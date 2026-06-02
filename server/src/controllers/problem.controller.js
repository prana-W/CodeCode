import Problem from '../models/Problem.model.js';
import Contest from '../models/Contest.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const resolveContestAuthor = async (problem_id, userId) => {
    const row = await Problem.findWithContest(problem_id);
    if (!row) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }
    if (row.contest_authored_by !== userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of the contest this problem belongs to.'
        );
    }
    return row;
};

const createProblem = asyncHandler(async (req, res) => {
    if (req.role !== 'user') {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Only users with role "user" can create problems.'
        );
    }

    const {contest_id, title, score, rating, statement, explanation, time_limit_ms, memory_limit_mb} = req.body;

    if (
        !contest_id ||
        !title ||
        score === undefined ||
        rating === undefined ||
        !statement
    ) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id, title, score, rating and statement are required.'
        );
    }

    const contest = await Contest.findById(contest_id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    if (contest.authored_by !== req.userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You can only add problems to contests you have authored.'
        );
    }

    if (Number(score) < 0 || Number(score) > 5000) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'score must be between 0 and 5000.'
        );
    }

    const insertId = await Problem.create({
        contest_id: Number(contest_id),
        title,
        score: Number(score),
        rating: Number(rating),
        statement,
        explanation,
        time_limit_ms: time_limit_ms !== undefined ? Number(time_limit_ms) : 2000,
        memory_limit_mb: memory_limit_mb !== undefined ? Number(memory_limit_mb) : 256,
    });

    const problem = await Problem.findById(insertId);

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Problem created successfully.',
                problem
            )
        );
});

const updateProblem = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const row = await resolveContestAuthor(Number(id), req.userId);

    const {
        title = row.title,
        score = row.score,
        rating = row.rating,
        statement = row.statement,
        explanation = row.explanation,
        time_limit_ms = row.time_limit_ms,
        memory_limit_mb = row.memory_limit_mb,
    } = req.body;

    if (Number(score) < 0 || Number(score) > 5000) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'score must be between 0 and 5000.'
        );
    }

    await Problem.update(Number(id), {
        title,
        score: Number(score),
        rating: Number(rating),
        statement,
        explanation,
        time_limit_ms: Number(time_limit_ms),
        memory_limit_mb: Number(memory_limit_mb),
    });

    const updated = await Problem.findById(Number(id));

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Problem updated successfully.',
                updated
            )
        );
});

const deleteProblem = asyncHandler(async (req, res) => {
    const {id} = req.params;

    await resolveContestAuthor(Number(id), req.userId);

    await Problem.delete(Number(id));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Problem deleted successfully.'));
});

const getAllProblems = asyncHandler(async (req, res) => {
    const {contest_id} = req.query;
    if (!contest_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id query param is required.'
        );
    }

    const problems = await Problem.findAllByContest(Number(contest_id));
    if (!problems.length) {
        return res
            .status(statusCode.OK)
            .json(new ApiResponse(statusCode.OK, 'No problems found.', []));
    }

    const now = new Date();
    const {contest_authored_by, contest_start_time, contest_end_time} =
        problems[0];
    const isCreator = contest_authored_by === req.userId;
    const isAdmin = req.role === 'admin';

    if (!isAdmin && !isCreator && now < new Date(contest_start_time)) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Contest has not started yet.'
        );
    }

    const data = problems.map(
        ({
            contest_authored_by,
            contest_start_time,
            contest_end_time,
            ...rest
        }) => rest
    );

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Problems fetched.', data));
});

const getProblemById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const rows = await Problem.findByIdWithSampleTestCases(Number(id));
    if (!rows.length) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }

    const now = new Date();
    const first = rows[0];
    const isCreator = first.contest_authored_by === req.userId;
    const isAdmin = req.role === 'admin';

    if (!isAdmin && !isCreator && now < new Date(first.contest_start_time)) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Contest has not started yet.'
        );
    }

    const showRating =
        isAdmin || isCreator || now > new Date(first.contest_end_time);

    const sampleTestCases = rows
        .filter((r) => r.test_case_id !== null)
        .map((r) => ({
            test_case_id: r.test_case_id,
            input_data: r.input_data,
            expected_output: r.expected_output,
        }));

    const problem = {
        problem_id: first.problem_id,
        contest_id: first.contest_id,
        title: first.title,
        score: first.score,
        ...(showRating ? {rating: first.rating} : {}),
        statement: first.statement,
        explanation: first.explanation,
        sample_test_cases: sampleTestCases,
    };

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Problem fetched.', problem));
});

export {
    createProblem,
    updateProblem,
    deleteProblem,
    getAllProblems,
    getProblemById,
};
