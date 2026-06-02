# CodeCode — System Architecture & Submission Flow

## Directory Structure

```
server/
├── src/
│   ├── index.js                     # Entry point — starts HTTP server, connects to MySQL
│   ├── app.js                       # Express app — registers middleware and all routers
│   │
│   ├── config/
│   │   └── redis.js                 # ioredis connection instance shared by Queue and Worker
│   │
│   ├── constants/
│   │   ├── statusCode.js            # HTTP status code constants
│   │   └── cookieOptions.js         # JWT cookie config (httpOnly, secure, sameSite)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # register, login, logout
│   │   ├── contest.controller.js    # CRUD + GET for contests
│   │   ├── problem.controller.js    # CRUD + GET for problems (with time/memory limits)
│   │   ├── testcase.controller.js   # CRUD + GET for test cases
│   │   └── submission.controller.js # createSubmission, getContestSubmissions, getSubmissionById
│   │
│   ├── db/
│   │   ├── db.js                    # mysql2 connection pool
│   │   ├── connectDB.js             # connects pool on startup
│   │   ├── schema.sql               # Full DB schema
│   │   └── migration_judge_limits.sql  # Adds time_limit_ms, memory_limit_mb, 'running' verdict
│   │
│   ├── middlewares/
│   │   ├── index.js                 # Re-exports verifyToken, verifyAdmin, errorHandler
│   │   ├── verifyToken.js           # Decodes JWT cookie → attaches req.userId, req.role
│   │   ├── verifyAdmin.js           # Blocks non-admin requests with 403
│   │   └── errorHandler.js          # Global Express error handler
│   │
│   ├── models/
│   │   ├── User.model.js            # create, findById, findByEmail, findByUsername
│   │   ├── Contest.model.js         # create, findById, findAll (JOIN), update, setVerified, delete
│   │   ├── Problem.model.js         # create, findById, findWithContest, findAllByContest,
│   │   │                            #   findByIdWithSampleTestCases, update, delete
│   │   ├── TestCase.model.js        # create, findById, findWithContest, findByProblemId,
│   │   │                            #   findAllByProblem, update, delete
│   │   └── Submission.model.js      # create, findById, findWithContest, findAllByContest,
│   │                                #   findByIdWithContest, findForJudge, setVerdict
│   │
│   ├── queues/
│   │   └── submissionQueue.js       # BullMQ Queue("submission-queue") — jobs are added here
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── contest.routes.js
│   │   ├── problem.routes.js
│   │   ├── testcase.routes.js
│   │   └── submission.routes.js
│   │
│   ├── services/
│   │   └── judge.js                 # Core Docker execution logic — runJudge()
│   │
│   ├── utility/
│   │   ├── index.js                 # Re-exports ApiError, ApiResponse, asyncHandler
│   │   ├── ApiError.js              # Custom error class with statusCode
│   │   ├── ApiResponse.js           # Standard JSON response wrapper
│   │   └── asyncHandler.js          # Wraps async controllers, forwards errors to next()
│   │
│   └── workers/
│       └── judgeWorker.js           # BullMQ Worker — processes jobs from submission-queue
```

---

## Phase 1 — Server Startup

`npm run dev` (via `concurrently`) starts **two** parallel processes:

### Process 1 — API Server (`src/index.js`)

1. Loads `.env` via `dotenv`.
2. Calls `connectToDatabase()` (`src/db/connectDB.js`) — tests the `mysql2` pool connection.
3. Creates an `http.Server` from the Express `app`.
4. Starts listening on `process.env.PORT` (default `8000`).

### Process 2 — Judge Worker (`src/workers/judgeWorker.js`)

1. Connects to Redis using the shared `ioredis` instance (`src/config/redis.js`).
2. Creates a `BullMQ Worker` subscribed to `"submission-queue"` with `concurrency: 2`.
3. Waits idle; processes up to 2 jobs concurrently as they arrive.

---

## Phase 2 — Submission Request

```
POST /api/v1/submissions
Cookie: token=<JWT>
Body: { problem_id, language, source_code }
```

### Step-by-step through the API server

| Step | File                                            | What happens                                                                                              |
| ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1    | `app.js`                                        | Request hits Express; `morgan` logs it                                                                    |
| 2    | `middlewares/verifyToken.js`                    | JWT from the `token` cookie is verified; `req.userId` and `req.role` attached                             |
| 3    | `routes/submission.routes.js`                   | Matched to `router.post('/', createSubmission)`                                                           |
| 4    | `controllers/submission.controller.js`          | `createSubmission` handler runs                                                                           |
| 5    | Validation                                      | Checks `problem_id`, `language` (must be `cpp/c/java/python/javascript`), `source_code` are present       |
| 6    | `models/Submission.findWithContest(problem_id)` | Single JOIN: `submissions → problems → contests` — returns `contest_authored_by` and `contest_start_time` |
| 7    | Access control                                  | If not admin/creator and `now < contest_start_time` → 403 Forbidden                                       |
| 8    | `models/Submission.create(...)`                 | Inserts row into `submissions` table; `verdict` defaults to `'pending'`; returns `insertId`               |
| 9    | `queues/submissionQueue.js`                     | `submissionQueue.add("judge-submission", { submissionId })` pushes a job to Redis                         |
| 10   | Response                                        | `201 Created` returned immediately to the client with the full submission object                          |

> The client does not wait for judging — judging happens entirely asynchronously.

---

## Phase 3 — Judge Worker Picks Up the Job

`src/workers/judgeWorker.js` — BullMQ calls the processor function with the job.

```
job.data = { submissionId: 42 }
```

| Step | File / Method                                           | What happens                                                                                                                                                       |
| ---- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `Submission.findForJudge(submissionId)`                 | Single 3-table JOIN: `submissions → problems → test_cases`. Returns `source_code`, `language`, `time_limit_ms`, `memory_limit_mb`, `input_data`, `expected_output` |
| 2    | Guard check                                             | If no row found → log error, return. If `input_data` is null (no test case registered) → set verdict `runtime_error`, return                                       |
| 3    | `Submission.setVerdict(id, 'running')`                  | Updates DB row: `verdict = 'running'`                                                                                                                              |
| 4    | `runJudge(data)`                                        | Calls the judge service (`src/services/judge.js`) — see Phase 4                                                                                                    |
| 5    | `Submission.setVerdict(id, verdict, execution_time_ms)` | Writes final verdict and timing back to DB                                                                                                                         |

---

## Phase 4 — Docker Execution (`src/services/judge.js`)

`runJudge()` receives: `{ source_code, language, input_data, expected_output, time_limit_ms, memory_limit_mb }`

### Step 1 — Prepare temp directory

- A sandbox directory is created for isolation: `sandbox/submission-<submission_id>/`
- The source file is written using the language-specific name:

| Language     | File written |
| ------------ | ------------ |
| `cpp`        | `main.cpp`   |
| `c`          | `main.c`     |
| `java`       | `Main.java`  |
| `python`     | `main.py`    |
| `javascript` | `main.js`    |

- `input_data` is explicitly written to `input.txt` inside the sandbox directory.

### Step 2 — Build `run.sh`

`buildRunScript(language, timeoutSecs)` generates a shell script written to `sandbox/submission-<submission_id>/run.sh`:

**Compiled languages (C, C++, Java):**

```sh
#!/bin/sh
g++ /code/main.cpp -o /code/main 2>/code/compile.err
if [ $? -ne 0 ]; then exit 100; fi   # ← exit 100 = compilation error signal
timeout 2 /code/main < /code/input.txt
exit $?
```

**Interpreted languages (Python, JS):**

```sh
#!/bin/sh
timeout 2 python3 /code/main.py < /code/input.txt
exit $?
```

### Step 3 — `docker run`

Uses Node.js `child_process.execFile` (promisified) to run:

```bash
docker run --rm \
  --name judge-<submission_id> \
  --network=none \            # No internet access
  --memory=256m \             # Hard memory cap
  --memory-swap=256m \        # No swap (total = memory cap only)
  --cpus=1 \                  # 1 CPU core
  -v .../sandbox/submission-<id>:/code \  # Mount sandbox dir into container as /code
  gcc:latest \                # Language-specific image
  sh /code/run.sh             # Run the generated script
```

**Docker images used:**
| Language | Image |
|----------|-------|
| `cpp`, `c` | `gcc:latest` |
| `java` | `openjdk:21-slim` |
| `python` | `python:3.12-slim` |
| `javascript` | `node:22-slim` |

Node.js enforces an outer timeout of `time_limit_ms + 10_000ms` (10s buffer for Docker startup overhead).

### Step 4 — Exit code → Verdict mapping

| Exit code           | Source                             | Verdict                                                                                                                |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `0`                 | Success                            | Compare stdout with `expected_output` (ignoring carriage returns via `normalizeOutput`) → `accepted` or `wrong_answer` |
| `100`               | `run.sh` compile step              | `compilation_error`                                                                                                    |
| `124`               | `timeout` command inside container | `time_limit_exceeded`                                                                                                  |
| `137`               | Docker OOM kill (SIGKILL)          | `memory_limit_exceeded`                                                                                                |
| `err.killed = true` | Node.js outer timeout fired        | `time_limit_exceeded`                                                                                                  |
| any other non-zero  | Runtime crash / segfault           | `runtime_error`                                                                                                        |

### Step 5 — Cleanup

The `finally` block always runs `fs.rm(sandboxPath, { recursive: true, force: true })` — temp files are deleted regardless of outcome.

### Return value

```js
{
  verdict: 'accepted',
  execution_time_ms: 312,
  compilation_error: '',
  actual_output: '30'
}
```

---

## Phase 5 — Verdict Written to DB

Back in `judgeWorker.js`:

```js
await Submission.setVerdict(submissionId, verdict, execution_time_ms);
```

SQL executed:

```sql
UPDATE submissions
SET verdict = ?, execution_time_ms = ?, memory_used_kb = ?
WHERE submission_id = ?
```

The submission row now has its final state. The client can poll `GET /api/v1/submissions/:id` to read the result.

---

## Data Flow Diagram

```
Client (Frontend)
    │
    │  POST /api/v1/submissions
    ▼
Express App (src/app.js)
    │
    ├── verifyToken (middlewares/verifyToken.js)
    │       └── Decode JWT cookie → req.userId, req.role
    │
    ├── submission.routes.js → submission.controller.js
    │       ├── Validate input fields
    │       ├── Submission.findWithContest()   ← MySQL JOIN
    │       ├── Access control check (start time, role)
    │       ├── Submission.create()            ← INSERT into MySQL
    │       └── submissionQueue.add()          ← Push job to Redis
    │
    │  201 Created ──────────────────────────────► Client
    │
Redis Queue (BullMQ "submission-queue")
    │
    │  Job: { submissionId }
    ▼
Judge Worker (src/workers/judgeWorker.js)  ← runs in separate process
    │
    ├── Submission.findForJudge()           ← MySQL 3-table JOIN
    ├── Submission.setVerdict('running')    ← UPDATE MySQL
    │
    ▼
Judge Service (src/services/judge.js)
    │
    ├── Write source file, input.txt + run.sh to sandbox/submission-<id>/
    ├── docker run (--name, --network=none, --memory, --cpus, -v)
    │       └── Inside container:
    │               ├── compile (if C/C++/Java)
    │               └── timeout N ./binary < /code/input.txt
    ├── Map exit code → verdict
    └── Cleanup temp dir
    │
    ▼
judgeWorker.js
    └── Submission.setVerdict(verdict, ms)  ← UPDATE MySQL

MySQL submissions table
    └── verdict = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' |
                 'memory_limit_exceeded' | 'compilation_error' | 'runtime_error'
```

---

## Key Packages

| Package                       | Role                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `express`                     | HTTP server framework                                                        |
| `mysql2`                      | MySQL connection pool with Promise support                                   |
| `jsonwebtoken`                | JWT signing and verification                                                 |
| `bcrypt`                      | Password hashing (12 salt rounds)                                            |
| `cookie-parser`               | Parses `httpOnly` JWT cookie from requests                                   |
| `bullmq`                      | Job queue built on Redis — `Queue` (producer) + `Worker` (consumer)          |
| `ioredis`                     | Redis client used by BullMQ; `maxRetriesPerRequest: null` required by BullMQ |
| `concurrently`                | Runs API server and judge worker as two parallel `nodemon` processes in dev  |
| `morgan`                      | HTTP request logger                                                          |
| `dotenv`                      | Loads `.env` into `process.env`                                              |
| `child_process` (Node stdlib) | `execFile` to spawn the `docker run` command                                 |
| `fs/promises` (Node stdlib)   | Async file I/O for writing source files and cleanup                          |

---

## Environment Variables (`.env`)

| Key              | Purpose                           |
| ---------------- | --------------------------------- |
| `PORT`           | HTTP server port (default `8000`) |
| `MYSQL_HOST`     | MySQL host                        |
| `MYSQL_USER`     | MySQL user                        |
| `MYSQL_PASSWORD` | MySQL password                    |
| `MYSQL_DB`       | Database name (`codecode_v0`)     |
| `JWT_SECRET`     | Secret key for signing JWTs       |
| `JWT_EXPIRES_IN` | JWT expiry (default `7d`)         |
| `REDIS_PORT`     | Redis port (default `6379`)       |
| `CORS_ORIGIN`    | Comma-separated allowed origins   |
