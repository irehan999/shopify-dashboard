import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import { ApiError } from "./ApiError.js";

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Shopify-optimized image transformations
const SHOPIFY_TRANSFORMATIONS = {
    // Product images - main display
    product_main: {
        width: 2048,
        height: 2048,
        crop: "fill",
        quality: "auto:good",
        format: "auto"
    },
    // Product thumbnails
    product_thumb: {
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto:good",
        format: "auto"
    },
    // Collection images
    collection: {
        width: 1200,
        height: 600,
        crop: "fill",
        quality: "auto:good",
        format: "auto"
    },
    // Store banner/hero images
    banner: {
        width: 1920,
        height: 1080,
        crop: "fill",
        quality: "auto:best",
        format: "auto"
    }
};

const uploadOnCloudinary = async (localFilePath, transformationType = 'product_main') => {
    try {
        if (!localFilePath) {
            console.error("Upload failed: No local file path provided.");
            return null;
        }

        // Check if file exists before trying to upload
        if (!fs.existsSync(localFilePath)) {
            console.error(`Upload failed: File does not exist at path: ${localFilePath}`);
            return null;
        }

        // Get transformation settings
        const transformation = SHOPIFY_TRANSFORMATIONS[transformationType] || SHOPIFY_TRANSFORMATIONS.product_main;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "shopify-dashboard", // Organize uploads
            ...transformation,
            // Generate multiple sizes for responsive images
            eager: [
                { width: 480, height: 480, crop: "fill", quality: "auto:good" },
                { width: 800, height: 800, crop: "fill", quality: "auto:good" },
                { width: 1200, height: 1200, crop: "fill", quality: "auto:good" }
            ],
            eager_async: true
        });

        // Clean up local file after successful upload
        fs.unlinkSync(localFilePath);
        
        console.log(`File uploaded to Cloudinary: ${response.public_id}`);
        return {
            url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
            bytes: response.bytes,
            // Include responsive URLs
            responsive_urls: response.eager?.map(size => ({
                url: size.secure_url,
                width: size.width,
                height: size.height
            })) || []
        };
        
    } catch (error) {
        // If an error occurred, still try to clean up the local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed:", error.message);
        return null; // IMPORTANT: Return null on any failure
    }  
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        console.log(`Media with public ID ${publicId} deleted successfully.`);
    } catch (error) {
        console.error("Failed to delete media from Cloudinary", error);
        throw new ApiError(500, "Error deleting media from Cloudinary.");
    }
};

// Generate Shopify-compatible URLs
const generateShopifyUrl = (publicId, width = 800, height = 800) => {
    return cloudinary.url(publicId, {
        width,
        height,
        crop: "fill",
        quality: "auto:good",
        format: "auto",
        secure: true
    });
};

// Validate if image meets Shopify requirements
const validateForShopify = (uploadResult) => {
    if (!uploadResult) return false;
    
    // Check file size (max 20MB)
    if (uploadResult.bytes > 20 * 1024 * 1024) {
        throw new ApiError(400, "Image too large. Maximum 20MB allowed for Shopify.");
    }
    
    // Check resolution (max 20MP)
    const megapixels = (uploadResult.width * uploadResult.height) / 1000000;
    if (megapixels > 20) {
        throw new ApiError(400, `Image resolution too high. Maximum 20MP allowed. Current: ${megapixels.toFixed(1)}MP`);
    }
    
    return true;
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    generateShopifyUrl,
    validateForShopify,
    SHOPIFY_TRANSFORMATIONS
};
