# CodeCode — Backend Server

A high-performance, production-grade backend for a competitive programming platform. Built on Node.js + Express, with a fully asynchronous online judge, Redis-backed job queue, Elo-like rating system, and an integrated AI coding assistant — all documented with an interactive Swagger UI.

---

## 📖 Documentation

| Document                                         | Description                                                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/architecture.md`](./docs/architecture.md) | Full system architecture — directory tree, server startup phases, submission flow, Docker judge execution, cron jobs, Socket.IO scaffolding, and data flow diagrams              |
| [`docs/api.md`](./docs/api.md)                   | Complete API reference — every endpoint, request body, response shape, and auth requirements                                                                                     |
| [`docs/notes.md`](./docs/notes.md)               | Step-by-step build history — every commit explained with the technical rationale behind each decision                                                                            |
| **Swagger UI**                                   | Interactive API explorer — open [`http://localhost:8000`](http://localhost:8000) or [`http://localhost:8000/api-docs`](http://localhost:8000/api-docs) after starting the server |

---

## 🛠️ Tech Stack

| Layer                | Technology                         | Why                                                                                                                                   |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | Node.js (ESM)                      | Non-blocking I/O — ideal for a server that juggles many concurrent HTTP requests and background judge workers simultaneously          |
| **Framework**        | Express v5                         | Minimal, composable middleware pipeline; the async error propagation improvements in v5 fit our `asyncHandler` pattern cleanly        |
| **Database**         | MySQL 8 via `mysql2`               | Relational integrity, JOIN-powered queries, and ACID transactions — see the [MySQL vs MongoDB](#-mysql-over-mongodb) section          |
| **Job Queue**        | BullMQ + Redis                     | Durable, Redis-backed queue that decouples HTTP request handling from the judge workload entirely                                     |
| **In-memory store**  | Redis (ioredis)                    | Sub-millisecond job enqueue/dequeue; BullMQ requires it for job state tracking                                                        |
| **Auth**             | JWT (`jsonwebtoken`)               | Stateless — no session table needed; role (`admin`/`user`) is embedded directly in the token                                          |
| **Password hashing** | bcrypt (12 rounds)                 | Adaptive hashing with a work factor high enough to be brute-force resistant at current hardware speeds                                |
| **Code execution**   | Docker                             | Each submission runs in a fully isolated, network-disabled, resource-capped container; no risk of container escape affecting the host |
| **Cron scheduling**  | node-cron                          | Lightweight in-process scheduler for the contest evaluation pipeline                                                                  |
| **Rate limiting**    | express-rate-limit                 | Per-IP sliding-window limiters on every sensitive route                                                                               |
| **API docs**         | swagger-jsdoc + swagger-ui-express | Full OpenAPI 3.0 spec served interactively at runtime — no separate doc deployment needed                                             |
| **AI assistant**     | Ollama (local LLM)                 | Runs entirely on-device — zero API cost, zero data sent to a third party; model and URL are configurable via env                      |
| **Real-time**        | Socket.IO                          | Scaffolded for future live contest features (standings push, notifications); JWT-authenticated at the socket handshake level          |
| **Dev tooling**      | PM2                                | Runs the API server and all background workers as parallel processes with hot-reloading using a single `npm run dev`                  |
| **Code style**       | Prettier                           | Enforced formatting across the entire codebase                                                                                        |

---

## ⚡ Features

### Authentication & Authorisation

- JWT stored as an **httpOnly cookie** — inaccessible to JavaScript, eliminating XSS token theft.
- Role (`admin` / `user`) is embedded in the token payload — no extra DB lookup per request.
- A deliberate security fix blocks clients from self-assigning `role: 'admin'` during registration; the role is hardcoded to `'user'` server-side regardless of what the body contains.

### Contest Management

- Full CRUD for contests, problems, and test cases — all ownership-verified (creator-only writes).
- Contests require **admin verification** (`isVerified` flag) before they become publicly visible.
- Contest **divisions** (1–5) and time windows are validated at the DB constraint level (`CHECK` constraint), not just application level.
- Registration is open for **30 minutes after the contest starts** and then automatically locked.

### Code Editor & User Templates

- **Inbuilt Code Editor**: External pasting is blocked. Users must select a template and write code internally.
- **User Templates**: Users can create, edit, and set default boilerplate code per language. Templates are locked from editing during an active contest to prevent pasting pre-written solutions.
- **Custom Invocations**: Users can run code against their own custom input. Handled by a dedicated BullMQ queue (`customInvocationWorker`) which pipes stdin to the execution container.

### Advanced Analytics

- **Activity Heatmap**: Submissions are aggregated daily over the current year to render a GitHub-style contribution graph.
- **Rating Graph**: Leverages historical `contest_registrations` data to plot a participant's Elo rating trajectory over time.

### Online Judge

- Supports **5 languages**: C, C++, Java, Python, JavaScript.
- **Decoupled Compilation & Execution**: Compilation runs in a fixed 512MB container, while execution runs in a separate container strictly bound by the problem's memory limit. This prevents language-heavy compilers (like C++ `#include <bits/stdc++.h>`) from artificially causing Memory Limit Exceeded errors.
- Each code execution runs inside a Docker container with:
    - `--network=none` — zero internet access.
    - `--memory` / `--memory-swap` hard caps — OOM kills map to `memory_limit_exceeded`.
    - `--cpus=1` — predictable single-core execution.
    - Per-problem configurable `time_limit_ms` and `memory_limit_mb`.
- An inner `timeout` command inside the container and an outer Node.js `execFile` timeout (`time_limit + 10s`) provide two independent TLE safeguards.
- Verdict is determined purely from the process exit code — no parsing of stderr needed.
- Sandbox directories are always cleaned up in a `finally` block, even if the judge crashes.
- **`concurrency: 2`** in the BullMQ worker — two submissions can be evaluated in parallel without blocking the HTTP server at all.

### Asynchronous Queue & Real-Time WebSockets (Pub/Sub)

- Submission and custom invocation creation return `201 Created` / `200 OK` **instantly** — the client never waits for execution.
- **Zero Polling**: WebSockets (Socket.IO) completely replace HTTP polling. When a background worker finishes evaluating code, it publishes the verdict to a Redis `socket_updates` channel. The main API server subscribes to this channel and emits the payload directly to the specific user's private socket room.
- Redis persists the job queue across server restarts; no submission is ever silently dropped.
- Workers run as completely **separate processes** (e.g., `submissionWorker.js` and `customInvocationWorker.js`) — a crashing worker cannot take down the API server.

### Contest Standings & Leaderboard

- The `contest_standings` table records only the **first accepted submission** per problem per user — re-submissions don't pollute the leaderboard.
- Standings are only recorded while the contest is live; post-contest accepted solutions count as practice only.
- The leaderboard query computes `final_score = SUM(problem scores) - SUM(penalty minutes)` entirely inside a single SQL `GROUP BY` aggregation — no application-layer sorting needed.

### Elo-like Rating System

After a contest ends, ratings are updated using a multi-step algorithm:

1. **Expected rank** is computed for each participant using pairwise Elo probability against every other participant: `P(i beats j) = 1 / (1 + 10^((Rj - Ri) / 400))`.
2. **Raw delta** = `K × (expectedRank - actualRank)` where `K = 4`.
3. A **zero-sum correction** (`sumDelta / n`) is subtracted from every delta, keeping the total net rating change across the field near zero.
4. A **rating floor of 400** is enforced — `newRating = max(currentRating + delta, 400)`.
5. `max_rating` is updated if the new rating is an all-time high.
6. All writes (delta per registration + rating per user) run inside a **single MySQL transaction** — either every participant is updated or nobody is. There is no partial-update state.

### Automatic Contest Finalization (Cron)

- A `node-cron` job fires **every 5 minutes** inside the API server process.
- It fetches all contests where `contest_end_time < NOW()` and `contest_evaluation = 'pending'`.
- The evaluation status lifecycle is `pending → running → completed` (or `running → pending` on failure), preventing double-evaluation if the cron fires during a long-running calculation.
- An **admin-only `POST /contests/:id/finalize`** endpoint provides a manual fallback trigger for the same pipeline.

### AI Coding Assistant

- Backed by a **local Ollama instance** — the model and endpoint are fully configurable via `OLLAMA_URL` and `OLLAMA_MODEL` env variables.
- A detailed system prompt in `config/aiConfig.js` enforces hard boundaries: **no code, no pseudocode, no implementation steps** — only conceptual explanations, hints, and learning guidance.
- Rate-limited to 100 requests per 5 minutes per IP.

### Live Online Users Tracking

- Tracks active sessions using Redis-backed transient keys with a **45-second TTL**.
- Periodic heartbeats sent by the client refresh the user's active status.
- Manual polling for live user counts has been removed in favor of real-time architectural improvements.
- Uses a fast, non-blocking Redis `SCAN` to compute the total count of active sessions.
- Injects a real-time `isOnline` status flag into user profiles and profile hover cards.

### Rate Limiting

Every sensitive route has a dedicated `express-rate-limit` limiter. Limits are enforced per IP:

| Scope                   | Window | Max requests |
| ----------------------- | ------ | ------------ |
| Global (all `/api/*`)   | 15 min | 100          |
| Auth (login / register) | 15 min | 10           |
| Submissions             | 1 min  | 5            |
| Contest creation        | 1 hour | 5            |
| Contest registration    | 10 min | 10           |
| Profile update          | 15 min | 15           |
| AI assistant            | 5 min  | 100          |

Standard `RateLimit-*` headers are returned to the client on every response.

### Swagger UI

- Full **OpenAPI 3.0** specification covering every route, request body, response schema, and cookie-based auth.
- Served at **`http://localhost:8000`** (root) and **`http://localhost:8000/api-docs`**.
- Schemas defined for: `User`, `Contest`, `Problem`, `Submission`, `Testcase`, `ContestRegistration`, `ContestStanding`, and the standard `ApiResponse` wrapper.
- No separate deployment or build step — the spec is generated from `config/swagger.js` at runtime.

---

## 🚀 Performance & Optimisations

### Query Optimisation with SQL JOINs

One of the most impactful optimisations in this codebase is the systematic elimination of **N+1 query patterns**. Early versions made sequential DB round-trips to traverse ownership chains; every single one was replaced with a single JOIN query.

**Before (2 round-trips):**

```
// Check if user owns the problem's contest
const problem = await pool.query('SELECT * FROM problems WHERE problem_id = ?', [id]);
const contest = await pool.query('SELECT * FROM contests WHERE id = ?', [problem.contest_id]);
// then check contest.authored_by === req.userId
```

**After (1 round-trip):**

```sql
SELECT p.*, c.authored_by AS contest_authored_by
FROM problems p
JOIN contests c ON p.contest_id = c.id
WHERE p.problem_id = ?
```

This pattern is applied throughout the codebase:

| Operation                | Queries before                          | Queries after | Savings                  |
| ------------------------ | --------------------------------------- | ------------- | ------------------------ |
| Problem ownership check  | 2                                       | 1             | 50%                      |
| Testcase ownership check | 3                                       | 1             | 67%                      |
| Submission judge fetch   | 3 (submissions + problems + test_cases) | 1             | 67%                      |
| Leaderboard aggregation  | N queries (one per user)                | 1 GROUP BY    | ~100× for large contests |
| Rating calculation input | 4 separate queries                      | 1 multi-JOIN  | 75%                      |

MySQL's query planner handles these JOINs with indexed foreign keys, making multi-table lookups **essentially the same cost** as single-table lookups at typical contest scales.

### Async Submission Pipeline

The HTTP response time for `POST /submissions` is **< 5ms** — it inserts one DB row and enqueues one Redis job, then returns. The client never waits for Docker to spin up, compile, or execute code. This means:

- The API server stays responsive regardless of how many submissions are in-flight.
- The submission worker can be scaled horizontally by simply increasing `concurrency` or running multiple worker processes.

### Atomic Transactions for Rating Updates

Without transactions, a crash mid-way through updating 50 participants' ratings would leave the database in a state where some users have new ratings and others don't — and the cron would not know which ones to retry. The `contest_evaluation` status column + MySQL transactions together guarantee:

- If anything fails: full rollback, status reverts to `pending`, cron retries on next cycle.
- If everything succeeds: single atomic commit, status set to `completed`, never re-evaluated.

---

## 🗄️ MySQL Over MongoDB

This project deliberately chose **MySQL** over MongoDB, and the reasons are deeply tied to the shape of the data and the query patterns required.

### 1. Relational data is actually relational

The core entities — users, contests, problems, test cases, submissions, standings, registrations — have **strict foreign key relationships**. A submission belongs to a problem, which belongs to a contest, which was authored by a user. These relationships need to be enforced at the database level, not just by application convention. MySQL's `FOREIGN KEY ... ON DELETE CASCADE` constraints mean deleting a contest automatically cascades to its problems, test cases, submissions, and standings — with zero application code.

MongoDB has no native foreign key enforcement. Referential integrity would need to be implemented and maintained entirely in application code, which is a source of subtle bugs.

### 2. JOINs make complex queries trivial

The leaderboard query is a perfect example of why SQL wins here:

```sql
SELECT
    cs.user_id,
    u.username,
    SUM(p.score)                                                            AS total_score,
    SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at))       AS total_penalty_minutes,
    SUM(p.score) - SUM(TIMESTAMPDIFF(MINUTE, c.contest_start_time, s.submitted_at)) AS final_score
FROM contest_standings cs
JOIN users      u  ON cs.user_id               = u.id
JOIN problems   p  ON cs.problem_id             = p.problem_id
JOIN submissions s ON cs.accepted_submission_id = s.submission_id
JOIN contests    c  ON cs.contest_id             = c.id
WHERE cs.contest_id = ?
GROUP BY cs.user_id, u.username, u.name
ORDER BY final_score DESC
```

This computes the full ranked leaderboard — including usernames, scores, penalty times, and ranking — **in a single DB round-trip**. The equivalent in MongoDB requires multiple `$lookup` stages in an aggregation pipeline that are harder to read, optimise, and debug.

### 3. ACID transactions are a first-class feature

The rating update writes deltas for every participant and updates every user's rating in a single transaction. MySQL's transaction model (`BEGIN`, `COMMIT`, `ROLLBACK`) is battle-tested and predictable. MongoDB only introduced multi-document transactions in v4.0, and they come with significant overhead and restrictions on sharded clusters.

### 4. Schema enforcement prevents bad data

MySQL's `ENUM` types and `CHECK` constraints enforce valid values at the storage layer:

- `verdict` can only be one of 7 legal values — not a free-form string.
- `division` must be between 1 and 5 — enforced by a `CHECK` constraint, not just a controller validation.
- `role` can only be `'admin'` or `'user'`.

In MongoDB, these constraints require application-level validation (or Mongoose schema validators), which can be bypassed if data is written from outside the application.

### 5. Predictable performance for read-heavy workloads

Contest leaderboards and submission history are read far more often than they are written. MySQL's B-tree indexes on foreign keys and frequently queried columns (`contest_id`, `user_id`, `verdict`) give deterministic, plannable query performance. The `EXPLAIN` plan is straightforward to read and optimise.

---

## 📦 Packages

| Package                  | Version       | Role                                                                         |
| ------------------------ | ------------- | ---------------------------------------------------------------------------- |
| `express`                | ^5.2.1        | HTTP server framework                                                        |
| `mysql2`                 | ^3.22.4       | MySQL driver with connection pool and Promise support                        |
| `jsonwebtoken`           | ^9.0.3        | JWT signing and verification                                                 |
| `bcrypt`                 | ^6.0.0        | Password hashing (12 salt rounds)                                            |
| `cookie-parser`          | ^1.4.7        | Parses the `httpOnly` JWT cookie from incoming requests                      |
| `cors`                   | ^2.8.6        | CORS with configurable allowed origins from `CORS_ORIGIN` env                |
| `bullmq`                 | ^5.78.0       | Redis-backed job queue — `Queue` (producer) + `Worker` (consumer)            |
| `ioredis`                | ^5.11.0       | Redis client; `maxRetriesPerRequest: null` required by BullMQ                |
| `node-cron`              | ^4.2.1        | In-process cron scheduler for contest evaluation                             |
| `express-rate-limit`     | ^8.5.2        | Per-IP rate limiting with standard `RateLimit-*` headers                     |
| `swagger-jsdoc`          | ^6.3.0        | Generates OpenAPI spec from the inline definition                            |
| `swagger-ui-express`     | ^5.0.1        | Serves the interactive Swagger UI at `/` and `/api-docs`                     |
| `socket.io`              | —             | WebSocket server (scaffolded for future real-time features)                  |
| `morgan`                 | ^1.10.1       | HTTP request logger (dev format)                                             |
| `dotenv`                 | ^17.4.2       | Loads `.env` into `process.env`                                              |
| `ngrok`                  | ^5.0.0-beta.2 | Dev tunnel for exposing the local server publicly (commented out by default) |
| `pm2`                    | ^7.0.1        | Runs API server and all background workers as parallel processes             |
| `prettier`               | ^3.8.3        | Enforces consistent code style across the entire codebase                    |
| `child_process` (stdlib) | —             | `execFile` to spawn `docker run` for each submission                         |
| `fs/promises` (stdlib)   | —             | Async file I/O for sandbox creation, source file writing, and cleanup        |

---

## 🔧 Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+
- Redis
- Docker (for the online judge)
- Ollama (optional — for the AI assistant)

### Environment Variables

Copy `.env.sample` to `.env` and fill in the values:

```env
PORT=8000

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=codecode_v0

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
ACCESS_TOKEN_SECRET=your_socket_secret

REDIS_PORT=6379

CORS_ORIGIN=http://localhost:5173

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

### Database

Run the schema to create all tables:

```bash
mysql -u root -p < src/db/schema.sql
```

### Run

```bash
# Development (hot-reload, API server + all workers)
npm run dev

# Production
npm start
```

The API server starts on `http://localhost:8000`.  
The Swagger UI is available immediately at [`http://localhost:8000`](http://localhost:8000).

---

## 🗂️ Project Structure (summary)

```
server/
├── src/
│   ├── index.js            # Entry point
│   ├── app.js              # Express app + middleware registration
│   ├── config/             # Redis, Swagger spec, AI system prompt
│   ├── constants/          # HTTP status codes, cookie options
│   ├── controllers/        # Request handlers (auth, contest, problem, submission, user, ai, health)
│   ├── cron/               # Contest evaluation cron job
│   ├── db/                 # MySQL pool, connectDB, schema.sql
│   ├── middlewares/        # verifyToken, verifyAdmin, errorHandler, rate limiters
│   ├── models/             # DB query functions (User, Contest, Problem, TestCase, Submission, ...)
│   ├── queues/             # BullMQ submission queue (producer)
│   ├── routes/             # Express routers
│   ├── services/           # judge.service.js, contest.service.js (delta), ai.service.js
│   ├── sockets/            # Socket.IO init, auth middleware (scaffolded)
│   ├── utility/            # ApiError, ApiResponse, asyncHandler
│   └── workers/            # BullMQ submission worker (consumer)
├── docs/
│   ├── architecture.md     # Full architecture reference
│   ├── api.md              # Full API reference
│   └── notes.md            # Commit-by-commit build history
├── sandbox/                # Temp directory for judge code files (auto-cleaned after each run)
├── package.json
└── .env.sample
```

---

## Credits

Developed by [Pranaw Kumar](https://www.linkedin.com/in/pranaw-kumar-710331215/)
