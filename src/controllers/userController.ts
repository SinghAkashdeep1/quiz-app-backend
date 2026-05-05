import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password, guestId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (guestId) {
      // Convert guest to user
      user = await User.findOne({ guestId, role: 'guest' });
      if (user) {
        user.username = username;
        user.email = email;
        user.password = hashedPassword;
        user.role = 'user';
        user.conversionStatus = 'converted';
        user.convertedAt = new Date();
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
      favorites: user.favorites,
      totalLevel: user.totalLevel,
      categoryCredits: user.categoryCredits,
      completedLevels: user.completedLevels,
      categoryLevels: user.categoryLevels,
      analytics: {
        totalGamesPlayed: user.totalGamesPlayed || 0,
        accuracy: user.accuracy || 0,
        totalQuestionsAttempted: user.totalQuestionsAttempted || 0,
        totalCorrectAnswers: user.totalCorrectAnswers || 0
      },
      streaks: user.streaks || { current: 0, longest: 0, history: [] },
      favorites: user.favorites || [],
      coins: user.coins || 0,
      categoryCredits: user.categoryCredits || [],
      token: generateToken(user._id as string),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password as string))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        coins: user.coins,
        favorites: user.favorites,
        totalLevel: user.totalLevel,
        categoryCredits: user.categoryCredits,
        completedLevels: user.completedLevels,
        categoryLevels: user.categoryLevels,
        analytics: {
          totalGamesPlayed: user.totalGamesPlayed || 0,
          accuracy: user.accuracy || 0,
          totalQuestionsAttempted: user.totalQuestionsAttempted || 0,
          totalCorrectAnswers: user.totalCorrectAnswers || 0
        },
        streaks: user.streaks || { current: 0, longest: 0, history: [] },
        favorites: user.favorites || [],
        coins: user.coins || 0,
        categoryCredits: user.categoryCredits || [],
        token: generateToken(user._id as string),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      coins: user.coins,
      categoryCredits: user.categoryCredits,
      favorites: user.favorites,
      totalLevel: user.totalLevel,
      analytics: {
        totalGamesPlayed: user.totalGamesPlayed,
        accuracy: user.accuracy,
        totalQuestionsAttempted: user.totalQuestionsAttempted,
        totalCorrectAnswers: user.totalCorrectAnswers
      },
      streaks: user.streaks
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
