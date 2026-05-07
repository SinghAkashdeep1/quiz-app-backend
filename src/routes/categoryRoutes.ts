import express from 'express';
import { 
  getCategories, createCategory, updateCategory, deleteCategory, getIcons,
  getArchivedCategories, restoreCategory, permanentlyDeleteCategory 
} from '../controllers/categoryController';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/icons', getIcons);
router.get('/archived', protect, admin, getArchivedCategories);
router.get('/', optionalProtect, getCategories); // optionalProtect used to get req.user for favorites
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.put('/:id/restore', protect, admin, restoreCategory);
router.delete('/:id', protect, admin, deleteCategory);
router.delete('/:id/permanent', protect, admin, permanentlyDeleteCategory);

export default router;
