import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import asyncHandler from '../utils/AsyncHanlde.js'

const authenticateUser = asyncHandler(async (req, res, next) => {
    const tokenFromHeader = req.headers.authorization;
    const accessToken = tokenFromHeader?.startsWith("Bearer ") 
        ? tokenFromHeader.split(" ")[1] 
        : req.cookies?.accessToken;

    if (!accessToken) {
        throw new ApiError(401, "Access token is required");
    }

    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    // Check if user is blocked
    if (user.isBlocked) {
        throw new ApiError(403, "Account is blocked");
    }

    // Check if user is deleted
    if (user.isDeleted) {
        throw new ApiError(403, "Account has been deleted");
    }

    req.user = user;
    next();
});

const checkRole = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }
        next();
    });
}

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || 
                      req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded._id).select('-password -refreshToken');
            
            if (user && !user.isBlocked && !user.isDeleted) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Silently ignore auth errors in optional middleware
        next();
    }
});

export { 
    authenticateUser, 
    checkRole, 
    optionalAuth 
};
