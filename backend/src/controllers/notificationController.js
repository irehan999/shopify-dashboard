import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';
import { notificationService } from '../services/notification.service.js';

// Get user notifications with pagination
export const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await notificationService.getUserNotifications(userId, { page, limit });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            'Notifications fetched successfully'
        ));
});

// Get unread notification count
export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const count = await notificationService.getUnreadCount(userId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            count,
            'Unread count fetched successfully'
        ));
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await notificationService.markAsRead(userId, notificationId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            notification,
            'Notification marked as read'
        ));
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const result = await notificationService.markAllAsRead(userId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            'All notifications marked as read'
        ));
});

// Delete a specific notification
export const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await notificationService.deleteUserNotification(userId, notificationId);

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            notification,
            'Notification deleted successfully'
        ));
});

// Create a user notification (for testing or admin use)
export const createNotification = asyncHandler(async (req, res) => {
    const { title, message, type, link, metadata, expiresAt } = req.body;
    const userId = req.user._id;

    if (!title || !message) {
        throw new ApiError(400, 'Title and message are required');
    }

    const notification = await notificationService.createUserNotification({
        userId,
        title,
        message,
        type: type || 'info',
        link,
        metadata,
        expiresAt
    });

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            notification,
            'Notification created successfully'
        ));
});

// Create system notification (admin feature)
export const createSystemNotification = asyncHandler(async (req, res) => {
    const { title, message, type, link, metadata, expiresAt } = req.body;

    if (!title || !message) {
        throw new ApiError(400, 'Title and message are required');
    }

    const notification = await notificationService.createSystemNotification({
        title,
        message,
        type: type || 'announcement',
        link,
        metadata,
        expiresAt
    });

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            notification,
            'System notification created successfully'
        ));
});

// Get notification preferences
export const getNotificationPreferences = asyncHandler(async (req, res) => {
    const user = req.user;
    
    const preferences = {
        notifications: user.preferences?.notifications ?? true,
        // Add more notification preferences as needed
    };

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            preferences,
            'Notification preferences fetched successfully'
        ));
});

// Update notification preferences
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const { notifications } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                'preferences.notifications': notifications
            }
        },
        { new: true }
    ).select('preferences');

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedUser.preferences,
            'Notification preferences updated successfully'
        ));
});
