import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TranslationService from '../services/translationService';
import User from '../models/User';
import Category from '../models/Category';
import Question from '../models/Question';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Helper to clean JSON from Gemini (removes markdown blocks if present)
const cleanJsonResponse = (text: string) => {
  try {
    // If it's already valid JSON, return it
    JSON.parse(text);
    return text;
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return text;
  }
};

export const useAiHint = async (req: Request, res: Response) => {
  try {
    const { categoryId, questionId, isFree, targetLang = 'English' } = req.body;

    // Validations
    if ((req as any).user.role === 'guest') {
      return res.status(403).json({ message: 'Guests cannot use lifelines' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (!isFree) {
      // @ts-ignore
      const cost = category.lifelines?.aiHints?.coinCost ?? 10;
      if (user.coins < cost) {
        return res.status(400).json({ message: 'Not enough coins' });
      }
      user.coins -= cost;
      await user.save();
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Generate Hint
    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key
      return res.status(200).json({
        hint: `Hint: Think about the core concepts of the question. The answer can be deduced by eliminating the obvious wrong choices.`,
        coinsLeft: user.coins
      });
    }

    const prompt = `You are a helpful quiz assistant. The user needs a hint for the following question:
Question: "${question.text}"
Options: ${question.options.join(', ')}

The correct answer is: "${question.options[question.correctAnswerIndex]}".

Please provide a brief, helpful hint in ${targetLang} that guides the user towards the correct answer. 

CRITICAL RULES:
1. DO NOT reveal the exact answer.
2. DO NOT mention any option letters (like A, B, C, D) or option numbers.
3. DO NOT directly quote the correct answer.
4. Keep the hint under 2 sentences.
5. Return the response as a JSON object with a single key "hint".
6. The hint MUST be in ${targetLang}.`;

    try {
      console.log('Using Gemini 1.5 Flash for question:', questionId);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      const result = await model.generateContent(prompt);
      const responseText = cleanJsonResponse(result.response.text());
      console.log('Gemini 1.5 Response:', responseText);
      const parsed = JSON.parse(responseText);
      const hint = parsed.hint;

      return res.status(200).json({ hint, coinsLeft: user.coins });
    } catch (aiError: any) {
      console.error('Gemini 1.5 API Error:', aiError.message);

      // Attempt Fallback Chain
      const modelsToTry = [
        "models/gemini-1.5-flash-latest",
        "models/gemini-1.5-flash-001",
        "models/gemini-1.5-flash-002",
        "models/gemini-1.5-pro-latest",
        "models/gemini-1.5-pro-001",
        "models/gemini-1.5-pro-002",
        "models/gemini-2.0-flash-exp",
        "models/gemini-1.0-pro",
        "models/gemini-pro"
      ];

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting fallback model: ${modelName}`);
          const fallbackModel = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.4,
              responseMimeType: modelName.includes('pro') ? undefined : "application/json"
            }
          });

          // Add a small timeout/delay if it was a 429
          if (aiError.message?.includes('429')) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const fallbackResult = await fallbackModel.generateContent(prompt);
          const fallbackResponseText = cleanJsonResponse(fallbackResult.response.text());
          console.log(`${modelName} Response:`, fallbackResponseText);

          let hint;
          try {
            const parsed = JSON.parse(fallbackResponseText);
            hint = parsed.hint;
          } catch (e) {
            // If JSON parse fails, maybe it just returned the text
            hint = fallbackResponseText.replace(/^{"hint":\s*"/, '').replace(/"}$/, '');
          }

          if (hint) {
            return res.status(200).json({
              hint,
              coinsLeft: user.coins,
              note: `Used fallback AI model: ${modelName}`
            });
          }
        } catch (fallbackError: any) {
          console.error(`${modelName} API Error:`, fallbackError.message);
          // Continue to next model
        }
      }

      // Random fallback hints if ALL AI models fail
      const fallbacks = [
        "Hint: Focus on the key terms in the question and try to eliminate the most unlikely answers first.",
        "Hint: Look for subtle clues in the way the question is phrased.",
        "Hint: Think about which option seems most logically consistent with the category.",
        "Hint: If you're stuck, try a process of elimination on the options you're sure are wrong.",
        "Hint: Consider the context of the category to narrow down your choices."
      ];
      const fallbackHint = fallbacks[Math.floor(Math.random() * fallbacks.length)];

      return res.status(200).json({
        hint: fallbackHint,
        coinsLeft: user.coins,
        note: 'All AI models unavailable, providing static fallback hint.'
      });
    }

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const useFiftyFifty = async (req: Request, res: Response) => {
  try {
    const { categoryId, questionId, isFree } = req.body;

    if ((req as any).user.role === 'guest') {
      return res.status(403).json({ message: 'Guests cannot use lifelines' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (!isFree) {
      // @ts-ignore
      const cost = category.lifelines?.fiftyFifty?.coinCost ?? 10;
      if (user.coins < cost) {
        return res.status(400).json({ message: 'Not enough coins' });
      }
      user.coins -= cost;
      await user.save();
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (question.options.length <= 2) {
      return res.status(400).json({ message: '50-50 lifeline is not available for questions with 2 or fewer options' });
    }

    // Generate 2 incorrect options
    const incorrectIndices = question.options
      .map((_, idx) => idx)
      .filter(idx => idx !== question.correctAnswerIndex);

    // Shuffle and pick 2
    const shuffled = incorrectIndices.sort(() => 0.5 - Math.random());
    const indicesToRemove = shuffled.slice(0, 2);

    res.status(200).json({ indicesToRemove, coinsLeft: user.coins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const useChangeQuestion = async (req: Request, res: Response) => {
  try {
    const { categoryId, questionId, isFree, excludeIds = [] } = req.body;

    if ((req as any).user.role === 'guest') {
      return res.status(403).json({ message: 'Guests cannot use lifelines' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (!isFree) {
      // @ts-ignore
      const cost = category.lifelines?.changeQuestion?.coinCost ?? 10;
      if (user.coins < cost) {
        return res.status(400).json({ message: 'Not enough coins' });
      }
      user.coins -= cost;
      await user.save();
    }

    const currentQuestion = await Question.findById(questionId);
    if (!currentQuestion) return res.status(404).json({ message: 'Question not found' });

    // Find a random question in the same category/difficulty that is not in excludeIds
    // We use aggregate with $sample for true randomness from the pool
    const pool = await Question.aggregate([
      {
        $match: {
          categoryId: new mongoose.Types.ObjectId(categoryId),
          difficulty: currentQuestion.difficulty,
          isAlternative: true,
          _id: { $nin: [...(excludeIds.map((id: string) => new mongoose.Types.ObjectId(id))), currentQuestion._id] }
        }
      },
      { $sample: { size: 1 } }
    ]);

    let alternative;
    if (pool.length > 0) {
      alternative = pool[0];
    } else {
      // If pool is empty (all alternatives seen), pick any random alternative excluding the current one
      const fallbackPool = await Question.aggregate([
        {
          $match: {
            categoryId: new mongoose.Types.ObjectId(categoryId),
            difficulty: currentQuestion.difficulty,
            isAlternative: true,
            _id: { $ne: currentQuestion._id }
          }
        },
        { $sample: { size: 1 } }
      ]);
      alternative = fallbackPool[0];
    }

    if (!alternative) {
      return res.status(400).json({ message: 'No other questions available for this level' });
    }

    res.status(200).json({ alternative, coinsLeft: user.coins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const useStopTimer = async (req: Request, res: Response) => {
  try {
    const { categoryId, isFree } = req.body;

    if ((req as any).user.role === 'guest') {
      return res.status(403).json({ message: 'Guests cannot use lifelines' });
    }

    const user = await User.findById((req as any).user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (!isFree) {
      // @ts-ignore
      const cost = category.lifelines?.stopTimer?.coinCost ?? 10;
      if (user.coins < cost) {
        return res.status(400).json({ message: 'Not enough coins' });
      }
      user.coins -= cost;
      await user.save();
    }

    res.status(200).json({ success: true, coinsLeft: user.coins });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const translateQuiz = async (req: Request, res: Response) => {
  try {
    const { questions, targetLang } = req.body;

    if (!questions || !targetLang || targetLang === 'en') {
      return res.status(200).json({ questions });
    }

    const langCode = targetLang.length <= 3 ? targetLang.toLowerCase() : targetLang.toLowerCase().substring(0, 2);

    const translatedQuestions = await Promise.all(questions.map(async (q: any) => {
      try {
        // 1. Try to find in DB if it's a real question (has _id)
        if (q._id) {
          const dbQuestion = await Question.findById(q._id);
          if (dbQuestion && dbQuestion.translations && dbQuestion.translations.get(langCode)) {
            const cached = dbQuestion.translations.get(langCode);
            return {
              ...q,
              text: cached.text || q.text,
              options: cached.options && cached.options.length ? cached.options : q.options,
              matchingPairs: cached.matchingPairs && cached.matchingPairs.length ? cached.matchingPairs : q.matchingPairs
            };
          }
        }

        // 2. Use TranslationService (Google Translate API)
        const translated = await TranslationService.translateQuestion(q, langCode);

        // 3. Save back to DB if it's a real question
        if (q._id) {
          const dbQuestion = await Question.findById(q._id);
          if (dbQuestion) {
            if (!dbQuestion.translations) dbQuestion.translations = new Map();
            dbQuestion.translations.set(langCode, {
              text: translated.text,
              options: translated.options,
              matchingPairs: translated.matchingPairs
            });
            dbQuestion.markModified('translations');
            await dbQuestion.save();
          }
        }

        return translated;
      } catch (err) {
        console.error('Translation error for question:', q.text, err);
        return q;
      }
    }));

    return res.status(200).json({ questions: translatedQuestions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import Translation from '../models/Translation';

export const translateStatic = async (req: Request, res: Response) => {
  try {
    const { text, texts, targetLang } = req.body;

    if (!targetLang || targetLang === 'en') {
      return res.status(200).json({ translation: text, translations: texts });
    }

    const langCode = targetLang.length <= 3 ? targetLang.toLowerCase() : targetLang.toLowerCase().substring(0, 2);

    if (text) {
      // Single text translation
      const cached = await Translation.findOne({ key: text, lang: langCode });
      if (cached) return res.status(200).json({ translation: cached.text });

      const translated = await TranslationService.translateText(text, langCode);
      if (translated && translated !== text) {
        try { await Translation.create({ key: text, lang: langCode, text: translated }); } catch (e) { }
      }
      return res.status(200).json({ translation: translated });
    }

    if (texts && Array.isArray(texts)) {
      // Batch text translation
      const results: string[] = [];
      const toTranslate: { text: string, index: number }[] = [];

      for (let i = 0; i < texts.length; i++) {
        const cached = await Translation.findOne({ key: texts[i], lang: langCode });
        if (cached) {
          results[i] = cached.text;
        } else {
          toTranslate.push({ text: texts[i], index: i });
        }
      }

      if (toTranslate.length > 0) {
        const batchResults = await TranslationService.translateBatch(toTranslate.map(t => t.text), langCode);
        for (let i = 0; i < toTranslate.length; i++) {
          const original = toTranslate[i].text;
          const translated = batchResults[i];
          results[toTranslate[i].index] = translated;

          if (translated && translated !== original) {
            try { await Translation.create({ key: original, lang: langCode, text: translated }); } catch (e) { }
          }
        }
      }

      return res.status(200).json({ translations: results });
    }

    res.status(400).json({ message: 'Missing text or texts' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
