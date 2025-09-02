import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import shopifyRoutes from './src/routes/shopifyRoutes.js';
import productRoutes from './src/routes/productRoutesNew.js';
import shopifyGraphQLRoutes from './src/routes/shopifyGraphQLRoutesNew.js';

// Import webhook handlers directly for early middleware setup
import { 
  handleAppUninstalled,
  handleProductCreate,
  handleProductUpdate,
  handleProductDelete,
  handleOrderCreate,
  handleOrderUpdate
} from './src/controllers/shopifyController.js';

// Future routes will be added here
// import storeRoutes from './src/routes/storeRoutes.js';
// import collectionRoutes from './src/routes/collectionRoutes.js';

const app = express();

// ✅ CRITICAL: Webhook endpoints BEFORE any middleware (need raw body)
// Middleware to capture raw body for webhook verification
const captureRawBody = (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

// Shopify webhook endpoints (BEFORE JSON middleware)
app.post('/api/shopify/webhooks/app/uninstalled', captureRawBody, handleAppUninstalled);
app.post('/api/shopify/webhooks/products/create', captureRawBody, handleProductCreate);
app.post('/api/shopify/webhooks/products/update', captureRawBody, handleProductUpdate);
app.post('/api/shopify/webhooks/products/delete', captureRawBody, handleProductDelete);
app.post('/api/shopify/webhooks/orders/create', captureRawBody, handleOrderCreate);
app.post('/api/shopify/webhooks/orders/update', captureRawBody, handleOrderUpdate);

// Express middleware (AFTER webhooks)
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check against environment variable
        const allowedOrigins = process.env.FRONTEND_URL 
            ? process.env.FRONTEND_URL.split(',') 
            : ['http://localhost:5173'];
        
        // In development, allow all localhost ports
        if (process.env.NODE_ENV === 'development') {
            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
            if (isLocalhost) return callback(null, true);
        }
        
        // Check against allowed origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Reject all other origins
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Global rate limiter (simple in-memory)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use((req, res, next) => {
    // Skip global rate limit for auth routes (they have their own)
    if (req.path.startsWith("/api/auth")) {
        return next();
    }
    globalLimiter(req, res, next);
});

// Auth-specific rate limiter (simple in-memory)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: {
        success: false, 
        message: "Too many authentication attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shopify-admin', shopifyGraphQLRoutes);

// Future routes will be added here
// app.use('/api/stores', storeRoutes);
// app.use('/api/collections', collectionRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle CORS errors
    if (err.message.includes('not allowed by CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS: Origin not allowed'
        });
    }
    
    res.status(err.statuscode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: `Route ${req.originalUrl} not found` 
    });
});

export { app };
