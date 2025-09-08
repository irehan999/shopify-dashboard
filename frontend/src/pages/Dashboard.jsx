import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Store, TrendingUp, Users } from 'lucide-react';
import { useDashboardStats, useUnpushedProducts } from '../features/dashboard/hooks/useDashboard.js';

const Dashboard = () => {
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: unpushedResponse, isLoading: unpushedLoading, error: unpushedError } = useUnpushedProducts(5);

  // Our API helpers return response.data (ApiResponse)
  const stats = statsResponse?.data;
  const unpushedData = unpushedResponse?.data;

  console.log('Dashboard stats received:', statsResponse);
  console.log('Unpushed products received:', unpushedResponse);

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {(statsError || unpushedError) && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
          Failed to load dashboard data. Please refresh.
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your store management activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalProducts ?? 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Connected Stores */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected Stores</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.connectedStores ?? 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Store className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Unpushed Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unpushed Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.unpushedProducts ?? 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.recentNotifications ?? 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unpushed Products - Full width when no other sections */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Products Ready to Push
                  </h2>
                  <p className="text-sm text-gray-600">
                    Products that haven't been pushed to any store yet
                  </p>
                </div>
                <Link
                  to="/products/create"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Link>
              </div>
            </div>

            <div className="p-6">
              {unpushedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : unpushedData?.products?.length > 0 ? (
                <div className="space-y-4">
                  {unpushedData.products.map((product) => {
                    const firstImage = product.media?.[0]?.src;
                    const firstVariantPrice = product.variants?.[0]?.price ?? 0;
                    const description = product.descriptionHtml ? product.descriptionHtml.replace(/<[^>]+>/g, '').slice(0, 140) : 'No description';
                    return (
                    <div
                      key={product._id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm font-medium text-gray-900">
                            ${firstVariantPrice}
                          </span>
                          <span className="text-xs text-gray-500">
                            Created {new Date(product.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/products/${product._id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                        <Link
                          to={`/products/${product._id}/edit`}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    );})}

                  {/* View All Link */}
                  {unpushedData?.total > 5 && (
                    <div className="text-center pt-4 border-t border-gray-200">
                      <Link
                        to="/products?filter=unpushed"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View all {unpushedData.total} unpushed products →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No unpushed products
                  </h3>
                  <p className="text-gray-600 mb-6">
                    All your products have been pushed to stores, or you haven't created any products yet.
                  </p>
                  <Link
                    to="/products/create"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Product
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-3 mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/stores"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Store className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Manage Stores</h3>
                  <p className="text-sm text-gray-600">Connect and manage your Shopify stores</p>
                </div>
              </Link>

              <Link
                to="/products"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">View Products</h3>
                  <p className="text-sm text-gray-600">Browse and manage your product catalog</p>
                </div>
              </Link>

              <Link
                to="/products/create"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Create Product</h3>
                  <p className="text-sm text-gray-600">Add a new product to your catalog</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
