import express from 'express';
import { loginAdmin, registerAdmin, getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/register', registerAdmin); // In production, this should be protected or disabled after first setup

router.route('/users')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/users/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;
