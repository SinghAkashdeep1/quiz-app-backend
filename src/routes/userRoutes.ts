import express from 'express';
import { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword, verifyResetCode, updateOnboarding } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.patch('/onboarding', protect, updateOnboarding);

export default router;
