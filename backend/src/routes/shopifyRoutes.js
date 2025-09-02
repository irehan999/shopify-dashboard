import express from 'express';
import { 
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
} from '../controllers/shopifyController.js';
import { authenticateUser as verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Middleware to capture raw body for webhook verification
const captureRawBody = (req, res, next) => {
  if (req.path.startsWith('/webhooks/')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

router.use(captureRawBody);

// OAuth flow routes
router.post('/auth', verifyJWT, initiateAuth);
router.get('/callback', handleCallback);

// Store management routes (all require authentication)
router.get('/stores', verifyJWT, getConnectedStores);
router.delete('/stores/:storeId', verifyJWT, disconnectStore);
router.get('/stores/:storeId/analytics', verifyJWT, getStoreAnalytics);

// Session validation endpoint
router.get('/session/validate', validateSession, (req, res) => {
  res.json({ valid: true, shop: req.session.shop });
});


// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

// Webhook endpoints (no auth required, but HMAC verified in controller)
// App lifecycle webhooks
router.post('/webhooks/app/uninstalled', handleAppUninstalled);

// Product webhooks
router.post('/webhooks/products/create', handleProductCreate);
router.post('/webhooks/products/update', handleProductUpdate);
router.post('/webhooks/products/delete', handleProductDelete);

// Order webhooks
router.post('/webhooks/orders/create', handleOrderCreate);
router.post('/webhooks/orders/update', handleOrderUpdate);

export default router;
