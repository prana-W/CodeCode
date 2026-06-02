import Contest from '../models/Contest.model.js';
import Problem from '../models/Problem.model.js';
import ContestStanding from '../models/ContestStanding.model.js';
import ContestRegistration from '../models/ContestRegistration.model.js';
import User from '../models/User.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {deltaCalculation} from '../services/contest.service.js';

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

const getLeaderboard = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    const isAdmin = req.role === 'admin';
    const isCreator = contest.authored_by === req.userId;

    if (!isAdmin && !isCreator && !contest.isVerified) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'This contest is not yet available.'
        );
    }

    const leaderboard = await ContestStanding.getLeaderboard(Number(id));

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(statusCode.OK, 'Leaderboard fetched.', leaderboard)
        );
});

const REGISTRATION_WINDOW_MINUTES = 30;

const registerForContest = asyncHandler(async (req, res) => {
    const {contest_id} = req.body;

    if (!contest_id) {
        throw new ApiError(statusCode.BAD_REQUEST, 'contest_id is required.');
    }

    const contest = await ContestRegistration.findContestTimes(
        Number(contest_id)
    );
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    const now = new Date();
    const startTime = new Date(contest.contest_start_time);
    const endTime = new Date(contest.contest_end_time);
    const registrationDeadline = new Date(
        startTime.getTime() + REGISTRATION_WINDOW_MINUTES * 60 * 1000
    );

    if (now >= endTime) {
        throw new ApiError(statusCode.FORBIDDEN, 'Contest has already ended.');
    }

    if (now >= registrationDeadline) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            `Registration closed. You can only register up to ${REGISTRATION_WINDOW_MINUTES} minutes after the contest starts.`
        );
    }

    const existing = await ContestRegistration.findByUserAndContest(
        Number(contest_id),
        req.userId
    );
    if (existing) {
        throw new ApiError(
            statusCode.CONFLICT,
            'You are already registered for this contest.'
        );
    }

    const user = await User.findById(req.userId);
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    await ContestRegistration.register({
        contest_id: Number(contest_id),
        user_id: req.userId,
        current_rating: user.rating,
    });

    const registration = await ContestRegistration.findByUserAndContest(
        Number(contest_id),
        req.userId
    );

    return res.status(statusCode.CREATED).json(
        new ApiResponse(
            statusCode.CREATED,
            'Successfully registered for the contest.',
            {
                registration_id: registration.registration_id,
                contest_id: registration.contest_id,
                user_id: registration.user_id,
                registered_at: registration.registered_at,
            }
        )
    );
});

const checkRegistration = asyncHandler(async (req, res) => {
    const {contest_id} = req.query;

    if (!contest_id) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'contest_id query param is required.'
        );
    }

    const contest = await ContestRegistration.findContestTimes(
        Number(contest_id)
    );
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    const registration = await ContestRegistration.findByUserAndContest(
        Number(contest_id),
        req.userId
    );

    if (registration) {
        return res.status(statusCode.OK).json(
            new ApiResponse(statusCode.OK, 'Registration status fetched.', {
                is_registered: true,
                registered_at: registration.registered_at,
            })
        );
    }

    const now = new Date();
    const startTime = new Date(contest.contest_start_time);
    const registrationDeadline = new Date(
        startTime.getTime() + REGISTRATION_WINDOW_MINUTES * 60 * 1000
    );

    const msRemaining = Math.max(0, registrationDeadline - now);
    const minutesRemaining = Math.floor(msRemaining / 60_000);
    const secondsRemaining = Math.floor((msRemaining % 60_000) / 1000);

    return res.status(statusCode.OK).json(
        new ApiResponse(statusCode.OK, 'Registration status fetched.', {
            is_registered: false,
            registration_open:
                now < registrationDeadline &&
                now < new Date(contest.contest_end_time),
            time_remaining:
                msRemaining > 0
                    ? `${minutesRemaining}m ${secondsRemaining}s`
                    : 'Registration closed',
        })
    );
});

const finalizeContest = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const contest = await Contest.findById(Number(id));
    if (!contest) {
        throw new ApiError(statusCode.NOT_FOUND, 'Contest not found.');
    }

    if (new Date() < new Date(contest.contest_end_time)) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Contest has not ended yet. Cannot finalize before the end time.'
        );
    }

    if (contest.contest_evaluation === 'completed') {
        throw new ApiError(
            statusCode.CONFLICT,
            'Contest has already been finalized.'
        );
    }

    if (contest.contest_evaluation === 'running') {
        throw new ApiError(
            statusCode.CONFLICT,
            'Contest finalization is already in progress.'
        );
    }

    await Contest.updateEvaluationStatus(Number(id), 'running');

    try {
        await deltaCalculation(Number(id));
        await Contest.updateEvaluationStatus(Number(id), 'completed');
    } catch (err) {
        await Contest.updateEvaluationStatus(Number(id), 'pending');
        throw new ApiError(
            statusCode.INTERNAL_SERVER_ERROR,
            'Delta calculation failed. Status reverted to pending.',
            err.message
        );
    }

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                `Contest ${id} finalized successfully.`
            )
        );
});

export {
    createContest,
    updateContest,
    toggleVerifyContest,
    deleteContest,
    getContestById,
    getAllContests,
    getLeaderboard,
    registerForContest,
    checkRegistration,
    finalizeContest,
};
