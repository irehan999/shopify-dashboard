import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { app } from './app.js';
import { User } from './src/models/User.js';
import { initializeNotificationSockets } from './src/services/notification.service.js';
import { connectDB } from './src/config/database.js';

dotenv.config(
    {
      path: './.env'
    }
);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error('No cookies found'));
        }

        const parsedCookies = cookie.parse(cookies);
        const token = parsedCookies['accessToken'];
        
        if (!token) {
            return next(new Error('No auth token found in cookies'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }

        const user = await User.findById(decoded._id);
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.user = user;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication failed'));
    }
};

// Apply authentication middleware to main namespace
io.use(authenticateSocket);

// Socket connection handlers
io.on('connection', (socket) => {
    console.log(`User ${socket.user.email} (${socket.user._id}) connected`);
    
    // Join user to their own room for private notifications
    socket.join(socket.user._id.toString());
    
    socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} (${socket.user._id}) disconnected`);
    });
});

// Initialize notification sockets
initializeNotificationSockets({ io });

// Connect to database and start server
connectDB()
    .then(() => {
        server.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
            console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            console.log(`🛍️ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((error) => {
        console.error("❌ Server startup failed:", error);
        process.exit(1);
    });

export { io };
