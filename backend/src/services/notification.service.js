import mongoose from 'mongoose';
import { UserNotification, SystemNotification, UserSystemNotification } from '../models/Notification.js';

// Will be imported from main app after Socket.IO setup
let io;

// Initialize socket handlers (called from index.js)
export const initializeNotificationSockets = (socketInstances) => {
    io = socketInstances.io;
    
    // Handle notification events
    io.on('connection', (socket) => {
        console.log(`Notification service: User ${socket.user._id} connected`);
        
        // Handle mark notification as read
        socket.on('markNotificationRead', async (data) => {
            try {
                const { notificationId, type = 'user' } = data;
                let result;
                
                if (type === 'user') {
                    result = await UserNotification.findByIdAndUpdate(
                        notificationId,
                        { 
                            isRead: true, 
                            readAt: new Date() 
                        },
                        { new: true }
                    );
                } else if (type === 'userSystem') {
                    result = await UserSystemNotification.findOneAndUpdate(
                        { 
                            userId: socket.user._id,
                            systemNotificationId: notificationId
                        },
                        { 
                            isRead: true, 
                            readAt: new Date() 
                        },
                        { new: true, upsert: true }
                    );
                }
                
                socket.emit('notificationMarkedRead', { 
                    success: true, 
                    notificationId,
                    type 
                });
            } catch (error) {
                console.error('Error marking notification as read:', error);
                socket.emit('notificationError', { 
                    error: 'Failed to mark notification as read' 
                });
            }
        });
        
        // Get unread notification count
        socket.on('getUnreadCount', async () => {
            try {
                const count = await getUnreadCount(socket.user._id);
                socket.emit('unreadCount', { count });
            } catch (error) {
                console.error('Error getting unread count:', error);
                socket.emit('notificationError', { 
                    error: 'Failed to get unread count' 
                });
            }
        });
        
        // Send system notification (for any user)
        socket.on('sendSystemNotification', async (data) => {
            try {
                const notification = await createSystemNotification(data);
                
                // Broadcast to all connected users
                io.emit('newSystemNotification', notification);
                
                socket.emit('systemNotificationSent', { 
                    success: true, 
                    notification 
                });
            } catch (error) {
                console.error('Error sending system notification:', error);
                socket.emit('notificationError', { 
                    error: 'Failed to send system notification' 
                });
            }
        });
    });
};

const NOTIFICATION_TYPES = ['store', 'product', 'sync', 'error', 'success', 'warning', 'info'];
const SYSTEM_NOTIFICATION_TYPES = ['maintenance', 'feature', 'announcement', 'update'];

/**
 * Create a user-specific notification
 */
async function createUserNotification({ 
    userId, 
    title, 
    message, 
    type = 'info', 
    link = null, 
    metadata = {}, 
    expiresAt = undefined, 
    eventName = 'new_notification' 
}) {
    if (!userId || !title || !message || !type) {
        throw new Error('userId, title, message, and type are required');
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
        throw new Error(`Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(', ')}`);
    }

    const notificationData = {
        userId,
        title,
        message,
        type,
        link,
        metadata,
    };

    if (expiresAt) {
        notificationData.expiresAt = expiresAt;
    }

    const notification = await UserNotification.create(notificationData);

    // Emit to socket if available
    if (io && userId) {
        io.to(userId.toString()).emit(eventName, {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            isRead: false
        });
    }

    return notification;
}

/**
 * Create a system-wide notification
 */
async function createSystemNotification({ 
    title, 
    message, 
    type = 'announcement', 
    link = null, 
    metadata = {}, 
    expiresAt = undefined, 
    eventName = 'new_system_notification' 
}) {
    if (!title || !message || !type) {
        throw new Error('title, message, and type are required');
    }

    if (!SYSTEM_NOTIFICATION_TYPES.includes(type)) {
        throw new Error(`Invalid system notification type. Must be one of: ${SYSTEM_NOTIFICATION_TYPES.join(', ')}`);
    }

    const notificationData = {
        title,
        message,
        link,
        metadata,
        type,
    };

    if (expiresAt) {
        notificationData.expiresAt = expiresAt;
    }

    const notification = await SystemNotification.create(notificationData);

    // Emit to all users if available
    if (io) {
        io.emit(eventName, {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            isSystemNotification: true
        });
    }

    return notification;
}

/**
 * Create a notification (simplified - no admin/user distinction)
 */
async function createNotification({ 
    userId, 
    title, 
    message, 
    type = 'info', 
    link = null, 
    metadata = {}, 
    expiresAt = undefined, 
    eventName = 'new_notification' 
}) {
    if (!userId || !title || !message || !type) {
        throw new Error('userId, title, message, and type are required');
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
        throw new Error(`Invalid notification type. Must be one of: ${NOTIFICATION_TYPES.join(', ')}`);
    }

    const notificationData = {
        userId,
        title,
        message,
        type,
        link,
        metadata,
    };

    if (expiresAt) {
        notificationData.expiresAt = expiresAt;
    }

    const notification = await UserNotification.create(notificationData);

    // Emit to socket if available
    if (io && userId) {
        io.to(userId.toString()).emit(eventName, {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
            isRead: false
        });
    }

    return notification;
}

/**
 * Get paginated notifications for a user, including system notifications
 */
async function getUserNotifications(userId, { page = 1, limit = 10 }) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                userId: userObjectId,
                expiresAt: { $gt: new Date() }
            }
        },
        { $addFields: { notificationModel: 'UserNotification' } },
        {
            $unionWith: {
                coll: 'systemnotifications',
                pipeline: [
                    { 
                        $match: { 
                            expiresAt: { $gt: new Date() },
                            isActive: true
                        } 
                    },
                    { $addFields: { notificationModel: 'SystemNotification' } }
                ]
            }
        },
        {
            $lookup: {
                from: 'usersystemnotifications',
                let: {
                    notificationId: '$_id',
                    isSystem: { $eq: ['$notificationModel', 'SystemNotification'] }
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$$isSystem', true] },
                                    { $eq: ['$userId', userObjectId] },
                                    { $eq: ['$systemNotificationId', '$$notificationId'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'readStatus'
            }
        },
        {
            $addFields: {
                isRead: {
                    $cond: {
                        if: { $eq: ['$notificationModel', 'UserNotification'] },
                        then: '$isRead',
                        else: { $gt: [{ $size: '$readStatus' }, 0] }
                    }
                }
            }
        },
        { $project: { readStatus: 0 } },
        { $sort: { isRead: 1, createdAt: -1 } },
        {
            $facet: {
                paginatedResults: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'count' }]
            }
        }
    ];

    const result = await UserNotification.aggregate(pipeline);

    const notifications = result[0].paginatedResults;
    const total = result[0].totalCount.length > 0 ? result[0].totalCount[0].count : 0;

    return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const userUnreadCount = await UserNotification.countDocuments({ 
        userId: userObjectId, 
        isRead: false,
        expiresAt: { $gt: new Date() }
    });

    const systemReadCount = await UserSystemNotification.countDocuments({ 
        userId: userObjectId, 
        isRead: true 
    });

    const totalSystemCount = await SystemNotification.countDocuments({ 
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    const systemUnreadCount = totalSystemCount - systemReadCount;

    return {
        userNotifications: userUnreadCount,
        systemNotifications: systemUnreadCount,
        total: userUnreadCount + systemUnreadCount
    };
}

/**
 * Mark a notification as read
 */
async function markAsRead(userId, notificationId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notificationObjectId = new mongoose.Types.ObjectId(notificationId);

    // Check if it's a user notification
    const userNotification = await UserNotification.findOneAndUpdate(
        { _id: notificationObjectId, userId: userObjectId },
        { isRead: true },
        { new: true }
    );

    if (userNotification) {
        return userNotification;
    }

    // Check if it's a system notification
    const systemNotification = await SystemNotification.findById(notificationObjectId);
    if (systemNotification) {
        await UserSystemNotification.findOneAndUpdate(
            { userId: userObjectId, systemNotificationId: notificationObjectId },
            { isRead: true },
            { upsert: true, new: true }
        );
        return systemNotification;
    }

    throw new Error('Notification not found');
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Mark all user notifications as read
    await UserNotification.updateMany(
        { userId: userObjectId, isRead: false },
        { isRead: true }
    );

    // Mark all system notifications as read
    const systemNotifications = await SystemNotification.find({ 
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    for (const sysNotification of systemNotifications) {
        await UserSystemNotification.findOneAndUpdate(
            { userId: userObjectId, systemNotificationId: sysNotification._id },
            { isRead: true },
            { upsert: true }
        );
    }

    return { success: true, message: 'All notifications marked as read' };
}

/**
 * Delete a user-specific notification
 */
async function deleteUserNotification(userId, notificationId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notificationObjectId = new mongoose.Types.ObjectId(notificationId);

    const notification = await UserNotification.findOneAndDelete({
        _id: notificationObjectId,
        userId: userObjectId
    });

    if (!notification) {
        throw new Error('Notification not found or does not belong to user');
    }

    return notification;
}

// Helper function to notify about new store connections
async function notifyStoreConnection(storeData) {
    // For now, just create a user notification for the current user
    // In the future, you can modify this to notify specific users
    await createUserNotification({
        userId: storeData.userId, // assuming store has userId
        title: 'New Store Connected',
        message: `Store "${storeData.name}" has been connected to the dashboard.`,
        type: 'store',
        link: `/stores/${storeData._id}`,
        metadata: {
            storeId: storeData._id,
            storeName: storeData.name,
            domain: storeData.domain
        }
    });
}

// Helper function to notify user about sync status
async function notifyUserSyncStatus(userId, syncData) {
    const type = syncData.success ? 'success' : 'error';
    const title = syncData.success ? 'Sync Completed' : 'Sync Failed';
    
    await createUserNotification({
        userId,
        title,
        message: syncData.message,
        type,
        link: syncData.link || null,
        metadata: syncData.metadata || {}
    });
}

export const notificationService = {
    createUserNotification,
    createNotification,
    createSystemNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteUserNotification,
    // Helper functions
    notifyStoreConnection,
    notifyUserSyncStatus
};
