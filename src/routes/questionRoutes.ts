import express from 'express';
import {
  getQuestions, getQuestionsByCategory, createQuestion, bulkCreateQuestions,
  updateQuestion, deleteQuestion, updateQuestionStats, getTopQuestions,
  getArchivedQuestions, restoreQuestion, permanentlyDeleteQuestion
} from '../controllers/questionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/archived', protect, admin, getArchivedQuestions);
router.get('/', getQuestions);
router.get('/category/:categoryId', protect, getQuestionsByCategory);
router.post('/', protect, admin, createQuestion);
router.post('/bulk', protect, admin, bulkCreateQuestions);
router.post('/analytics', updateQuestionStats);
router.get('/top', getTopQuestions);
router.put('/:id', protect, admin, updateQuestion);
router.put('/:id/restore', protect, admin, restoreQuestion);
router.delete('/:id', protect, admin, deleteQuestion);
router.delete('/:id/permanent', protect, admin, permanentlyDeleteQuestion);

export default router;
