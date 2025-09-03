import { shopify } from '../config/shopify.js';
import { ApiError } from '../utils/ApiError.js';
import { Store } from '../models/Store.js';

/**
 * Middleware to validate Shopify session for GraphQL requests
 * Use this for routes that need authenticated Shopify session
 */
export const validateShopifySession = async (req, res, next) => {
  try {
    // Get session from request using Shopify's method
    const sessionId = await shopify.session.getCurrentId({
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    if (!sessionId) {
      throw new ApiError(401, 'No valid Shopify session found');
    }

    // Load session from storage
    const session = await shopify.config.sessionStorage.loadSession(sessionId);
    
    if (!session) {
      throw new ApiError(401, 'Session not found in storage');
    }

    // Check if session is still valid and store exists
    const store = await Store.findOne({ 
      shopDomain: session.shop, 
      isActive: true 
    });

    if (!store) {
      throw new ApiError(401, 'Store not found or inactive');
    }

    // Attach session and store to request
    req.session = session;
    req.store = store;
    
    next();
  } catch (error) {
    console.error('Shopify session validation error:', error);
    res.status(401).json({
      success: false,
      message: 'Shopify session validation failed',
      error: error.message
    });
  }
};

/**
 * Helper to get session from request
 * Use this when you need to get session info without throwing errors
 */
export const getSessionFromRequest = async (req, res) => {
  try {
    const sessionId = await shopify.session.getCurrentId({
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    if (!sessionId) {
      return null;
    }

    return await shopify.config.sessionStorage.loadSession(sessionId);
  } catch (error) {
    console.error('Error getting session from request:', error);
    return null;
  }
};

/**
 * Helper to validate webhook with proper secret
 */
export const validateWebhook = (rawBody, signature) => {
  return shopify.webhooks.verify({
    rawBody,
    signature,
  });
};
