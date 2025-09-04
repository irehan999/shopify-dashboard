# Backend Controller Organization Guide

## 🎯 Active Controller Structure

### ✅ **shopifyController.js** (OAuth & Store Management)
**Responsibilities:**
- OAuth flow (initiate, callback, token exchange)
- Store connection/disconnection management
- Store analytics and summary
- Webhook handling (app lifecycle, products, orders)
- Session validation and management

**Active Routes:**
- `GET /api/shopify/auth` - Initiate OAuth
- `GET /api/shopify/callback` - OAuth callback
- `POST /api/shopify/token-exchange` - Exchange session token
- `GET /api/shopify/stores` - Get connected stores
- `DELETE /api/shopify/stores/:storeId` - Disconnect store
- `GET /api/shopify/stores/:storeId/analytics` - Store analytics
- `GET /api/shopify/stores/:storeId/summary` - Store summary **[NEW]**
- `POST /api/shopify/link-store` - Link store to user
- Webhook endpoints for app/product lifecycle

### ✅ **collectionController.js** (Collection Management)
**Responsibilities:**
- Store collection fetching and management
- Collection search and filtering
- Collection details and metadata

**Active Routes:**
- `GET /api/collections/stores/:storeId/collections` - Get store collections
- `GET /api/collections/stores/:storeId/collections/:collectionId` - Collection details
- `POST /api/collections/stores/:storeId/collections` - Create collection
- Collection search and management endpoints

**Key Function:**
- `getStoreCollections()` - Already implemented for dynamic collection fetching

### ✅ **inventoryController.js** (Inventory Management)
**Responsibilities:**
- Inventory assignment between master products and stores
- Inventory synchronization from Shopify
- Store location management **[CONSOLIDATED]**
- Inventory tracking and history

**Active Routes:**
- `GET /api/inventory/stores/locations` - Get store locations **[MOVED FROM shopifyStoreController]**
- `POST /api/inventory/products/:productId/stores/:storeId/inventory/assign` - Assign inventory
- `POST /api/inventory/products/:productId/stores/:storeId/inventory/sync` - Sync from Shopify
- `GET /api/inventory/products/:productId/inventory/summary` - Inventory summary
- `GET /api/inventory/products/:productId/stores/:storeId/inventory/history` - Inventory history

**Key Function:**
- `getStoreLocations()` - Moved from shopifyStoreController for inventory-specific operations

### ✅ **shopifyGraphQLControllerNew.js** (Product Sync Operations)
**Responsibilities:**
- ProductSet mutation operations (create/update products)
- Collection assignment during sync
- Inventory location assignment
- GraphQL Admin API interactions

**Active Routes:**
- `POST /api/shopify-admin/products/sync` - Sync product with collections and inventory
- GraphQL product operations with enhanced collection/inventory support

## 🗑️ **Removed/Consolidated Files**

### ❌ **shopifyStoreController.js** (DELETED)
**Reason:** Duplicate functionality consolidated into existing controllers
- `getStoreLocations()` → Moved to **inventoryController.js**
- `getStoreCollections()` → Already exists in **collectionController.js**
- `getStoreSummary()` → Moved to **shopifyController.js**

## 📋 **Route Configuration (app.js)**

```javascript
// Active route mappings
app.use('/api/shopify', shopifyRoutes);           // OAuth, stores, webhooks
app.use('/api/collections', collectionRoutes);    // Collection management
app.use('/api/inventory', inventoryRoutes);       // Inventory & locations
app.use('/api/shopify-admin', shopifyGraphQLRoutes); // Product sync operations
```

## 🔄 **ProductMap Sync Settings Usage**

The `ProductMap` model contains several sync settings that control how products are managed:

### **Sync Settings Schema:**
```javascript
syncSettings: {
  autoSync: Boolean,           // Auto-sync changes to Shopify
  syncFrequency: String,       // 'manual', 'hourly', 'daily'
  conflictResolution: String,  // 'shopify_wins', 'dashboard_wins', 'manual'
  lastSyncDirection: String,   // 'to_shopify', 'from_shopify'
  allowInventorySync: Boolean, // Enable inventory synchronization
  allowPriceSync: Boolean,     // Enable price synchronization
  allowDescriptionSync: Boolean // Enable description synchronization
}
```

### **Where They're Used:**

1. **executeSyncProduct()** - Uses `autoSync` and sync preferences to determine behavior
2. **Inventory Assignment** - `allowInventorySync` controls whether inventory changes sync
3. **Price Updates** - `allowPriceSync` determines if price changes propagate
4. **Conflict Resolution** - `conflictResolution` handles data conflicts during sync
5. **Sync History** - `lastSyncDirection` tracks sync flow for audit trails

### **Frontend Integration:**
- Settings displayed in product sync configuration UI
- Used to show sync status and control sync behavior
- Allows users to configure per-product sync preferences

## 🎯 **Integration Guidelines**

### **For Frontend Development:**
1. Use `/api/shopify/stores/:storeId/summary` for store overview data
2. Use `/api/inventory/stores/locations` for location selection
3. Use `/api/collections/stores/:storeId/collections` for collection management
4. Use `/api/shopify-admin/products/sync` for product operations

### **Authentication Requirements:**
- All routes require JWT authentication except OAuth callbacks and webhooks
- Store-specific operations validate store ownership through user ID
- Shopify session validation for GraphQL operations

### **Error Handling:**
- All controllers use standardized `ApiError` and `ApiResponse` classes
- Comprehensive error logging and user-friendly error messages
- Proper HTTP status codes for all scenarios

## 📝 **Notes for Development:**

1. **No Duplicate Functionality** - Each controller has clearly defined responsibilities
2. **Session Management** - Shopify sessions handled through `shopifyController.js`
3. **Inventory Focus** - All inventory-related operations centralized in `inventoryController.js`
4. **Collection Focus** - All collection operations in `collectionController.js`
5. **Clean Separation** - OAuth, product sync, collections, and inventory are clearly separated

This organization provides a clean, maintainable structure for frontend integration and future development.
