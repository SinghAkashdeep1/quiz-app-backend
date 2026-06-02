import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendResetPasswordEmail } from '../services/emailService';
import crypto from 'crypto';

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
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: normalizedEmail });
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
        email: normalizedEmail,
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
      onboarding: Object.fromEntries(user.onboarding || new Map()),
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
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

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
        onboarding: Object.fromEntries(user.onboarding || new Map()),
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
      streaks: user.streaks,
      completedLevels: user.completedLevels,
      categoryLevels: user.categoryLevels,
      onboarding: Object.fromEntries(user.onboarding || new Map())
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Forgot password - send reset code
// @route   POST /api/users/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`ForgotPassword: User not found for email: ${email}`);
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    console.log(`ForgotPassword: User found, generating code for: ${email}`);

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set token and expiry (2 minutes from now)
    const expiryTime = Date.now() + 2 * 60 * 1000;
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = new Date(expiryTime);
    
    await user.save();
    console.log(`ForgotPassword: Saved reset code ${resetCode} to DB for: ${email}. Expires at: ${new Date(expiryTime).toISOString()}`);

    await sendResetPasswordEmail(email, resetCode);
    console.log(`ForgotPassword: sendResetPasswordEmail completed for: ${email}`);

    res.json({ message: 'Reset code sent to email' });
  } catch (error) {
    console.error('ForgotPassword Error:', error);
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { email, code, newPassword } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    
    console.log(`ResetPassword Attempt: email=${normalizedEmail}, code=${code}, at=${now.toISOString()}`);
    
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: now },
    });

    if (!user) {
      // Check if user exists at all with this code but expired
      const foundUser = await User.findOne({ email: normalizedEmail, resetPasswordToken: code });
      if (foundUser) {
        console.log(`ResetPassword Failed: Code found but expired. Expiry: ${foundUser.resetPasswordExpires?.toISOString()}, Current: ${now.toISOString()}`);
      } else {
        console.log(`ResetPassword Failed: Code not found or email mismatch.`);
      }
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    console.log(`ResetPassword Success: Valid code found for: ${normalizedEmail}. Expiry was: ${user.resetPasswordExpires?.toISOString()}`);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify reset code
// @route   POST /api/users/verify-code
export const verifyResetCode = async (req: Request, res: Response, next: NextFunction) => {
  const { email, code } = req.body;

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    
    console.log(`VerifyCode Attempt: email=${normalizedEmail}, code=${code}, at=${now.toISOString()}`);
    
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: now },
    });

    if (!user) {
      const foundUser = await User.findOne({ email: normalizedEmail, resetPasswordToken: code });
      if (foundUser) {
        console.log(`VerifyCode Failed: Code found but expired. Expiry: ${foundUser.resetPasswordExpires?.toISOString()}, Current: ${now.toISOString()}`);
      } else {
        console.log(`VerifyCode Failed: Code not found or email mismatch.`);
      }
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    console.log(`VerifyCode Success: Valid code found for: ${normalizedEmail}`);
    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update onboarding progress
// @route   PATCH /api/users/onboarding
export const updateOnboarding = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { featureKey } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.onboarding) {
      user.onboarding = new Map();
    }

    user.onboarding.set(featureKey, true);
    await user.save();

    res.json({ onboarding: Object.fromEntries(user.onboarding) });
  } catch (error) {
    next(error);
  }
};
