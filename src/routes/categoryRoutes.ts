import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getIcons } from '../controllers/categoryController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getCategories);
router.get('/icons', getIcons);
router.post('/', protect, createCategory);
router.put('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

export default router;
