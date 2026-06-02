import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError, ApiResponse, asyncHandler } from '../utility/index.js';
import statusCode from '../constants/statusCode.js';
import cookieOptions from '../constants/cookieOptions.js';

const SALT_ROUNDS = 12;

const generateToken = (user) =>
    jwt.sign(
        {
            userId:   user.id,
            username: user.username,
            role:     user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

const register = asyncHandler(async (req, res) => {
    const { username, name, institute, email, password, role } = req.body;

    if (!username || !name || !email || !password) {
        throw new ApiError(statusCode.BAD_REQUEST, 'username, name, email and password are required.');
    }
    const existingByUsername = await User.findByUsername(username);
    if (existingByUsername) {
        throw new ApiError(statusCode.CONFLICT, 'Username is already taken.');
    }

    const existingByEmail = await User.findByEmail(email);
    if (existingByEmail) {
        throw new ApiError(statusCode.CONFLICT, 'Email is already registered.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (rating defaults to 0 if not provided)
    const insertId = await User.create({
        username,
        name,
        institute: institute || null,
        email,
        password: hashedPassword,
        rating:     0,
        max_rating: 0,
        role:       role || 'user',
    });

    const newUser = await User.findById(insertId);

    const token = generateToken(newUser);

    const { password: _pw, ...safeUser } = newUser;

    return res
        .status(statusCode.CREATED)
        .cookie('token', token, cookieOptions)
        .json(new ApiResponse(statusCode.CREATED, 'Registration successful.', safeUser));
});


const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(statusCode.BAD_REQUEST, 'Email and password are required.');
    }

    const user = await User.findByEmail(email);
    if (!user) {
        throw new ApiError(statusCode.UNAUTHORIZED, 'Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(statusCode.UNAUTHORIZED, 'Invalid email or password.');
    }

    const token = generateToken(user);

    const { password: _pw, ...safeUser } = user;

    return res
        .status(statusCode.OK)
        .cookie('token', token, cookieOptions)
        .json(new ApiResponse(statusCode.OK, 'Login successful.', safeUser));
});


const logout = asyncHandler(async (req, res) => {
    return res
        .status(statusCode.OK)
        .clearCookie('token', cookieOptions)
        .json(new ApiResponse(statusCode.OK, 'Logout successful.'));
});

export { register, login, logout };
