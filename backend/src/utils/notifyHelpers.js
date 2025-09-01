import { User } from '../models/User.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Notify all admins about an event
 */
export async function notifyAdmins({ title, message, type = 'info', link, metadata, eventName = 'new_notification' }) {
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        
        const notifications = [];
        for (const admin of admins) {
            const notification = await notificationService.createAdminNotification({
                userId: admin._id,
                title,
                message,
                type,
                link,
                metadata,
                eventName
            });
            notifications.push(notification);
        }
        
        return notifications;
    } catch (error) {
        console.error('Error notifying admins:', error);
        throw error;
    }
}

/**
 * Notify user about Shopify store events
 */
export async function notifyStoreEvent({ userId, storeId, storeName, eventType, details }) {
    const eventMessages = {
        connected: {
            title: 'Store Connected Successfully',
            message: `Your Shopify store "${storeName}" has been connected to the dashboard.`,
            type: 'success'
        },
        disconnected: {
            title: 'Store Disconnected',
            message: `Your Shopify store "${storeName}" has been disconnected.`,
            type: 'warning'
        },
        sync_started: {
            title: 'Product Sync Started',
            message: `Started syncing products from "${storeName}".`,
            type: 'info'
        },
        sync_completed: {
            title: 'Product Sync Completed',
            message: `Successfully synced ${details?.count || 0} products from "${storeName}".`,
            type: 'success'
        },
        sync_failed: {
            title: 'Product Sync Failed',
            message: `Failed to sync products from "${storeName}". ${details?.error || ''}`,
            type: 'error'
        },
        product_created: {
            title: 'Product Created',
            message: `Product "${details?.productName}" was created in "${storeName}".`,
            type: 'success'
        },
        product_updated: {
            title: 'Product Updated',
            message: `Product "${details?.productName}" was updated in "${storeName}".`,
            type: 'success'
        },
        product_deleted: {
            title: 'Product Deleted',
            message: `Product "${details?.productName}" was deleted from "${storeName}".`,
            type: 'warning'
        }
    };

    const eventData = eventMessages[eventType];
    if (!eventData) {
        throw new Error(`Unknown store event type: ${eventType}`);
    }

    return await notificationService.createUserNotification({
        userId,
        title: eventData.title,
        message: eventData.message,
        type: eventData.type,
        link: `/stores/${storeId}`,
        metadata: {
            storeId,
            storeName,
            eventType,
            ...details
        }
    });
}

/**
 * Notify about system maintenance
 */
export async function notifySystemMaintenance({ title, message, startTime, endTime }) {
    return await notificationService.createSystemNotification({
        title,
        message,
        type: 'maintenance',
        metadata: {
            startTime,
            endTime,
            maintenanceWindow: `${startTime} - ${endTime}`
        },
        expiresAt: new Date(endTime)
    });
}

/**
 * Notify about new features
 */
export async function notifyNewFeature({ title, message, featureName, link }) {
    return await notificationService.createSystemNotification({
        title,
        message,
        type: 'feature',
        link,
        metadata: {
            featureName,
            version: process.env.APP_VERSION || '1.0.0'
        }
    });
}
