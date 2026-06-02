import Submission from '../models/Submission.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

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

    if (
        !isAdmin &&
        !isCreator &&
        new Date() < new Date(context.contest_start_time)
    ) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Contest has not started yet.'
        );
    }

    const insertId = await Submission.create({
        problem_id: Number(problem_id),
        submitted_by: req.userId,
        language,
        source_code,
    });

    const submission = await Submission.findById(insertId);

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

export {createSubmission, getContestSubmissions, getSubmissionById};
