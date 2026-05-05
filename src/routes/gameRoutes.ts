import express from 'express';
import { checkGameAccess, submitGame, refillCredits, toggleFavorite, saveProgress } from '../controllers/gameController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/check-access', protect, checkGameAccess);
router.post('/submit', protect, submitGame);
router.post('/refill', protect, refillCredits);
router.post('/favorite', protect, toggleFavorite);
router.post('/save-progress', protect, saveProgress);

export default router;
