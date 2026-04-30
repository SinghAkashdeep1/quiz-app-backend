import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Question from '../models/Question';
import Icon from '../models/Icon';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, icon, color } = req.body;
    const category = new Category({ name, icon, color });
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
    next(error);
  }
};
