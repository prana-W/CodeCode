# CodeCode — System Architecture

## Directory Structure

```
server/
├── src/
│   ├── index.js                     # Entry point — starts HTTP server, registers cron jobs
│   ├── app.js                       # Express app — registers middleware, routers, Swagger UI
│   │
│   ├── config/
│   │   ├── redis.js                 # ioredis connection instance shared by Queue and Worker
│   │   ├── swagger.js               # swagger-jsdoc spec — full OpenAPI definition for all routes
│   │   └── aiConfig.js              # SYSTEM_PROMPT constant for the CodeCode AI Assistant
│   │
│   ├── constants/
│   │   ├── statusCode.js            # HTTP status code constants
│   │   └── cookieOptions.js         # Cookie options for accessToken (5 min) and refreshToken (7 days)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       # register, login, logout, refresh (access+refresh token rotation)
│   │   ├── checkHealth.controller.js# GET /api/v1 — returns server time + DB timestamp
│   │   ├── contest.controller.js    # CRUD, verify, register, leaderboard, finalize
│   │   ├── problem.controller.js    # CRUD + GET for problems (with time/memory limits)
│   │   ├── testcase.controller.js   # CRUD + GET for test cases
│   │   ├── submission.controller.js # createSubmission, getContestSubmissions, getSubmissionById
│   │   ├── user.controller.js       # getUserById, updateUser, deleteUser, heartbeat
│   │   └── ai.controller.js         # askAssistant — proxies prompt to AI service
│   │
│   ├── cron/
│   │   └── contestEvaluation.cron.js# node-cron job (every 5 min) — auto-finalizes ended contests
│   │
│   ├── db/
│   │   ├── db.js                    # mysql2 connection pool
│   │   ├── connectDB.js             # connects pool on startup
│   │   ├── schema.sql               # Full DB schema (all 6 tables)
│   │   └── test_queries.sql         # Ad-hoc SQL scratch queries
│   │
│   ├── middlewares/
│   │   ├── index.js                 # Re-exports verifyToken, verifyAdmin, errorHandler
│   │   ├── verifyToken.js           # Decodes accessToken cookie (JWT) → attaches req.userId, req.role
│   │   ├── verifyAdmin.js           # Blocks non-admin requests with 403
│   │   ├── errorHandler.js          # Global Express error handler
│   │   └── rateLimit.middleware.js  # express-rate-limit instances (see Rate Limiting section)
│   │
│   ├── models/
│   │   ├── User.model.js            # create, findById, findByEmail, findByUsername,
│   │   │                            #   getAll, update, delete, updateRating (transactional)
│   │   │                            #   setRefreshToken, findByRefreshToken, clearRefreshToken
│   │   ├── Contest.model.js         # create, findById, findAll, update, setVerified, delete,
│   │   │                            #   getPendingEvaluations, updateEvaluationStatus
│   │   ├── Problem.model.js         # create, findById, findWithContest, findAllByContest,
│   │   │                            #   findByIdWithSampleTestCases, update, delete
│   │   ├── TestCase.model.js        # create, findById, findWithContest, findByProblemId,
│   │   │                            #   findAllByProblem, update, delete
│   │   ├── Submission.model.js      # create, findById, findWithContest, findAllByContest,
│   │   │                            #   findByIdWithContest, findForJudge, setVerdict
│   │   ├── ContestRegistration.model.js  # register, findByUserAndContest, findContestTimes,
│   │   │                                 #   getParticipantsWithRating, updateDelta
│   │   └── ContestStanding.model.js # getLeaderboard — ranked standings by final_score
│   │
│   ├── queues/
│   │   ├── submissionQueue.js
│   │   └── customInvocationQueue.js       # BullMQ Queue("submission-queue") — jobs are added here
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── statistics.routes.js
│   │   ├── custom-invocation.routes.js
│   │   ├── user-template.routes.js
│   │   ├── contest.routes.js        # Includes register, leaderboard, finalize endpoints
│   │   ├── problem.routes.js
│   │   ├── testcase.routes.js
│   │   ├── submission.routes.js
│   │   ├── user.routes.js           # getUserById, updateUser, deleteUser, heartbeat
│   │   ├── ai.routes.js             # POST /ask — AI assistant (aiLimiter applied)
│   │   └── admin.routes.js          # Empty placeholder for future admin-only routes
│   │
│   ├── services/
│   │   ├── judge.service.js         # Core Docker execution logic — runJudge()
│   │   ├── contest.service.js       # Elo-like rating delta calculation — deltaCalculation()
│   │   └── ai.service.js            # generateHint() — calls local Ollama /api/chat
│   │
│   ├── sockets/
│   │   ├── index.js                 # initializeSocket(httpServer) — creates Socket.IO server
│   │   ├── socket.js                # registerSockets(io) — attaches auth middleware + handlers
│   │   ├── controllers/             # (empty — placeholder for future socket event handlers)
│   │   └── middlewares/
│   │       └── verifyAccessToken.middleware.js  # Socket.IO auth: reads socket.handshake.auth.accessToken
│   │
│   ├── utility/
│   │   ├── index.js                 # Re-exports ApiError, ApiResponse, asyncHandler
│   │   ├── ApiError.js              # Custom error class with statusCode
│   │   ├── ApiResponse.js           # Standard JSON response wrapper
│   │   └── asyncHandler.js          # Wraps async controllers, forwards errors to next()
│   │
│   └── workers/
│       ├── judgeWorker.js
│       └── customInvocationWorker.js           # BullMQ Worker — processes jobs from submission-queue
```

---

## Phase 1 — Server Startup

`npm run dev` (via `concurrently`) starts **two** parallel processes:

### Process 1 — API Server (`src/index.js`)

1. Loads `.env` via `dotenv`.
2. Calls `connectToDatabase()` (`src/db/connectDB.js`) — tests the `mysql2` pool connection.
3. Imports `src/cron/contestEvaluation.cron.js` — **registers the cron job** (runs every 5 minutes).
4. Creates an `http.Server` from the Express `app`.
5. Starts listening on `process.env.PORT` (default `8000`).

> Socket.IO (`src/sockets/`) is scaffolded but the `initializeSocket` call is not yet wired in `index.js`. It will be attached to the `httpServer` when real-time features are activated.

### Process 2 — Judge Worker (`src/workers/judgeWorker.js`)

1. Connects to Redis using the shared `ioredis` instance (`src/config/redis.js`).
2. Creates a `BullMQ Worker` subscribed to `"submission-queue"` with `concurrency: 2`.
3. Waits idle; processes up to 2 jobs concurrently as they arrive.

---

## Phase 2 — Submission Request

```
POST /api/v1/submissions
Cookie: accessToken=<JWT>
Body: { problem_id, language, source_code }
```

### Step-by-step through the API server

| Step | File                                            | What happens                                                                                              |
| ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1    | `app.js`                                        | Request hits Express; `morgan` logs it; `apiLimiter` checks IP rate limit                                 |
| 2    | `middlewares/verifyToken.js`                    | JWT from the `accessToken` cookie is verified; `req.userId` and `req.role` attached                       |
| 3    | `routes/submission.routes.js`                   | Matched to `router.post('/', submissionLimiter, createSubmission)`                                        |
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
| 4    | `runJudge(data)`                                        | Calls the judge service (`src/services/judge.service.js`) — see Phase 4                                                                                            |
| 5    | `Submission.setVerdict(id, verdict, execution_time_ms)` | Writes final verdict and timing back to DB                                                                                                                         |

---

## Phase 4 — Docker Execution (`src/services/judge.service.js`)

`runJudge()` receives: `{ submission_id, source_code, language, input_data, expected_output, time_limit_ms, memory_limit_mb }`

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

- `input_data` is written to `input.txt` inside the sandbox directory.

### Step 2 — Build `run.sh`

`buildRunScript(language, timeoutSecs)` generates a shell script written to `sandbox/submission-<id>/run.sh`:

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

### Step 3 — `docker run` (Decoupled Compilation & Execution)

Compilation and execution are handled in two distinct container lifecycles to prevent compiler memory spikes from triggering `memory_limit_exceeded`.

**Compilation Step (if applicable):**

- Runs with a fixed `--memory=512m` limit.
- If it exits with code `100` or fails, verdict is `compilation_error`.

**Execution Step:**
Uses Node.js `child_process.execFile` (promisified) to run the compiled binary or interpreted script:

```bash
docker run --rm \
  --name judge-<submission_id> \
  --network=none \            # No internet access
  --memory=<problem_memory_limit>m \  # Strict problem memory cap
  --memory-swap=<problem_memory_limit>m \
  --cpus=1 \                  # 1 CPU core
  -v .../sandbox/submission-<id>:/code \  # Mount sandbox dir
  gcc:latest \                # Language-specific image
  sh /code/run.sh             # Run the generated script
```

**Docker images used:**

| Language     | Image              |
| ------------ | ------------------ |
| `cpp`, `c`   | `gcc:latest`       |
| `java`       | `openjdk:21-slim`  |
| `python`     | `python:3.12-slim` |
| `javascript` | `node:22-slim`     |

Node.js enforces an outer timeout of `time_limit_ms + 10_000ms` (10s buffer for Docker startup overhead). `maxBuffer` is capped at 10 MB to prevent stdout flooding.

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

The submission row now has its final state.

### Pub/Sub Notification (Socket.IO)

Instead of forcing the client to poll, the worker executes:

```js
redis.publish('socket_updates', JSON.stringify({ userId, submissionId, verdict, ... }));
```

---

## Phase 6 — Real-Time WebSocket Architecture (Redis Pub/Sub)

To eliminate manual HTTP polling for verdicts and custom invocations, the platform uses a unified real-time architecture:

1. **Connection**: The client connects via `socket.io-client`. The server authenticates the JWT and places the socket connection into a room named strictly after the `userId`.
2. **Worker Publishing**: Once a background worker (`judgeWorker` or `customInvocationWorker`) finishes execution, it publishes the final payload to the `socket_updates` Redis channel.
3. **Server Subscription**: The main Node.js server (`index.js`) listens on the `socket_updates` channel. When a message arrives, it inspects the `userId`.
4. **Broadcasting**: The server emits the event specifically to the user's room (`io.to(userId).emit(...)`).
5. **UI Update**: The frontend receives the event and instantly updates the submission list or custom invocation output without a single redundant HTTP request.

---

## Phase 7 — Contest Finalization (Cron + Admin Trigger)

After a contest ends, ratings are calculated via an **Elo-like delta system**.

### Automatic: Cron Job (`src/cron/contestEvaluation.cron.js`)

Runs **every 5 minutes** via `node-cron`.

1. Queries `contests` for rows where `contest_end_time < NOW()` AND `contest_evaluation = 'pending'`.
2. For each matching contest, sets `contest_evaluation = 'running'`.
3. Calls `deltaCalculation(contestId)` (see below).
4. On success → sets `contest_evaluation = 'completed'`.
5. On failure → reverts to `'pending'` so it will be retried next cycle.

### Manual: Admin Endpoint

```
POST /api/v1/contests/:id/finalize
Cookie: token=<admin JWT>
```

Guarded by `verifyAdmin`. Same `deltaCalculation()` call with the same status state machine (`pending → running → completed`), but triggered on-demand instead of by the cron.

### Delta Calculation (`src/services/contest.service.js`)

`deltaCalculation(contestId)`:

1. Fetches all registered participants with their `currentRating` and `final_score` (score minus penalty minutes), ordered by rank.
2. For each participant `i`, computes **expected wins** against all other participants using the Elo probability formula: `P(i beats j) = 1 / (1 + 10^((Rj - Ri) / 400))`.
3. Derives `expectedRank = n - expectedWins`.
4. Computes raw delta: `delta = K * (expectedRank - actualRank)` where `K = 4`.
5. Applies a **zero-sum correction**: subtracts `round(sumDelta / n)` from every delta so the total change across the field sums to zero.
6. Floors each new rating at `RATING_FLOOR = 400`.
7. Runs a single **MySQL transaction**:
    - `ContestRegistration.updateDelta()` — writes `delta` and `final_rating` to the registration row.
    - `User.updateRating()` — updates `users.rating` and `users.max_rating`.
8. Rolls back the transaction if any update fails.

---

## Authentication Flow

CodeCode uses a **dual-token, httpOnly cookie** strategy:

### Token Lifecycle

```
[Login / Register]
    ↓
  Generate accessToken (JWT, 5 min, signed with JWT_ACCESS_SECRET)
  Generate refreshToken (random 64-byte hex, 7 days)
    ↓
  Store refreshToken in users.refresh_token (DB)
  Set accessToken cookie  (httpOnly, secure, sameSite=none, maxAge=5m)
  Set refreshToken cookie (httpOnly, secure, sameSite=none, maxAge=7d)

[Every API Request]
    ↓
  verifyToken middleware reads accessToken cookie
  Verifies JWT with JWT_ACCESS_SECRET
    ↓ (valid) → req.userId, req.username, req.role attached → next()
    ↓ (expired) → 401 "Access token has expired."

[Client Axios Interceptor — on 401 "Access token has expired."]
    ↓
  POST /auth/refresh  (sends refreshToken cookie)
    ↓
  Server: find user by refreshToken in DB
           generate new accessToken
           generate new refreshToken (ROTATION)
           update DB with new refreshToken
           set both new cookies
    ↓ (success) → retry original failed request transparently
    ↓ (failure) → call forceLogout() → clear localStorage + cookies → redirect to /login

[Logout]
    ↓
  POST /auth/logout  (sends refreshToken cookie — no access token needed)
    ↓
  Server: NULL users.refresh_token in DB
          clearCookie accessToken
          clearCookie refreshToken
```

### Refresh Token Rotation

Every `/refresh` call issues a brand-new refresh token and replaces the old one in the DB. This means:
- A stolen refresh token can only be used **once** before it is invalidated
- If an attacker uses a stolen RT, the legitimate user's next request will detect a mismatch and invalidate the entire session

### Why Two Separate Secrets?

`JWT_ACCESS_SECRET` signs access tokens only. `JWT_REFRESH_SECRET` is available as an env var for future enhancement (e.g., signing refresh tokens as JWTs instead of opaque values). Keeping them separate ensures access tokens cannot be used as refresh tokens and vice versa.

---

## AI Assistant (`src/services/ai.service.js`)

```
POST /api/v1/ai/ask
Cookie: accessToken=<JWT>
Body: { prompt: "What is a segment tree?" }
```

- Requires a valid JWT (`verifyToken`).
- Rate-limited by `aiLimiter` (100 requests / 5 minutes per IP).
- Calls a **local Ollama instance** at `OLLAMA_URL/api/chat` using the model specified by `OLLAMA_MODEL`.
- The system prompt (`src/config/aiConfig.js`) enforces strict rules: **no code, no pseudocode, no implementation details** — only conceptual explanations and hints.
- Returns `{ hint: "<AI response text>" }`.

---

## Live Users Tracking

```
POST /api/v1/users/heartbeat
Cookie: accessToken=<JWT>
```

- **Authentication**: Requires a valid JWT (`verifyToken`).
- **Heartbeat Registration**: The client issues a heartbeat POST request every 30 seconds. On receipt, the server registers/renews the key `online_user:{username}` in Redis with a 45-second TTL (`SETEX`).
- **Online Counting**: The server queries active users by scanning for matching keys `online_user:*` using a series of non-blocking `SCAN` commands.
- **User Live Status**: The user controllers check if a user is online via `EXISTS online_user:{username}` and include an `isOnline` boolean in the user profile query responses (used by profile hover cards and profile pages).

---

## Rate Limiting (`src/middlewares/rateLimit.middleware.js`)

All rate limiters use `express-rate-limit` with `standardHeaders: true`.

| Limiter                      | Applied to                                        | Window | Limit |
| ---------------------------- | ------------------------------------------------- | ------ | ----- |
| `apiLimiter`                 | All `/api/*` routes                               | 15 min | 100   |
| `authLimiter`                | `POST /auth/register`, `/login`, `/refresh`       | 15 min | 10    |
| `submissionLimiter`          | `POST /submissions`                               | 1 min  | 5     |
| `contestCreationLimiter`     | `POST /contests`                                  | 1 hour | 5     |
| `contestRegistrationLimiter` | `POST /contests/register`                         | 10 min | 10    |
| `profileUpdateLimiter`       | `PATCH /users/:id`                                | 15 min | 15    |
| `aiLimiter`                  | `POST /ai/ask`                                    | 5 min  | 100   |

---

## Swagger / API Documentation

- **Package**: `swagger-jsdoc` + `swagger-ui-express`
- **Spec**: defined inline in `src/config/swagger.js` (full OpenAPI 3.0 definition for all routes and schemas).
- **Served at**: both `/` (root) and `/api-docs` — both render the interactive Swagger UI.
- **Title**: "CodeCode API Docs"

---

## Socket.IO Layer (`src/sockets/`)

Scaffolded but not yet fully activated in production startup.

| File                                                  | Purpose                                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `sockets/index.js`                                    | `initializeSocket(httpServer)` — creates `Server` with CORS `*`                                             |
| `sockets/socket.js`                                   | `registerSockets(io)` — wires auth middleware + connection/disconnect logging                               |
| `sockets/middlewares/verifyAccessToken.middleware.js` | Reads `socket.handshake.auth.accessToken`, verifies JWT via `ACCESS_TOKEN_SECRET`, attaches `socket.userId` |
| `sockets/controllers/`                                | Empty — placeholder for future real-time event handlers                                                     |

---

## Database Schema (6 tables)

| Table                   | Key columns                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                 | `id`, `username`, `name`, `institute`, `email`, `password`, `refresh_token`, `rating`, `max_rating`, `role`, `created_at`                                                           |
| `contests`              | `id`, `title`, `description`, `isVerified`, `authored_by`, `contest_start_time`, `contest_end_time`, `contest_evaluation ENUM(pending,running,completed)`, `division TINYINT(1–5)` |
| `problems`              | `problem_id`, `contest_id`, `title`, `score`, `rating`, `time_limit_ms`, `memory_limit_mb`, `statement`, `explanation`                                                             |
| `test_cases`            | `test_case_id`, `problem_id` (UNIQUE), `input_data`, `expected_output`, `is_sample`                                                                                                |
| `submissions`           | `submission_id`, `problem_id`, `submitted_by`, `submitted_at`, `verdict ENUM(...)`, `language ENUM(...)`, `source_code`, `execution_time_ms`, `memory_used_kb`                     |
| `contest_standings`     | `(contest_id, user_id, problem_id)` PK, `accepted_submission_id` — one row per solved problem per user                                                                             |
| `contest_registrations` | `registration_id`, `contest_id`, `user_id`, `registered_at`, `delta`, `final_rating` — one row per participant                                                                     |

---

## Data Flow Diagram

```
Client (Frontend)
    │
    │  POST /api/v1/submissions
    ▼
Express App (src/app.js)
    │
    ├── apiLimiter (express-rate-limit)
    ├── verifyToken (middlewares/verifyToken.js)
    │       └── Decode JWT cookie → req.userId, req.role
    │
    ├── submission.routes.js → submission.controller.js
    │       ├── submissionLimiter (rate limit 5/min)
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
Judge Service (src/services/judge.service.js)
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
    ├── Submission.setVerdict(verdict, ms)  ← UPDATE MySQL
    └── redis.publish('socket_updates')     ← Notify Main Server via Pub/Sub

MySQL submissions table
    └── verdict = 'accepted' | 'wrong_answer' | 'time_limit_exceeded' |
                 'memory_limit_exceeded' | 'compilation_error' | 'runtime_error'

Main Server (src/index.js)
    ├── Subscribed to 'socket_updates' Redis channel
    └── io.to(userId).emit('submission_update')

Client (Frontend)
    └── Receives socket event and instantly updates UI

─────────────────────────────────────────────────────

Cron (every 5 min, runs inside API server process)
    │
    ├── Contest.getPendingEvaluations()     ← ended contests with evaluation='pending'
    ├── Contest.updateEvaluationStatus('running')
    ├── deltaCalculation(contestId)         ← contest.service.js
    │       ├── ContestRegistration.getParticipantsWithRating()  ← ranked by final_score
    │       ├── Elo probability + zero-sum correction
    │       └── DB Transaction:
    │               ├── ContestRegistration.updateDelta()
    │               └── User.updateRating()
    └── Contest.updateEvaluationStatus('completed' | 'pending')
```

---

## Key Packages

| Package                       | Role                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `express`                     | HTTP server framework (v5)                                                   |
| `mysql2`                      | MySQL connection pool with Promise support                                   |
| `jsonwebtoken`                | JWT signing and verification                                                 |
| `bcrypt`                      | Password hashing (12 salt rounds)                                            |
| `cookie-parser`               | Parses `httpOnly` JWT cookie from requests                                   |
| `bullmq`                      | Job queue built on Redis — `Queue` (producer) + `Worker` (consumer)          |
| `ioredis`                     | Redis client used by BullMQ; `maxRetriesPerRequest: null` required by BullMQ |
| `node-cron`                   | Schedules the contest evaluation cron job (every 5 minutes)                  |
| `express-rate-limit`          | IP-based rate limiting for API abuse prevention                              |
| `swagger-jsdoc`               | Generates OpenAPI spec from JSDoc comments + inline definition               |
| `swagger-ui-express`          | Serves interactive Swagger UI at `/` and `/api-docs`                         |
| `socket.io`                   | WebSocket layer for future real-time features (scaffolded)                   |
| `concurrently`                | Runs API server and judge worker as two parallel `nodemon` processes in dev  |
| `morgan`                      | HTTP request logger                                                          |
| `dotenv`                      | Loads `.env` into `process.env`                                              |
| `cors`                        | Configures allowed origins from `CORS_ORIGIN` env variable                   |
| `ngrok`                       | (Commented out) Tunnel for exposing local server publicly                    |
| `child_process` (Node stdlib) | `execFile` to spawn the `docker run` command                                 |
| `fs/promises` (Node stdlib)   | Async file I/O for writing source files and cleanup                          |

---

## Environment Variables (`.env`)

| Key                   | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `PORT`                | HTTP server port (default `8000`)                              |
| `MYSQL_HOST`          | MySQL host                                                     |
| `MYSQL_USER`          | MySQL user                                                     |
| `MYSQL_PASSWORD`      | MySQL password                                                 |
| `MYSQL_DB`            | Database name (`codecode_v0`)                                  |
| `JWT_ACCESS_SECRET`   | Secret for signing short-lived access token JWTs (5 min)       |
| `JWT_REFRESH_SECRET`  | Secret for future refresh token JWT signing (currently opaque) |
| `REDIS_PORT`          | Redis port (default `6379`)                                    |
| `CORS_ORIGIN`         | Comma-separated allowed origins                                |
| `OLLAMA_URL`          | Base URL of the local Ollama instance                          |
| `OLLAMA_MODEL`        | Model name for the AI assistant (e.g. `gemma3:4b`)             |
| `GEMINI_API_KEY`      | Google Gemini API key for cloud AI features                    |
| `GEMINI_MODEL`        | Gemini model name (e.g. `gemini-1.5-flash`)                    |
