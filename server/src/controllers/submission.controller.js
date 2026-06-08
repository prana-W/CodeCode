import Submission from '../models/Submission.model.js';
import ContestRegistration from '../models/ContestRegistration.model.js';
import Problem from '../models/Problem.model.js';
import TestCase from '../models/TestCase.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import submissionQueue from '../queues/submissionQueue.js';
import customInvocationQueue from '../queues/customInvocationQueue.js';
import redis from '../config/redis.js';
import crypto from 'crypto';

const createSubmission = asyncHandler(async (req, res) => {
    const {problem_id, language, source_code} = req.body;

    if (!problem_id || !language || !source_code) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'problem_id, language and source_code are required.'
        );
    }

    if (!Submission.validLanguages.includes(language)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `language must be one of: ${Submission.validLanguages.join(', ')}.`
        );
    }

    const context = await Submission.findWithContest(Number(problem_id));
    if (!context) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }

    const isCreator = context.contest_authored_by === req.userId;
    const isAdmin = req.role === 'admin';
    const now = new Date();
    const startTime = new Date(context.contest_start_time);
    const endTime = new Date(context.contest_end_time);

    if (!isAdmin && !isCreator) {
        if (now < startTime) {
            throw new ApiError(
                statusCode.FORBIDDEN,
                'Contest has not started yet.'
            );
        }

        if (now >= startTime && now <= endTime) {
            const registration = await ContestRegistration.findByUserAndContest(
                context.contest_id,
                req.userId
            );
            if (!registration) {
                throw new ApiError(
                    statusCode.FORBIDDEN,
                    'You must be registered for the contest to submit during the contest window.'
                );
            }
        }
    }

    const insertId = await Submission.create({
        problem_id: Number(problem_id),
        submitted_by: req.userId,
        language,
        source_code,
    });

    const submission = await Submission.findById(insertId);

    await submissionQueue.add('judge-submission', {
        submissionId: insertId,
    });

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Submission created successfully.',
                submission
            )
        );
});

const getContestSubmissions = asyncHandler(async (req, res) => {
    const {contest_id} = req.query;
    if (!contest_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id query param is required.'
        );
    }

    const isAdmin = req.role === 'admin';

    const probe = await Submission.findAllByContest(Number(contest_id), null);

    const isCreator =
        probe.length > 0 && probe[0].contest_authored_by === req.userId;
    const canSeeAll = isAdmin || isCreator;

    const rows = canSeeAll
        ? probe
        : probe.filter((s) => s.submitted_by === req.userId);

    const data = rows.map(({contest_authored_by, ...rest}) => rest);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Submissions fetched.', data));
});

const getSubmissionById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const submission = await Submission.findByIdWithContest(Number(id));
    if (!submission) {
        throw new ApiError(statusCode.NOT_FOUND, 'Submission not found.');
    }

    const isAdmin = req.role === 'admin';
    const isCreator = submission.contest_authored_by === req.userId;
    const isOwner = submission.submitted_by === req.userId;

    if (!isAdmin && !isCreator && !isOwner) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not allowed to view this submission.'
        );
    }

    const {contest_authored_by, ...data} = submission;

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Submission fetched.', data));
});

const getSubmissionCounts = asyncHandler(async (req, res) => {
    const {contest_id} = req.query;
    if (!contest_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id query param is required.'
        );
    }

    const counts = await Submission.getSubmissionCountsByContest(
        Number(contest_id)
    );

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, 'Submission counts fetched.', counts)
        );
});

const getSolvedProblems = asyncHandler(async (req, res) => {
    const {contest_id} = req.query;
    if (!contest_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id query param is required.'
        );
    }

    const solvedIds = await Submission.getSolvedProblemsByContest(
        Number(contest_id),
        req.userId
    );

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Solved problems fetched.',
                solvedIds
            )
        );
});

const runAgainstSample = asyncHandler(async (req, res) => {
    const {problem_id, language, source_code} = req.body;

    if (!problem_id || !language || !source_code) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'problem_id, language and source_code are required.'
        );
    }

    if (!Submission.validLanguages.includes(language)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            `language must be one of: ${Submission.validLanguages.join(', ')}.`
        );
    }

    const problem = await Problem.findWithContest(Number(problem_id));
    if (!problem) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }

    const isCreator = problem.contest_authored_by === req.userId;
    const isAdmin = req.role === 'admin';
    const now = new Date();
    const startTime = new Date(problem.contest_start_time);
    const endTime = new Date(problem.contest_end_time);

    if (!isAdmin && !isCreator) {
        if (now < startTime) {
            throw new ApiError(
                statusCode.FORBIDDEN,
                'Contest has not started yet.'
            );
        }

        if (now >= startTime && now <= endTime) {
            const registration = await ContestRegistration.findByUserAndContest(
                problem.contest_id,
                req.userId
            );
            if (!registration) {
                throw new ApiError(
                    statusCode.FORBIDDEN,
                    'You must be registered for the contest to run code during the contest window.'
                );
            }
        }
    }

    const testcase = await TestCase.findByProblemId(Number(problem_id));
    if (!testcase) {
        throw new ApiError(
            statusCode.NOT_FOUND,
            'No test case found for this problem.'
        );
    }

    const customInvocationId = crypto.randomUUID();
    const key = `custom_invocation:${customInvocationId}`;

    const pendingVal = {
        status: 'pending',
        userId: req.userId,
        customInvocationId,
    };
    await redis.set(key, JSON.stringify(pendingVal), 'EX', 120);

    await customInvocationQueue.add(
        'run',
        {
            customInvocationId,
            userId: req.userId,
            source_code,
            language,
            input_data: testcase.sample_input_data,
            time_limit_ms: problem.time_limit_ms,
            memory_limit_mb: problem.memory_limit_mb,
        },
        {priority: 1}
    );

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Code submitted for sample run successfully.',
                {customInvocationId}
            )
        );
});

export {
    createSubmission,
    getContestSubmissions,
    getSubmissionById,
    getSubmissionCounts,
    getSolvedProblems,
    runAgainstSample,
};
