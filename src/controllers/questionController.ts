import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Question from '../models/Question';
import Category from '../models/Category';
import TranslationService from '../services/translationService';

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
      const isAllowedForDiff = guestAccess[difficulty] !== undefined
        ? guestAccess[difficulty]
        : (difficulty === 'easy' || difficulty === undefined);

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

    const query: any = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      isAlternative: { $ne: true },
      isArchived: { $ne: true }
    };
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: 10 } }
    ]);

    // Check if any alternatives exist for this category/level
    const hasAlternatives = await Question.exists({
      categoryId,
      difficulty,
      isAlternative: true
    });

    // Convert aggregate results to Mongoose documents for compatibility with below logic
    const questionsDocs = questions.map(q => new Question(q));

    // Determine language
    const lang =
      (req.query.lang as string) ||
      (req.headers['accept-language']?.split(',')[0].split('-')[0]) ||
      'en';

    if (!lang || lang === 'en') {
      return res.json({
        questions: questionsDocs.map(q => q.toObject()),
        hasAlternatives: !!hasAlternatives
      });
    }

    // Translate each question, checking DB cache first
    const translatedQuestions = await Promise.all(
      questionsDocs.map(async (q: any) => {
        const qData = q.toObject();

        // Check DB cache
        const cached = q.translations?.get(lang);
        if (cached?.text) {
          qData.text = cached.text;
          if (cached.options?.length) qData.options = cached.options;
          if (cached.matchingPairs?.length) qData.matchingPairs = cached.matchingPairs;
          return qData;
        }

        // Translate: question text + all options (+ matchingPairs if present)
        try {
          const textsToTranslate: string[] = [q.text, ...(q.options || [])];

          const pairStartIdx = textsToTranslate.length;
          if (q.matchingPairs && Array.isArray(q.matchingPairs)) {
            for (const pair of q.matchingPairs) {
              textsToTranslate.push(pair.left);
              textsToTranslate.push(pair.right);
            }
          }

          const translated = await TranslationService.translateBatch(textsToTranslate, lang);

          qData.text = translated[0];
          qData.options = translated.slice(1, 1 + (q.options?.length || 0));

          const translationPayload: any = {
            text: translated[0],
            options: translated.slice(1, 1 + (q.options?.length || 0)),
          };

          if (q.matchingPairs && Array.isArray(q.matchingPairs)) {
            const translatedPairs = q.matchingPairs.map((_: any, i: number) => ({
              left: translated[pairStartIdx + i * 2],
              right: translated[pairStartIdx + i * 2 + 1],
            }));
            qData.matchingPairs = translatedPairs;
            translationPayload.matchingPairs = translatedPairs;
          }

          // Persist to DB in background
          Question.findOneAndUpdate(
            { _id: q._id },
            { $set: { [`translations.${lang}`]: translationPayload } },
            { new: true }
          ).catch(err => console.error('[questionController] Background DB update failed:', err));

        } catch (err) {
          console.error(`[questionController] Translation failed for question ${q._id}:`, err);
          // Return original data on failure
        }

        return qData;
      })
    );

    res.json({ questions: translatedQuestions, hasAlternatives: !!hasAlternatives });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all questions
// @route   GET /api/questions
export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, difficulty, type, isAlternative, page, limit, paginated } = req.query;

    let query: any = { isArchived: { $ne: true } };
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (type && type !== 'all') query.type = type;
    if (isAlternative !== undefined && isAlternative !== 'all') {
      query.isAlternative = isAlternative === 'true';
    }

    // To handle questions from archived categories, we can either:
    // 1. Ensure cascading archive works perfectly (current approach)
    // 2. Add a check here. Since we want to be robust, we'll do both.
    
    // First, get total count with basic filters
    const totalCountInDB = await Question.countDocuments(query);

    let questionsQuery = Question.find(query).populate('categoryId', 'name isArchived').sort({ createdAt: -1, _id: 1 });

    if (paginated === 'true' && page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      questionsQuery = questionsQuery.skip(skip).limit(Number(limit));
    }

    let questions = await questionsQuery;

    // Post-filter to ensure no questions from archived categories show up
    // (This handles cases where cascading archive might have failed or category was hard-deleted)
    questions = questions.filter(q => {
      const cat = q.categoryId as any;
      return cat && !cat.isArchived;
    });

    if (paginated === 'true') {
      return res.json({
        questions,
        totalCount: totalCountInDB, // Note: This might be slightly off if post-filtering removes items, but it's safer for performance
        totalPages: limit ? Math.ceil(totalCountInDB / Number(limit)) : 1,
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
    const {
      categoryId, text, options, optionImages,
      correctAnswerIndex, correctAnswerIndices,
      matchingPairs, type, imageUrl, difficulty, weightage, timeLimit, isAlternative
    } = req.body;

    if (type === 'image' && !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Question image is mandatory for Image Question type' });
    }

    if (!text?.trim() && !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Either question text or image must be provided' });
    }



    if (['mcq', 'image', 'multiple_correct', 'boolean'].includes(type)) {
      if (!options || !Array.isArray(options)) {
        return res.status(400).json({ message: 'Options are required' });
      }

      const filledIndices = [];
      for (let i = 0; i < options.length; i++) {
        const hasText = options[i]?.trim()?.length > 0;
        const hasImage = optionImages?.[i]?.trim()?.length > 0;
        if (hasText || hasImage) {
          filledIndices.push(i);
        }
      }

      if (type === 'boolean' && filledIndices.length < 2) {
        return res.status(400).json({ message: 'Boolean questions must have 2 options' });
      } else if (filledIndices.length < 2) {
        return res.status(400).json({ message: 'Question must have at least 2 options' });
      }

      // Validate correct answer indices point to filled options
      if (type === 'multiple_correct') {
        if (!correctAnswerIndices || !correctAnswerIndices.every(idx => filledIndices.includes(idx))) {
          return res.status(400).json({ message: 'One or more correct answers point to an empty option' });
        }
      } else {
        if (correctAnswerIndex === undefined || !filledIndices.includes(correctAnswerIndex)) {
          return res.status(400).json({ message: 'The correct answer points to an empty option' });
        }
      }
    }

    if (type === 'matching') {
      if (!matchingPairs || matchingPairs.length === 0) {
        return res.status(400).json({ message: 'Matching questions must have at least one pair' });
      }
      for (const pair of matchingPairs) {
        if (!pair.left?.trim() || !pair.right?.trim()) {
          return res.status(400).json({ message: 'All matching pairs must have both left and right items' });
        }
      }
    }

    const question = new Question({
      categoryId, text, options, optionImages,
      correctAnswerIndex, correctAnswerIndices,
      matchingPairs, type, imageUrl, difficulty, weightage, timeLimit, isAlternative
    });

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

    for (const q of questions) {
      if (q.type === 'image' && !q.imageUrl?.trim()) {
        return res.status(400).json({ message: `Question ${questions.indexOf(q) + 1}: Question image is mandatory for Image type` });
      }

      if (!q.text?.trim() && !q.imageUrl?.trim()) {
        return res.status(400).json({ message: 'Each question must have either text or an image' });
      }

      if (['mcq', 'image', 'multiple_correct', 'boolean'].includes(q.type)) {
        const filledIndices = [];
        for (let i = 0; i < (q.options?.length || 0); i++) {
          const hasText = q.options[i]?.trim()?.length > 0;
          const hasImage = q.optionImages?.[i]?.trim()?.length > 0;
          if (hasText || hasImage) {
            filledIndices.push(i);
          }
        }

        if (q.type === 'boolean' && filledIndices.length < 2) {
          return res.status(400).json({ message: `Question ${questions.indexOf(q) + 1}: Boolean questions must have 2 options` });
        } else if (filledIndices.length < 2) {
          return res.status(400).json({ message: `Question ${questions.indexOf(q) + 1}: Must have at least 2 options` });
        }
      }

      if (q.type === 'matching') {
        if (!q.matchingPairs || q.matchingPairs.length === 0) {
          return res.status(400).json({ message: `Question ${questions.indexOf(q) + 1}: Matching questions must have at least one pair` });
        }
        for (const pair of q.matchingPairs) {
          if (!pair.left?.trim() || !pair.right?.trim()) {
            return res.status(400).json({ message: `Question ${questions.indexOf(q) + 1}: All matching pairs must have both left and right items` });
          }
        }
      }
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
    if (req.body.hasOwnProperty('text') || req.body.hasOwnProperty('imageUrl') || req.body.hasOwnProperty('type') || req.body.hasOwnProperty('options')) {
      const existing = await Question.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Question not found' });

      const finalText = req.body.text !== undefined ? req.body.text : existing.text;
      const finalImage = req.body.imageUrl !== undefined ? req.body.imageUrl : existing.imageUrl;
      const finalType = req.body.type !== undefined ? req.body.type : existing.type;
      const finalOptions = req.body.options !== undefined ? req.body.options : existing.options;
      const finalOptionImages = req.body.optionImages !== undefined ? req.body.optionImages : existing.optionImages;

      if (finalType === 'image' && !finalImage?.trim()) {
        return res.status(400).json({ message: 'Question image is mandatory for Image Question type' });
      }

      if (!finalText?.trim() && !finalImage?.trim()) {
        return res.status(400).json({ message: 'Either question text or image must be provided' });
      }

      if (['mcq', 'image', 'multiple_correct', 'boolean'].includes(finalType)) {
        const filledIndices = [];
        for (let i = 0; i < (finalOptions?.length || 0); i++) {
          const hasText = finalOptions[i]?.trim()?.length > 0;
          const hasImage = finalOptionImages?.[i]?.trim()?.length > 0;
          if (hasText || hasImage) {
            filledIndices.push(i);
          }
        }

        if (finalType === 'boolean' && filledIndices.length < 2) {
          return res.status(400).json({ message: 'Boolean questions must have 2 options' });
        } else if (filledIndices.length < 2) {
          return res.status(400).json({ message: 'Question must have at least 2 options' });
        }

        // Validate correct answer indices
        if (req.body.hasOwnProperty('correctAnswerIndex') || req.body.hasOwnProperty('correctAnswerIndices')) {
          const finalCAI = req.body.correctAnswerIndex !== undefined ? req.body.correctAnswerIndex : existing.correctAnswerIndex;
          const finalCAIs = req.body.correctAnswerIndices !== undefined ? req.body.correctAnswerIndices : existing.correctAnswerIndices;

          if (finalType === 'multiple_correct') {
            if (!finalCAIs || !finalCAIs.every(idx => filledIndices.includes(idx))) {
              return res.status(400).json({ message: 'One or more correct answers point to an empty option' });
            }
          } else {
            if (finalCAI === undefined || !filledIndices.includes(finalCAI)) {
              return res.status(400).json({ message: 'The correct answer points to an empty option' });
            }
          }
        }
      }
    }



    const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuestion);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a question
// @route   DELETE /api/questions/:id
export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, {
      isArchived: true,
      archivedAt: new Date()
    });
    res.json({ message: 'Question moved to archive' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get archived questions
// @route   GET /api/questions/archived
export const getArchivedQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const archived = await Question.find({ isArchived: true })
      .populate('categoryId', 'name isArchived')
      .sort({ archivedAt: -1 });
    res.json(archived);
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a question
// @route   PUT /api/questions/:id/restore
export const restoreQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await Question.findById(req.params.id).populate('categoryId');
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Rule: Cannot restore if category is still archived
    const category = question.categoryId as any;
    if (category && category.isArchived) {
      return res.status(400).json({
        message: 'Cannot restore question because its category is still archived. Please restore the category first.'
      });
    }

    question.isArchived = false;
    question.archivedAt = undefined;
    await question.save();

    res.json(question);
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a question
// @route   DELETE /api/questions/:id/permanent
export const permanentlyDeleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question statistics
// @route   POST /api/questions/analytics
export const updateQuestionStats = async (req: Request, res: Response, next: NextFunction) => {
  const { results } = req.body;

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

    // Filter out questions whose category was deleted or null
    const validQuestions = questions.filter(q => q.categoryId !== null && q.categoryId !== undefined);
    res.json(validQuestions);
  } catch (error) {
    next(error);
  }
};
