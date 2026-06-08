## Commit - 1

Simple initialisation of repository with a ReadMe file.

---

## Commit - 2

Set up the initial backend server and connected it to MySQL.

- Initialised the Express app (`app.js`) with middleware: `cors`, `cookie-parser`, `express.json`, `express.urlencoded`, and `morgan` for HTTP request logging.
- Set up CORS to only allow origins listed in `CORS_ORIGIN` env variable (comma-separated), with credentials enabled.
- Created a MySQL connection pool (`db.js`) and a `connectDB` helper that tests the connection on startup by acquiring and immediately releasing a connection.
- The entry point (`index.js`) loads `.env`, creates an HTTP server wrapping the Express app, connects to the database, and then starts listening on the configured port (default `8000`).
- Built out the utility layer:
    - `ApiError` — a custom error class that extends `Error`, carries an HTTP `statusCode`, and captures a clean stack trace.
    - `ApiResponse` — a standard response wrapper that enforces a consistent `{ statusCode, success, message, data }` shape across all endpoints.
    - `asyncHandler` — wraps async route handlers so any thrown error is automatically forwarded to Express's error handler without try/catch boilerplate in every controller.
- Created a centralised `errorHandler` middleware that catches all errors, logs the stack, and sends a properly shaped `ApiResponse` with the appropriate status code.
- Added a `/` and `/api/v1/check-health` health-check endpoint.
- Set up a `socket.js` and socket middleware scaffolding (for future WebSocket support via Socket.io).
- Added a `ngrok.connect.js` utility for exposing the server publicly during development (commented out by default).
- Added constants for cookie options and HTTP status codes.

---

## Commit - 3

Added full user authentication — registration, login, and logout — using a single JWT token approach.

- Created the `users` table in SQL with fields: `id`, `username`, `name`, `institute`, `email`, `password` (bcrypt hashed), `rating`, `max_rating`, `role` (ENUM: `admin`/`user`), and `created_at`.
- Built the `User` model with reusable query functions: `findById`, `findByUsername`, `findByEmail`, and `create`.
- On registration, the password is hashed with bcrypt before storage. Duplicate usernames and emails are rejected with clear error messages.
- On login, the password is verified against the stored hash. If valid, a JWT is signed containing the user's `id` and `role`, and stored as an HTTP-only cookie with a 7-day expiry.
- The JWT signing key is pulled from `process.env.JWT_SECRET`.
- Created the `verifyToken` middleware which reads the `token` cookie, verifies it, and attaches `req.userId` and `req.role` to the request for downstream use.
- The `role` in the token allows admin-protected routes to be enforced without an extra DB lookup.
- Added a `verifyAdmin` middleware that checks `req.role === 'admin'` and rejects non-admins with a `403 Forbidden`.
- Logout simply clears the `token` cookie.
- Added the `auth.routes.js` with routes for `/register`, `/login`, and `/logout`.
- Exposed `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and DB credentials in `.env.sample`.

---

## Commit - 4

Added contests and problems tables, models, and full CRUD endpoints.

- Created the `contests` table with: `id`, `title`, `description`, `isVerified` (default `false`), `authored_by` (FK → users), `created_on`, `contest_start_time`, and `contest_end_time`.
- Created the `problems` table with: `problem_id`, `contest_id` (FK → contests), `title`, `description`, `difficulty`, and `max_score`.
- Built `Contest` and `Problem` models with create, update, delete, and lookup functions.
- Added contest endpoints: create, update, delete — all restricted to the original creator (`authored_by === req.userId`).
- Added problem endpoints: create, update, delete — with an ownership check that verifies the user owns the contest to which the problem belongs.
- Added a `verifyContest` (toggle) endpoint that is **admin-only**, allowing admins to flip the `isVerified` flag on any contest. Only verified contests are visible to the general public.
- Added `contest.routes.js` and `problem.routes.js` and registered them in `app.js`.

---

## Commit - 5

Added the `test_cases` table, its model, and CRUD endpoints for testcases.

- The `test_cases` table stores `id`, `problem_id` (FK), `input_data`, `expected_output`, and a `is_sample` flag to distinguish sample testcases (visible to users in the problem statement) from hidden ones (used by the judge only).
- Built `TestCase.model.js` with create, update, and delete functions.
- Added endpoints for creating, updating, and deleting a testcase.
- Ownership is deeply verified: the user must own the contest → that contains the problem → that the testcase belongs to. Three-level ownership chain enforced correctly.
- Added `testcase.routes.js` and registered it in `app.js`.

---

## Commit - 6

General code cleanup and logic improvements across the existing controllers.

- Removed redundant logic, cleaned up inconsistent patterns, and made the code more readable.

---

## Commit - 7

Significant performance optimisation — replaced multiple sequential DB queries with SQL JOINs.

- Previously, checking ownership of a problem required two separate DB calls: one to fetch the problem row (to get `contest_id`), and then another to fetch the contest (to get `authored_by`). This was wasteful and didn't scale.
- Replaced these with a single query using a `JOIN` between the `problems` and `contests` tables, so ownership can be verified in one round-trip to the database.
- Applied the same pattern to testcase ownership checks, which previously took even more queries to traverse the chain (testcase → problem → contest).
- Added the optimised JOIN-based lookup methods to `Problem.model.js` and `TestCase.model.js`.
- This significantly reduces database load for every write operation on problems and testcases.

---

## Commit - 8

Added all GET endpoints for contests, problems, and testcases with proper visibility rules.

- **Contests:**
    - Admins can view all contests regardless of verification status.
    - General users can only see verified contests.
    - Contest creators can additionally see all of their own contests (verified or not).
- **Problems:**
    - Problems are publicly visible only once the contest is live (i.e., `contest_start_time` has passed).
    - Admins and the contest creator can view problems at any time.
- **Testcases:**
    - Sample testcases are visible to anyone who can view the problem.
    - Hidden testcases (those with `is_sample = false`) are **never** shown to the general public — only admins and the contest creator can access them.
- Added single-resource GET endpoints alongside the list endpoints for all three entities.
- Updated models (`Contest.model.js`, `Problem.model.js`, `TestCase.model.js`) with the corresponding query functions.

---

## Commit - 9

Fixed a security vulnerability in the registration flow.

- The `register` controller previously destructured the `role` field from `req.body` and used it when creating the user (`role: role || 'user'`). This meant a malicious user could pass `role: 'admin'` in the JSON body and self-assign admin privileges during signup.
- Fixed by hardcoding `role: 'user'` in the user creation call, completely ignoring any `role` field the client might send.
- The `schema.sql` was also cleaned up: changed `CREATE TABLE contests` and `CREATE TABLE problems` to `CREATE TABLE IF NOT EXISTS` to prevent errors on repeated schema runs, and removed stray debug `DROP TABLE` and `SELECT *` statements that were left in.

---

## Commit - 10

Added the submissions table, model, and endpoints.

- Created the `submissions` table with: `submission_id` (BIGINT), `problem_id` (FK), `submitted_by` (FK → users), `submitted_at` (timestamp), `verdict` (ENUM: `pending`, `accepted`, `wrong_answer`, `runtime_error`, `compilation_error`, `time_limit_exceeded`, `memory_limit_exceeded`), `language` (ENUM: `cpp`, `c`, `java`, `python`, `javascript`), `source_code` (LONGTEXT), `execution_time_ms`, and `memory_used_kb`.
- Built `Submission.model.js` with create, verdict update, and retrieval functions.
- POST `/submissions` — allows any authenticated user to submit code for a problem. The submission is stored in the DB with a `pending` verdict; the actual evaluation happens asynchronously via the judge (added later).
- GET `/submissions` — users can view their own past submissions for a contest. Admins and the contest creator can see all submissions for that contest.
- Added `submission.routes.js` and registered it in `app.js`.

---

## Commit - 11

Formatted all existing code with Prettier for a consistent code style.

- Applied a project-wide Prettier pass across all JavaScript source files.
- No logic changes — purely a formatting and consistency commit.

---

## Commit - 12

Integrated Redis and BullMQ to create an asynchronous queue-based submission processing system.

- Installed `ioredis` and `bullmq`.
- Created a Redis connection config (`config/redis.js`) that BullMQ uses internally as its in-memory storage backend.
- BullMQ has three components:
    - **Producer:** On each submission, the `submission_id` is enqueued as a job into the `submission-queue` using `submissionQueue.add()`.
    - **Storage:** Redis holds the queue state — pending jobs, active jobs, completed jobs, and failed jobs — all in memory.
    - **Worker:** `judgeWorker.js` runs concurrently alongside `index.js` as a separate process. It continuously polls Redis for new jobs and, when one arrives, picks it up and sends it to the Online Judge for evaluation.
- The worker processes one job at a time by default (`concurrency: 1`), ensuring the judge is not flooded. This can be adjusted via the `concurrency` option. Later I made the concurreny to 2, to reduce the waiting time of the incoming submission in the queue, as two workers can work simultaneously on two different tasks, reducing the wait time.
- Once a job is evaluated, the verdict is written back to the `submissions` table and the worker picks up the next job.

---

## Commit - 13, 14

Added the Online Judge logic — code is executed inside isolated Docker containers.

- Added `time_limit` and `memory_limit` columns to the `problems` table so each problem can have independent resource constraints.
- Implemented `judge.service.js`:
    1. A unique temp directory is created, and the source code is written to a file with the appropriate extension (`.cpp`, `.py`, `.js`, etc.).
    2. A shell script is generated to compile and run the file. The run command is pre-mapped per language.
    3. Node.js `child_process` spawns a Docker container, mounting the temp directory and shell script inside it. The `time_limit` and `memory_limit` are passed to Docker (`--memory`, custom timeout arguments).
    4. The container runs the code with the testcase's `input_data` piped to stdin.
    5. The Docker container is automatically removed after execution (`--rm` flag).
    6. An outer Node.js timeout (10 seconds beyond the problem's time limit) acts as a failsafe in case the Docker container hangs during startup or teardown.
    7. The verdict is determined by the process exit code (e.g., exit 1 → runtime error, timeout → TLE).
    8. Execution start time is recorded before the container runs and subtracted from the end time to compute `execution_time_ms`.
    9. The temp directory is cleaned up after each run.
- The `judgeWorker.js` now calls `runJudge()` with all the submission data, gets the verdict back, and updates the submission record.

---

## Commit - 15

Added contest standings and the leaderboard endpoint.

- Created the `contest_standings` table with: `id`, `contest_id` (FK), `user_id` (FK), `problem_id` (FK), and `submission_id` (FK).
- When the judge returns `accepted` for a submission, the judge worker now records an entry in `contest_standings` — but **only the first accepted submission per problem per user** is recorded. If the same problem is accepted multiple times, only the earliest submission counts in the standings.
- Built `ContestStanding.model.js` with a `getLeaderboard` query that aggregates standings to produce ranked results.
- `getLeaderboard` works as follows:
    - Fetches all `contest_standings` entries for the contest.
    - Sums the scores of all accepted problems for each user.
    - Subtracts the **penalty**, which is the total elapsed time from `contest_start_time` to each accepted submission.
    - Ranks participants in descending order of total score (with penalty as tiebreaker).
- Added the `GET /contests/:id/leaderboard` endpoint. Admins and the contest creator can view the leaderboard at any time; general users can only view it for verified contests.

---

## Commit - 16

Added contest registration, enforced participation time windows, and fixed leaderboard eligibility.

- Created the `contest_registrations` table with: `id`, `contest_id` (FK), `user_id` (FK), `registered_at`, and a `delta` column (used later to store each participant's rating change after the contest ends).
- Registration is only allowed up to **30 minutes after the contest starts**. Any registration attempt after this cutoff is rejected.
- Built `ContestRegistration.model.js` with create, lookup, and list functions.
- Added `POST /contests/:id/register` and `GET /contests/:id/check-registration` endpoints.
- Updated the judge worker to conditionally record a `contest_standings` entry: an accepted submission is **only added to the standings if the contest is still ongoing** (i.e., `current time <= contest_end_time`). Solving problems after a contest ends is treated as practice and does not affect the leaderboard or future rating calculations.
- Also started writing `api.md` as the API reference document in this commit.

---

## Commit - 17

Added all user profile endpoints.

- Built `user.controller.js` with three handlers:
    - `GET /users/:id` — fetches public profile info for any user. Strips the `password` field before sending the response.
    - `PUT /users/:id` — allows a user to update their own `name`, `institute`, and `email`. Enforces that only the owner can modify their own profile (`req.userId !== id` → 403). Checks for email uniqueness before applying the update.
    - `DELETE /users/:id` — allows a user to delete their own account. Clears the `token` cookie after deletion so the session is immediately invalidated.
- Added the corresponding model methods (`User.update`, `User.delete`, `User.findByEmail`) to `User.model.js`.
- Added `user.routes.js` and registered it in `app.js`.
- Continued expanding `api.md` with documentation for all user endpoints.

---

## Commit - 18

Added granular rate limiting to all major API endpoints using `express-rate-limit`.

- Created `rateLimit.middleware.js` with the following limiters:
    - **Global API limiter** (`apiLimiter`): 100 requests per 15 minutes, applied to all `/api/*` routes.
    - **Auth limiter** (`authLimiter`): 10 requests per 15 minutes on `/auth/login` and `/auth/register` to prevent brute-force attacks.
    - **Submission limiter** (`submissionLimiter`): 5 submissions per minute to prevent judge spam.
    - **Contest creation limiter** (`contestCreationLimiter`): 5 contest creations per hour.
    - **Profile update limiter** (`profileUpdateLimiter`): 15 updates per 15 minutes.
    - **Contest registration limiter** (`contestRegistrationLimiter`): 10 registrations per 10 minutes.
- All limiters use `standardHeaders: true` so the client receives `RateLimit-*` headers in responses.
- The global `apiLimiter` is applied at the app level; specific limiters are applied as per-route middleware on the relevant route files.

---

## Commit - 19

Added the contest evaluation cron job and wired up the evaluation status lifecycle.

- Installed `node-cron`.
- Added a `contest_evaluation_status` column (ENUM: `pending`, `running`, `completed`, default `pending`) to the `contests` table.
- Created `contestEvaluation.cron.js` which runs on a `*/5 * * * *` schedule (every 5 minutes):
    1. Queries for all contests where the end time has passed and `contest_evaluation_status = 'pending'`.
    2. For each such contest, immediately sets the status to `running` (to prevent duplicate execution if the cron fires again before the first run finishes).
    3. Calls `deltaCalculation(contestId)` from the contest service (a stub at this point).
    4. On success, sets the status to `completed`.
    5. On failure, reverts the status back to `pending` so the cron will retry on the next cycle.
- Added `Contest.getPendingEvaluations()` and `Contest.updateEvaluationStatus()` model methods.
- The cron is imported and started in `index.js` so it runs continuously alongside the server.
- Also created `server/sandbox/` with a `.gitkeep` — this is the temp directory where the judge writes code files during execution.

---

## Commit - 20

Integrated Ollama for local AI model support — an in-platform coding assistant.

- Installed and configured an Ollama-backed AI assistant that can answer competitive programming questions.
- Created `config/aiConfig.js` containing a detailed system prompt that enforces strict boundaries:
    - The AI **cannot** provide code, pseudocode, code snippets, templates, or step-by-step implementation instructions in any form.
    - It **can** explain problem statements in simpler terms, define algorithms and data structures conceptually, explain complexity, give high-level hints, and guide learning.
    - The system prompt includes explicit example responses to shape the model's output style.
- Created `services/ai.service.js` (`generateHint`) which calls the Ollama REST API (`/api/chat`) with the system prompt + user prompt, using `stream: false` to get a complete response.
    - The Ollama URL and model name are configurable via `OLLAMA_URL` and `OLLAMA_MODEL` env variables.
- Created `controllers/ai.controller.js` (`askAssistant`) which validates the incoming prompt and returns the AI's response.
- Added a dedicated **AI rate limiter** (`aiLimiter`) — 10 requests per minute — to prevent abuse of the AI endpoint.
- Added `ai.routes.js` (protected route: requires login) and registered it in `app.js`.
- Updated `.env.sample` with `OLLAMA_URL` and `OLLAMA_MODEL`.
- Updated `api.md` with documentation for the AI endpoint.

---

## Commit - 21

Implemented the full Elo-like delta and rating change system inside a database transaction.

- Replaced the stub `deltaCalculation` in `contest.service.js` with the complete algorithm (see the detailed breakdown below).
- The entire sequence of DB writes (updating deltas for all participants, then updating their ratings and max ratings) is wrapped in a **single MySQL transaction**:
    - If any step fails mid-way, the transaction is rolled back to its original state, preventing partial updates (e.g., some users get new ratings while others don't).
    - On success, the transaction is committed atomically.
- Added `ContestRegistration.updateDelta(conn, contestId, userId, delta)` — updates the `delta` column in `contest_registrations` for a specific user in a specific contest.
- Added `User.updateRating(conn, userId, newRating, newMaxRating)` — updates `rating` and `max_rating` for a user. Both functions accept an active connection object to participate in the same transaction.
- Added the **admin-only `POST /contests/:id/finalize`** endpoint (`finalizeContest` controller):
    - Guards: contest must exist, must have ended, must not already be `completed` or `running`.
    - Sets status to `running`, calls `deltaCalculation`, then sets to `completed`.
    - If `deltaCalculation` throws, reverts to `pending` and returns a 500 so the admin can retry.
    - This provides a manual fallback in case the cron job fails for any reason.
- Updated `api.md` with documentation for the finalize endpoint.

---

## Commit - 22

Added the Swagger UI for interactive API documentation.

- Installed `swagger-ui-express`.
- Created `config/swagger.js` — a large, hand-written OpenAPI 3.0.0 specification covering all API endpoints, including schemas for `User`, `Contest`, `Problem`, `Submission`, `Testcase`, `ContestRegistration`, `ContestStanding`, and the standard `ApiResponse` wrapper.
- The Swagger UI is served at **two routes**:
    - `/` — replaces the old health-check landing page, making the API docs the default view when opening the server URL.
    - `/api-docs` — an alternative path.
- Authentication in Swagger is declared as `cookieAuth` (an API key passed via the `token` cookie), consistent with how the JWT auth middleware works.
- The health-check endpoint was moved to `GET /api/v1`.
- Also fixed a minor bug in `ContestRegistration.model.js` and `contest.service.js` discovered during documentation review.

---

## Commit - 23

Added the updated commit_history notes, architecture and readme notes.

---

## Commit - later 1

We have decoupled the compilation and execution part of the judge, as the compilation for with a cpp file having #include <bits/stdc++.h> was taking a lot of time and memory, as this statement requires a lot of time to bring together all the header files, so we have added the separate service for compilation of code. Now the workflow is like this:

1. User submits the code
2. Submission is saved in the DB with pending state
3. Judge service is called
4. Judge service first compile the code and if successful it then proceeds to the execution
5. If the compilation fails, it updates the submission with compilation error and returns
6. If the execution fails, it updates the submission with execution error and returns
7. If the execution is successful, it updates the submission with the verdict and returns

So, basically fixed 512 GB for compilation code docker container and variable memmory for running code docker container

---

# Rating Delta Calculation Algorithm

The goal is to determine how much each user's rating should increase or decrease after a contest based on:

1. Their **current rating** before the contest.
2. Their **actual performance** in the contest.
3. Their **expected performance** according to their rating.

---

## Step 1: Get the Final Contest Standings

After the contest ends, generate the final ranking of all participants.

Example:

| Rank | User | Rating |
| ---- | ---- | ------ |
| 1    | A    | 1500   |
| 2    | B    | 1700   |
| 3    | C    | 1400   |
| 4    | D    | 1600   |

These are the **actual ranks** achieved in the contest.

---

## Step 2: Estimate How Each User Was Expected to Perform

The rating system assumes that higher-rated users should generally perform better than lower-rated users.

For every participant:

- Compare them against every other participant.
- Calculate the probability that they would beat that participant based on rating difference.
- Sum all these probabilities.

This gives the number of opponents they were expected to beat.

Example:

Suppose User A has:

```text
Expected wins against others:
B -> 0.25
C -> 0.70
D -> 0.40
```

Then:

```text
Expected Wins = 1.35
```

Meaning A is expected to beat roughly 1.35 opponents.

---

## Step 3: Convert Expected Wins into Expected Rank

The expected wins are transformed into an expected contest position.

Example:

```text
100 participants
Expected Wins = 70

Expected Rank = 30
```

The rating system predicts that this user should finish around 30th place.

Now every participant has:

```text
Actual Rank
Expected Rank
```

---

## Step 4: Measure Overperformance or Underperformance

Compare:

```text
Expected Rank
vs
Actual Rank
```

### Case 1: User performed better than expected

```text
Expected Rank = 30
Actual Rank = 10
```

The user exceeded expectations.

They deserve a rating increase.

---

### Case 2: User performed as expected

```text
Expected Rank = 30
Actual Rank = 31
```

Very close to expectation.

Small rating change.

---

### Case 3: User performed worse than expected

```text
Expected Rank = 10
Actual Rank = 50
```

The user underperformed.

They should lose rating.

---

## Step 5: Convert Performance Difference into Rating Change

The larger the gap between expected and actual rank:

- The larger the gain if the user exceeded expectations.
- The larger the loss if the user performed worse.

The delta is computed as:

```text
delta = K × (expectedRank - actualRank)
```

Where `K = 4` is the scaling factor.

Example:

```text
Expected Rank = 50
Actual Rank = 10

Difference = +40
Delta = 4 × 40 = +160
```

Large positive delta.

---

Another example:

```text
Expected Rank = 5
Actual Rank = 50

Difference = -45
Delta = 4 × -45 = -180
```

Large negative delta.

---

## Step 6: Balance the Entire Contest (Zero-Sum Correction)

After calculating everyone's raw delta:

```text
User A +80
User B +20
User C -10
User D -30

Total = +60
```

This creates rating inflation because more points were gained than lost.

To keep the rating pool stable:

- Compute the average excess: `correction = sum(deltas) / n`
- Subtract `correction` from every participant's delta.

This keeps the total net rating change near zero across the entire contest.

---

## Step 7: Apply Rating Floor

A minimum rating of **400** is enforced.

Example:

```text
Current Rating = 420
Calculated Delta = -100

New Rating = 320
```

Since ratings cannot go below 400:

```text
Final Rating = 400
Adjusted Delta = 400 - 420 = -20  (capped)
```

This prevents users from falling indefinitely.

---

## Step 8: Compute Final Ratings

For every participant:

```text
New Rating = max(Current Rating + Final Delta, 400)
```

Example:

| User | Old Rating | Delta | New Rating |
| ---- | ---------- | ----- | ---------- |
| A    | 1500       | +70   | 1570       |
| B    | 1700       | -40   | 1660       |
| C    | 1400       | +20   | 1420       |

---

## Step 9: Save Contest History

The `delta` field in the `contest_registrations` table is updated for each participant.

This is what allows:

- Contest pages to show `+52`
- User profiles to show rating history
- Future analytics

---

## Step 10: Update User Records

For every participant:

Update:

```text
Current Rating
Maximum Rating Achieved
```

If the new rating exceeds the user's previous best rating, update their `max_rating` as well.

---

## Step 11: Make All Updates Atomic

All database updates — saving deltas and updating user ratings — are executed inside a **single MySQL transaction**.

Why?

Imagine:

```text
User 1 updated ✓
User 2 updated ✓
User 3 updated ✓
Error occurs ✗
```

Without a transaction:

```text
Some users get new ratings
Some users keep old ratings
```

Contest data becomes inconsistent, and the next recalculation will produce wrong results.

With a transaction:

```text
Either:
  Everything succeeds → COMMIT

OR

  Everything is reverted → ROLLBACK
```

The rating system remains correct.

---

# Core Idea

The entire algorithm can be summarised as:

```text
1. Determine final standings.
2. Predict standings using ratings.
3. Compare prediction vs reality.
4. Reward users who exceeded expectations.
5. Penalise users who underperformed.
6. Balance the rating pool (zero-sum correction).
7. Enforce a rating floor.
8. Update ratings safely inside a transaction.
```

---

## Lamen Terms:

## Commit - 1

Simple initialisation of repository with ReadMe

## Commit - 2

Setup initial Backend server and connect to MySQL

## Commit - 3

- Add user authentication (regitration, login and logout) using a single token approach
- User Table is made along with a model in server which contains reusable functions for the User Table
- A single token is genrated during the login and stored in the cookie of the browser which has a validity of 7 days
- For every visit to any protected api endpoint, this cookie is verified using JWT and then only allowed to procced. It contains user id and role. It also allows to check for admin users, protected with JWT key, to prevent tamper of token

## Commit - 4

- Add contests and problems table in SQL
- Make models for contests and problems for reusable functions
- Make endpoints for contest create, update and delete
- Make endpoints for problem create, update and delete
- Only allow the original creator of the contest to modify the contest and the problems that belong to that contest
- Also added a verifyContestToggle, which only the admins can trigger to verify any contest created
- Only the contest which is verified by the admins is viewed by the general user later in the code

## Commit - 5

- Add Testcase table, model, and endpoints for creating a single testcase for each and every problem.
- Only original creator of a contest, to which the problem belonged, of which the testcase belongs, is allowed to create, udpate or delete the testcases

## Commit - 6

- General cleaning of some code logic

## Commit - 7

- Previously several DB queries was being executed very ineeficiently, for example, to check for who owned a problem, first we made the DB query to fetch the problem row for that id, then using the contest id in the problem row, we made another db query to fetch the contest row and from that we found the authored_by field and compared it to the user_id provided. This took 2 DB calls to perform a single task, that is to check for the owner of a contest of which a particular problem belonged. Queries like these could have been easily optimised by using a JOIN and optimising the DB call by a single query to perform complex tasks like this
- This is what we did for all the queries written till now, optimising the performace significantly

## Commit - 8

- We made GET endpoints for all the entities till now, contest, problem and testcase
- Any contest can be viewed by the admin
- Verified contests can only be viewed by the general public
- Apart from verified contests, the creator of a contest can see all of their contests
- We also made GET for particular contest, problem or testcase
- Problem is only allowed to view by the general public once the contest is live
- Admins and creators can view the problem or testcase anytime
- Testcase (which are not sample) is hidden from the general public at all times

## Commit - 9

- There was a serious bug where during registration frontend could send a role field to the server. We don't want that as if anyone somehow attached a admin to the role field from frontend, they would become one. We want the already existing admins to assign admin roles to others, which I might add later

## Commit - 10

- Now we made a submission table, model and controller
- Here user can create a submission for a particular problem at any given time for any particular programming language by providing the source_code. This submission will be later evaluated by the online judge.
- Also there is a GET endpoint for submission, to view all their past submissions of a particular contest as well
- Admins and creator of a contest can see all the submission for the particular contest

## Commit - 11

- Used prettier to format the code into a pre-set manner for consistency

## Commit - 12

- Installed ioredis and BullMQ for queue based system for our online judge for submission
- Setup Redis connection as BullMQ uses Redis internally to handle the queue. BullMQ has three components Producers (that produce the task and add to queue), Storage (Redis in-memory data storage) and Workers (that asynchronously picks up jobs from Redis and executes them)
- Any submission_id for any submission made in the queue using BullMQ
- Later a worker which runs continuously in the background concurrently with index.js, takes one item from the queue and sends it to the Online Judge (later added) and then when one is finally evaluated, then takes another one from queue and sends it to OJ and so on
- Also there is a concurrent field in the BullMQ worker, which is the ablity of the worker to process multiple jobs simultaneously. By default it is obviously set to 1, so only one job at a time, only when the job is finished, we take out another one from the queue and execute it. Later I made the concurreny to 2, to reduce the waiting time of the incoming submission in the queue, as two workers can work simultaneously on two different tasks, reducing the wait time.

## Commit - 13, 14

- Added time_limit and memory_limit fields in the field of Problem Table
- ONLINE Judge:
    - First a temp directory is formed ans a source code file is made with the required extension depending on the language
    - A shell script is generated to execute the file based on the file type, also a run command is pre-mapped for all types of file time, here we pass the time limit to the docker
    - Use node.js child process to run the docker container and providing the temp directory along with the shell script command to run inside the docker, before running we also set the verdict to running. We also provide the memory limit to the docker
    - Also docker container is ran temporatily and automatically removed after the execution
    - The input_data is piped to docker for taking the stdin for the code ran
    - Node.js also enforces a outer timeout in addition to docker timeout which is 10seconds more than required to compensate for docker container starting and stopping. This is to prevent the container from hanging.
    - The verdict is decided based on the exit code of the code in docker
    - Later the temp directory is also cleaned up
    - After this the veridict of the submission is updated based on the response from the online judge
    - before executing the code, we store the current time and after the entire execution is completed and a veridict is retured, we check the final time and subtract to get the elapsed time.

## Commit - 15

- Add a contest standings table which takes the contest_id, user_id, problem_id and submission id
- For any submission that gets a verdict of accepted, it is added to the contest_standings table. Also, note that for every problem that is accepted, it is added to the table only once. So if same problem is submitted twice and accepted both of the times, only the submission made the first time is included in our contest standings table for that problem
- Now we make a leaderboard endpoint, which utilises the contest standings table to form the entire leaderboard for a contest
- We get the contest standings for a particular contest, add the scores of all the problems solved by a particular user, subtract the penalty, which is the total time takaen for each problem which is accepted from the contest start time, this gives us the final score, based on this final score participants are ranked in descending order to get the leaderboard.

## Commit - 16

- Add the table for contest registration and the endpoints for contest registration
- This table contains all the people that actually registered for the contest. Later this table will be used to store the delta of each participants after the contest is over. So this table will also act as a contest history for everyone later on
- Also we have allowed people to only participate till 30 minutes have passed since the start time of the contest, after that no one can participate
- Also we updated the judge worker to place an entry in the contest standings only if the problem that was accepted was solved during the contest, becuase then only it should impact the contest leaderboards. If any participant solves a problem after the contest ends, it should just be treated as practice and not in the actual leaderboard, as leaderboard is only for the people who actually solved the problem during the contest

## Commit - 17

- Added all the endpoints for users to view profile, update and delete

## Commit - 18

- We have also added rate limiting to all the major API endpoints and also globally to our backend. This is to limit IP address to send burst of request in a small amount of time
- Example: 100 request in 15 mintutes to our server overall
- 5 submission request to our server per minute
- 10 request for authentication in 15 minutes

## Commit - 19

- Added a contest evaluation cron
- Added a new field called contest_evaluation_status in contest table
- It runs every 5 minutes and checks for any contest that has ended and is still in pending evaluation state
- This then sets the evaluation to running, then send it to our Delta calculation service (later added) and calculates the delta change for all the participants, adds some normalization, then adds the delta data for that contest in the contestRegistration table and the ratings and max ratings of everyone is updated, and then the evalutation state is set to completed after everything has been done successfully

## Commit - 20

- Add Ollama Models support to ask general doubts from the AI agent, we have added a system prompt to prevent the AI from giving the code directly. AI will only give text responses like definition, explaining problem statement etc
- Also added rate limiting to it

## Commit - 21

- Add the Delta change system
- Also added an api endpoint for the admin only to manually trigger the contest evaluation for any contest, in case the cron fails to do so
- Also we have made the entire process of saving the delta to the contest registration for all the users, updating the rating and max rating of all the people of the contest, that is all sequence of DB queries will be ran using transaction. This prevents the situation of partial update of data in the DB. Example, updating only the delta of some people and not the others, recalculation will give the wrong result next time for everyone. That's why transaction in DB is used to either do the entire job or to rollback to the original state if in case any thing stops in between due to some reason
- The entire code for delta update is in the contest.service.js

## Commit - 22

- Add Swagger UI for API docs in the base url and /api-docs of the server

## Commit - 23

Added the updated commit_history notes, architecture and readme notes.

## Commit - Later 1

We have decoupled the compilation and execution part of the judge, as the compilation for with a cpp file having #include <bits/stdc++.h> was taking a lot of time and memory, as this statement requires a lot of time to bring together all the header files, so we have added the separate service for compilation of code. Now the workflow is like this:

1. User submits the code
2. Submission is saved in the DB with pending state
3. Judge service is called
4. Judge service first compile the code and if successful it then proceeds to the execution
5. If the compilation fails, it updates the submission with compilation error and returns
6. If the execution fails, it updates the submission with execution error and returns
7. If the execution is successful, it updates the submission with the verdict and returns

So, basically fixed 512 GB for compilation code docker container and variable memmory for running code docker container

## Commit - Later 2

- I have added total online users functionality, using Redis
- Every 30 seconds a heartbeat is sent by the user at the server, the server adds the entry for it in redis with the username as key and TTL of 45 seconds, also it avoids duplicates. Now if user gets offline, the key auto-expires after 45 seconds, hence removing the count of the user from the total online users. We are sending the heartbeat by a simple POST method

## Commit - Later 3

- I have also added final ranking of each pariticipant in the contest registration table itself

## Commit - Later 4

- Now, I have added the rating graph functionality for each user. By using the contest_registrations table, we can know all the contest user participated in, their delta, final ranking and rating.

## Commit - Later 5

- I have added heatmap to display the user activity, for each and every day of the current year. Basically, display small blocks and make a API call that aggregates all the submissions made by the user. Then we get data like total submissions for each day, total submission that was accepted for each day, total submission that was accepted the entire year and all time and so on.

## Commit - Later 6

- I have now added a custom invocation feature. User send their source_code with their custom input, a invocationId is generated in the server and a temp directory is created in the server with the code and input data, then a queue is formed for custom invoacation with the key as custom invocation id (created using crypto.uuid() or something), then a worker picks up the job (it has higher priority), and gives to the online judge with sufficient time and memmory limits, the code finally executes and the invocationId and output is stored in Redis with a TTL of 2 minutes, then temp directory is deleted. Meanwhile user sends a request every 5 seconds, with the customInvocationId, if it exists in redis, then the ouput (or error message) is sent back else user keeps on polling (for 2 minute) after that polling stops.

## Commit - Later 7

- I have added template feature. User can add, edit and delete templates. Also modifiying and creating a template during an ongoing contest is disabled

- I have also modified testcases, to now include both sample ip/op and hidden ip/op, sample would be used to run the code and hidden would be use to submit the code. Run the code would just use the same flow as custom invocation, by temperarily creating the entry in redis, input would be received from stdin

## Commit - Later 8

- I have added inbuilt code editor and remove submit code by pasting functionality entirely. Users can only choose from their pre-defined template, and not allow external paste, only allow internal copy/pastes. Also users can't mofiy/create their templates during an ongoing contest, to prevent pasting generated code/solution from the external source into template and then using that.

## Commit - Later 9

- I have now removed manual polling for submission, code run and custom invocation. Now I connect to my server via socket, and my server subscribes the redis channel because worker publish the result directly using reedis pub/sub, which my server subscribes and then emits back to the user

Why can't we directly emit via socket from the worker itself?

- A worker can access Socket.IO directly, but only if the worker itself owns the Socket.IO server instance or has a way to communicate with it.

- The usual problem is that your worker and your main server are different processes.

- A seperate worker is used intead of doing everything in node.js, because the single event loop of node.js would remain block as long as any process is being executed, so that's why worker is used, to prevent the single event loop of node.js from blocking. Also if worker crashes somehow, it won't disturb my main node.js process from execution

Viewed CustomInvocationPage.jsx:220-243

Here is the exact flow of the new real-time WebSocket architecture that we just built, taking a code submission as an example:

### 1. Connection (Authentication & Rooms)

When you log into the platform, the `<SocketProvider>` wrapper (in `App.jsx`) initializes a `socket.io-client` connection to the backend. The backend verifies your JWT cookie. Once verified, the backend Socket.io server assigns your specific socket connection to a "room" named strictly after your `userId`.
_(This ensures that if you have 5 browser tabs open, all 5 tabs join the same room and stay perfectly in sync)._

### 2. Job Queueing

When you click **"Submit Code"** (or **"Execute"** for a custom invocation), the React frontend still makes a standard HTTP POST request. The API responds with an ID (e.g. `submission_id` or `customInvocationId`).

- **Before**: The frontend used `setInterval` to ping the API every 3-5 seconds asking, "Is it done yet?"
- **Now**: The frontend simply stores that ID in a state variable (e.g. `pendingSubmissionId`) and patiently waits, listening for socket events.

### 3. Worker Processing & Redis Pub/Sub

The actual code execution happens inside isolated background processes (`judgeWorker.js` or `customInvocationWorker.js`).
Once a worker finishes compiling/executing your code and generates a final verdict (e.g., "Accepted" or "Runtime Error"), it uses `ioredis` to `.publish()` a message to an internal Redis channel called `socket_updates`. It tags this message with your specific `userId`.

### 4. WebSocket Routing

Your main backend server (`server/src/index.js`) is constantly subscribed to the `socket_updates` Redis channel. As soon as it hears a message from a worker, it parses the JSON. It sees your `userId` attached, and commands the Socket.io server to instantly broadcast that exact verdict payload directly to your private room: `io.to(userId).emit(...)`.

### 5. Instant UI Update

Back on the frontend (e.g., in `ContestProblemView.jsx` or `CustomInvocationPage.jsx`), an active `useEffect` listener receives the socket event. It matches the incoming `submission_id` against the `pendingSubmissionId` it was waiting for. If it matches, React instantly clears the loading state, fires the toast notification, and updates the UI!

### Why is this better?

- **Speed**: Verdicts arrive instantly the exact millisecond the worker finishes.
- **Server Load**: We entirely eliminated thousands of redundant HTTP GET requests that were constantly hitting your database while users waited.
- **Scalability**: Utilizing Redis Pub/Sub means that if you eventually run multiple Node.js instances, workers can talk to the sockets flawlessly across different servers!

## Commit - Later 10

- I have now removed the manual polling + redis for checking live users.

- I successfully:
    - Removed the 30-second setInterval loop in the frontend Header.jsx that was constantly pinging the backend API.
    - Modified server/src/sockets/index.js to automatically increment/decrement the unique user count based on standard connection and disconnect socket events, broadcasting the new count using io.emit('live_users_update', count).
    - Updated the backend user.controller.js to calculate whether a user is online by dynamically querying io.in(userId).fetchSockets() instead of checking Redis keys.
    - Removed the /users/heartbeat API endpoint entirely!
