import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency';

const ProductPreview = ({ formData }) => {
  const { product = {}, variants = [], media = [], storeMappings = [] } = formData;
  
  // Get main image
  const mainImage = media.find(m => m.position === 1) || media[0];
  
  // Get price range
  const getPriceRange = () => {
    if (!variants.length) return null;
    
    const prices = variants.map(v => parseFloat(v.price || 0)).filter(p => p > 0);
    if (!prices.length) return null;
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    if (min === max) {
      return formatCurrency(min);
    }
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  const priceRange = getPriceRange();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Preview</h3>
        <p className="text-sm text-gray-500">
          This is how your product will appear to customers
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage.preview}
              alt={mainImage.alt || product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">No image</p>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Product Title */}
          <h4 className="font-semibold text-gray-900 mb-2">
            {product.title || 'Product Title'}
          </h4>

          {/* Price */}
          {priceRange && (
            <div className="mb-3">
              <span className="text-lg font-bold text-gray-900">
                {priceRange}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-2 mb-4">
              {product.options.map((option, index) => (
                <div key={index}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {option.values && option.values.map((value, valueIndex) => (
                      <Badge 
                        key={valueIndex} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {value.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant Count */}
          {variants.length > 0 && (
            <div className="text-sm text-gray-500 mb-3">
              {variants.length} variant{variants.length !== 1 ? 's' : ''} available
            </div>
          )}

          {/* Store Availability */}
          {storeMappings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Available in {storeMappings.length} store{storeMappings.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {product.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{product.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-gray-900">
              {media.length}
            </div>
            <div className="text-sm text-gray-500">Media Files</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-semibold text-gray-900">
              {variants.length}
            </div>
            <div className="text-sm text-gray-500">Variants</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export {ProductPreview};
