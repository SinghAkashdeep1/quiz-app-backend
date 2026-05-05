import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Question from '../models/Question';
import Icon from '../models/Icon';
import User from '../models/User';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { favorite, page, limit, paginated } = req.query;
    const user = req.user;
    
    let query = {};
    if (favorite === 'true' && user) {
      const u = await User.findById(user._id);
      if (u) {
        query = { _id: { $in: u.favorites } };
      }
    }

    const totalCount = await Category.countDocuments(query);
    
    let categoriesQuery = Category.find(query).sort({ createdAt: -1 });
    
    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      categoriesQuery = categoriesQuery.skip(skip).limit(Number(limit));
    }

    const categories = await categoriesQuery;
    const lang = (req.headers['accept-language'] || req.query.lang || 'en') as string;

    // Enrich with available difficulties
    const enrichedCategories = await Promise.all(categories.map(async (cat: any) => {
      const difficulties = ['easy', 'medium', 'hard'];
      const available = await Promise.all(difficulties.map(async (d) => {
        const count = await Question.countDocuments({ categoryId: cat._id, difficulty: d });
        return count > 0 ? d : null;
      }));
      
      const translation = cat.translations?.get(lang);
      const name = translation?.name || cat.name;

      return {
        ...cat.toObject(),
        name,
        availableDifficulties: available.filter(Boolean)
      };
    }));

    if (paginated === 'true') {
      return res.json({
        categories: enrichedCategories,
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / Number(limit)) : 1,
        currentPage: Number(page) || 1
      });
    }

    res.json(enrichedCategories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = new Category(req.body);
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category and all its questions
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ categoryId: req.params.id });
    res.json({ message: 'Category and its questions deleted' });
  } catch (error) {
    next(error);
  }
};
// @desc    Get all available icons
// @route   GET /api/categories/icons
export const getIcons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const icons = await Icon.find().sort({ label: 1 });
    res.json(icons);
  } catch (error) {
    console.error('Error in getIcons:', error);
    next(error);
  }
};
