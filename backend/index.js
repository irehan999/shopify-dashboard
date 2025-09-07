import dotenv from 'dotenv';
dotenv.config(
    {
      path: './.env'
    }
);

import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

import { app } from './app.js';
import { User } from './src/models/User.js';
import { initializeNotificationSockets } from './src/services/notification.service.js';
import { connectDB } from './src/config/database.js';



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

// Socket authentication middleware with token refresh capability
const authenticateSocket = async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        if (!cookies) {
            return next(new Error('No cookies found'));
        }

        const parsedCookies = cookie.parse(cookies);
        let accessToken = parsedCookies['accessToken'];
        const refreshToken = parsedCookies['refreshToken'];
        
        if (!accessToken && !refreshToken) {
            return next(new Error('No auth tokens found in cookies'));
        }

        let decoded;
        let user;

        // Try to verify access token first
        try {
            decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            user = await User.findById(decoded._id);
            
            if (user) {
                socket.user = user;
                return next();
            }
        } catch (tokenError) {
            console.log('Access token invalid or expired, trying refresh token');
            
            // If access token fails, try refresh token
            if (refreshToken) {
                try {
                    const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    const refreshUser = await User.findById(refreshDecoded._id);
                    
                    if (refreshUser && refreshUser.refreshToken === refreshToken) {
                        // Refresh token is valid, but we can't set new cookies in socket middleware
                        // Instead, we'll allow the connection and let the client handle refresh
                        socket.user = refreshUser;
                        socket.emit('token_refresh_needed'); // Tell client to refresh token
                        return next();
                    }
                } catch (refreshError) {
                    console.log('Refresh token also invalid');
                }
            }
            
            // Both tokens failed
            return next(new Error('Authentication failed'));
        }

        return next(new Error('User not found'));
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
            console.log('All envs:', process.env);
        });
    })
    .catch((error) => {
        console.error("❌ Server startup failed:", error);
        process.exit(1);
    });

export { io };
