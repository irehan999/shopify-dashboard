import { Router } from 'express';
import {
    uploadAvatar,
    deleteAvatar,
    handleAvatar,
    getUserProfile,
    updateUserProfile,
    updateUserPreferences,
    deactivateAccount
} from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Profile routes
router.route('/profile').get(getUserProfile);
router.route('/profile').patch(updateUserProfile);
router.route('/preferences').patch(updateUserPreferences);

// Avatar routes (unified handler)
router.route('/avatar').post(upload.single('avatar'), handleAvatar);
router.route('/avatar').delete(deleteAvatar);

// Legacy routes (backward compatibility)
router.route('/upload-avatar').post(upload.single('avatar'), uploadAvatar);
router.route('/delete-avatar').delete(deleteAvatar);

// Account management
router.route('/deactivate').post(deactivateAccount);

export default router;
