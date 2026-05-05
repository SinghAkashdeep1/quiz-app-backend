import express from 'express';
import { getQuestions, getQuestionsByCategory, createQuestion, bulkCreateQuestions, updateQuestion, deleteQuestion, updateQuestionStats, getTopQuestions } from '../controllers/questionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getQuestions);
router.get('/category/:categoryId', protect, getQuestionsByCategory);
router.post('/', protect, admin, createQuestion);
router.post('/bulk', protect, admin, bulkCreateQuestions);
router.post('/analytics', updateQuestionStats);
router.get('/top', getTopQuestions);
router.put('/:id', protect, admin, updateQuestion);
router.delete('/:id', protect, admin, deleteQuestion);

export default router;
