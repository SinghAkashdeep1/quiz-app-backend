import express from 'express';
import { getQuestions, getQuestionsByCategory, createQuestion, bulkCreateQuestions, updateQuestion, deleteQuestion, updateQuestionStats, getTopQuestions } from '../controllers/questionController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getQuestions);
router.get('/category/:categoryId', getQuestionsByCategory);
router.post('/', protect, createQuestion);
router.post('/bulk', protect, bulkCreateQuestions);
router.post('/analytics', updateQuestionStats);
router.get('/top', getTopQuestions);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;
