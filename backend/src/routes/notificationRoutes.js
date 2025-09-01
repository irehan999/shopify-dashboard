import { Router } from 'express';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createSystemNotification,
    getNotificationPreferences,
    updateNotificationPreferences
} from '../controllers/notificationController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Get notifications and unread count
router.route('/').get(getUserNotifications);
router.route('/unread-count').get(getUnreadCount);

// Mark notifications as read
router.route('/:notificationId/read').patch(markAsRead);
router.route('/mark-all-read').patch(markAllAsRead);

// Delete notification
router.route('/:notificationId').delete(deleteNotification);

// Create notifications
router.route('/').post(createNotification);
router.route('/system').post(createSystemNotification);

// Notification preferences
router.route('/preferences').get(getNotificationPreferences);
router.route('/preferences').patch(updateNotificationPreferences);

export default router;
