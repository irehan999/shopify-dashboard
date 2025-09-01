import mongoose from 'mongoose';

// Notification Models
const userNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['store', 'product', 'sync', 'error', 'success', 'warning', 'info'],
        required: true,
        default: 'info'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    link: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        index: { expireAfterSeconds: 0 }
    }
}, {
    timestamps: true
});

// System-wide notifications
const systemNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['maintenance', 'feature', 'announcement', 'update'],
        required: true,
        default: 'announcement'
    },
    link: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        index: { expireAfterSeconds: 0 }
    }
}, {
    timestamps: true
});

// Track which users have read system notifications
const userSystemNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    systemNotificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SystemNotification',
        required: true
    },
    isRead: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

userSystemNotificationSchema.index({ userId: 1, systemNotificationId: 1 }, { unique: true });

const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
const SystemNotification = mongoose.model('SystemNotification', systemNotificationSchema);
const UserSystemNotification = mongoose.model('UserSystemNotification', userSystemNotificationSchema);

export { UserNotification, SystemNotification, UserSystemNotification };
