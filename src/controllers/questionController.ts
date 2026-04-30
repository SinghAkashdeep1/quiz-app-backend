import { Request, Response } from 'express';
import Question from '../models/Question';

// @desc    Get questions by category
// @route   GET /api/questions/category/:categoryId
export const getQuestionsByCategory = async (req: Request, res: Response) => {
  try {
    const questions = await Question.find({ categoryId: req.params.categoryId });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get all questions
// @route   GET /api/questions
export const getQuestions = async (req: Request, res: Response) => {
  try {
    const questions = await Question.find().populate('categoryId', 'name');
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Create a question
// @route   POST /api/questions
export const createQuestion = async (req: Request, res: Response) => {
  try {
    const { categoryId, text, options, correctAnswerIndex, type, imageUrl } = req.body;
    const question = new Question({ categoryId, text, options, correctAnswerIndex, type, imageUrl });
    const savedQuestion = await question.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Bulk create questions
// @route   POST /api/questions/bulk
export const bulkCreateQuestions = async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of questions' });
    }
    const savedQuestions = await Question.insertMany(questions);
    res.status(201).json({ count: savedQuestions.length, questions: savedQuestions });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
export const updateQuestion = async (req: Request, res: Response) => {
  try {
    const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Update question statistics
// @route   POST /api/questions/analytics
export const updateQuestionStats = async (req: Request, res: Response) => {
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
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Get top questions by play count
// @route   GET /api/questions/top
export const getTopQuestions = async (req: Request, res: Response) => {
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
    res.status(500).json({ message: (error as Error).message });
  }
};
