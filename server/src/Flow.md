# Online Judge Architecture Flow

## Overview

The goal is to execute user submissions asynchronously and safely.

Instead of running code directly inside the API request, we:

1. Store the submission in MySQL.
2. Push a job into Redis (using BullMQ) in queues directory.
3. A worker picks up the job inside workers directory which runs continuously in background.
4. The worker runs the code inside Docker.
5. The worker compares outputs.
6. The worker updates the verdict in MySQL.

---

# High Level Architecture

```text
Frontend (React)
        |
        v
Backend API (Express)
        |
        v
      MySQL
        |
        v
 Redis Queue (BullMQ)
        |
        v
 Judge Worker
        |
        v
 Docker Sandbox
        |
        v
 Update Verdict
```

---