import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';

// MongoDB session storage configuration
const sessionStorage = new MongoDBSessionStorage(
  process.env.MONGODB_URI,
  process.env.SHOPIFY_CLIENT_SECRET
);

// Configure Shopify API with MongoDB session storage
export const shopify = shopifyApi({
  // Basic app configuration
  apiKey: process.env.SHOPIFY_CLIENT_ID,
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET,
  
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
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, '') || 'localhost',
  hostScheme: 'https',
  
  // API version
  apiVersion: LATEST_API_VERSION,
  
  // App type
  isEmbeddedApp: true,
  
  // Session storage
  sessionStorage: sessionStorage,
  
  // ✅ Webhooks removed to avoid duplication - registered programmatically instead
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

// Helper to validate webhook
export const validateWebhook = (rawBody, signature) => {
  return shopify.webhooks.verify({
    rawBody,
    signature,
  });
};

export default shopify;
