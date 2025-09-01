import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// Handle avatar upload/update (single function for both new and replacement)
export const handleAvatar = asyncHandler(async (req, res) => {
    const { action } = req.body; // 'upload' or 'delete'
    
    if (action === 'delete') {
        return deleteAvatar(req, res);
    }
    
    // Default action is upload
    if (!req.file) {
        throw new ApiError(400, 'Avatar file is required');
    }

    try {
        // Get user's current avatar to delete old one if exists
        const currentUser = await User.findById(req.user._id);
        
        // Delete old avatar if exists (before uploading new one)
        if (currentUser.profileImage?.publicId) {
            await deleteFromCloudinary(currentUser.profileImage.publicId);
        }

        // Upload new avatar to Cloudinary
        const uploadResult = await uploadOnCloudinary(req.file.path);
        
        if (!uploadResult) {
            throw new ApiError(500, 'Failed to upload avatar');
        }

        // Update user with new avatar
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profileImage.url': uploadResult.secure_url,
                    'profileImage.publicId': uploadResult.public_id
                }
            },
            { new: true }
        ).select('-password -refreshToken');

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {
                    user,
                    avatar: {
                        url: uploadResult.secure_url,
                        publicId: uploadResult.public_id
                    }
                },
                'Avatar uploaded successfully'
            ));

    } catch (error) {
        throw new ApiError(500, error?.message || 'Failed to upload avatar');
    }
});

// Upload/Update user avatar (legacy - kept for backward compatibility)
export const uploadAvatar = handleAvatar;

// Delete user avatar
export const deleteAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user.profileImage?.publicId) {
        throw new ApiError(400, 'No avatar found to delete');
    }

    try {
        // Delete from Cloudinary
        await deleteFromCloudinary(user.profileImage.publicId);

        // Remove avatar from user document
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    'profileImage.url': 1,
                    'profileImage.publicId': 1
                }
            }
        );

        const updatedUser = await User.findById(req.user._id).select('-password -refreshToken');

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                { user: updatedUser },
                'Avatar deleted successfully'
            ));

    } catch (error) {
        throw new ApiError(500, error?.message || 'Failed to delete avatar');
    }
});

// Get user profile (detailed)
export const getUserProfile = asyncHandler(async (req, res) => {
    // Fetch fresh user data from database
    const user = await User.findById(req.user._id)
        .select('-password -refreshToken')
        .lean();

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            'User profile fetched successfully'
        ));
});

// Update user profile (SINGLE FUNCTION - handles all profile updates)
export const updateUserProfile = asyncHandler(async (req, res) => {
    const { fullName, email, username } = req.body;

    if (!fullName && !email && !username) {
        throw new ApiError(400, 'At least one field is required to update');
    }

    const updateFields = {};
    
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email.toLowerCase();
    if (username) updateFields.username = username.toLowerCase();

    // Check for existing email/username if being updated
    if (email || username) {
        const conditions = [];
        if (email) conditions.push({ email: email.toLowerCase() });
        if (username) conditions.push({ username: username.toLowerCase() });

        const existingUser = await User.findOne({
            $or: conditions,
            _id: { $ne: req.user._id }
        });

        if (existingUser) {
            const conflict = existingUser.email === email?.toLowerCase() ? 'email' : 'username';
            throw new ApiError(409, `This ${conflict} is already taken`);
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select('-password -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Profile updated successfully'));
});

// Update user preferences
export const updateUserPreferences = asyncHandler(async (req, res) => {
    const { notifications, language, theme } = req.body;

    const updateFields = {};
    if (notifications !== undefined) updateFields['preferences.notifications'] = notifications;
    if (language) updateFields['preferences.language'] = language;
    if (theme) updateFields['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateFields },
        { new: true }
    ).select('-password -refreshToken');

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'Preferences updated successfully'));
});

// Deactivate account (SINGLE FUNCTION - temporary deactivation)
export const deactivateAccount = asyncHandler(async (req, res) => {
    const { password, reason } = req.body;

    if (!password) {
        throw new ApiError(400, 'Password is required to deactivate account');
    }

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid password');
    }

    // Deactivate account
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                isBlocked: true,
                deactivationReason: reason || 'User requested deactivation',
                deactivatedAt: new Date()
            },
            $unset: {
                refreshToken: 1
            }
        }
    );

    return res
        .status(200)
        .clearCookie('accessToken')
        .clearCookie('refreshToken')
        .json(new ApiResponse(200, {}, 'Account deactivated successfully'));
});
