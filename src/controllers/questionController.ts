import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Question from '../models/Question';
import Category from '../models/Category';

// @desc    Get questions by category
// @route   GET /api/questions/category/:categoryId
export const getQuestionsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categoryId = req.params.categoryId;
    const difficulty = req.query.difficulty as string;
    const isGuest = req.user && req.user.role === 'guest';

    // 1. Check if the category exists and if it allows guests
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (isGuest) {
      if (req.user.credits <= 0) {
        return res.status(403).json({ 
          message: 'You have run out of credits! Please sign up to continue playing and earn coins.',
          code: 'NO_CREDITS',
          questions: [] 
        });
      }

      const guestAccess = (category as any).guestAccess || {};
      const isAllowedForDiff = guestAccess[difficulty] !== undefined ? guestAccess[difficulty] : (difficulty === 'easy' || difficulty === undefined);
      
      if (category.isGuestAllowed === false || !isAllowedForDiff) {
        return res.status(403).json({ 
          message: 'Access restricted for guest users',
          code: 'GUEST_RESTRICTED',
          questions: [] 
        });
      }
    }

    // 2. Progression Check (for everyone)
    if (difficulty === 'medium') {
      const easyCompleted = req.user?.completedLevels?.some(
        (cl: any) => cl.categoryId.toString() === categoryId && cl.difficulty === 'easy'
      );
      if (!easyCompleted) {
        return res.status(403).json({ 
          message: 'Please complete the Easy level first to unlock Medium.',
          code: 'LEVEL_LOCKED',
          questions: []
        });
      }
    }

    if (difficulty === 'hard') {
      const mediumCompleted = req.user?.completedLevels?.some(
        (cl: any) => cl.categoryId.toString() === categoryId && cl.difficulty === 'medium'
      );
      if (!mediumCompleted) {
        return res.status(403).json({ 
          message: 'Please complete the Medium level first to unlock Hard.',
          code: 'LEVEL_LOCKED',
          questions: []
        });
      }
    }

    const query: any = { categoryId };
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // 2. Access is managed at category/difficulty level
    // No longer filtering individual questions for guests

    const questions = await Question.find(query);
    const lang = (req.headers['accept-language'] || req.query.lang || 'en') as string;

    const translatedQuestions = questions.map((q: any) => {
      const translation = q.translations?.get(lang);
      if (translation) {
        return {
          ...q.toObject(),
          text: translation.text || q.text,
          options: translation.options || q.options
        };
      }
      return q;
    });

    res.json(translatedQuestions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions
// @route   GET /api/questions
export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, difficulty, page, limit, paginated } = req.query;
    
    let query: any = {};
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

    const totalCount = await Question.countDocuments(query);
    
    let questionsQuery = Question.find(query).populate('categoryId', 'name').sort({ createdAt: -1 });

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      questionsQuery = questionsQuery.skip(skip).limit(Number(limit));
    }

    const questions = await questionsQuery;

    if (paginated === 'true') {
      return res.json({
        questions,
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / Number(limit)) : 1,
        currentPage: Number(page) || 1
      });
    }

    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a question
// @route   POST /api/questions
export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, text, options, correctAnswerIndex, type, imageUrl } = req.body;
    const question = new Question({ categoryId, text, options, correctAnswerIndex, type, imageUrl });
    const savedQuestion = await question.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create questions
// @route   POST /api/questions/bulk
export const bulkCreateQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of questions' });
    }
    const savedQuestions = await Question.insertMany(questions);
    res.status(201).json({ count: savedQuestions.length, questions: savedQuestions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuestion);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question statistics
// @route   POST /api/questions/analytics
export const updateQuestionStats = async (req: Request, res: Response, next: NextFunction) => {
  const { results } = req.body; // Array of { questionId: string, isCorrect: boolean }

  try {
    const updatePromises = results.map((result: { questionId: string, isCorrect: boolean }) => {
      return Question.findByIdAndUpdate(result.questionId, {
        $inc: {
          playCount: 1,
          correctAnswerCount: result.isCorrect ? 1 : 0
        }
      });
    });

    await Promise.all(updatePromises);
    res.json({ message: 'Stats updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top questions by play count
// @route   GET /api/questions/top
export const getTopQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await Question.find({ 
        playCount: { $gte: 1 },
        categoryId: { $ne: null }
      })
      .sort({ playCount: -1 })
      .limit(5)
      .populate('categoryId', 'name');
    
    // Filter out questions whose category was deleted (populate returns null)
    const validQuestions = questions.filter(q => q.categoryId !== null);
    res.json(validQuestions);
  } catch (error) {
    next(error);
  }
};
