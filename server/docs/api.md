# CodeCode API Reference

Welcome to the CodeCode backend API documentation. All endpoints except public authentication routes require a valid session token (passed via an `httpOnly` cookie named `token`).

---

## Authentication Endpoints (`/api/v1/auth`)

### 1. Register User

- **Method**: `POST`
- **Route**: `/register`
- **Access**: Public
- **Request Body**:
    ```json
    {
        "username": "coder_x",
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "password": "strongpassword123",
        "institute": "MIT"
    }
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Registration successful.",
        "data": {
            "id": 1,
            "username": "coder_x",
            "name": "Alex Mercer",
            "institute": "MIT",
            "email": "alex@example.com",
            "rating": 0,
            "max_rating": 0,
            "role": "user",
            "created_at": "2026-06-02T09:00:00.000Z"
        }
    }
    ```

### 2. Login User

- **Method**: `POST`
- **Route**: `/login`
- **Access**: Public
- **Request Body**:
    ```json
    {
        "email": "alex@example.com",
        "password": "strongpassword123"
    }
    ```
- **Success Response (200 OK)**: Sets `token` cookie.
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Login successful.",
        "data": {
            "id": 1,
            "username": "coder_x",
            "name": "Alex Mercer",
            "institute": "MIT",
            "email": "alex@example.com",
            "rating": 0,
            "max_rating": 0,
            "role": "user",
            "created_at": "2026-06-02T09:00:00.000Z"
        }
    }
    ```

### 3. Logout User

- **Method**: `POST`
- **Route**: `/logout`
- **Access**: Authenticated (Token required)
- **Success Response (200 OK)**: Clears `token` cookie.
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Logout successful."
    }
    ```

---

## Contest Endpoints (`/api/v1/contests`)

_Note: All endpoints require authentication._

### 1. Create Contest

- **Method**: `POST`
- **Route**: `/`
- **Access**: Users with role `user`
- **Request Body**:
    ```json
    {
        "title": "CodeCode Grand Prix Div. 2",
        "description": "Weekly contest for Div 2 coders",
        "contest_start_time": "2026-06-03T18:00:00.000Z",
        "contest_end_time": "2026-06-03T20:00:00.000Z",
        "division": 2
    }
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Contest created successfully.",
        "data": {
            "id": 1,
            "title": "CodeCode Grand Prix Div. 2",
            "description": "Weekly contest for Div 2 coders",
            "isVerified": false,
            "authored_by": 1,
            "created_on": "2026-06-02T09:10:00.000Z",
            "contest_start_time": "2026-06-03T18:00:00.000Z",
            "contest_end_time": "2026-06-03T20:00:00.000Z",
            "division": 2
        }
    }
    ```

### 2. View All Contests

- **Method**: `GET`
- **Route**: `/`
- **Access**: Authenticated. Normal users only see verified contests. Admin and the contest creators see all contests.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "All contests fetched.",
        "data": [
            {
                "id": 1,
                "title": "CodeCode Grand Prix Div. 2",
                "description": "Weekly contest for Div 2 coders",
                "authored_by_name": "Alex Mercer"
            }
        ]
    }
    ```

### 2b. View My Contests

- **Method**: `GET`
- **Route**: `/my`
- **Access**: Authenticated. Returns only the contests created by the logged-in user.
- **Description**: Fetches all contests authored by the current user, including division, description, verification status, and evaluation status. Ordered by creation date (newest first).
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Your contests fetched.",
        "data": [
            {
                "id": 1,
                "title": "CodeCode Grand Prix Div. 2",
                "description": "Weekly contest for Div 2 coders",
                "division": 2,
                "isVerified": false,
                "contest_start_time": "2026-06-03T18:00:00.000Z",
                "contest_end_time": "2026-06-03T20:00:00.000Z",
                "contest_evaluation": "pending",
                "authored_by": 1,
                "authored_by_name": "Alex Mercer"
            }
        ]
    }
    ```

### 3. View Particular Contest

- **Method**: `GET`
- **Route**: `/:id`
- **Access**: Authenticated. Normal users can only view if the contest is verified. Admin and the contest creator can view regardless of verification status.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Contest fetched.",
        "data": {
            "id": 1,
            "title": "CodeCode Grand Prix Div. 2",
            "description": "Weekly contest for Div 2 coders",
            "isVerified": false,
            "authored_by": 1,
            "created_on": "2026-06-02T09:10:00.000Z",
            "contest_start_time": "2026-06-03T18:00:00.000Z",
            "contest_end_time": "2026-06-03T20:00:00.000Z",
            "division": 2
        }
    }
    ```

### 4. Update Contest

- **Method**: `PATCH`
- **Route**: `/:id`
- **Access**: Creator of the contest only
- **Request Body**: (all fields optional)
    ```json
    {
        "description": "Updated description",
        "division": 1,
        "contest_start_time": "2026-06-03T19:00:00.000Z",
        "contest_end_time": "2026-06-03T21:00:00.000Z"
    }
    ```
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Contest updated successfully.",
        "data": {
            "id": 1,
            "title": "CodeCode Grand Prix Div. 2",
            "description": "Updated description",
            "isVerified": false,
            "authored_by": 1,
            "contest_start_time": "2026-06-03T19:00:00.000Z",
            "contest_end_time": "2026-06-03T21:00:00.000Z",
            "division": 1
        }
    }
    ```

### 5. Toggle Contest Verification

- **Method**: `PATCH`
- **Route**: `/:id/verify`
- **Access**: Admin only
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Contest verified successfully.",
        "data": {
            "id": 1,
            "isVerified": true
        }
    }
    ```

### 6. Delete Contest

- **Method**: `DELETE`
- **Route**: `/:id`
- **Access**: Creator of the contest only
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Contest deleted successfully."
    }
    ```

### 7. View Contest Leaderboard

- **Method**: `GET`
- **Route**: `/:id/leaderboard`
- **Access**: Authenticated. Normal users can only view if the contest is verified. Admin and the contest creator can view regardless of verification status.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Leaderboard fetched.",
        "data": [
            {
                "user_id": 1,
                "username": "coder_x",
                "name": "Alex Mercer",
                "problems_solved": 2,
                "total_score": 1400,
                "total_penalty_minutes": 120,
                "final_score": 1280,
                "solved_problems": [
                    {
                        "problem_id": 4,
                        "score": 600,
                        "penalty_minutes": 45
                    },
                    {
                        "problem_id": 7,
                        "score": 800,
                        "penalty_minutes": 75
                    }
                ]
            }
        ]
    }
    ```

---

## Problem Endpoints (`/api/v1/problems`)

_Note: All endpoints require authentication._

### 1. Create Problem

- **Method**: `POST`
- **Route**: `/`
- **Access**: Creator of the target contest
- **Request Body**:
    ```json
    {
        "contest_id": 1,
        "title": "Sum of Two Numbers",
        "score": 100,
        "rating": 800,
        "statement": "Given two numbers a and b, find their sum.",
        "explanation": "Example: 1 + 2 = 3"
    }
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Problem created successfully.",
        "data": {
            "problem_id": 1,
            "contest_id": 1,
            "title": "Sum of Two Numbers",
            "score": 100,
            "rating": 800,
            "statement": "Given two numbers a and b, find their sum.",
            "explanation": "Example: 1 + 2 = 3"
        }
    }
    ```

### 2. View All Problems for a Contest

- **Method**: `GET`
- **Route**: `/?contest_id=1`
- **Access**: Authenticated. Normal users can only fetch problems if the contest has started. Admins and the contest creator can view them anytime.
- **Success Response (200 OK)**: Only returns basic identifiers.
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Problems fetched.",
        "data": [
            {
                "problem_id": 1,
                "title": "Sum of Two Numbers"
            }
        ]
    }
    ```

### 3. View Particular Problem

- **Method**: `GET`
- **Route**: `/:id`
- **Access**: Authenticated. Normal users can only fetch the problem if the contest has started. The problem's `rating` will only be returned to normal users if the contest has ended. Admins and contest creators can view everything (including the rating) at any time. Automatically fetches any associated sample test cases.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Problem fetched.",
        "data": {
            "problem_id": 1,
            "contest_id": 1,
            "title": "Sum of Two Numbers",
            "score": 100,
            "rating": 800,
            "statement": "Given two numbers a and b, find their sum.",
            "explanation": "Example: 1 + 2 = 3",
            "sample_test_cases": [
                {
                    "test_case_id": 5,
                    "input_data": "1 2",
                    "expected_output": "3"
                }
            ]
        }
    }
    ```

### 4. Update Problem

- **Method**: `PATCH`
- **Route**: `/:id`
- **Access**: Creator of the contest this problem belongs to
- **Request Body**: (all fields optional)
    ```json
    {
        "title": "Sum of Two Integers",
        "score": 200,
        "statement": "Calculate the sum of two integers."
    }
    ```
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Problem updated successfully.",
        "data": {
            "problem_id": 1,
            "contest_id": 1,
            "title": "Sum of Two Integers",
            "score": 200,
            "rating": 800,
            "statement": "Calculate the sum of two integers.",
            "explanation": "Example: 1 + 2 = 3"
        }
    }
    ```

### 5. Delete Problem

- **Method**: `DELETE`
- **Route**: `/:id`
- **Access**: Creator of the contest this problem belongs to
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Problem deleted successfully."
    }
    ```

---

## Test Case Endpoints (`/api/v1/testcases`)

_Note: All endpoints require authentication._

### 1. Create Test Case

- **Method**: `POST`
- **Route**: `/`
- **Access**: Creator of the contest this problem belongs to. Only _one_ test case can be registered per problem.
- **Request Body**:
    ```json
    {
        "problem_id": 1,
        "input_data": "10 20",
        "expected_output": "30",
        "is_sample": true
    }
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Test case created successfully.",
        "data": {
            "test_case_id": 1,
            "problem_id": 1,
            "input_data": "10 20",
            "expected_output": "30",
            "is_sample": true
        }
    }
    ```

### 2. View All Test Cases for a Problem

- **Method**: `GET`
- **Route**: `/?problem_id=1`
- **Access**: Creator of the contest this problem belongs to only.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Test cases fetched.",
        "data": [
            {
                "test_case_id": 1,
                "problem_id": 1,
                "input_data": "10 20",
                "expected_output": "30",
                "is_sample": true
            }
        ]
    }
    ```

### 3. Update Test Case

- **Method**: `PATCH`
- **Route**: `/:id`
- **Access**: Creator of the contest this problem belongs to
- **Request Body**: (all fields optional)
    ```json
    {
        "input_data": "100 200",
        "expected_output": "300",
        "is_sample": false
    }
    ```
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Test case updated successfully.",
        "data": {
            "test_case_id": 1,
            "problem_id": 1,
            "input_data": "100 200",
            "expected_output": "300",
            "is_sample": false
        }
    }
    ```

### 4. Delete Test Case

- **Method**: `DELETE`
- **Route**: `/:id`
- **Access**: Creator of the contest this problem belongs to
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Test case deleted successfully."
    }
    ```

---

## Submission Endpoints (`/api/v1/submissions`)

_Note: All endpoints require authentication._

### 0. Get Solved Problems by Contest

- **Method**: `GET`
- **Route**: `/solved?contest_id=1`
- **Access**: Authenticated users.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Solved problems fetched.",
        "data": [1, 5, 12]
    }
    ```
- **Error Cases**:
    - `400` — `contest_id` missing

### 0. Get Submission Counts by Contest

- **Method**: `GET`
- **Route**: `/counts?contest_id=1`
- **Access**: Authenticated users.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Submission counts fetched.",
        "data": [
            {
                "problem_id": 1,
                "total_submissions": 45
            },
            {
                "problem_id": 2,
                "total_submissions": 12
            }
        ]
    }
    ```
- **Error Cases**:
    - `400` — `contest_id` missing

### 1. Create Submission

- **Method**: `POST`
- **Route**: `/`
- **Access**: Authenticated. Normal users can only submit if the contest has started. Admin and contest creators can submit at any time.
- **Request Body**:
    ```json
    {
        "problem_id": 1,
        "language": "cpp",
        "source_code": "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    if (cin >> a >> b) cout << a + b << endl;\n    return 0;\n}"
    }
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Submission created successfully.",
        "data": {
            "submission_id": 1,
            "problem_id": 1,
            "submitted_by": 1,
            "submitted_at": "2026-06-02T09:20:00.000Z",
            "verdict": "pending",
            "language": "cpp",
            "source_code": "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    if (cin >> a >> b) cout << a + b << endl;\n    return 0;\n}",
            "execution_time_ms": null,
            "memory_used_kb": null
        }
    }
    ```

### 2. View All Submissions for a Contest

- **Method**: `GET`
- **Route**: `/?contest_id=1`
- **Access**: Authenticated. Normal users will only see their own submissions for the contest. Admins and the contest creator will see all submissions for that contest. For security, `source_code` is hidden for everyone in this list.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Submissions fetched.",
        "data": [
            {
                "submission_id": 1,
                "problem_id": 1,
                "submitted_by": 1,
                "submitted_at": "2026-06-02T09:20:00.000Z",
                "verdict": "pending",
                "language": "cpp",
                "execution_time_ms": null,
                "memory_used_kb": null
            }
        ]
    }
    ```

### 3. View Particular Submission

- **Method**: `GET`
- **Route**: `/:id`
- **Access**: The submitter, the contest creator, and admins only. Normal users cannot view submissions created by others.
- **Success Response (200 OK)**: Returns the full submission including the `source_code`.
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Submission fetched.",
        "data": {
            "submission_id": 1,
            "problem_id": 1,
            "submitted_by": 1,
            "submitted_at": "2026-06-02T09:20:00.000Z",
            "verdict": "pending",
            "language": "cpp",
            "source_code": "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    if (cin >> a >> b) cout << a + b << endl;\n    return 0;\n}",
            "execution_time_ms": null,
            "memory_used_kb": null
        }
    }
    ```

## Registration Endpoints (`/api/v1/contests`)

_Note: All endpoints require authentication. Admins and contest creators do not need to register._

### 8. Register for a Contest

- **Method**: `POST`
- **Route**: `/register`
- **Access**: Authenticated users. Registration is allowed any time before the contest ends, but closes 30 minutes after the contest start time.
- **Request Body**:
    ```json
    {"contest_id": 1}
    ```
- **Success Response (201 Created)**:
    ```json
    {
        "statusCode": 201,
        "success": true,
        "message": "Successfully registered for the contest.",
        "data": {
            "registration_id": 42,
            "contest_id": 1,
            "user_id": 7,
            "registered_at": "2026-06-03T18:10:00.000Z"
        }
    }
    ```
- **Error cases**:
    - `400` — `contest_id` missing
    - `404` — Contest not found
    - `409` — Already registered
    - `403` — Contest has ended, or registration window (start time + 30 min) has passed

### 8b. Unregister from a Contest

- **Method**: `DELETE`
- **Route**: `/register`
- **Access**: Authenticated users. Can only unregister before the contest has started.
- **Request Body**:
    ```json
    {"contest_id": 1}
    ```
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Successfully unregistered from the contest."
    }
    ```
- **Error cases**:
    - `400` — `contest_id` missing
    - `403` — Contest has already started
    - `404` — Contest not found, or user is not registered

### 9. Check Registration Status

- **Method**: `GET`
- **Route**: `/register/status?contest_id=1`
- **Access**: Authenticated users.
- **Success Response — Registered (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Registration status fetched.",
        "data": {
            "is_registered": true,
            "registered_at": "2026-06-03T18:10:00.000Z"
        }
    }
    ```
- **Success Response — Not Registered (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Registration status fetched.",
        "data": {
            "is_registered": false,
            "registration_open": true,
            "time_remaining": "24m 13s"
        }
    }
    ```
    > `time_remaining` counts down to the registration deadline (contest start + 30 min). Shows `"Registration closed"` if the window has passed.

### 10. Finalize Contest

- **Method**: `POST`
- **Route**: `/:id/finalize`
- **Access**: Admin only. Triggers the calculation of Elo-like rating deltas for all participants of the contest.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Contest 1 finalized successfully."
    }
    ```
- **Error Cases**:
    - `400` — Contest has not ended yet. Cannot finalize before the end time.
    - `404` — Contest not found.
    - `409` — Contest has already been finalized or finalization is already in progress.

---

## User Endpoints (`/api/v1/users`)

_Note: All endpoints require authentication._

### 1. View User Details

- **Method**: `GET`
- **Route**: `/:id`
- **Access**: Authenticated users (any user can view another user's profile details).
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "User details fetched successfully.",
        "data": {
            "id": 1,
            "username": "coder_x",
            "name": "Alex Mercer",
            "institute": "MIT",
            "email": "alex@example.com",
            "rating": 0,
            "max_rating": 0,
            "role": "user",
            "isOnline": true,
            "created_at": "2026-06-02T09:00:00.000Z"
        }
    }
    ```
- **Error Cases**:
    - `404` — User not found

### 2. Update User Details

- **Method**: `PATCH`
- **Route**: `/:id`
- **Access**: Submitter must be the same user as `:id` (ownership verification).
- **Request Body**: (all fields optional)
    ```json
    {
        "name": "Alex J. Mercer",
        "institute": "Harvard",
        "email": "alex.new@example.com"
    }
    ```
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "User updated successfully.",
        "data": {
            "id": 1,
            "username": "coder_x",
            "name": "Alex J. Mercer",
            "institute": "Harvard",
            "email": "alex.new@example.com",
            "rating": 0,
            "max_rating": 0,
            "role": "user",
            "created_at": "2026-06-02T09:00:00.000Z"
        }
    }
    ```
- **Error Cases**:
    - `400` — Empty name or email provided
    - `403` — Not authorized (updating someone else's profile)
    - `404` — User not found
    - `409` — Email already in use

### 3. Delete User Profile

- **Method**: `DELETE`
- **Route**: `/:id`
- **Access**: Submitter must be the same user as `:id` (ownership verification). Clears the session token cookie on success.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "User deleted successfully."
    }
    ```
- **Error Cases**:
    - `403` — Not authorized (deleting someone else's profile)

### 4. User Heartbeat & Live Users Count

- **Method**: `POST`
- **Route**: `/heartbeat`
- **Access**: Authenticated users.
- **Description**: Registers or refreshes the user's active session in Redis with a 45-second TTL. Returns the total count of active online users.
- **Success Response (200 OK)**:
    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "Heartbeat acknowledged.",
        "data": {
            "onlineUsers": 12
        }
    }
    ```

---

## AI Endpoints (`/api/v1/ai`)

_Note: All endpoints require authentication._

### 1. Ask AI Assistant

- **Method**: `POST`
- **Route**: `/ask`
- **Access**: Authenticated users. Limited to 5 requests per 10 minutes.
- **Description**: Asks the local AI assistant a question. The assistant is configured as a coding mentor to provide hints and definitions, but never code.
- **Request Body**:
    ```json
    {
        "prompt": "How do I find the longest palindromic substring?"
    }
    ```
- **Success Response (200 OK)**:

    ```json
    {
        "statusCode": 200,
        "success": true,
        "message": "AI response generated successfully.",
        "data": {
            "hint": "To find the longest palindromic substring, you can use the 'expand around center' approach. This involves iterating through the string and expanding outward from each character (and between each pair of characters) to check for palindromes. By keeping track of the longest palindrome found during these expansions, you can identify the final answer."
        }
    }
    ```

- **Error Cases**:
    - `400` — Prompt is required and must be a non-empty string.
    - `429` — You have reached your AI assistant limit.
    - `500` — Failed to communicate with the AI assistant (Ollama offline).
