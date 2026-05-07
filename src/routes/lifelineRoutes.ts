import { Router } from 'express';
import { useAiHint, useFiftyFifty, translateQuiz, translateStatic, useChangeQuestion, useStopTimer } from '../controllers/lifelineController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/ai-hint', protect, useAiHint as any);
router.post('/50-50', protect, useFiftyFifty as any);
router.post('/change-question', protect, useChangeQuestion as any);
router.post('/stop-timer', protect, useStopTimer as any);
router.post('/translate-quiz', protect, translateQuiz as any);
router.post('/translate-static', translateStatic as any);

export default router;
