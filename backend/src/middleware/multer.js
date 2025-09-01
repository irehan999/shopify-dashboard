import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

// Shopify image requirements based on official documentation
const SHOPIFY_IMAGE_REQUIREMENTS = {
    maxFileSize: 20 * 1024 * 1024, // 20MB max
    maxResolution: 20000000, // 20 megapixels
    allowedMimeTypes: [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/heic',
        'image/gif'
    ],
    allowedExtensions: /\.(jpeg|jpg|png|webp|heic|gif)$/i
};

const SHOPIFY_VIDEO_REQUIREMENTS = {
    maxFileSize: 1024 * 1024 * 1024, // 1GB max
    maxDuration: 600, // 10 minutes in seconds
    allowedMimeTypes: [
        'video/mp4',
        'video/mov',
        'video/quicktime',
        'video/avi',
        'video/mkv',
        'video/webm'
    ],
    allowedExtensions: /\.(mp4|mov|avi|mkv|webm)$/i
};

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Generate unique filename to avoid conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// File filter for Shopify compatibility
const fileFilter = (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    
    if (isImage) {
        // Check image requirements
        if (!SHOPIFY_IMAGE_REQUIREMENTS.allowedMimeTypes.includes(file.mimetype)) {
            return cb(new ApiError(400, `Invalid image type for ${file.fieldname}. Allowed: JPEG, PNG, WEBP, HEIC, GIF`), false);
        }
        
        if (!SHOPIFY_IMAGE_REQUIREMENTS.allowedExtensions.test(file.originalname.toLowerCase())) {
            return cb(new ApiError(400, `Invalid image extension for ${file.fieldname}`), false);
        }
        
        return cb(null, true);
        
    } else if (isVideo) {
        // Check video requirements
        if (!SHOPIFY_VIDEO_REQUIREMENTS.allowedMimeTypes.includes(file.mimetype)) {
            return cb(new ApiError(400, `Invalid video type for ${file.fieldname}. Allowed: MP4, MOV, WEBM`), false);
        }
        
        if (!SHOPIFY_VIDEO_REQUIREMENTS.allowedExtensions.test(file.originalname.toLowerCase())) {
            return cb(new ApiError(400, `Invalid video extension for ${file.fieldname}`), false);
        }
        
        return cb(null, true);
    }
    
    // Reject other file types
    cb(new ApiError(400, `Invalid file type for ${file.fieldname}. Only images and videos are allowed`), false);
};

// Create multer instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: SHOPIFY_IMAGE_REQUIREMENTS.maxFileSize, // 20MB for images, will handle videos separately
        files: 10 // Max 10 files per request
    }
});

// Separate upload for videos with higher limit
export const uploadVideo = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: SHOPIFY_VIDEO_REQUIREMENTS.maxFileSize, // 1GB for videos
        files: 5 // Max 5 videos per request
    }
});

// Helper function to validate image dimensions (to be used after upload)
export const validateImageDimensions = (width, height) => {
    const megapixels = (width * height) / 1000000;
    
    if (megapixels > 20) {
        throw new ApiError(400, `Image resolution too high. Maximum 20 megapixels allowed. Current: ${megapixels.toFixed(1)}MP`);
    }
    
    // Check aspect ratio (between 100:1 and 1:100)
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 100) {
        throw new ApiError(400, `Image aspect ratio must be between 100:1 and 1:100. Current: ${aspectRatio.toFixed(1)}:1`);
    }
    
    return true;
};

// Export requirements for use in other files
export { SHOPIFY_IMAGE_REQUIREMENTS, SHOPIFY_VIDEO_REQUIREMENTS };