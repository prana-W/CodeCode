import User from '../models/User.model.js';
import {ApiError, ApiResponse, asyncHandler} from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import redis from '../config/redis.js';

const getUserById = asyncHandler(async (req, res) => {
    const {id} = req.params;

    const user = await User.findById(Number(id));
    if (!user) {
        throw new ApiError(statusCode.NOT_FOUND, 'User not found.');
    }

    const {password, ...userDetails} = user;

    const isOnline = await redis.exists(`online_user:${user.username}`);
    userDetails.isOnline = isOnline === 1;

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

    const isOnline = await redis.exists(`online_user:${username}`);
    userDetails.isOnline = isOnline === 1;

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
    const { institute, sortBy } = req.query;
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

const heartbeat = asyncHandler(async (req, res) => {
    const username = req.username;
    if (!username) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Username is required.');
    }

    // Set user key with 45 seconds TTL
    const userKey = `online_user:${username}`;
    await redis.set(userKey, '1', 'EX', 45);

    // Scan for all online user keys
    let cursor = '0';
    let onlineUsersCount = 0;

    do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'online_user:*', 'COUNT', 100);
        cursor = nextCursor;
        onlineUsersCount += keys.length;
    } while (cursor !== '0');

    return res
        .status(statusCode.OK)
        .json(
            new ApiResponse(
                statusCode.OK,
                'Heartbeat acknowledged.',
                { onlineUsers: onlineUsersCount }
            )
        );
});

export {
    getUserById,
    getUserByUsername,
    getRankings,
    updateUser,
    deleteUser,
    heartbeat,
};
