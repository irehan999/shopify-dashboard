import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';
import jwt from 'jsonwebtoken';

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Generate access and refresh tokens
const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating tokens');
    }
};

// Register user
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    // Validation
    if ([fullName, username, email, password].some(field => field?.trim() === '')) {
        throw new ApiError(400, 'All fields are required');
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, 'User with email or username already exists');
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        isVerified: true // Auto-verify for simplicity
    });

    // Get user without password
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering user');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res
        .status(201)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                },
                'User registered successfully'
            )
        );
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // Check if email or username is provided
    if (!username && !email) {
        throw new ApiError(400, 'Username or email is required');
    }

    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    // Find user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    // Check if user is blocked
    if (user.isBlocked) {
        throw new ApiError(403, 'Your account has been blocked. Please contact support.');
    }

    // Check if user is deleted
    if (user.isDeleted) {
        throw new ApiError(403, 'Your account has been deactivated.');
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Get user without password
    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    );

    return res
        .status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                'User logged in successfully'
            )
        );
});

// Logout user - handles expired tokens
export const logoutUser = asyncHandler(async (req, res) => {
    try {
        // Get token from cookies or header
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            try {
                // Try to verify token - if it fails, we still proceed with logout
                const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                
                // If token is valid, clear refresh token from database
                if (decodedToken?._id) {
                    await User.findByIdAndUpdate(
                        decodedToken._id,
                        {
                            $unset: {
                                refreshToken: 1 // Remove refresh token from DB
                            }
                        },
                        { new: true }
                    );
                }
            } catch (error) {
                // Token is expired or invalid, but we still want to clear cookies
                console.log('Token expired or invalid during logout, proceeding with cookie cleanup');
            }
        }

        return res
            .status(200)
            .clearCookie('accessToken', cookieOptions)
            .clearCookie('refreshToken', cookieOptions)
            .json(new ApiResponse(200, {}, 'User logged out successfully'));
    } catch (error) {
        // Even if something goes wrong, clear the cookies
        return res
            .status(200)
            .clearCookie('accessToken', cookieOptions)
            .clearCookie('refreshToken', cookieOptions)
            .json(new ApiResponse(200, {}, 'User logged out'));
    }
});

// Refresh access token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request');
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used');
        }

        // Generate new tokens
        const { accessToken, refreshToken } = await generateTokens(user._id);

        return res
            .status(200)
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    'Access token refreshed'
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token');
    }
});



// Get current user (for token validation and fresh user data)
export const getCurrentUser = asyncHandler(async (req, res) => {
    // Fetch fresh user data from database (req.user might be stale)
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Current user fetched successfully'));
});

// Change password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Old password and new password are required');
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid old password');
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully'));
});


