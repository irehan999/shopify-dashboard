# 🎯 Product Creation & Push Flow Mapping

## 📋 Overview
Complete mapping of product creation and push functionality with component connections, hooks, API calls, routes, and controller interactions.

## 🔄 Product Creation Flow

### 🎪 Main Entry Points
```
📍 Route: /products/create
📄 Page: ProductCreate.jsx
🧩 Component: ProductCreator.jsx
```

### 🏗️ Component Hierarchy
```
ProductCreate.jsx (Page)
└── ProductCreator.jsx (Main Component)
    ├── StepIndicator.jsx (Step Navigation)
    ├── BasicInfoForm.jsx (Step 1)
    ├── OptionsForm.jsx (Step 2) 
    ├── VariantsForm.jsx (Step 3)
    ├── MediaForm.jsx (Step 4)
    └── ActionBar.jsx (Navigation Controls)
```

### 🎣 Hooks Used
```
📁 useProductForm.js
├── Form state management
├── Step validation
├── Multi-step navigation
└── Form validation rules

📁 useProductApi.js  
├── useCreateProduct() 
└── API: POST /api/products
```

### 🔗 API Flow
```
Frontend Hook → API Call → Backend Route → Controller
useCreateProduct() → POST /api/products → productRoutes.js → productController.createProduct()
```

### 🎛️ Controller Details
```javascript
// File: backend/src/controllers/productController.js
createProduct(req, res) {
  1. Validates product data
  2. Creates Product document in MongoDB
  3. Creates variants array
  4. Uploads media to Cloudinary (if present)
  5. Returns created product with ID
  6. NO store sync (dashboard only)
}
```

### 🚦 Navigation Flow
```
Step 1: Basic Info → Next → Step 2: Options
Step 2: Options → Next → Step 3: Variants  
Step 3: Variants → Next → Step 4: Media
Step 4: Media → Submit → Product Created → Redirect to /products
```

## 🚀 Product Push Flow

### 🎪 Main Entry Points
```
📍 Route: /products/:id/push
📄 Page: StorePushPageWrapper.jsx
🧩 Component: StorePushPage.jsx
```

### 🏗️ Component Hierarchy
```
StorePushPageWrapper.jsx (Page Wrapper)
└── StorePushPage.jsx (Main Component)
    ├── StoreSelector.jsx (Store Selection)
    ├── CollectionSelector.jsx (Collection Assignment)
    ├── PushProgress.jsx (Sync Progress)
    └── Back Navigation (→ /products/:id)
```

### 🎣 Hooks Used
```
📁 useShopifySync.js
├── useSyncToMultipleStores() 
└── API: POST /api/shopify-admin/sync-to-multiple-stores

📁 useShopify.js (Shopify feature)
├── useConnectedStores()
└── API: GET /api/shopify/stores

📁 useCollectionApi.js (Products feature) 
├── useCollectionSelection()
└── API: GET /api/collections/store/:storeId

📁 useInventoryApi.js (Products feature)
├── useLocationSelection() 
└── API: GET /api/inventory/locations
```

### 🔗 API Flow Chain
```
1. Store Selection:
   useConnectedStores() → GET /api/shopify/stores → shopifyController.getConnectedStores()

2. Collection Loading:
   useCollectionSelection() → GET /api/collections/store/:storeId → collectionController.getCollectionsByStore()

3. Location Loading:
   useLocationSelection() → GET /api/inventory/locations → inventoryController.getStoreLocations()

4. Product Push:
   useSyncToMultipleStores() → POST /api/shopify-admin/sync-to-multiple-stores → shopifyGraphQLControllerNew.syncToMultipleStores()
```

### 🎛️ Controller Details
```javascript
// File: backend/src/controllers/shopifyGraphQLControllerNew.js
syncToMultipleStores(req, res) {
  1. Validates productId and storeIds
  2. Gets product from MongoDB  
  3. For each store:
     a. Creates/updates Shopify product via GraphQL
     b. Creates ProductMap document
     c. Assigns to collections (if specified)
     d. Sets inventory locations (if specified)
  4. Returns sync results array
}

// File: backend/src/controllers/shopifyController.js  
getConnectedStores(req, res) {
  1. Fetches user's connected Shopify stores
  2. Returns store list with OAuth status
}

// File: backend/src/controllers/collectionController.js
getCollectionsByStore(req, res) {
  1. Fetches collections for specific store
  2. Returns collection list with IDs and names
}

// File: backend/src/controllers/inventoryController.js
getStoreLocations(req, res) {
  1. Fetches Shopify locations for inventory
  2. Returns location list with IDs and addresses
}
```

## 🔄 Complete User Journey

### 📝 Product Creation Journey
```
1. User: Navigate to /products/create
2. System: Load ProductCreate.jsx → ProductCreator.jsx
3. User: Fill Step 1 (Basic Info) → Next
4. User: Fill Step 2 (Options) → Next  
5. User: Fill Step 3 (Variants) → Next
6. User: Fill Step 4 (Media) → Submit
7. System: useCreateProduct() → POST /api/products → productController.createProduct()
8. Database: Product saved to MongoDB
9. System: Redirect to /products (product catalog)
10. User: Can see new product in catalog
```

### 🚀 Product Push Journey  
```
1. User: Click "Push to Stores" from product detail
2. System: Navigate to /products/:id/push
3. System: Load StorePushPageWrapper.jsx → StorePushPage.jsx
4. System: Auto-load stores (useConnectedStores)
5. User: Select target stores
6. System: Load collections for selected stores (useCollectionSelection)
7. System: Load inventory locations (useLocationSelection)
8. User: Configure collections and inventory (optional)
9. User: Click "Push to Stores"
10. System: useSyncToMultipleStores() → POST /api/shopify-admin/sync-to-multiple-stores
11. Controller: syncToMultipleStores() processes each store
12. Shopify: Product created/updated via GraphQL API
13. Database: ProductMap documents created
14. System: Show progress → Success message
15. System: Auto-redirect to /products/:id (product detail)
```

## 🔗 Component Interconnections

### 📊 Data Flow
```
ProductCreator.jsx
├── Uses: useProductForm() for state
├── Uses: useCreateProduct() for API
├── Children: BasicInfoForm, OptionsForm, VariantsForm, MediaForm
└── Navigation: ActionBar (Previous/Next/Submit)

StorePushPage.jsx  
├── Uses: useConnectedStores() for store list
├── Uses: useCollectionSelection() for collections
├── Uses: useLocationSelection() for inventory
├── Uses: useSyncToMultipleStores() for push action
├── Children: StoreSelector, CollectionSelector, PushProgress
└── Navigation: Back to /products/:id
```

### 🎯 Hook Responsibilities
```
📁 useProductForm.js (Form Management)
└── Multi-step form state, validation, navigation

📁 useProductApi.js (Products CRUD)  
└── Create, read, update, delete products in dashboard

📁 useShopifySync.js (Sync Operations)
└── Push products to Shopify stores, sync status

📁 useShopify.js (Store Management)
└── Connected stores, store auth, store metadata

📁 useCollectionApi.js (Collection Management)
└── Store collections, collection assignment

📁 useInventoryApi.js (Inventory Management)  
└── Store locations, inventory assignment, tracking
```

## 🚨 Current Issues Analysis

### ✅ Working Correctly
- ✅ Product creation flow (all 4 steps working)
- ✅ Store push navigation and back button
- ✅ Collection selection per store
- ✅ Inventory management integration 
- ✅ Hook separation (no cross-contamination)
- ✅ API routing and controller separation
- ✅ Proper import statements across components

### ⚠️ Potential Issues to Verify

#### 1. 📍 Main.jsx Routing Links
```javascript
// Current routes in main.jsx:
✅ /products/create → ProductCreate.jsx 
✅ /products/:id/push → StorePushPageWrapper.jsx
✅ /products/:id → ProductDetail.jsx

// Need to verify back navigation works:
🔍 ProductCreator → Should have way back to /products
🔍 StorePushPage → Has back to /products/:id ✅
```

#### 2. 🎨 Theme Switching Issues
```javascript
// ThemeProvider.jsx implementation looks correct
// But user reports glitches - need to check:
🔍 CSS variable consistency
🔍 Theme class application timing
🔍 localStorage synchronization
```

### 🔧 Inventory Backend Alignment
The inventory hooks expect these backend endpoints:
```
✅ GET /api/inventory/locations → inventoryController.getStoreLocations() ✅
✅ POST /api/inventory/assign/:productId/:storeId → inventoryController.assignInventoryToStore() ✅ 
✅ POST /api/inventory/sync/:productId/:storeId → inventoryController.syncInventoryFromShopify() ✅
✅ GET /api/inventory/summary/:productId → inventoryController.getInventorySummary() ✅
✅ GET /api/inventory/history/:productId/:storeId → inventoryController.getInventoryHistory() ✅
```

**✅ VERIFICATION: All inventory hooks are correctly aligned with backend expectations!**

## 🎯 Next Steps for Testing

### 1. Add Missing Back Navigation
- Add back button in ProductCreator to return to /products

### 2. Fix Theme Switching
- Investigate theme glitches
- Ensure CSS variables are properly defined
- Fix timing issues in theme application

### 3. Verify Complete Flow
- Test product creation → push → inventory management
- Ensure all redirects work correctly
- Verify error handling in all components

## 📈 Performance Notes
- All hooks use React Query for caching
- Store/collection data cached for 10 minutes
- Inventory data cached for 2-5 minutes
- Background refetching enabled for fresh data
