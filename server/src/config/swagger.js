const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'CodeCode API Docs',
        version: '1.0.0',
        description:
            'REST API for the CodeCode competitive programming platform. ' +
            'All protected endpoints require a valid `token` cookie set via Login.',
    },
    servers: [
        {
            url: '/api/v1',
            description: 'Current server',
        },
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    statusCode: {type: 'integer'},
                    success: {type: 'boolean'},
                    message: {type: 'string'},
                    data: {},
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: {type: 'integer'},
                    username: {type: 'string'},
                    name: {type: 'string'},
                    institute: {type: 'string', nullable: true},
                    email: {type: 'string'},
                    rating: {type: 'integer'},
                    max_rating: {type: 'integer'},
                    role: {type: 'string', enum: ['admin', 'user']},
                    created_at: {type: 'string', format: 'date-time'},
                },
            },
            Contest: {
                type: 'object',
                properties: {
                    id: {type: 'integer'},
                    title: {type: 'string'},
                    description: {type: 'string', nullable: true},
                    isVerified: {type: 'boolean'},
                    authored_by: {type: 'integer'},
                    created_on: {type: 'string', format: 'date-time'},
                    contest_start_time: {type: 'string', format: 'date-time'},
                    contest_end_time: {type: 'string', format: 'date-time'},
                    contest_evaluation: {
                        type: 'string',
                        enum: ['pending', 'running', 'completed'],
                    },
                    division: {type: 'integer', enum: [1, 2, 3, 4, 5]},
                },
            },
            Problem: {
                type: 'object',
                properties: {
                    problem_id: {type: 'integer'},
                    contest_id: {type: 'integer'},
                    title: {type: 'string'},
                    score: {type: 'integer'},
                    rating: {type: 'integer'},
                    time_limit_ms: {type: 'integer'},
                    memory_limit_mb: {type: 'integer'},
                    statement: {type: 'string'},
                    explanation: {type: 'string', nullable: true},
                },
            },
            TestCase: {
                type: 'object',
                properties: {
                    test_case_id: {type: 'integer'},
                    problem_id: {type: 'integer'},
                    input_data: {type: 'string'},
                    expected_output: {type: 'string'},
                    is_sample: {type: 'boolean'},
                },
            },
            Submission: {
                type: 'object',
                properties: {
                    submission_id: {type: 'integer'},
                    problem_id: {type: 'integer'},
                    submitted_by: {type: 'integer'},
                    submitted_at: {type: 'string', format: 'date-time'},
                    verdict: {
                        type: 'string',
                        enum: [
                            'pending',
                            'running',
                            'accepted',
                            'wrong_answer',
                            'runtime_error',
                            'compilation_error',
                            'time_limit_exceeded',
                            'memory_limit_exceeded',
                        ],
                    },
                    language: {
                        type: 'string',
                        enum: ['cpp', 'c', 'java', 'python', 'javascript'],
                    },
                    source_code: {type: 'string'},
                    execution_time_ms: {type: 'integer', nullable: true},
                    memory_used_kb: {type: 'integer', nullable: true},
                },
            },
        },
    },
    security: [{cookieAuth: []}],
    paths: {
        // ── AUTH ──────────────────────────────────────────────────────────────
        '/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'username',
                                    'name',
                                    'email',
                                    'password',
                                ],
                                properties: {
                                    username: {
                                        type: 'string',
                                        example: 'coder_x',
                                    },
                                    name: {
                                        type: 'string',
                                        example: 'Alex Mercer',
                                    },
                                    email: {
                                        type: 'string',
                                        example: 'alex@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'strongpassword123',
                                    },
                                    institute: {type: 'string', example: 'MIT'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'User registered successfully'},
                    400: {description: 'Validation error or missing fields'},
                    409: {description: 'Username or email already taken'},
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login and receive session cookie',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: {
                                        type: 'string',
                                        example: 'alex@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'strongpassword123',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            'Login successful — sets httpOnly token cookie',
                    },
                    401: {description: 'Invalid credentials'},
                },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout and clear session cookie',
                responses: {
                    200: {description: 'Logged out successfully'},
                    401: {description: 'Not authenticated'},
                },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Send password reset email',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: {
                                        type: 'string',
                                        example: 'alex@example.com',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Reset email sent if user exists'},
                    400: {description: 'Email is required'},
                },
            },
        },
        '/auth/reset-password': {
            post: {
                tags: ['Auth'],
                summary: 'Reset password using token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['userId', 'token', 'newPassword'],
                                properties: {
                                    userId: {
                                        type: 'integer',
                                        example: 1,
                                    },
                                    token: {
                                        type: 'string',
                                        example: 'hex_token_string',
                                    },
                                    newPassword: {
                                        type: 'string',
                                        example: 'newstrongpassword123',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Password reset successfully'},
                    400: {description: 'Invalid token or short password'},
                },
            },
        },

        // ── CONTESTS ──────────────────────────────────────────────────────────
        '/contests': {
            post: {
                tags: ['Contests'],
                summary: 'Create a contest',
                description: 'Only users with role `user` can create contests.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'title',
                                    'contest_start_time',
                                    'contest_end_time',
                                    'division',
                                ],
                                properties: {
                                    title: {
                                        type: 'string',
                                        example: 'CodeCode Grand Prix Div. 2',
                                    },
                                    description: {
                                        type: 'string',
                                        example: 'Weekly contest',
                                    },
                                    contest_start_time: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    contest_end_time: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    division: {
                                        type: 'integer',
                                        enum: [1, 2, 3, 4, 5],
                                        example: 2,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'Contest created'},
                    400: {
                        description:
                            'Missing required fields or invalid division / times',
                    },
                    403: {description: 'Not allowed (admin cannot create)'},
                },
            },
            get: {
                tags: ['Contests'],
                summary: 'List all visible contests',
                description:
                    'Admins and creators see all contests. Regular users only see verified ones.',
                responses: {
                    200: {description: 'List of contests'},
                },
            },
        },
        '/contests/my': {
            get: {
                tags: ['Contests'],
                summary: 'List all contests created by the logged-in user',
                description:
                    'Returns all contests authored by the current user, including division, ' +
                    'description, verification status, and evaluation status. Ordered by creation date (newest first).',
                responses: {
                    200: {
                        description: "List of user's contests",
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Contest',
                                    },
                                },
                            },
                        },
                    },
                    401: {description: 'Not authenticated'},
                },
            },
        },
        '/contests/{id}': {
            get: {
                tags: ['Contests'],
                summary: 'Get a contest by ID',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Contest details'},
                    403: {description: 'Not verified and not admin/creator'},
                    404: {description: 'Contest not found'},
                },
            },
            patch: {
                tags: ['Contests'],
                summary: 'Update a contest',
                description: 'Creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    description: {type: 'string'},
                                    division: {
                                        type: 'integer',
                                        enum: [1, 2, 3, 4, 5],
                                    },
                                    contest_start_time: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    contest_end_time: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Contest updated'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Contest not found'},
                },
            },
            delete: {
                tags: ['Contests'],
                summary: 'Delete a contest',
                description: 'Creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Contest deleted'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Contest not found'},
                },
            },
        },
        '/contests/{id}/leaderboard': {
            get: {
                tags: ['Contests'],
                summary: 'Get contest leaderboard',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {
                        description: 'Leaderboard rows sorted by final score',
                    },
                    403: {description: 'Contest not verified'},
                    404: {description: 'Contest not found'},
                },
            },
        },
        '/contests/{id}/verify': {
            patch: {
                tags: ['Contests'],
                summary: 'Toggle contest verification status',
                description: 'Admin only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Verification status toggled'},
                    403: {description: 'Not admin'},
                    404: {description: 'Contest not found'},
                },
            },
        },
        '/contests/{id}/finalize': {
            post: {
                tags: ['Contests'],
                summary: 'Finalize contest and calculate rating deltas',
                description:
                    'Admin only. Runs the Elo-like rating delta algorithm for all participants, ' +
                    'updates `contest_registrations.delta`, `contest_registrations.final_rating`, ' +
                    '`users.rating`, and `users.max_rating` inside a single DB transaction. ' +
                    'Sets `contest_evaluation` to `completed` on success, reverts to `pending` on failure.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Contest finalized successfully'},
                    400: {description: 'Contest has not ended yet'},
                    403: {description: 'Not admin'},
                    404: {description: 'Contest not found'},
                    409: {
                        description:
                            'Already finalized or finalization in progress',
                    },
                    500: {
                        description:
                            'Delta calculation failed — status reverted to pending',
                    },
                },
            },
        },
        '/contests/register': {
            post: {
                tags: ['Contests'],
                summary: 'Register for a contest',
                description:
                    'Registration is open from contest start until start + 30 minutes. ' +
                    "Snapshots the user's current rating into `final_rating` on the registration row.",
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['contest_id'],
                                properties: {
                                    contest_id: {type: 'integer', example: 1},
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'Registered successfully'},
                    400: {description: 'contest_id missing'},
                    403: {
                        description:
                            'Contest ended or registration window closed',
                    },
                    404: {description: 'Contest not found'},
                    409: {description: 'Already registered'},
                },
            },
            delete: {
                tags: ['Contests'],
                summary: 'Unregister from a contest',
                description:
                    'Allows a user to unregister from a contest before it starts. ' +
                    'Cannot unregister once the contest has begun.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['contest_id'],
                                properties: {
                                    contest_id: {type: 'integer', example: 1},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Unregistered successfully'},
                    400: {description: 'contest_id missing'},
                    403: {description: 'Contest has already started'},
                    404: {description: 'Contest not found or not registered'},
                },
            },
        },
        '/contests/register/status': {
            get: {
                tags: ['Contests'],
                summary: 'Check registration status for a contest',
                parameters: [
                    {
                        in: 'query',
                        name: 'contest_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {
                        description:
                            'Registration status. If registered: `{is_registered: true, registered_at}`. ' +
                            'If not: `{is_registered: false, registration_open, time_remaining}`.',
                    },
                    400: {description: 'contest_id query param missing'},
                    404: {description: 'Contest not found'},
                },
            },
        },

        // ── PROBLEMS ──────────────────────────────────────────────────────────
        '/problems': {
            post: {
                tags: ['Problems'],
                summary: 'Create a problem',
                description: 'Contest creator only.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'contest_id',
                                    'title',
                                    'score',
                                    'rating',
                                    'statement',
                                ],
                                properties: {
                                    contest_id: {type: 'integer'},
                                    title: {type: 'string'},
                                    score: {
                                        type: 'integer',
                                        minimum: 0,
                                        maximum: 5000,
                                    },
                                    rating: {type: 'integer'},
                                    time_limit_ms: {
                                        type: 'integer',
                                        default: 2000,
                                    },
                                    memory_limit_mb: {
                                        type: 'integer',
                                        default: 256,
                                    },
                                    statement: {type: 'string'},
                                    explanation: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'Problem created'},
                    403: {description: 'Not the contest creator'},
                },
            },
            get: {
                tags: ['Problems'],
                summary: 'List all problems for a contest',
                description:
                    'Normal users can only view after the contest starts.',
                parameters: [
                    {
                        in: 'query',
                        name: 'contest_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {
                        description:
                            'List of problems (id + title only for regular users)',
                    },
                    403: {description: 'Contest not started yet'},
                },
            },
        },
        '/problems/{id}': {
            get: {
                tags: ['Problems'],
                summary: 'Get a problem by ID',
                description:
                    'Rating is hidden from regular users until the contest ends. ' +
                    'Includes sample test cases automatically.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Problem details'},
                    403: {description: 'Contest not started yet'},
                    404: {description: 'Problem not found'},
                },
            },
            patch: {
                tags: ['Problems'],
                summary: 'Update a problem',
                description: 'Contest creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: {type: 'string'},
                                    score: {type: 'integer'},
                                    rating: {type: 'integer'},
                                    statement: {type: 'string'},
                                    explanation: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Problem updated'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Problem not found'},
                },
            },
            delete: {
                tags: ['Problems'],
                summary: 'Delete a problem',
                description: 'Contest creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Problem deleted'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Problem not found'},
                },
            },
        },

        // ── TEST CASES ────────────────────────────────────────────────────────
        '/testcases': {
            post: {
                tags: ['Test Cases'],
                summary: 'Create a test case',
                description:
                    'Contest creator only. Only one test case is allowed per problem.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'problem_id',
                                    'input_data',
                                    'expected_output',
                                ],
                                properties: {
                                    problem_id: {type: 'integer'},
                                    input_data: {
                                        type: 'string',
                                        example: '10 20',
                                    },
                                    expected_output: {
                                        type: 'string',
                                        example: '30',
                                    },
                                    is_sample: {
                                        type: 'boolean',
                                        default: false,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'Test case created'},
                    403: {description: 'Not the contest creator'},
                    409: {
                        description:
                            'Test case already exists for this problem',
                    },
                },
            },
            get: {
                tags: ['Test Cases'],
                summary: 'List all test cases for a problem',
                description: 'Contest creator only.',
                parameters: [
                    {
                        in: 'query',
                        name: 'problem_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'List of test cases'},
                    403: {description: 'Not the contest creator'},
                },
            },
        },
        '/testcases/{id}': {
            patch: {
                tags: ['Test Cases'],
                summary: 'Update a test case',
                description: 'Contest creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    input_data: {type: 'string'},
                                    expected_output: {type: 'string'},
                                    is_sample: {type: 'boolean'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Test case updated'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Test case not found'},
                },
            },
            delete: {
                tags: ['Test Cases'],
                summary: 'Delete a test case',
                description: 'Contest creator only.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Test case deleted'},
                    403: {description: 'Not the contest creator'},
                    404: {description: 'Test case not found'},
                },
            },
        },

        // ── SUBMISSIONS ───────────────────────────────────────────────────────
        '/submissions/solved': {
            get: {
                tags: ['Submissions'],
                summary: 'Get problems solved by user in a contest',
                parameters: [
                    {
                        in: 'query',
                        name: 'contest_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Solved problems fetched'},
                    400: {description: 'contest_id missing'},
                },
            },
        },
        '/submissions/counts': {
            get: {
                tags: ['Submissions'],
                summary: 'Get total submissions per problem for a contest',
                parameters: [
                    {
                        in: 'query',
                        name: 'contest_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Counts fetched successfully'},
                    400: {description: 'contest_id missing'},
                },
            },
        },
        '/submissions': {
            post: {
                tags: ['Submissions'],
                summary: 'Submit a solution',
                description:
                    'Normal users can only submit after the contest starts. ' +
                    'Admins and contest creators can submit any time.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'problem_id',
                                    'language',
                                    'source_code',
                                ],
                                properties: {
                                    problem_id: {type: 'integer'},
                                    language: {
                                        type: 'string',
                                        enum: [
                                            'cpp',
                                            'c',
                                            'java',
                                            'python',
                                            'javascript',
                                        ],
                                    },
                                    source_code: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Submission created, queued for judging',
                    },
                    403: {description: 'Contest not started yet'},
                },
            },
            get: {
                tags: ['Submissions'],
                summary: 'List submissions for a contest',
                description:
                    'Regular users only see their own submissions. ' +
                    'Admins and contest creators see all. `source_code` is always hidden in lists.',
                parameters: [
                    {
                        in: 'query',
                        name: 'contest_id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'List of submissions'},
                },
            },
        },
        '/submissions/{id}': {
            get: {
                tags: ['Submissions'],
                summary: 'Get a submission by ID',
                description:
                    'Only the submitter, the contest creator, or an admin can view.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Full submission including source_code'},
                    403: {
                        description: 'Not authorized to view this submission',
                    },
                    404: {description: 'Submission not found'},
                },
            },
        },
        '/submissions/run-sample': {
            post: {
                tags: ['Submissions'],
                summary: 'Run code against sample test cases',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    problem_id: {type: 'integer'},
                                    language: {type: 'string'},
                                    source_code: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Executed successfully'},
                },
            },
        },

        // ── USERS ─────────────────────────────────────────────────────────────
        '/users/me': {
            get: {
                tags: ['Users'],
                summary: 'Get current authenticated user',
                description:
                    'Returns the user details corresponding to the session cookie.',
                responses: {
                    200: {
                        description: 'User details',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User',
                                },
                            },
                        },
                    },
                    401: {description: 'Not authenticated'},
                    404: {description: 'User not found'},
                },
            },
        },
        '/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user profile',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'User details (password excluded)'},
                    404: {description: 'User not found'},
                },
            },
            patch: {
                tags: ['Users'],
                summary: 'Update user profile',
                description: 'Can only update your own profile.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {type: 'string'},
                                    institute: {type: 'string'},
                                    email: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'User updated'},
                    400: {description: 'Empty name or email'},
                    403: {description: 'Not authorized'},
                    404: {description: 'User not found'},
                    409: {description: 'Email already in use'},
                },
            },
            delete: {
                tags: ['Users'],
                summary: 'Delete user account',
                description:
                    'Can only delete your own account. Clears the session cookie.',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'User deleted'},
                    403: {description: 'Not authorized'},
                    404: {description: 'User not found'},
                },
            },
        },
        '/users/rankings': {
            get: {
                tags: ['Users'],
                summary: 'Get user rankings',
                parameters: [
                    {
                        in: 'query',
                        name: 'institute',
                        schema: {type: 'string'},
                    },
                    {
                        in: 'query',
                        name: 'sortBy',
                        schema: {type: 'string'},
                    },
                ],
                responses: {
                    200: {description: 'Rankings fetched'},
                },
            },
        },
        '/users/username/{username}': {
            get: {
                tags: ['Users'],
                summary: 'Get user profile by username',
                parameters: [
                    {
                        in: 'path',
                        name: 'username',
                        required: true,
                        schema: {type: 'string'},
                    },
                ],
                responses: {
                    200: {description: 'User details'},
                    404: {description: 'User not found'},
                },
            },
        },
        '/users/username/{username}/contest-history': {
            get: {
                tags: ['Users'],
                summary: 'Get user contest history',
                parameters: [
                    {
                        in: 'path',
                        name: 'username',
                        required: true,
                        schema: {type: 'string'},
                    },
                ],
                responses: {
                    200: {description: 'Contest history'},
                },
            },
        },
        '/users/username/{username}/activity-stats': {
            get: {
                tags: ['Users'],
                summary: 'Get user activity stats (heatmap)',
                parameters: [
                    {
                        in: 'path',
                        name: 'username',
                        required: true,
                        schema: {type: 'string'},
                    },
                    {
                        in: 'query',
                        name: 'year',
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Activity stats'},
                },
            },
        },

        // ── AI ────────────────────────────────────────────────────────────────
        '/ai/deco': {
            post: {
                tags: ['AI'],
                summary: 'Ask the local AI coding mentor (Deco)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['prompt'],
                                properties: {prompt: {type: 'string'}},
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'AI hint generated'},
                },
            },
        },
        '/ai/external': {
            post: {
                tags: ['AI'],
                summary: 'Ask the external AI assistant (Gemini)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['prompt', 'intent'],
                                properties: {
                                    prompt: {type: 'string'},
                                    intent: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'AI response generated'},
                },
            },
        },
        '/ai/external/stream': {
            post: {
                tags: ['AI'],
                summary: 'Stream from the external AI assistant (Gemini)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['prompt', 'intent'],
                                properties: {
                                    prompt: {type: 'string'},
                                    intent: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'SSE Stream'},
                },
            },
        },

        // ── STATISTICS ────────────────────────────────────────────────────────
        '/statistics': {
            get: {
                tags: ['Statistics'],
                summary: 'Get platform statistics',
                responses: {
                    200: {description: 'Statistics fetched'},
                },
            },
        },

        // ── CUSTOM INVOCATION ─────────────────────────────────────────────────
        '/custom-invocation': {
            post: {
                tags: ['Custom Invocation'],
                summary: 'Run custom code invocation',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    source_code: {type: 'string'},
                                    language: {type: 'string'},
                                    input_data: {type: 'string'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Invocation queued'},
                },
            },
        },
        '/custom-invocation/status/{customInvocationId}': {
            get: {
                tags: ['Custom Invocation'],
                summary: 'Get custom invocation status',
                parameters: [
                    {
                        in: 'path',
                        name: 'customInvocationId',
                        required: true,
                        schema: {type: 'string'},
                    },
                ],
                responses: {
                    200: {description: 'Invocation status'},
                },
            },
        },

        // ── USER TEMPLATES ────────────────────────────────────────────────────
        '/user-templates/ongoing-contest-status': {
            get: {
                tags: ['User Templates'],
                summary: 'Check if user has an ongoing contest',
                responses: {
                    200: {description: 'Ongoing contest status'},
                },
            },
        },
        '/user-templates': {
            get: {
                tags: ['User Templates'],
                summary: 'Get user templates',
                responses: {
                    200: {description: 'User templates fetched'},
                },
            },
            post: {
                tags: ['User Templates'],
                summary: 'Create a user template',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: {type: 'string'},
                                    source_code: {type: 'string'},
                                    language: {type: 'string'},
                                    is_default: {type: 'boolean'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {description: 'Template created'},
                },
            },
        },
        '/user-templates/{id}': {
            get: {
                tags: ['User Templates'],
                summary: 'Get template by ID',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Template details'},
                },
            },
            put: {
                tags: ['User Templates'],
                summary: 'Update template',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: {type: 'string'},
                                    source_code: {type: 'string'},
                                    language: {type: 'string'},
                                    is_default: {type: 'boolean'},
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {description: 'Template updated'},
                },
            },
            delete: {
                tags: ['User Templates'],
                summary: 'Delete template',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Template deleted'},
                },
            },
        },
        '/user-templates/{id}/default': {
            put: {
                tags: ['User Templates'],
                summary: 'Set template as default',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        required: true,
                        schema: {type: 'integer'},
                    },
                ],
                responses: {
                    200: {description: 'Template set as default'},
                },
            },
        },
    },
};

export default swaggerDefinition;
