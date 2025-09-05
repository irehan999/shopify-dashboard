import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import { 
  useSyncToAllStores
} from '../../hooks/useProductApi.js';
import { useConnectedStores } from '@/features/shopify/hooks/useShopify.js';
import { ShoppingBagIcon, CogIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export const StorePushModal = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();
  const [isQuickPushing, setIsQuickPushing] = useState(false);
  
  const { data: stores = [], isLoading: storesLoading } = useConnectedStores();
  const syncToAllStores = useSyncToAllStores();

  const handleQuickPushAll = async () => {
    if (stores.length === 0) {
      toast.error('No connected stores available');
      return;
    }

    setIsQuickPushing(true);
    try {
      await syncToAllStores.mutateAsync(product.id);
      toast.success(`Product pushed to all ${stores.length} stores!`);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to push product');
    } finally {
      setIsQuickPushing(false);
    }
  };

  const handleAdvancedPush = () => {
    onClose();
    navigate(`/products/${product.id}/push`);
  };

  const isLoading = storesLoading || isQuickPushing || syncToAllStores.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Push Product to Stores">
      <div className="space-y-6">
        {/* Product Summary */}
        <div className="flex items-start space-x-4">
          {product.media?.[0] && (
            <img
              src={product.media[0].src || product.media[0].preview}
              alt={product.media[0].alt || product.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="font-medium text-gray-900">{product.title}</h3>
            <p className="text-sm text-gray-600">{product.vendor}</p>
          </div>
        </div>

        {/* Store Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-900">Connected Stores</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-600">Loading stores...</p>
          ) : stores.length === 0 ? (
            <p className="text-sm text-red-600">No connected stores available</p>
          ) : (
            <p className="text-sm text-gray-600">
              {stores.length} stores available for push
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Quick Push to All */}
          <Button
            onClick={handleQuickPushAll}
            disabled={isLoading || stores.length === 0}
            className="w-full"
            size="lg"
          >
            {isQuickPushing ? (
              'Pushing to All Stores...'
            ) : (
              `Quick Push to All Stores (${stores.length})`
            )}
          </Button>

          {/* Advanced Push */}
          <Button
            onClick={handleAdvancedPush}
            variant="outline"
            disabled={isLoading || stores.length === 0}
            className="w-full"
            size="lg"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Advanced Push (Select Stores & Collections)
          </Button>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <p>💡 <strong>Quick Push:</strong> Pushes to all connected stores immediately</p>
          <p>🔧 <strong>Advanced Push:</strong> Select specific stores and collections</p>
        </div>
      </div>
    </Modal>
  );
};
