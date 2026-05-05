import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getIcons } from '../controllers/categoryController';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/icons', getIcons);
router.get('/', optionalProtect, getCategories); // optionalProtect used to get req.user for favorites
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;
