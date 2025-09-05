import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  BarChart3, 
  Target,
  MapPin,
  Zap,
  Settings
} from 'lucide-react';
import { useLiveInventoryAllocation, useRealTimeInventoryMonitor } from '../hooks/useInventoryApi.js';

/**
 * Live Inventory Allocation Dashboard
 * Sophisticated real-time inventory allocation system with live Shopify data
 */
const LiveInventoryAllocationDashboard = ({ 
  productId, 
  onAllocationChange,
  showRecommendations = true,
  compactMode = false 
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState('balanced');
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);

  // Use live inventory allocation hook
  const {
    liveInventory,
    realTimeData,
    isLoading,
    getRecommendations,
    isGeneratingRecommendations,
    recommendations,
    totalAvailableInventory,
    variantCount,
    locationCount
  } = useLiveInventoryAllocation(productId);

  // Real-time monitoring for dashboard updates
  const monitor = useRealTimeInventoryMonitor({
    productIds: [productId],
    refreshInterval: 30000,
    enableNotifications: true
  });

  // Generate recommendations
  const handleGetRecommendations = () => {
    getRecommendations(selectedStrategy);
  };

  // Format recommendation data for display
  const formattedRecommendations = useMemo(() => {
    if (!recommendations || recommendations.length === 0) return null;
    
    return recommendations[0]; // First product recommendations
  }, [recommendations]);

  // Get inventory alerts
  const inventoryAlerts = monitor.getInventoryAlerts();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600 dark:text-gray-300">Loading live inventory data...</span>
        </div>
      </div>
    );
  }

  if (!liveInventory) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          No live inventory data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-time Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Inventory Allocation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Real-time Shopify data • Updated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={monitor.forceRefresh}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
              title="Force refresh"
            >
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </button>
            
            <button
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
              title="Advanced controls"
            >
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </button>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Inventory</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalAvailableInventory.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Variants</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {variantCount}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Locations</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {locationCount}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Alerts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {inventoryAlerts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Controls */}
      <AnimatePresence>
        {showAdvancedControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Allocation Strategy
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strategy Type
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="balanced">Balanced Distribution</option>
                  <option value="priority">Priority Locations</option>
                  <option value="demand-based">Demand-Based</option>
                  <option value="geographic">Geographic Optimization</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGetRecommendations}
                  disabled={isGeneratingRecommendations}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isGeneratingRecommendations ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      <span>Generate Recommendations</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Inventory Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Inventory Distribution
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Real-time inventory levels across all locations
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {liveInventory.variants.map((variant, index) => (
              <VariantAllocationCard
                key={variant.variantId}
                variant={variant}
                recommendations={formattedRecommendations?.variants?.[index]}
                isCompact={compactMode}
                onAllocationChange={(allocation) => 
                  onAllocationChange?.(variant.variantId, allocation)
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      {inventoryAlerts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
              Inventory Alerts
            </h4>
          </div>
          
          <div className="space-y-2">
            {inventoryAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.locationName}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                  }`}>
                    {alert.available} units remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual variant allocation card with live data
 */
const VariantAllocationCard = ({ 
  variant, 
  recommendations, 
  isCompact, 
  onAllocationChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div 
        className="p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white">
              {variant.variantTitle}
            </h5>
            {variant.sku && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                SKU: {variant.sku}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {variant.totalQuantity.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Available
              </div>
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            {/* Location Breakdown */}
            <div className="space-y-3">
              {variant.locationBreakdown.map((location) => (
                <div
                  key={location.locationId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      location.isActive && location.fulfillsOnlineOrders
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {location.locationName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {location.fulfillsOnlineOrders ? 'Online Orders' : 'Local Only'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {location.available.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Available
                      </div>
                    </div>
                    
                    {recommendations?.recommendedAllocation && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {recommendations.recommendedAllocation
                            .find(rec => rec.locationId === location.locationId)
                            ?.suggestedAllocation || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Suggested
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Allocation Efficiency */}
            {recommendations?.allocationEfficiency !== undefined && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Allocation Efficiency
                  </span>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {recommendations.allocationEfficiency}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${recommendations.allocationEfficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveInventoryAllocationDashboard;
