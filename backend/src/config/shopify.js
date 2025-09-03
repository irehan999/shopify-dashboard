import dotenv from 'dotenv';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-04';
import '@shopify/shopify-api/adapters/node';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';

// Load environment variables first
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'MONGODB_URI'];
const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missing.length > 0) {
  throw new Error(`Cannot initialize Shopify API Library. Missing values for: ${missing.join(', ')}`);
}

// MongoDB session storage configuration
const sessionStorage = new MongoDBSessionStorage(
  process.env.MONGODB_URI,
  process.env.SHOPIFY_API_SECRET
);

// Configure Shopify API with MongoDB session storage
export const shopify = shopifyApi({
  // Basic app configuration
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  
  // Product-focused scopes for your requirements
  scopes: [
    'read_products',
    'write_products',
    'read_product_listings', 
    'write_product_listings',
    'read_files',
    'write_files'
  ],
  
  // App URL configuration
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, ''),
  hostScheme: 'https',
  
  // API version
  apiVersion: LATEST_API_VERSION,
  
  // App type
  isEmbeddedApp: false,
  
  // Session storage
  sessionStorage: sessionStorage,
});

// Helper to get session from request
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

// Helper to create and store session
export const createSession = async (shop, accessToken, scopes) => {
  try {
    const session = shopify.session.customAppSession(shop);
    session.accessToken = accessToken;
    session.scope = Array.isArray(scopes) ? scopes.join(',') : scopes;
    
    // Store session in MongoDB
    await shopify.config.sessionStorage.storeSession(session);
    
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Helper to validate webhook with proper secret
export const validateWebhook = (rawBody, signature) => {
  return shopify.webhooks.verify({
    rawBody,
    signature,
  });
};

export default shopify;
