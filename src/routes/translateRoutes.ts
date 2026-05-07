import express, { Request, Response, NextFunction } from 'express';
import TranslationService from '../services/translationService';

const router = express.Router();

// @desc  Translate a single text or array of texts
// @route POST /api/translate
// @access Public
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, texts, targetLang, from = 'en' } = req.body;

    if (!targetLang) {
      return res.status(400).json({ message: 'targetLang is required' });
    }

    // Single text
    if (text !== undefined) {
      if (!text || targetLang === 'en') {
        return res.json({ translation: text });
      }
      const translation = await TranslationService.translateText(text, targetLang, from);
      return res.json({ translation });
    }

    // Batch texts
    if (Array.isArray(texts)) {
      if (targetLang === 'en') {
        return res.json({ translations: texts });
      }
      const translations = await TranslationService.translateBatch(texts, targetLang, from);
      return res.json({ translations });
    }

    return res.status(400).json({ message: 'Provide either "text" (string) or "texts" (array)' });
  } catch (error) {
    next(error);
  }
});

export default router;
