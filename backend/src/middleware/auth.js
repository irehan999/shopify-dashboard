// Auth middleware for JWT token verification
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies?.accessToken || 
                  req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
    // Get user from database
    const user = await User.findById(decoded._id).select('-password -refreshToken')
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      })
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked'
      })
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deleted'
      })
    }

    // Attach user to request object
    req.user = user
    next()

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

// Admin role middleware
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  next()
}

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || 
                  req.header('Authorization')?.replace('Bearer ', '')

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decoded._id).select('-password -refreshToken')
      
      if (user && !user.isBlocked && !user.isDeleted) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    // Silently ignore auth errors in optional middleware
    next()
  }
}

// Rate limiting middleware for auth endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map()

  return (req, res, next) => {
    const key = req.ip + (req.body?.email || req.body?.username || '')
    const now = Date.now()
    
    // Clean old attempts
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k)
      }
    }
    
    const userAttempts = attempts.get(key)
    
    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now })
      return next()
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
      })
    }
    
    userAttempts.count++
    next()
  }
}

export {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
  authRateLimit
}
