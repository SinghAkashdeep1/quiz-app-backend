import express from 'express';
import { getOverviewStats, getCategoryPerformance } from '../controllers/analyticsController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/overview', protect, admin, getOverviewStats);
router.get('/categories', protect, admin, getCategoryPerformance);

export default router;
