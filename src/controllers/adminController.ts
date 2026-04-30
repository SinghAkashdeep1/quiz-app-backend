import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';

// @desc    Auth admin & get token
// @route   POST /api/admin/login
export const loginAdmin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }]
    });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin._id,
        username: admin.username,
        token: jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', {
          expiresIn: '30d',
        }),
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Register admin (helper for initial setup)
export const registerAdmin = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const admin = new Admin({ username, email, password: hashedPassword });
        await admin.save();
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
}
