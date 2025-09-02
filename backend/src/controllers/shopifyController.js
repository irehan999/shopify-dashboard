
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';

// Import Shopify configuration
import shopify, { getSessionFromRequest, validateWebhook } from '../config/shopify.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHanlde.js';

/**
 * Register webhooks for the store
 */
const registerWebhooks = async (session) => {
  try {
    const client = new shopify.clients.Graphql({ session });
    
    const webhookTopics = [
      'APP_UNINSTALLED',
      'PRODUCTS_CREATE', 
      'PRODUCTS_UPDATE',
      'PRODUCTS_DELETE',
      'ORDERS_CREATE',
      'ORDERS_UPDATE'
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

    const existingWebhooksResponse = await client.query({
      data: { query: existingWebhooksQuery }
    });

    const existingWebhooks = existingWebhooksResponse.body.data.webhookSubscriptions.edges.map(
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

      if (webhookExists) {
        console.log(`Webhook already exists for ${topic}, skipping...`);
        continue;
      }
      
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

      const response = await client.query({
        data: {
          query: mutation,
          variables: variables,
        },
      });

      if (response.body.data.webhookSubscriptionCreate.userErrors.length > 0) {
        console.error(`Webhook registration error for ${topic}:`, 
          response.body.data.webhookSubscriptionCreate.userErrors);
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
 * Validate authenticated session middleware
 */
const validateSession = asyncHandler(async (req, res, next) => {
  try {
    const session = await getSessionFromRequest(req, res);
    
    if (!session) {
      throw new ApiError(401, 'No valid session found');
    }

    // Check if session is still valid
    const store = await Store.findOne({ 
      shopDomain: session.shop, 
      isActive: true 
    });

    if (!store) {
      throw new ApiError(401, 'Store not found or inactive');
    }

    req.session = session;
    req.store = store;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json(new ApiResponse(401, null, 'Session validation failed'));
  }
});

/**
 * Initiate OAuth flow using official Shopify API
 * POST /api/shopify/auth
 */
const initiateAuth = asyncHandler(async (req, res) => {
  const { shop } = req.body;
  const userId = req.user._id;

  if (!shop) {
    throw new ApiError(400, 'Shop domain is required');
  }

  // Clean and validate shop domain
  let shopDomain = shop.trim().toLowerCase();
  if (!shopDomain.includes('.myshopify.com')) {
    shopDomain = `${shopDomain}.myshopify.com`;
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shopDomain)) {
    throw new ApiError(400, 'Invalid shop domain format');
  }

  try {
    // Use official Shopify API to begin OAuth
    const authRoute = await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/shopify/callback',
      isOnline: false, // Use offline tokens for persistent access
      rawRequest: req,
      rawResponse: res,
    });

    // Store user info in session for callback
    req.session.shopifyAuth = {
      userId,
      shop: shopDomain,
      initiated: new Date()
    };

    res.json(new ApiResponse(200, { authUrl: authRoute }, 'OAuth URL generated'));
    
  } catch (error) {
    console.error('OAuth initiation error:', error);
    throw new ApiError(500, 'Failed to initiate OAuth flow');
  }
});

/**
 * Handle OAuth callback using official Shopify API
 * GET /api/shopify/callback
 */
const handleCallback = asyncHandler(async (req, res) => {
  try {
    // Use official Shopify API to handle callback
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callbackResponse;
    
    if (!session) {
      throw new ApiError(400, 'Failed to create session');
    }

    // Get stored user info from session
    const storedAuth = req.session.shopifyAuth;
    if (!storedAuth) {
      throw new ApiError(400, 'No authentication session found');
    }

    // Get shop information using the session
    const client = new shopify.clients.Rest({ session });
    const shopResponse = await client.get({
      path: 'shop',
    });

    const shopInfo = shopResponse.body.shop;

    // Save or update store in database
    const storeData = {
      userId: storedAuth.userId,
      shopDomain: session.shop,
      shopName: shopInfo.name,
      shopEmail: shopInfo.email,
      accessToken: session.accessToken,
      // ✅ Fix: Handle both comma and space separated scopes
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

    let store = await Store.findOne({ 
      userId: storedAuth.userId, 
      shopDomain: session.shop 
    });

    if (store) {
      // Update existing store
      Object.assign(store, storeData);
      await store.save();
    } else {
      // ✅ Fix: Verify user exists before creating store to prevent orphaned stores
      const userExists = await User.findById(storedAuth.userId);
      if (!userExists) {
        throw new ApiError(404, 'User not found. Cannot create store.');
      }

      // Create new store
      store = await Store.create(storeData);
      
      // Increment user's connected stores count
      const userUpdateResult = await User.findByIdAndUpdate(storedAuth.userId, {
        $inc: { connectedStores: 1 }
      });

      if (!userUpdateResult) {
        // If user update fails, clean up the store to prevent orphaned data
        await Store.findByIdAndDelete(store._id);
        throw new ApiError(500, 'Failed to update user store count');
      }
    }

    // Register webhooks after successful connection
    try {
      await registerWebhooks(session);
    } catch (webhookError) {
      console.error('Webhook registration error:', webhookError);
      // Don't fail the entire flow for webhook errors
    }

    // Clear session data
    delete req.session.shopifyAuth;

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/stores?success=true&store=${encodeURIComponent(session.shop)}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Clear session data
    if (req.session.shopifyAuth) {
      delete req.session.shopifyAuth;
    }
    
    // Redirect to frontend error page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/stores?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
});

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
    // Create session for API calls
    const session = {
      shop: store.shopDomain,
      accessToken: store.accessToken,
    };

    const client = new shopify.clients.Rest({ session });

    // Fetch analytics data
    const [ordersResponse, productsResponse, customersResponse] = await Promise.all([
      client.get({ path: 'orders', query: { limit: 250, status: 'any' } }),
      client.get({ path: 'products/count' }),
      client.get({ path: 'customers/count' })
    ]);

    // Calculate analytics
    const orders = ordersResponse.body.orders || [];
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = productsResponse.body.count || 0;
    const totalCustomers = customersResponse.body.count || 0;

    // Recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );

    const analytics = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrders.length,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      currency: store.shopData.currency,
      lastUpdated: new Date(),
    };

    // Update cached analytics in store
    store.analytics = analytics;
    await store.save();

    res.json(new ApiResponse(200, analytics, 'Store analytics retrieved'));

  } catch (error) {
    console.error('Analytics fetch error:', error);
    throw new ApiError(500, 'Failed to fetch store analytics');
  }
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
    const product = req.body;
    console.log(`New product created in ${shopDomain}:`, product.title);
    
    // Update store's product count
    const store = await Store.findOne({ shopDomain, isActive: true });
    if (store) {
      store.analytics.totalProducts += 1;
      store.analytics.lastUpdated = new Date();
      await store.save();
    }

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
    const product = req.body;
    console.log(`Product updated in ${shopDomain}:`, product.title);
    
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
    const product = req.body;
    console.log(`Product deleted in ${shopDomain}:`, product.title);
    
    // Update store's product count
    const store = await Store.findOne({ shopDomain, isActive: true });
    if (store) {
      store.analytics.totalProducts = Math.max(0, store.analytics.totalProducts - 1);
      store.analytics.lastUpdated = new Date();
      await store.save();
    }

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
};
