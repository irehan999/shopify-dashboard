import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  ShareIcon,
  TagIcon,
  CubeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

/**
 * Simple Product Detail Component
 * For products that are NOT connected to any Shopify stores
 * Shows basic product information without store management features
 */
export const SimpleProductDetail = ({ product, onEdit, onPushToStores }) => {
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600">Product Details</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
          <Button onClick={onPushToStores}>
            <ShareIcon className="h-4 w-4 mr-2" />
            Push to Stores
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Product Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.media && product.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.media.map((media, index) => (
                    <div key={media.id || index} className="aspect-square">
                      <img
                        src={media.src || media.preview}
                        alt={media.alt || `Product image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No images uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {product.status || 'DRAFT'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Vendor</label>
                <p className="mt-1 text-sm text-gray-900">{product.vendor || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                <p className="mt-1 text-sm text-gray-900">{product.productType || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Tags</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No tags</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CubeIcon className="h-5 w-5 mr-2" />
                Variants ({product.variants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.variants && product.variants.length > 0 ? (
                <div className="space-y-3">
                  {product.variants.map((variant, index) => (
                    <div key={variant.id || index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {variant.title || `Variant ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {variant.sku || 'Not set'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatPrice(variant.price)}
                          </p>
                          {variant.compareAtPrice && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(variant.compareAtPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No variants created</p>
              )}
            </CardContent>
          </Card>

          {/* Store Connection Status */}
          <Card className="border-dashed border-gray-300">
            <CardContent className="text-center py-6">
              <ShareIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Not Connected to Stores</h3>
              <p className="text-sm text-gray-500 mb-4">
                This product hasn't been pushed to any Shopify stores yet.
              </p>
              <Button onClick={onPushToStores} size="sm">
                Push to Stores
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
