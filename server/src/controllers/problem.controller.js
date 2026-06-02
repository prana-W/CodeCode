import Problem from '../models/Problem.model.js';
import Contest from '../models/Contest.model.js';
import { ApiError, ApiResponse, asyncHandler } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const resolveContestAuthor = async (problem_id, userId) => {
    const problem = await Problem.findById(problem_id);
    if (!problem) {
        throw new ApiError(statusCode.NOT_FOUND, 'Problem not found.');
    }

    const contest = await Contest.findById(problem.contest_id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Owning contest not found.');
    }

    if (contest.authored_by !== userId) {
        throw new ApiError(statusCode.FORBIDDEN, 'You are not the author of the contest this problem belongs to.');
    }

    return { problem, contest };
};

const createProblem = asyncHandler(async (req, res) => {
    if (req.role !== 'user') {
        throw new ApiError(statusCode.FORBIDDEN, 'Only users with role "user" can create problems.');
    }

    const { contest_id, title, score, rating, statement, explanation } = req.body;

    if (!contest_id || !title || score === undefined || rating === undefined || !statement) {
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
        throw new ApiError(statusCode.FORBIDDEN, 'You can only add problems to contests you have authored.');
    }

    if (Number(score) < 0 || Number(score) > 5000) {
        throw new ApiError(statusCode.BAD_REQUEST, 'score must be between 0 and 5000.');
    }

    const insertId = await Problem.create({
        contest_id: Number(contest_id),
        title,
        score:  Number(score),
        rating: Number(rating),
        statement,
        explanation,
    });

    const problem = await Problem.findById(insertId);

    return res
        .status(statusCode.CREATED)
        .json(new ApiResponse(statusCode.CREATED, 'Problem created successfully.', problem));
});

const updateProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { problem } = await resolveContestAuthor(Number(id), req.userId);

    const {
        title       = problem.title,
        score       = problem.score,
        rating      = problem.rating,
        statement   = problem.statement,
        explanation = problem.explanation,
    } = req.body;

    if (Number(score) < 0 || Number(score) > 5000) {
        throw new ApiError(statusCode.BAD_REQUEST, 'score must be between 0 and 5000.');
    }

    await Problem.update(Number(id), {
        title,
        score:  Number(score),
        rating: Number(rating),
        statement,
        explanation,
    });

    const updated = await Problem.findById(Number(id));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Problem updated successfully.', updated));
});

const deleteProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await resolveContestAuthor(Number(id), req.userId);

    await Problem.delete(Number(id));

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Problem deleted successfully.'));
});

export { createProblem, updateProblem, deleteProblem };
