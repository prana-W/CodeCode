import Contest from '../models/Contest.model.js';
import Problem from '../models/Problem.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';

const createContest = asyncHandler(async (req, res) => {
    if (req.role !== 'user') {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'Only users with role "user" can create contests.'
        );
    }

    const {title, description, contest_start_time, contest_end_time, division} =
        req.body;

    if (!title || !contest_start_time || !contest_end_time || !division) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'title, contest_start_time, contest_end_time and division are required.'
        );
    }

    if (![1, 2, 3, 4, 5].includes(Number(division))) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'division must be one of 1, 2, 3, 4, 5.'
        );
    }

    if (new Date(contest_start_time) >= new Date(contest_end_time)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_start_time must be before contest_end_time.'
        );
    }

    const insertId = await Contest.create({
        title,
        description,
        authored_by: req.userId,
        contest_start_time,
        contest_end_time,
        division: Number(division),
    });

    const contest = await Contest.findById(insertId);

    return res
        .status(statusCode.CREATED)
        .json(
            new ApiResponse(
                statusCode.CREATED,
                'Contest created successfully.',
                contest
            )
        );
});

const updateContest = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    if (contest.authored_by !== req.userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of this contest.'
        );
    }

    const {
        description = contest.description,
        division = contest.division,
        contest_start_time = contest.contest_start_time,
        contest_end_time = contest.contest_end_time,
    } = req.body;

    if (![1, 2, 3, 4, 5].includes(Number(division))) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'division must be one of 1, 2, 3, 4, 5.'
        );
    }

    if (new Date(contest_start_time) >= new Date(contest_end_time)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_start_time must be before contest_end_time.'
        );
    }

    await Contest.update(id, {
        description,
        division: Number(division),
        contest_start_time,
        contest_end_time,
    });

    const updated = await Contest.findById(id);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Contest updated successfully.',
                updated
            )
        );
});

const toggleVerifyContest = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    const newStatus = !contest.isVerified;
    await Contest.setVerified(id, newStatus);

    const updated = await Contest.findById(id);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                `Contest ${newStatus ? 'verified' : 'unverified'} successfully.`,
                updated
            )
        );
});

const deleteContest = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    if (contest.authored_by !== req.userId) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not the author of this contest.'
        );
    }

    await Contest.delete(id);

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Contest deleted successfully.'));
});
const getContestById = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const contest = await Contest.findById(id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }
    const isCreator = contest.authored_by === req.userId;
    const isAdmin = req.role === 'admin';
    if (!isAdmin && !isCreator && !contest.isVerified) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'This contest is not yet available.'
        );
    }
    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'Contest fetched.', contest));
});

const getAllContests = asyncHandler(async (req, res) => {
    const all = await Contest.findAll();
    const now = new Date();
    const isAdmin = req.role === 'admin';
    const filtered = all
        .filter((c) => isAdmin || c.authored_by === req.userId || c.isVerified)
        .map(({authored_by, ...rest}) => rest);
    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, 'All contests fetched.', filtered)
        );
});

export {
    createContest,
    updateContest,
    toggleVerifyContest,
    deleteContest,
    getContestById,
    getAllContests,
};
