import { Router } from 'express';
import { 
  getDashboardStats,
  getUnpushedProducts
} from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticateUser);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Unpushed products
router.get('/unpushed-products', getUnpushedProducts);

export default router;
