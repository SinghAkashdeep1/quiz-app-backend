import { Request, Response } from 'express';
import User from '../models/User';
import GameSession from '../models/GameSession';
import Category from '../models/Category';

// @desc    Get dashboard overview stats
// @route   GET /api/analytics/overview
export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalGuests = await User.countDocuments({ role: 'guest' });
    const totalGames = await GameSession.countDocuments();

    // DAU (Daily Active Users - last 24h)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dau = await User.countDocuments({
      $or: [
        { 'streaks.lastPlayDate': { $gte: dayAgo } },
        { updatedAt: { $gte: dayAgo } }
      ]
    });

    // MAU (Monthly Active Users - last 30d)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mau = await User.countDocuments({
      $or: [
        { 'streaks.lastPlayDate': { $gte: monthAgo } },
        { updatedAt: { $gte: monthAgo } }
      ]
    });

    // Conversion rate
    const convertedUsers = await User.countDocuments({ conversionStatus: 'converted' });
    const conversionRate = totalGuests > 0 ? (convertedUsers / totalGuests) * 100 : 0;

    // Profile completion rate
    const fullyRegistered = await User.countDocuments({
      username: { $exists: true, $ne: '' },
      email: { $exists: true, $ne: '' }
    });
    const totalAccounts = totalUsers + totalGuests + await User.countDocuments({ role: 'admin' });
    const profileCompletionRate = totalAccounts > 0 ? (fullyRegistered / totalAccounts) * 100 : 0;

    res.json({
      totalUsers,
      totalGuests,
      totalGames,
      dau,
      mau,
      conversionRate,
      profileCompletionRate
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc Get category performance
export const getCategoryPerformance = async (req: Request, res: Response) => {
  try {
    const performance = await GameSession.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalPlays: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' },
          totalCorrect: { $sum: '$correctAnswers' },
          totalQuestions: { $sum: '$questionsAttempted' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $match: { 'category.isArchived': { $ne: true } } },
      {
        $project: {
          name: '$category.name',
          totalPlays: 1,
          avgAccuracy: 1,
          totalCorrect: 1,
          totalQuestions: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
