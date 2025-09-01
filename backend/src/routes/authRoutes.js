import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
} from '../controllers/authController.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Public routes
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/logout').post(logoutUser); // No middleware - handles expired tokens

// Protected routes
router.route('/current-user').get(authenticateUser, getCurrentUser);
router.route('/change-password').post(authenticateUser, changeCurrentPassword);


export default router;
