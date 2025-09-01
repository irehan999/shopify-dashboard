# Shopify Multi-Store Dashboard - Complete API Reference

This document provides a comprehensive reference for all Shopify GraphQL Admin API mutations and queries required for our multi-store dashboard project. All models have been analyzed and optimized for production use.

## Model Analysis Summary

### ✅ Product Model (OPTIMIZED)
**Status**: Production-ready
**Fields**: Only includes mutation-required fields
- Basic product data (title, description, vendor, handle, etc.)
- Product options and variant data for mutations
- Methods: `toShopifyProductInput()`, `toShopifyVariantInput()`, `toShopifyMediaInput()`

### ✅ Collection Model (OPTIMIZED) 
**Status**: Production-ready
**Fields**: Supports both smart and manual collections
- Collection metadata and rules
- Smart collection rule schema with proper validation
- Methods: `toShopifyCollectionInput()`, rule conversion utilities

### ✅ ProductMap Model (VERIFIED)
**Status**: Production-ready for multi-store sync
**Purpose**: Maps dashboard products to store-specific Shopify instances
**Key Features**:
- Comprehensive store mapping with sync settings
- Variant and media mapping between dashboard and store products
- Sync history tracking with timestamps and status
- Price adjustments and store-specific customizations
- Error handling and retry mechanisms
- Bulk sync operations support

### ✅ User Model (VERIFIED)
**Status**: Production-ready for authentication
**Purpose**: User management and authentication
**Key Features**:
- JWT token-based authentication with bcrypt password hashing
- User preferences and role management
- Profile management with avatar support
- Session tracking and security features
- Dashboard-specific user settings

### ✅ Store Model (VERIFIED)
**Status**: Production-ready for store connections
**Purpose**: Shopify store connection and configuration management
**Key Features**:
- Secure access token storage with encryption
- Store metadata and configuration management
- Webhook endpoint management and verification
- Store features and limits tracking
- Dashboard settings and preferences
- Connection health monitoring

## Required Mutations

### Product Management

#### 1. productCreate
**Purpose**: Create a new product
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
  productCreate(input: $input, media: $media) {
    product {
      id
      title
      handle
      options {
        id
        name
        values
        optionValues {
          id
          name
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

**Input Fields**:
- `title` (String): Product title
- `descriptionHtml` (String): Product description in HTML
- `vendor` (String): Product vendor
- `productType` (String): Product type
- `tags` ([String]): Product tags
- `productOptions` ([ProductOptionInput]): Product options (Color, Size, etc.)
- `metafields` ([MetafieldInput]): Custom metafields
- `seo` (SEOInput): SEO settings

#### 2. productUpdate
**Purpose**: Update existing product
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
      updatedAt
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 3. productVariantsBulkCreate
**Purpose**: Create multiple variants for a product
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkCreate(productId: $productId, variants: $variants) {
    product {
      id
    }
    productVariants {
      id
      title
      price
      sku
      optionValues {
        id
        name
        optionName
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

**Variant Input Fields**:
- `price` (Money): Variant price
- `compareAtPrice` (Money): Compare at price
- `sku` (String): SKU
- `barcode` (String): Barcode
- `inventoryItem` (InventoryItemInput): Inventory settings
- `optionValues` ([OptionValueInput]): Option value assignments
- `metafields` ([MetafieldInput]): Variant metafields

#### 4. productVariantsBulkUpdate
**Purpose**: Update multiple variants
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants {
      id
      title
      price
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 5. productVariantsBulkDelete
**Purpose**: Delete multiple variants
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productVariantsBulkDelete($productId: ID!, $variantsIds: [ID!]!) {
  productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
    product {
      id
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 6. productOptionsCreate
**Purpose**: Create product options
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productOptionsCreate($productId: ID!, $options: [OptionCreateInput!]!) {
  productOptionsCreate(productId: $productId, options: $options) {
    product {
      id
      options {
        id
        name
        values
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 7. productOptionUpdate
**Purpose**: Update existing product option
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productOptionUpdate($productId: ID!, $option: OptionUpdateInput!) {
  productOptionUpdate(productId: $productId, option: $option) {
    product {
      id
      options {
        id
        name
        optionValues {
          id
          name
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 8. productOptionsDelete
**Purpose**: Delete product options
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productOptionsDelete($productId: ID!, $optionsIds: [ID!]!) {
  productOptionsDelete(productId: $productId, optionsIds: $optionsIds) {
    product {
      id
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 9. productSet (Advanced)
**Purpose**: Comprehensive product sync from external source
**API Version**: 2025-07
**Required Scope**: `write_products`
**Use Case**: Database sync workflow

```graphql
mutation productSet($input: ProductSetInput!) {
  productSet(input: $input) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
```

### Media Management

#### 10. fileCreate
**Purpose**: Upload media files (images, videos, 3D models)
**API Version**: 2025-07
**Required Scope**: `write_files`

```graphql
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files {
      id
      alt
      createdAt
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 11. productCreateMedia
**Purpose**: Associate media with products
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media {
      id
      alt
      mediaContentType
    }
    userErrors {
      field
      message
    }
  }
}
```

### Collection Management

#### 12. collectionCreate
**Purpose**: Create manual or smart collections
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation collectionCreate($input: CollectionInput!) {
  collectionCreate(input: $input) {
    collection {
      id
      title
      handle
      ruleSet {
        appliedDisjunctively
        rules {
          column
          relation
          condition
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
```

**Collection Input Fields**:
- `title` (String): Collection title
- `descriptionHtml` (String): Collection description
- `handle` (String): URL handle
- `products` ([ID]): Manual collection products
- `ruleSet` (CollectionRuleSetInput): Smart collection rules
- `sortOrder` (CollectionSortOrder): Product sorting
- `seo` (SEOInput): SEO settings

#### 13. collectionUpdate
**Purpose**: Update existing collection
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation collectionUpdate($input: CollectionInput!) {
  collectionUpdate(input: $input) {
    collection {
      id
      title
      updatedAt
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 14. collectionAddProducts
**Purpose**: Add products to manual collection
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
  collectionAddProducts(id: $id, productIds: $productIds) {
    collection {
      id
      productsCount
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 15. collectionRemoveProducts
**Purpose**: Remove products from manual collection
**API Version**: 2025-07
**Required Scope**: `write_products`

```graphql
mutation collectionRemoveProducts($id: ID!, $productIds: [ID!]!) {
  collectionRemoveProducts(id: $id, productIds: $productIds) {
    job {
      id
      done
    }
    userErrors {
      field
      message
    }
  }
}
```

### Publishing Management

#### 16. publishablePublish
**Purpose**: Publish products/collections to sales channels
**API Version**: 2025-07
**Required Scope**: `write_publications`

```graphql
mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
  publishablePublish(id: $id, input: $input) {
    publishable {
      publishedOnCurrentPublication
    }
    userErrors {
      field
      message
    }
  }
}
```

#### 17. publishableUnpublish
**Purpose**: Unpublish products/collections from sales channels
**API Version**: 2025-07
**Required Scope**: `write_publications`

```graphql
mutation publishableUnpublish($id: ID!, $input: [PublicationInput!]!) {
  publishableUnpublish(id: $id, input: $input) {
    publishable {
      publishedOnCurrentPublication
    }
    userErrors {
      field
      message
    }
  }
}
```

## Required Queries

### Product Queries

#### 1. products
**Purpose**: Retrieve product listings with pagination
**API Version**: 2025-07
**Required Scope**: `read_products`

```graphql
query products($first: Int, $after: String, $query: String) {
  products(first: $first, after: $after, query: $query) {
    edges {
      node {
        id
        title
        handle
        status
        createdAt
        updatedAt
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
              sku
            }
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

#### 2. product
**Purpose**: Retrieve single product with full details
**API Version**: 2025-07
**Required Scope**: `read_products`

```graphql
query product($id: ID!) {
  product(id: $id) {
    id
    title
    descriptionHtml
    handle
    vendor
    productType
    tags
    status
    options {
      id
      name
      values
      optionValues {
        id
        name
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          price
          compareAtPrice
          sku
          barcode
          inventoryQuantity
          selectedOptions {
            name
            value
          }
        }
      }
    }
    media(first: 250) {
      edges {
        node {
          id
          alt
          mediaContentType
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
}
```

### Collection Queries

#### 3. collections
**Purpose**: Retrieve collection listings
**API Version**: 2025-07
**Required Scope**: `read_products`

```graphql
query collections($first: Int, $after: String, $query: String) {
  collections(first: $first, after: $after, query: $query) {
    edges {
      node {
        id
        title
        handle
        updatedAt
        productsCount
        ruleSet {
          appliedDisjunctively
          rules {
            column
            relation
            condition
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

#### 4. collection
**Purpose**: Retrieve single collection with products
**API Version**: 2025-07
**Required Scope**: `read_products`

```graphql
query collection($id: ID!) {
  collection(id: $id) {
    id
    title
    descriptionHtml
    handle
    sortOrder
    ruleSet {
      appliedDisjunctively
      rules {
        column
        relation
        condition
        conditionObjectId
      }
    }
    products(first: 250) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
}
```

### Shop Information

#### 5. shop
**Purpose**: Retrieve shop details and limits
**API Version**: 2025-07
**Required Scope**: `read_products`

```graphql
query shop {
  shop {
    id
    name
    email
    domain
    currencyCode
    resourceLimits {
      maxProductVariants
      maxProductOptions
    }
    plan {
      displayName
      partnerDevelopment
      shopifyPlus
    }
  }
}
```

## Collection Rule Schema

For smart collections, use these rule configurations:

### Rule Columns
- `TITLE` - Product title
- `TYPE` - Product type
- `VENDOR` - Product vendor
- `TAG` - Product tags
- `VARIANT_PRICE` - Variant price
- `VARIANT_COMPARE_AT_PRICE` - Compare at price
- `VARIANT_WEIGHT` - Variant weight
- `VARIANT_INVENTORY` - Inventory quantity
- `VARIANT_TITLE` - Variant title
- `PRODUCT_METAFIELD_DEFINITION` - Product metafields
- `VARIANT_METAFIELD_DEFINITION` - Variant metafields

### Rule Relations
- `EQUALS` - Exact match
- `NOT_EQUALS` - Not equal
- `GREATER_THAN` - Greater than (numbers)
- `LESS_THAN` - Less than (numbers)
- `STARTS_WITH` - Starts with (text)
- `ENDS_WITH` - Ends with (text)
- `CONTAINS` - Contains (text)
- `NOT_CONTAINS` - Does not contain (text)

## Implementation Priority

### Phase 1: Core Product Management
1. `productCreate` - Create dashboard products
2. `productVariantsBulkCreate` - Add variants to products
3. `productCreateMedia` - Upload and associate media
4. `product` query - Retrieve product details

### Phase 2: Multi-Store Sync
1. `productSet` - Sync products to stores (database workflow)
2. `productUpdate` - Update existing store products
3. `productVariantsBulkUpdate` - Update store variants
4. `products` query - List store products for mapping

### Phase 3: Collection Management
1. `collectionCreate` - Create collections
2. `collectionAddProducts` - Manage manual collections
3. `collectionUpdate` - Update smart collection rules
4. `collections` query - List collections

### Phase 4: Publishing & Media
1. `publishablePublish` - Publish to sales channels
2. `fileCreate` - Advanced media upload
3. `productOptionsCreate` - Dynamic option management

## Error Handling Best Practices

1. **Rate Limiting**: Implement exponential backoff for rate limit errors
2. **Validation**: Validate all input data before API calls
3. **Partial Failures**: Handle bulk operation partial failures
4. **Retries**: Implement retry logic for transient errors
5. **Logging**: Log all API responses for debugging

## Security Considerations

1. **Access Tokens**: Store tokens securely with encryption
2. **Scopes**: Request minimal required scopes
3. **Webhooks**: Verify webhook signatures
4. **Audit Trail**: Log all mutations for audit purposes

This documentation serves as the complete reference for implementing the Shopify multi-store dashboard with all verified models and API endpoints.
