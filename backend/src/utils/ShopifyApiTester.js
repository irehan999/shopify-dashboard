/**
 * Test Shopify API Client Configuration
 * 
 * This file contains examples of how to use the ShopifyApiClient
 * Run this after setting up a valid Shopify session
 */

import ShopifyApiClient from './ShopifyApiClient.js';

// Example usage functions (for testing purposes)

/**
 * Example: Test API connection
 */
export const testShopifyConnection = async (session) => {
  try {
    console.log('🔍 Testing Shopify API connection...');
    
    const isConnected = await ShopifyApiClient.testConnection(session);
    
    if (isConnected) {
      console.log('✅ API connection successful!');
      return true;
    } else {
      console.log('❌ API connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return false;
  }
};

/**
 * Example: Fetch shop information
 */
export const getShopDetails = async (session) => {
  try {
    console.log('🏪 Fetching shop information...');
    
    const shop = await ShopifyApiClient.getShop(session);
    
    console.log('✅ Shop info retrieved:', {
      name: shop.shop?.name,
      domain: shop.shop?.domain,
      email: shop.shop?.email,
      plan: shop.shop?.plan_name
    });
    
    return shop;
  } catch (error) {
    console.error('❌ Error fetching shop info:', error.message);
    throw error;
  }
};

/**
 * Example: Fetch products with REST API
 */
export const getShopProducts = async (session, limit = 10) => {
  try {
    console.log(`📦 Fetching ${limit} products...`);
    
    const products = await ShopifyApiClient.getProducts(session, { limit });
    
    console.log(`✅ Retrieved ${products.products?.length || 0} products`);
    
    // Log first product details if available
    if (products.products && products.products.length > 0) {
      const firstProduct = products.products[0];
      console.log('First product:', {
        id: firstProduct.id,
        title: firstProduct.title,
        handle: firstProduct.handle,
        status: firstProduct.status
      });
    }
    
    return products;
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    throw error;
  }
};

/**
 * Example: Fetch products with GraphQL API
 */
export const getShopProductsGraphQL = async (session, first = 5) => {
  try {
    console.log(`📦 Fetching ${first} products via GraphQL...`);
    
    const response = await ShopifyApiClient.getProductsGraphQL(session, first);
    const products = response.data?.products?.edges || [];
    
    console.log(`✅ Retrieved ${products.length} products via GraphQL`);
    
    // Log first product details if available
    if (products.length > 0) {
      const firstProduct = products[0].node;
      console.log('First product (GraphQL):', {
        id: firstProduct.id,
        title: firstProduct.title,
        handle: firstProduct.handle,
        status: firstProduct.status
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching products via GraphQL:', error.message);
    throw error;
  }
};

/**
 * Example: Create a test product
 */
export const createTestProduct = async (session) => {
  try {
    console.log('🆕 Creating test product...');
    
    const productData = {
      title: `Test Product ${Date.now()}`,
      description: 'This is a test product created via API',
      vendor: 'Test Vendor',
      product_type: 'Test Type',
      status: 'draft',
      variants: [
        {
          title: 'Default Variant',
          price: '10.00',
          inventory_quantity: 100,
          sku: `TEST-SKU-${Date.now()}`
        }
      ]
    };
    
    const product = await ShopifyApiClient.createProduct(session, productData);
    
    console.log('✅ Test product created:', {
      id: product.product?.id,
      title: product.product?.title,
      status: product.product?.status
    });
    
    return product;
  } catch (error) {
    console.error('❌ Error creating test product:', error.message);
    throw error;
  }
};

/**
 * Example: Full API test suite
 */
export const runFullApiTest = async (session) => {
  console.log('🚀 Starting full Shopify API test suite...\n');
  
  try {
    // Test 1: Connection
    console.log('=== Test 1: Connection ===');
    const isConnected = await testShopifyConnection(session);
    if (!isConnected) {
      throw new Error('Connection test failed');
    }
    console.log('');
    
    // Test 2: Shop info
    console.log('=== Test 2: Shop Information ===');
    await getShopDetails(session);
    console.log('');
    
    // Test 3: Products (REST)
    console.log('=== Test 3: Products (REST API) ===');
    await getShopProducts(session, 5);
    console.log('');
    
    // Test 4: Products (GraphQL)
    console.log('=== Test 4: Products (GraphQL API) ===');
    await getShopProductsGraphQL(session, 3);
    console.log('');
    
    // Test 5: Create product (optional - only if write permissions)
    if (ShopifyApiClient.isValidSession(session, ['write_products'])) {
      console.log('=== Test 5: Create Test Product ===');
      await createTestProduct(session);
      console.log('');
    } else {
      console.log('=== Test 5: Skipped (No write permissions) ===\n');
    }
    
    console.log('🎉 All API tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('💥 API test suite failed:', error.message);
    return false;
  }
};

/**
 * Example session validation
 */
export const validateSessionExample = (session) => {
  console.log('🔍 Validating session...');
  
  const isValid = ShopifyApiClient.isValidSession(session);
  const hasReadProducts = ShopifyApiClient.isValidSession(session, ['read_products']);
  const hasWriteProducts = ShopifyApiClient.isValidSession(session, ['write_products']);
  
  console.log('Session validation results:', {
    isValid,
    hasReadProducts,
    hasWriteProducts,
    shop: session?.shop,
    scopes: session?.scope
  });
  
  return {
    isValid,
    hasReadProducts,
    hasWriteProducts
  };
};

// Export for use in controllers or test files
export default {
  testShopifyConnection,
  getShopDetails,
  getShopProducts,
  getShopProductsGraphQL,
  createTestProduct,
  runFullApiTest,
  validateSessionExample
};
