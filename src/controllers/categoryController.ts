import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';
import Question from '../models/Question';
import Icon from '../models/Icon';
import User from '../models/User';
import TranslationService from '../services/translationService';

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { favorite, page, limit, paginated } = req.query;
    const user = req.user;

    let query: any = { isArchived: { $ne: true } };
    if (favorite === 'true' && user) {
      const u = await User.findById(user._id);
      if (u) {
        query = { ...query, _id: { $in: u.favorites } };
      }
    }

    const totalCount = await Category.countDocuments(query);

    let categoriesQuery = Category.find(query).sort({ createdAt: -1, _id: 1 });

    if (page && limit) {
      const skip = (Number(page) - 1) * Number(limit);
      categoriesQuery = categoriesQuery.skip(skip).limit(Number(limit));
    }

    const categories = await categoriesQuery;

    // Determine target language from query param first, then Accept-Language header
    const lang =
      (req.query.lang as string) ||
      (req.headers['accept-language']?.split(',')[0].split('-')[0]) ||
      'en';

    // Build the enriched list (availableDifficulties) in parallel
    const enrichedCategories = await Promise.all(
      categories.map(async (cat: any) => {
        const difficulties = ['easy', 'medium', 'hard'];
        const available = await Promise.all(
          difficulties.map(async (d) => {
            const count = await Question.countDocuments({ categoryId: cat._id, difficulty: d });
            return count > 0 ? d : null;
          })
        );
        return {
          ...(cat.toObject()),
          availableDifficulties: available.filter(Boolean),
        };
      })
    );

    // Translate names serially if a non-English language is requested.
    // Serial (not parallel) to respect the free Google Translate rate limit.
    if (lang && lang !== 'en') {
      for (let idx = 0; idx < enrichedCategories.length; idx++) {
        const catData = enrichedCategories[idx];
        const cat = categories[idx];

        // Check DB cache first — no network call needed
        const cached = cat.translations?.get(lang);
        if (cached?.name) {
          enrichedCategories[idx].name = cached.name;
          continue;
        }

        // Translate on the fly
        try {
          const translatedName = await TranslationService.translateText(catData.name, lang);

          if (translatedName && translatedName !== catData.name) {
            enrichedCategories[idx].name = translatedName;

            // Persist to DB in the background (don't await)
            Category.findOneAndUpdate(
              { _id: cat._id },
              { $set: { [`translations.${lang}`]: { name: translatedName } } },
              { new: true }
            ).catch(() => {});
          }
        } catch (err) {
          console.error(`[categoryController] Failed to translate category "${catData.name}":`, err);
          // Keep original name on failure
        }
      }
    }

    if (paginated === 'true') {
      return res.json({
        categories: enrichedCategories,
        totalCount,
        totalPages: limit ? Math.ceil(totalCount / Number(limit)) : 1,
        currentPage: Number(page) || 1,
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

// @desc    Soft delete a category and all its questions
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { 
      isArchived: true, 
      archivedAt: new Date() 
    });
    // Cascading archive: questions also get archived
    await Question.updateMany(
      { categoryId: req.params.id }, 
      { isArchived: true, archivedAt: new Date() }
    );
    res.json({ message: 'Category and its questions moved to archive' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get archived categories
// @route   GET /api/categories/archived
export const getArchivedCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const archived = await Category.find({ isArchived: true }).sort({ archivedAt: -1 });
    res.json(archived);
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a category
// @route   PUT /api/categories/:id/restore
export const restoreCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restored = await Category.findByIdAndUpdate(req.params.id, { 
      isArchived: false, 
      $unset: { archivedAt: "" } 
    }, { new: true });
    res.json(restored);
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a category
// @route   DELETE /api/categories/:id/permanent
export const permanentlyDeleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ categoryId: req.params.id });
    res.json({ message: 'Category and its questions permanently deleted' });
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
