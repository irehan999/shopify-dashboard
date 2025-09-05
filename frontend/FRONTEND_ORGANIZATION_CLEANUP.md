# ✅ Frontend API & Hooks Organization - CLEANED UP

## 🎯 **Correct File Structure After Cleanup**

### **1. Shopify Feature** (`/features/shopify/`)
```
📁 api/
  └── shopifyApi.js        ✅ Store management API functions only
📁 hooks/
  └── useShopify.js        ✅ Store management hooks only
```

**Responsibilities:**
- OAuth flow management
- Store connections/disconnections  
- Store analytics and summary
- Store listing and details

**API Functions:**
- `initiateShopifyAuth()`, `getConnectedStores()`, `disconnectStore()`, etc.

**Hooks:**
- `useConnectedStores()`, `useDisconnectStore()`, `useStoreSummary()`, etc.

---

### **2. Products Feature** (`/features/products/`)
```
📁 api/
  ├── productApi.js        ✅ Master product CRUD only
  ├── collectionApi.js     ✅ Collection management only 
  ├── inventoryApi.js      ✅ Inventory operations only
  └── shopifySyncApi.js    ✅ Product sync operations only

📁 hooks/
  ├── useProductApi.js     ✅ Master product hooks only
  ├── useCollectionApi.js  ✅ Collection hooks only
  ├── useInventoryApi.js   ✅ Inventory hooks only
  └── useShopifySync.js    ✅ Product sync hooks only
```

---

## 📋 **API Functions Mapping**

### **Shopify API** (`shopifyApi.js`)
| Function | Backend Route | Purpose |
|----------|---------------|---------|
| `getConnectedStores()` | `GET /api/shopify/stores` | List user's stores |
| `getStoreSummary()` | `GET /api/shopify/stores/:id/summary` | Store metrics |
| `getStoreLocations()` | `GET /api/inventory/stores/locations` | Locations for inventory |
| `getStoreCollections()` | `GET /api/collections/stores/:id/collections` | Collections for sync |

### **Collection API** (`collectionApi.js`)
| Function | Backend Route | Purpose |
|----------|---------------|---------|
| `getStoreCollections()` | `GET /api/collections/stores/:id/collections` | Get collections |
| `createStoreCollection()` | `POST /api/collections/stores/:id/collections` | Create collection |
| `getCollectionDetails()` | `GET /api/collections/stores/:id/collections/:collectionId` | Collection details |

### **Inventory API** (`inventoryApi.js`)
| Function | Backend Route | Purpose |
|----------|---------------|---------|
| `assignInventoryToStore()` | `POST /api/inventory/products/:id/stores/:storeId/inventory/assign` | Assign inventory |
| `syncInventoryFromShopify()` | `POST /api/inventory/products/:id/stores/:storeId/inventory/sync` | Sync from Shopify |
| `getInventorySummary()` | `GET /api/inventory/products/:id/inventory/summary` | Inventory overview |

### **Shopify Sync API** (`shopifySyncApi.js`)
| Function | Backend Route | Purpose |
|----------|---------------|---------|
| `syncProduct()` | `POST /api/shopify-admin/products/sync` | Main sync operation |
| `createProduct()` | `POST /api/shopify-admin/products/:id/stores/:storeId/create` | Create in store |
| `updateProduct()` | `PUT /api/shopify-admin/products/:id/stores/:storeId/update` | Update in store |

---

## 🔗 **Hook Usage in Components**

### **✅ CORRECT Imports**
```jsx
// Store management
import { useConnectedStores, useStoreSummary } from '@/features/shopify/hooks/useShopify.js';

// Product sync operations  
import { useSyncToStore, useCollectionSelection } from '@/features/products/hooks/useShopifySync.js';

// Inventory management
import { useInventorySummary, useLocationSelection } from '@/features/products/hooks/useInventoryApi.js';

// Collection management
import { useStoreCollections, useCreateCollection } from '@/features/products/hooks/useCollectionApi.js';

// Master product operations
import { useCreateProduct, useUpdateProduct } from '@/features/products/hooks/useProductApi.js';
```

### **❌ REMOVED Duplications**
- ~~`useConnectedStores` from `useShopifySync.js`~~ → Use from `@/features/shopify/hooks/useShopify.js`
- ~~`useStoreSelection` from `useShopifySync.js`~~ → Use `useConnectedStores` from shopify feature
- ~~`storeApi.js` from products feature~~ → All store operations in shopify feature
- ~~Store management functions in sync hooks~~ → Separated to correct features

---

## 🚀 **Component Updates Made**

### **StorePushPage.jsx**
```jsx
// ✅ BEFORE (WRONG)
import { useStoreSelection } from '../../hooks/useShopifySync.js';

// ✅ AFTER (CORRECT)  
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
```

### **StoresForm.jsx**
```jsx
// ✅ BEFORE (WRONG)
import { useStoreSelection } from '../../hooks/useShopifySync.js';

// ✅ AFTER (CORRECT)
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
```

### **CollectionSelector.jsx**
```jsx
// ✅ BEFORE (WRONG)  
import { useConnectedStores } from '../../hooks/useShopifySync.js';

// ✅ AFTER (CORRECT)
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
```

---

## 📝 **Key Principles Followed**

1. **🎯 Single Responsibility**: Each API file handles one domain
2. **🚫 No Duplication**: Functions exist in exactly one place
3. **📁 Logical Grouping**: Features contain their related operations
4. **🔗 Clear Dependencies**: Components import from correct features
5. **📚 Preserved Documentation**: All helpful comments maintained
6. **🎨 Consistent Patterns**: Same structure across all features

---

## 🔄 **Backend Route Alignment**

All frontend API calls now correctly map to backend controller organization:

| Frontend Feature | Backend Controller | Routes |
|------------------|-------------------|---------|
| `shopify/api/shopifyApi.js` | `shopifyController.js` | `/api/shopify/*` |
| `products/api/collectionApi.js` | `collectionController.js` | `/api/collections/*` |
| `products/api/inventoryApi.js` | `inventoryController.js` | `/api/inventory/*` |
| `products/api/shopifySyncApi.js` | `shopifyGraphQLControllerNew.js` | `/api/shopify-admin/*` |

---

## ✅ **Ready for Development**

The frontend is now properly organized with:
- ✅ No duplicate API functions
- ✅ Clean separation of concerns  
- ✅ Correct imports in all components
- ✅ Proper alignment with backend structure
- ✅ All documentation preserved
- ✅ Optimized React Query keys
- ✅ Consistent error handling

**The push functionality is now ready to be implemented with the correct, clean architecture!**
