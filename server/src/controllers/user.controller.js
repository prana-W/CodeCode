import User from '../models/User.model.js';
import ContestRegistration from '../models/ContestRegistration.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import {getIO} from '../sockets/index.js';

const getUserById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const user = await User.findById(Number(id));
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const {password, ...userDetails} = user;

    const io = getIO();
    let isOnline = false;
    if (io) {
        const sockets = await io.in(user.id.toString()).fetchSockets();
        isOnline = sockets.length > 0;
    }
    userDetails.isOnline = isOnline;

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'User details fetched successfully.',
                userDetails
            )
        );
});
const getUserByUsername = asyncHandler(async (req, res) => {
    const {username} = req.params;

    const user = await User.findByUsername(username);
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const {password, ...userDetails} = user;

    const io = getIO();
    let isOnline = false;
    if (io) {
        const sockets = await io.in(user.id.toString()).fetchSockets();
        isOnline = sockets.length > 0;
    }
    userDetails.isOnline = isOnline;

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'User details fetched successfully.',
                userDetails
            )
        );
});

const updateUser = asyncHandler(async (req, res) => {
    const {id} = req.params;
    const {name, institute, email} = req.body;

    if (req.userId !== Number(id)) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not authorized to update this user profile.'
        );
    }

    const user = await User.findById(Number(id));
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const updatedName = name !== undefined ? name : user.name;
    const updatedInstitute =
        institute !== undefined ? institute : user.institute;
    const updatedEmail = email !== undefined ? email : user.email;

    if (!updatedName || !updatedEmail) {
        throw new ApiError(
            statusCode.BAD_REQUEST,
            'Name and email cannot be empty.'
        );
    }

    if (updatedEmail !== user.email) {
        const existingUser = await User.findByEmail(updatedEmail);
        if (existingUser) {
            throw new ApiError(statusCode.CONFLICT, 'Email is already in use.');
        }
    }

    await User.update(Number(id), {
        name: updatedName,
        institute: updatedInstitute,
        email: updatedEmail,
    });

    const updatedUser = await User.findById(Number(id));
    const {password, ...updatedUserDetails} = updatedUser;

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'User updated successfully.',
                updatedUserDetails
            )
        );
});

const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.params;

    if (req.userId !== Number(id)) {
        throw new ApiError(
            statusCode.FORBIDDEN,
            'You are not authorized to delete this user profile.'
        );
    }

    const user = await User.findById(Number(id));
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    await User.delete(Number(id));

    // Optional: We can clear cookies here if the user deleted their own account.
    res.clearCookie('token');

    return res
        .status(statusCode.OK)
        .json(new ApiResponse(statusCode.OK, 'User deleted successfully.'));
});

const getRankings = asyncHandler(async (req, res) => {
    const {institute, sortBy} = req.query;
    const users = await User.getRankings(institute, sortBy);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Rankings fetched successfully.',
                users
            )
        );
});



const getContestHistory = asyncHandler(async (req, res) => {
    const {username} = req.params;

    const user = await User.findByUsername(username);
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const history = await ContestRegistration.getContestHistory(user.id);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Contest history fetched successfully.',
                history
            )
        );
});

const getActivityStats = asyncHandler(async (req, res) => {
    const {username} = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const user = await User.findByUsername(username);
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const stats = await User.getActivityStats(user.id, year);

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Activity stats fetched successfully.',
                stats
            )
        );
});

export {
    getUserById,
    getUserByUsername,
    getRankings,
    updateUser,
    deleteUser,
    getContestHistory,
    getActivityStats,
};
