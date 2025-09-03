
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { StoreLink } from '../models/StoreLink.js';
import crypto from 'crypto';

// Import Shopify configuration
import shopify, { getSessionFromRequest, createSession, validateWebhook } from '../config/shopify.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';

/**
 * Register webhooks for the store
 */
const registerWebhooks = async (session) => {
  try {
    const client = new shopify.clients.Graphql({ session });
    
    // Product-first approach: only register app + product webhooks for now
    const webhookTopics = [
      'APP_UNINSTALLED',
      'PRODUCTS_CREATE', 
      'PRODUCTS_UPDATE',
      'PRODUCTS_DELETE'
    ];

    // ✅ Fix: Use proper topic mapping instead of string replace
    const topicMapping = {
      'APP_UNINSTALLED': 'app/uninstalled',
      'PRODUCTS_CREATE': 'products/create',
      'PRODUCTS_UPDATE': 'products/update',
      'PRODUCTS_DELETE': 'products/delete',
      'ORDERS_CREATE': 'orders/create',
      'ORDERS_UPDATE': 'orders/update'
    };

    const baseUrl = process.env.SHOPIFY_APP_URL || process.env.BACKEND_URL;
    
    // ✅ Fix: Check existing webhooks to prevent duplicates
    const existingWebhooksQuery = `
      query {
        webhookSubscriptions(first: 100) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `;

  const existingWebhooksResponse = await client.request(existingWebhooksQuery, { retries: 2 });

  const existingWebhooks = existingWebhooksResponse.data.webhookSubscriptions.edges.map(
      edge => ({
        topic: edge.node.topic,
        callbackUrl: edge.node.endpoint?.callbackUrl
      })
    );
    
    for (const topic of webhookTopics) {
      const webhookPath = `/api/shopify/webhooks/${topicMapping[topic]}`;
      const callbackUrl = `${baseUrl}${webhookPath}`;

      // Check if webhook already exists
      const webhookExists = existingWebhooks.some(
        webhook => webhook.topic === topic && webhook.callbackUrl === callbackUrl
      );

  if (webhookExists) continue;
      
      const mutation = `
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            webhookSubscription {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        topic: topic,
        webhookSubscription: {
          callbackUrl: callbackUrl,
          format: 'JSON'
        }
      };

      const response = await client.request(mutation, { variables, retries: 2 });

      const result = response.data.webhookSubscriptionCreate;
      if (result.userErrors && result.userErrors.length > 0) {
        console.error(`Webhook registration error for ${topic}:`, result.userErrors);
      } else {
        console.log(`Successfully registered webhook for ${topic}`);
      }
    }
  } catch (error) {
    console.error('Error registering webhooks:', error);
    throw error;
  }
};

/**
 * Exchange session token for access token (for embedded apps)
 * POST /api/shopify/token-exchange
 */
const exchangeSessionToken = asyncHandler(async (req, res) => {
  const { sessionToken } = req.body;
  
  if (!sessionToken) {
    throw new ApiError(400, 'Session token is required');
  }

  try {
    // Verify and decode session token
    const decodedToken = shopify.session.decodeSessionToken(sessionToken);
    const shop = decodedToken.dest.replace('https://', '');

    // Exchange session token for access token
    const session = await shopify.auth.tokenExchange({
      sessionToken,
      shop,
      requestedTokenType: 'urn:shopify:params:oauth:token-type:offline-access-token'
    });

    if (!session) {
      throw new ApiError(400, 'Failed to exchange session token');
    }

    // Store the session
    await shopify.config.sessionStorage.storeSession(session);

    // Find or create store record
    let store = await Store.findOne({ shopDomain: shop });
    
    if (!store) {
      // Get shop info
      const client = new shopify.clients.Rest({ session });
      const shopResponse = await client.get({ path: 'shop' });
      const shopInfo = shopResponse.body.shop;

      // Create new store record
      store = await Store.create({
        shopDomain: shop,
        shopName: shopInfo.name,
        shopEmail: shopInfo.email,
        accessToken: session.accessToken,
        scopes: session.scope ? session.scope.split(',') : [],
        isActive: true,
        connectedAt: new Date(),
        shopData: {
          id: shopInfo.id,
          currency: shopInfo.currency,
          timezone: shopInfo.iana_timezone,
          plan: shopInfo.plan_name,
          country: shopInfo.country,
          province: shopInfo.province,
          city: shopInfo.city,
          address: shopInfo.address1,
          zip: shopInfo.zip,
          phone: shopInfo.phone,
        },
        lastSyncAt: new Date(),
        syncStatus: 'completed'
      });
    } else {
      // Update existing store
      store.accessToken = session.accessToken;
      store.scopes = session.scope ? session.scope.split(',') : [];
      store.isActive = true;
      store.lastSyncAt = new Date();
      await store.save();
    }

    res.json(new ApiResponse(200, { 
      sessionId: session.id,
      shop: session.shop,
      storeId: store._id 
    }, 'Session token exchanged successfully'));

  } catch (error) {
    console.error('Token exchange error:', error);
    throw new ApiError(500, 'Failed to exchange session token');
  }
});

/**
 * Get or create session for store operations
 */
const getStoreSession = async (store) => {
  try {
    // Try to get existing session from MongoDB storage
    const sessionId = `offline_${store.shopDomain}`;
    let session = await shopify.config.sessionStorage.loadSession(sessionId);
    
    if (session && session.accessToken) {
      // Validate session is still working
      try {
        const client = new shopify.clients.Rest({ session });
        await client.get({ path: 'shop' });
        return session;
      } catch (error) {
        console.log('Existing session invalid, will create new one');
      }
    }
    
    // Create new session using stored access token
    session = await createSession(
      store.shopDomain,
      store.accessToken,
      store.scopes
    );
    
    return session;
  } catch (error) {
    console.error('Error getting/creating store session:', error);
    throw new ApiError(500, 'Failed to create store session');
  }
};


/**
 * Validate authenticated session middleware
 */
const validateSession = asyncHandler(async (req, res, next) => {
  try {
    // Get session from request
    const session = await getSessionFromRequest(req, res);
    
    if (!session || !session.accessToken) {
      throw new ApiError(401, 'No valid session found or missing access token');
    }

    // Load session from MongoDB storage
    const storedSession = await shopify.config.sessionStorage.loadSession(session.id);
    if (!storedSession) {
      throw new ApiError(401, 'Session not found in storage');
    }

    // (Optional) extra consistency check
    if (storedSession.shop !== session.shop) {
      throw new ApiError(401, 'Session shop mismatch');
    }

    // Ensure store exists in DB
    const store = await Store.findOne({ 
      shopDomain: storedSession.shop, 
      isActive: true 
    });
    if (!store) {
      throw new ApiError(401, 'Store not found or inactive');
    }

    // Attach validated session + store to request
    req.session = storedSession;
    req.store = store;

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json(new ApiResponse(401, null, 'Session validation failed'));
  }
});


/**
 * Initiate OAuth flow with proper user context and state management
 * GET /api/shopify/auth?shop=store.myshopify.com
 */
const initiateAuth = asyncHandler(async (req, res) => {
  const { shop } = req.query;

  console.log('user:', req.user);
  if (!shop) {
    throw new ApiError(400, 'Shop domain is required as query parameter');
  }
  // Clean and validate shop domain
  let shopDomain = shop.trim().toLowerCase();
  if (!shopDomain.includes('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shopDomain)) {
    throw new ApiError(400, 'Invalid shop domain format');
  }

  try {
    // Create state with user ID for callback validation
    const userId = req.user?._id?.toString();
    const randomState = Math.random().toString(36).substring(2, 15);
    const state = userId ? `user_${userId}_${randomState}` : randomState;

    // ✅ Explicit scopes to ensure all required permissions are requested
    const requestedScopes = [
      'read_products',
      'write_products',
      'read_product_listings', 
      'write_product_listings',
      'read_files',
      'write_files'
    ];

    // ✅ Let Shopify handle the redirect directly (don't send JSON response)
    await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
      state,
      scopes: requestedScopes, // Explicitly request all scopes
    });

    // Note: Don't send response here - shopify.auth.begin handles the redirect
  } catch (error) {
    console.error('OAuth initiation error:', error);
    throw new ApiError(500, 'Failed to initiate OAuth flow');
  }
});


/**
 * Handle OAuth callback with proper state validation and user context
 * GET /api/shopify/callback
 */
    const handleCallback = asyncHandler(async (req, res) => {
    try {
        // Validate state parameter to extract user ID
        const { state } = req.query;
        let userId = null;
        
        if (state && state.startsWith('user_')) {
        const userIdMatch = state.match(/^user_([^_]+)_/);
        if (userIdMatch) {
            userId = userIdMatch[1];
            console.log('User ID extracted from state:', userId);
        }
        }

        // Use official Shopify API to handle callback - this creates and stores session automatically
        let callbackResponse;
        try {
          callbackResponse = await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res,
          });
        } catch (error) {
          // Handle OAuth cookie not found error specifically
          console.warn('OAuth callback error:', {
            name: error.name,
            message: error.message,
            query: req.query
          });
          
          if (error.name === 'CookieNotFound' || error.message?.includes('cookie') || error.message?.includes('state')) {
            console.warn('OAuth cookie/state issue detected, redirecting for retry');
            const shop = req.query.shop;
            if (shop) {
              // Redirect back to the install page for retry
              const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
              return res.redirect(`${frontendUrl}/stores?error=oauth_retry&shop=${encodeURIComponent(shop)}`);
            }
          }
          
          // For other OAuth errors, also try to provide meaningful feedback
          if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
            const shop = req.query.shop;
            if (shop) {
              const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
              return res.redirect(`${frontendUrl}/stores?error=oauth_retry&shop=${encodeURIComponent(shop)}`);
            }
          }
          
          throw error;
        }

        const { session } = callbackResponse;
        
        if (!session || !session.accessToken) {
        throw new ApiError(400, 'Failed to create session or obtain access token');
        }

        console.log('OAuth session created:', {
        id: session.id,
        shop: session.shop,
        isOnline: session.isOnline,
        scope: session.scope,
        hasToken: !!session.accessToken
        });

        // Use REST client only for testing/getting shop info
        const client = new shopify.clients.Rest({ session });
        const shopResponse = await client.get({
        path: 'shop',
        });

        const shopInfo = shopResponse.body.shop;

        // Save or update store in database with user context
        const storeData = {
        userId: userId, // From state parameter
        shopDomain: session.shop,
        shopName: shopInfo.name,
        shopEmail: shopInfo.email,
        accessToken: session.accessToken,
        sessionId: session.id,
        scopes: session.scope ? session.scope.split(/[,\s]+/).filter(s => s.length > 0) : [],
        isActive: true,
        connectedAt: new Date(),
        shopData: {
            id: shopInfo.id,
            currency: shopInfo.currency,
            timezone: shopInfo.iana_timezone,
            plan: shopInfo.plan_name,
            country: shopInfo.country,
            province: shopInfo.province,
            city: shopInfo.city,
            address: shopInfo.address1,
            zip: shopInfo.zip,
            phone: shopInfo.phone,
        },
        lastSyncAt: new Date(),
        syncStatus: 'completed'
        };

    let store;
        
    if (userId) {
        // Find existing store for this user and shop
        store = await Store.findOne({ 
            userId: userId, 
            shopDomain: session.shop 
        });

        if (store) {
            // Update existing store
            Object.assign(store, storeData);
            await store.save();
        } else {
            // ✅ Fix: Verify user exists before creating store to prevent orphaned stores
            const userExists = await User.findById(userId);
            if (!userExists) {
            throw new ApiError(404, 'User not found. Cannot create store.');
            }

            // Create new store
            store = await Store.create(storeData);
            
            // Increment user's connected stores count
            const userUpdateResult = await User.findByIdAndUpdate(userId, {
            $inc: { connectedStores: 1 }
            });

            if (!userUpdateResult) {
            // If user update fails, clean up the store to prevent orphaned data
            await Store.findByIdAndDelete(store._id);
            throw new ApiError(500, 'Failed to update user store count');
            }
        }
        } else {
        // Guest install or install launched from Shopify admin where our cookie/user isn't present.
        // Create a short-lived StoreLink token to let the user bind this store after login/signup.
        const token = crypto.randomBytes(24).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

        await StoreLink.create({
            token,
            shopDomain: session.shop,
            shopName: shopInfo.name,
            shopEmail: shopInfo.email,
            sessionId: session.id,
            accessToken: session.accessToken,
            scopes: storeData.scopes,
            shopData: storeData.shopData,
            expiresAt,
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        // Redirect user to linking page carrying the token; frontend will ask user to sign in/up and then call link endpoint
        return res.redirect(`${frontendUrl}/link-store?token=${token}&shop=${encodeURIComponent(session.shop)}`);
        }

        // Register webhooks after successful connection
        try {
        await registerWebhooks(session);
        } catch (webhookError) {
        console.error('Webhook registration error:', webhookError);
        // Don't fail the entire flow for webhook errors
        }

        // Redirect to frontend success page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/stores?success=true&store=${encodeURIComponent(session.shop)}`);

    } catch (error) {
        console.error('OAuth callback error:', error);
        
        // Redirect to frontend error page
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/stores?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
    });

// Removed completeStoreConnection - functionality handled by handleCallback

/**
 * Get connected stores
 * GET /api/shopify/stores
 */
const getConnectedStores = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stores = await Store.find({ userId, isActive: true })
    .select('-accessToken') // Don't send access tokens to frontend
    .sort({ connectedAt: -1 });

  res.json(new ApiResponse(200, stores, 'Connected stores retrieved'));
});

/**
 * Disconnect store
 * DELETE /api/shopify/stores/:storeId
 */
const disconnectStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user._id;

  const store = await Store.findOne({ _id: storeId, userId });
  
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  // Attempt to uninstall the app from the Shopify store (remote disconnect)
  try {
    const session = await getStoreSession(store);
    const client = new shopify.clients.Graphql({ session });
    const UNINSTALL_MUTATION = `
      mutation { appUninstall { userErrors { field message } } }
    `;
    const resp = await client.request(UNINSTALL_MUTATION);
    const userErrors = resp.data?.appUninstall?.userErrors || [];
    if (userErrors.length > 0) {
      console.warn('App uninstall returned userErrors:', userErrors);
    }
  } catch (e) {
    console.error('Failed to uninstall app from store (continuing to mark inactive):', e);
  }

  // Mark as inactive instead of deleting (for audit trail)
  store.isActive = false;
  store.disconnectedAt = new Date();
  await store.save();

  // ✅ Fix: Check if user exists before updating connected stores count
  const userUpdateResult = await User.findByIdAndUpdate(userId, {
    $inc: { connectedStores: -1 }
  });

  if (!userUpdateResult) {
    console.warn(`User ${userId} not found when disconnecting store ${storeId}`);
  }

  // Best-effort: delete persisted session and clear token
  try {
    const sessionId = `offline_${store.shopDomain}`;
    await shopify.config.sessionStorage.deleteSession(sessionId);
  } catch (e) {
    console.error('Failed to delete session after uninstall:', e);
  }
  try {
    await Store.findByIdAndUpdate(storeId, { $unset: { accessToken: '' } });
  } catch {}

  res.json(new ApiResponse(200, {}, 'Store disconnected successfully'));
});

/**
 * Get store analytics using Shopify API
 * GET /api/shopify/stores/:storeId/analytics
 */
const getStoreAnalytics = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user._id;

  const store = await Store.findOne({ _id: storeId, userId, isActive: true });
  
  if (!store) {
    throw new ApiError(404, 'Store not found');
  }

  try {
    // TODO: Implement analytics sync (counts/revenue). For now, return minimal info from store.shopData.
    const minimal = {
      currency: store.shopData?.currency,
      lastUpdated: new Date(),
    };
    res.json(new ApiResponse(200, minimal, 'Analytics placeholder'));
  } catch (error) {
    console.error('Analytics fetch error:', error);
    throw new ApiError(500, 'Failed to fetch store analytics');
  }
});

/**
 * Claim a store link token and bind the store to the current user
 * POST /api/shopify/link-store
 * Body: { token }
 */
const linkStoreToUser = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user?._id;

  if (!token) {
    throw new ApiError(400, 'Token is required');
  }
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  // Atomically fetch + mark token as used
  const link = await StoreLink.findOneAndUpdate(
    { token, used: false, expiresAt: { $gt: new Date() } },
    { $set: { used: true } },
    { new: true }
  );

  if (!link) {
    throw new ApiError(404, 'Invalid or expired token');
  }

  // Prevent cross-user hijack
  const existingStore = await Store.findOne({ shopDomain: link.shopDomain });
  if (existingStore && existingStore.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'This store is already linked to another account');
  }

  // Upsert store for this user
  let store;
  if (existingStore) {
    // Update existing store for this user
    Object.assign(existingStore, {
      accessToken: link.accessToken,
      scopes: link.scopes,
      isActive: true,
      shopName: link.shopName || existingStore.shopName,
      shopEmail: link.shopEmail || existingStore.shopEmail,
      shopData: link.shopData || existingStore.shopData,
      connectedAt: existingStore.connectedAt || new Date(),
      lastSyncAt: new Date(),
      syncStatus: 'completed',
    });
    store = await existingStore.save();
  } else {
    // Create new store
    store = await Store.create({
      userId,
      shopDomain: link.shopDomain,
      shopName: link.shopName || link.shopDomain,
      shopEmail: link.shopEmail,
      accessToken: link.accessToken,
      scopes: link.scopes,
      isActive: true,
      connectedAt: new Date(),
      shopData: link.shopData,
      lastSyncAt: new Date(),
      syncStatus: 'completed',
    });

    await User.findByIdAndUpdate(userId, { $inc: { connectedStores: 1 } });
  }

  // Optional cleanup: delete used link (not strictly required)
  await StoreLink.deleteOne({ _id: link._id }).catch(() => {});

  // Register webhooks after linking
  try {
    await registerWebhooks({
      id: store.sessionId,
      shop: store.shopDomain,
      accessToken: store.accessToken,
      isOnline: false,
    });
  } catch (err) {
    console.error('Webhook registration failed after store linking:', err);
  }

  return res.json(new ApiResponse(200, { storeId: store._id }, 'Store linked successfully'));
});


// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Webhook handler for app uninstallation
 * POST /api/shopify/webhooks/app/uninstalled
 */
const handleAppUninstalled = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  // Verify webhook authenticity using official Shopify method
  const isValid = validateWebhook(rawBody, hmac);

  if (!isValid) {
    console.error('Invalid webhook signature for app uninstall');
    return res.status(401).send('Unauthorized');
  }

  try {
    // Mark store as inactive
    const store = await Store.findOne({ shopDomain });
    if (store) {
      store.isActive = false;
      store.disconnectedAt = new Date();
      await store.save();

      // ✅ Fix: Check if user exists before updating connected stores count
      const userUpdateResult = await User.findByIdAndUpdate(store.userId, {
        $inc: { connectedStores: -1 }
      });

      if (!userUpdateResult) {
        console.warn(`User ${store.userId} not found when handling app uninstall for shop ${shopDomain}`);
      }

      console.log(`App uninstalled from shop: ${shopDomain}`);
    }

    // Clean up stored offline session if present
    try {
      const sessionId = `offline_${shopDomain}`;
      await shopify.config.sessionStorage.deleteSession(sessionId);
    } catch (e) {
      console.warn('Failed to delete stored session on uninstall:', e?.message || e);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling app uninstall webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Webhook handler for product creation
 * POST /api/shopify/webhooks/products/create
 */
const handleProductCreate = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!validateWebhook(rawBody, hmac)) {
    return res.status(401).send('Unauthorized');
  }

  try {
  // TODO: Update local product cache / counts when analytics sync is implemented
  // const product = req.body;

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling product create webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Webhook handler for product updates
 * POST /api/shopify/webhooks/products/update
 */
const handleProductUpdate = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!validateWebhook(rawBody, hmac)) {
    return res.status(401).send('Unauthorized');
  }

  try {
  // TODO: Update local product cache when analytics sync is implemented
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling product update webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Webhook handler for product deletion
 * POST /api/shopify/webhooks/products/delete
 */
const handleProductDelete = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!validateWebhook(rawBody, hmac)) {
    return res.status(401).send('Unauthorized');
  }

  try {
  // TODO: Update local product cache / counts when analytics sync is implemented

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling product delete webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Webhook handler for order creation
 * POST /api/shopify/webhooks/orders/create
 */
const handleOrderCreate = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!validateWebhook(rawBody, hmac)) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const order = req.body;
    console.log(`New order created in ${shopDomain}:`, order.order_number);
    
    // Update store analytics
    const store = await Store.findOne({ shopDomain, isActive: true });
    if (store) {
      store.analytics.totalOrders += 1;
      store.analytics.totalRevenue += parseFloat(order.total_price || 0);
      store.analytics.lastUpdated = new Date();
      await store.save();
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling order create webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * Webhook handler for order updates
 * POST /api/shopify/webhooks/orders/update
 */
const handleOrderUpdate = asyncHandler(async (req, res) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!validateWebhook(rawBody, hmac)) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const order = req.body;
    console.log(`Order updated in ${shopDomain}:`, order.order_number);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling order update webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

export {
  // OAuth and Store Management
  initiateAuth,
  handleCallback,
  exchangeSessionToken,
  getConnectedStores,
  disconnectStore,
  getStoreAnalytics,
  validateSession,
  
  // Webhook Handlers
  handleAppUninstalled,
  handleProductCreate,
  handleProductUpdate,
  handleProductDelete,
  handleOrderCreate,
  handleOrderUpdate
  ,
  linkStoreToUser
};
