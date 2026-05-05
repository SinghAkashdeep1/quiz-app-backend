import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      return next(error);
    }
  }

  // Handle Guest via x-guest-id header
  const guestId = req.headers['x-guest-id'] as string;
  console.log('Auth Middleware - Guest ID:', guestId);
  if (guestId) {
    try {
      let user = await User.findOne({ guestId });
      if (!user) {
        // Create a temporary guest user if doesn't exist
        user = await User.create({
          guestId,
          role: 'guest',
          username: `Guest_${guestId.slice(-6).toUpperCase()}`
        });
      }
      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  }

  if (!token && !guestId) {
    return res.status(401).json({ message: 'Not authorized, no token or guest id' });
  }
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Continue without user
    }
  }

  const guestId = req.headers['x-guest-id'] as string;
  if (guestId && !req.user) {
    try {
      req.user = await User.findOne({ guestId });
    } catch (error) {
      // Continue without user
    }
  }

  next();
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

