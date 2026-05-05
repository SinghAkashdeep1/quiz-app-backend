import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Category from '../models/Category';
import GameSession from '../models/GameSession';
import User from '../models/User';
import Question from '../models/Question';

// @desc    Check if user can play a category
// @route   POST /api/game/check-access
export const checkGameAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { categoryId, difficulty = 'easy' } = req.body;
  const user = req.user;

  try {
    if (!user) {
      return res.status(401).json({ message: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (user.role === 'guest') {
      // Check if category allows guests at all
      if (category.isGuestAllowed === false) {
        return res.status(403).json({
          message: 'This category is for registered users only',
          code: 'AUTH_REQUIRED'
        });
      }

      // Check hearts (categoryCredits)
      const updatedUser = await User.findById(user._id);
      if (!updatedUser) return res.status(404).json({ message: 'User not found' });

      let catCredit = updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId);
      if (!catCredit) {
        // Initialize and save if not exists
        catCredit = { 
          categoryId: categoryId as any, 
          hearts: category.guestHeartsConfig?.maxHearts || 3,
          refillsToday: 0,
          lastRefillAt: new Date(0)
        };
        updatedUser.categoryCredits.push(catCredit);
        await updatedUser.save();
      }

      if (catCredit.hearts <= 0) {
        // Reset refillsToday if it's a new day
        const today = new Date().toDateString();
        const lastRefillDay = catCredit.lastRefillDate ? new Date(catCredit.lastRefillDate).toDateString() : '';
        if (lastRefillDay !== today) {
          catCredit.refillsToday = 0;
          await updatedUser.save();
        }

        const dailyLimit = category.guestHeartsConfig?.dailyRefillLimit || 3;

        if (catCredit.refillsToday >= dailyLimit) {
          // Check cooldown only if daily limit is reached
          const referenceTime = (catCredit as any).heartsEmptyAt || catCredit.lastRefillAt || new Date(0);
          const cooldownHours = category.guestHeartsConfig?.refillCooldownHours || 14;
          const hoursSinceRefill = (Date.now() - referenceTime.getTime()) / (1000 * 3600);
          
          if (hoursSinceRefill < cooldownHours) {
            const remaining = Math.ceil(cooldownHours - hoursSinceRefill);
            return res.status(403).json({
              message: `You are out of hearts! Cooldown active: ${remaining} hours remaining.`,
              code: 'COOLDOWN_ACTIVE',
              remaining
            });
          }
        }

        return res.status(403).json({
          message: 'You have run out of hearts for this category! Please refill to continue.',
          code: 'NO_CREDITS'
        });
      }

      // Check specific difficulty access for guest
      const guestAccess = (category as any).guestAccess || {};
      const isAllowedForDifficulty = guestAccess[difficulty] !== undefined ? guestAccess[difficulty] : (difficulty === 'easy');

      if (!isAllowedForDifficulty) {
        return res.status(403).json({
          message: `The ${difficulty} level is for registered users only. Please sign up to continue.`,
          code: 'AUTH_REQUIRED'
        });
      }

      // Check guest attempts
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attemptsToday = await GameSession.countDocuments({
        userId: user._id,
        playedAt: { $gte: today }
      });

      if (attemptsToday >= category.maxGuestAttempts) {
        return res.status(403).json({
          message: 'Daily guest limit reached for this category',
          code: 'LIMIT_REACHED'
        });
      }
    }

    // Difficulty Progression Logic (Only for registered users)
    if (user.role === 'user' || user.role === 'admin') {
      const fullUser = await User.findById(user._id);
      if (!fullUser) return res.status(404).json({ message: 'User not found' });

      if (difficulty === 'medium' || difficulty === 'hard') {
        const prevDiff = difficulty === 'hard' ? 'medium' : 'easy';

        // Check if there are any questions for the previous difficulty level
        const prevQuestionsExist = await Question.exists({ categoryId, difficulty: prevDiff });

        if (prevQuestionsExist) {
          const isCompleted = fullUser.completedLevels.some(
            cl => cl.categoryId.toString() === categoryId && cl.difficulty === prevDiff
          );

          if (!isCompleted) {
            return res.status(403).json({
              message: `Please complete the ${prevDiff} level first!`,
              code: 'LEVEL_LOCKED',
              requiredLevel: prevDiff
            });
          }
        } else if (difficulty === 'hard') {
          // If Hard and no Medium, check if Easy questions exist and are completed
          const easyQuestionsExist = await Question.exists({ categoryId, difficulty: 'easy' });

          if (easyQuestionsExist) {
            const isEasyCompleted = fullUser.completedLevels.some(
              cl => cl.categoryId.toString() === categoryId && cl.difficulty === 'easy'
            );
            if (!isEasyCompleted) {
              return res.status(403).json({
                message: `Please complete the easy level first!`,
                code: 'LEVEL_LOCKED',
                requiredLevel: 'easy'
              });
            }
          }
        }
      }
    }

    let progressIndex = 0;
    if (user.role === 'guest') {
      const updatedUser = await User.findById(user._id);
      if (updatedUser) {
        const catCredit = updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId);
        if (catCredit) progressIndex = (catCredit as any).progressIndex || 0;
      }
    }

    res.json({ allowed: true, progressIndex });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit game results
// @route   POST /api/game/submit
export const submitGame = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { categoryId, difficulty = 'easy', score, questionsAttempted, correctAnswers, timeSpent, results } = req.body;
  const user = req.user;

  try {
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // 1. Save Game Session
    const session = new GameSession({
      userId: user._id,
      categoryId,
      difficulty,
      score,
      questionsAttempted,
      correctAnswers,
      timeSpent,
      isGuest: user.role === 'guest'
    });
    await session.save();

    // 2. Update Question Metrics
    if (results && Array.isArray(results)) {
      for (const result of results) {
        const updateDoc: any = { $inc: { playCount: 1 } };
        if (result.isCorrect) {
          updateDoc.$inc.correctAnswerCount = 1;
        }
        await Question.findByIdAndUpdate(result.questionId, updateDoc);
      }
    }

    // 3. Update User Analytics, Coins, and Levels
    const updatedUser = await User.findById(user._id);
    const category = await Category.findById(categoryId);

    if (updatedUser && category) {
      updatedUser.totalGamesPlayed += 1;
      updatedUser.totalQuestionsAttempted += questionsAttempted;
      updatedUser.totalCorrectAnswers += correctAnswers;

      let earnedCoins = 0;
      let levelGained = 0;

      const alreadyCompletedBefore = updatedUser.completedLevels.some(
        cl => cl.categoryId.toString() === categoryId && cl.difficulty === difficulty
      );

      // --- REGISTERED USER LOGIC (Coins & Levels) ---
      if (updatedUser.role !== 'guest') {
        const baseReward = (category.rewards as any)?.[difficulty] || 10;

        // Calculate coins per question
        // Note: For now, we use average time spent to estimate speed bonus
        const avgTime = timeSpent / questionsAttempted;
        const totalTimeLimit = 30; // Default time limit
        const timeMultiplier = avgTime < (totalTimeLimit * 0.2) ? 1.5 : (avgTime < (totalTimeLimit * 0.5) ? 1.0 : 0.7);

        if (!alreadyCompletedBefore) {
          results.forEach((res: any) => {
            if (res.isCorrect) {
              earnedCoins += Math.round(baseReward * timeMultiplier);
              levelGained += 1;
            } else {
              earnedCoins -= Math.floor(baseReward / 2);
            }
          });

          // Ensure earnedCoins isn't negative for the first attempt if they did okay
          if (earnedCoins < 0 && score > 0) earnedCoins = 0;

          updatedUser.coins += earnedCoins;
        } else {
          // Replay logic: only show what they WOULD have earned, but don't add to balance
          results.forEach((res: any) => {
            if (res.isCorrect) {
              earnedCoins += Math.round(baseReward * timeMultiplier);
            }
          });
          // Do not add to updatedUser.coins
        }

        // Update category level
        let catLevel = updatedUser.categoryLevels.find(cl => cl.categoryId.toString() === categoryId);
        if (!catLevel) {
          catLevel = { categoryId: categoryId as any, level: 1, experience: 0 };
          updatedUser.categoryLevels.push(catLevel);
        }

        // Only increase level if it's the first time completing this specific difficulty
        const alreadyCompleted = updatedUser.completedLevels.some(
          cl => cl.categoryId.toString() === categoryId && cl.difficulty === difficulty
        );

        if (!alreadyCompleted) {
          catLevel.level += levelGained;
          // Milestone reward for finishing Hard
          if (difficulty === 'hard' && correctAnswers === questionsAttempted) {
            updatedUser.coins += 500; // Big bonus
          }
        }
      }

      // --- USER LOGIC (Coins) ---
      if (updatedUser.role !== 'guest') {
        const incorrect = questionsAttempted - correctAnswers;
        const penaltyPerWrong = 5; 
        updatedUser.coins -= (incorrect * penaltyPerWrong);
      }

      // --- GUEST LOGIC (Credits/Hearts) ---
      if (updatedUser.role === 'guest') {
        const incorrect = questionsAttempted - correctAnswers;

        let catCredit = updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId);
        if (!catCredit) {
          catCredit = { categoryId: categoryId as any, hearts: category.guestHeartsConfig?.maxHearts || 3 };
          updatedUser.categoryCredits.push(catCredit);
        }

        // Deduct hearts for wrong answers
        catCredit.hearts -= incorrect;
        if (catCredit.hearts <= 0) {
          catCredit.hearts = 0;
          if (!(catCredit as any).heartsEmptyAt) {
            (catCredit as any).heartsEmptyAt = new Date();
          }
        }

        // Reset progress because they finished the quiz
        (catCredit as any).progressIndex = 0;

        // Add heart rewards if level completed (70%+)
        const scorePercentage = (correctAnswers / questionsAttempted) * 100;
        if (scorePercentage >= 70) {
          const rewardHearts = (category.guestHeartsConfig?.rewards as any)?.[difficulty] || 0;
          catCredit.hearts += rewardHearts;

          const maxHearts = category.guestHeartsConfig?.maxHearts || 3;
          if (catCredit.hearts > maxHearts) catCredit.hearts = maxHearts;
        }
      }

      // 4. Update Streaks
      const now = new Date();
      const lastPlay = updatedUser.streaks.lastPlayDate;

      if (!lastPlay) {
        updatedUser.streaks.current = 1;
        updatedUser.streaks.longest = 1;
      } else {
        const diffInDays = Math.floor((now.getTime() - lastPlay.getTime()) / (1000 * 3600 * 24));

        if (diffInDays === 1) {
          updatedUser.streaks.current += 1;
          if (updatedUser.streaks.current > updatedUser.streaks.longest) {
            updatedUser.streaks.longest = updatedUser.streaks.current;
          }
          // Streak Bonus
          if (updatedUser.role !== 'guest') {
            updatedUser.coins += (updatedUser.streaks.current * 5);
          }
        } else if (diffInDays > 1) {
          updatedUser.streaks.current = 1;
        }
      }

      updatedUser.streaks.lastPlayDate = now;
      if (!updatedUser.streaks.history.some(d => d.toDateString() === now.toDateString())) {
        updatedUser.streaks.history.push(now);
      }

      // 5. Mark level as completed
      if (questionsAttempted > 0) {
        const scorePercentage = (correctAnswers / questionsAttempted) * 100;
        if (scorePercentage >= 70) {
          const stars = scorePercentage >= 95 ? 3 : (scorePercentage >= 85 ? 2 : 1);
          const completionIndex = updatedUser.completedLevels.findIndex(
            cl => cl.categoryId.toString() === categoryId && cl.difficulty === difficulty
          );

          if (completionIndex === -1) {
            updatedUser.completedLevels.push({
              categoryId: categoryId as any,
              difficulty,
              score: scorePercentage,
              stars,
              completedAt: now
            });
          } else {
            // Update if better score
            if (scorePercentage > (updatedUser.completedLevels[completionIndex].score || 0)) {
              updatedUser.completedLevels[completionIndex].score = scorePercentage;
              updatedUser.completedLevels[completionIndex].stars = stars;
            }
          }
        }
      }

      await updatedUser.save();

      return res.status(201).json({
        message: 'Game submitted successfully',
        rewards: {
          coins: earnedCoins,
          hearts: updatedUser.role === 'guest' ? updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId)?.hearts : null,
          levelUp: levelGained > 0,
          isReplay: alreadyCompletedBefore,
          currentLevel: updatedUser.role !== 'guest' ? updatedUser.categoryLevels.find(cl => cl.categoryId.toString() === categoryId)?.level : null
        },
        streak: updatedUser.streaks.current
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refill credits/coins via puzzle
// @route   POST /api/game/refill
export const refillCredits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { categoryId } = req.body;
  const user = req.user;

  try {
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updatedUser.role === 'guest') {
      if (!categoryId) return res.status(400).json({ message: 'Category ID required' });

      const category = await Category.findById(categoryId);
      if (!category) return res.status(404).json({ message: 'Category not found' });

      let catCredit = updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId);
      if (!catCredit) {
        catCredit = { categoryId: categoryId as any, hearts: 0, lastRefillAt: new Date(0) };
        updatedUser.categoryCredits.push(catCredit);
      }

      // Check Daily Limit
      const today = new Date().toDateString();
      const lastRefillDay = catCredit.lastRefillDate ? catCredit.lastRefillDate.toDateString() : '';
      
      if (lastRefillDay !== today) {
        catCredit.refillsToday = 0;
      }

      const dailyLimit = category.guestHeartsConfig?.dailyRefillLimit || 3;
      if (catCredit.refillsToday >= dailyLimit) {
        return res.status(403).json({
          message: `Daily refill limit reached for this category (Max ${dailyLimit}). Please try again tomorrow!`,
          code: 'DAILY_LIMIT_REACHED',
          dailyLimit
        });
      }

      // Cooldown check removed because they should be able to refill until dailyLimit is reached.
      // If dailyLimit is reached, they can't refill anyway (handled above).

      const refillCount = category.guestHeartsConfig?.refillCount || 3;
      const maxHearts = category.guestHeartsConfig?.maxHearts || 3;

      catCredit.hearts += refillCount;
      if (catCredit.hearts > maxHearts) catCredit.hearts = maxHearts;
      catCredit.lastRefillAt = new Date();
      catCredit.lastRefillDate = new Date();
      catCredit.refillsToday += 1;

      await updatedUser.save();
      return res.json({
        success: true,
        message: `${refillCount} Hearts refilled!`,
        hearts: catCredit.hearts
      });
    } else {
      return res.status(403).json({
        message: 'Coin refill is no longer available. You can continue playing with 0 or negative coins.',
        code: 'REFILL_DISABLED'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category favorite
// @route   POST /api/game/favorite
export const toggleFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { categoryId } = req.body;
  const user = req.user;

  try {
    if (!user || user.role === 'guest') {
      return res.status(403).json({ message: 'Favorites feature is only available for registered users' });
    }

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    const index = updatedUser.favorites.findIndex(id => id.toString() === categoryId);
    let isFavorite = false;

    if (index > -1) {
      updatedUser.favorites.splice(index, 1);
    } else {
      updatedUser.favorites.push(categoryId as any);
      isFavorite = true;
    }

    await updatedUser.save();
    res.json({ success: true, isFavorite });
  } catch (error) {
    next(error);
  }
};

// @desc    Save game progress mid-quiz
// @route   POST /api/game/save-progress
export const saveProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { categoryId, currentIndex, isOutOfHearts, currentHearts } = req.body;
  const user = req.user;

  try {
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (user.role !== 'guest') {
      return res.json({ success: true, message: 'Progress saved (not applicable for users currently)' });
    }

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    let catCredit = updatedUser.categoryCredits.find(c => c.categoryId.toString() === categoryId);
    if (!catCredit) {
      catCredit = { categoryId: categoryId as any, hearts: 0, lastRefillAt: new Date(0) };
      updatedUser.categoryCredits.push(catCredit);
    }

    (catCredit as any).progressIndex = currentIndex;
    
    if (currentHearts !== undefined) {
      catCredit.hearts = currentHearts;
    }

    if (isOutOfHearts) {
      catCredit.hearts = 0;
      if (!(catCredit as any).heartsEmptyAt) {
        (catCredit as any).heartsEmptyAt = new Date();
      }
    }

    await updatedUser.save();
    res.json({ success: true, hearts: catCredit.hearts });
  } catch (error) {
    next(error);
  }
};
