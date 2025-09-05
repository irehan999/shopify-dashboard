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
import collectionRoutes from './src/routes/collectionRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';

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
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());



app.use(
  cors({
    origin: function (origin, callback) {
      // Always allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "https://07fbd8d74223.ngrok-free.app", // Allow ngrok frontend
        process.env.FRONTEND_URL
      ].filter(Boolean);

      // In development, be more permissive
      if (process.env.NODE_ENV === "development") {
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        const isNgrok = /\.ngrok-free\.app$/i.test(origin);

        if (isLocalhost || isNgrok || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      } else {
        // Production: only allow specific origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Shopify-*"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
    maxAge: 86400,
  })
);

// Global rate limiter (simple in-memory) - TEMPORARILY DISABLED FOR TESTING
// const globalLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 1000, // Limit each IP to 1000 requests per windowMs
//     message: {
//         success: false,
//         message: 'Too many requests from this IP, please try again later.'
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// app.use((req, res, next) => {
//     // Skip global rate limit for auth routes (they have their own)
//     if (req.path.startsWith("/api/auth")) {
//         return next();
//     }
//     globalLimiter(req, res, next);
// });

// Auth-specific rate limiter (simple in-memory) - TEMPORARILY DISABLED FOR TESTING
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 20, // Limit each IP to 20 auth requests per windowMs
//     message: {
//         success: false, 
//         message: "Too many authentication attempts. Please try again later."
//     },
//     standardHeaders: true,
//     legacyHeaders: false,
// });

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/auth', authRoutes); // authLimiter temporarily disabled
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shopify-admin', shopifyGraphQLRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/inventory', inventoryRoutes);

// Future routes will be added here
// app.use('/api/stores', storeRoutes);

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

// // 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({ 
//         success: false,
//         message: `Route ${req.originalUrl} not found` 
//     });
// });

export { app };
