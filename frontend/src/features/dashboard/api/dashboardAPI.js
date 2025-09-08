import { api } from '../../../lib/api.js';

export const dashboardAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data; // Return response.data to access backend data properly
  },

  // Get unpushed products
  getUnpushedProducts: async (limit = 10) => {
    const response = await api.get(`/api/dashboard/unpushed-products?limit=${limit}`);
    return response.data; // Return response.data to access backend data properly
  },
};
