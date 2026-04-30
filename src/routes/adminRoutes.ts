import express from 'express';
import { loginAdmin, registerAdmin } from '../controllers/adminController';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/register', registerAdmin); // In production, this should be protected or disabled after first setup

export default router;
