import mongoose from 'mongoose';
import Category from '../models/Category';
import Question from '../models/Question';
import TranslationService from '../services/translationService';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';

const TARGET_LANGS = ['hi', 'es', 'fr', 'de', 'it'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function translateDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Translate Categories
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories. Starting translation...`);

    for (const cat of categories) {
      for (const lang of TARGET_LANGS) {
        const translations = (cat as any).translations || new Map();
        if (!translations.get(lang)) {
          console.log(`Translating category "${cat.name}" to ${lang}...`);
          const translatedName = await TranslationService.translateText(cat.name, lang);
          
          if (translatedName && translatedName !== cat.name) {
            translations.set(lang, { name: translatedName });
            (cat as any).translations = translations;
            await delay(1000); // 1 second delay between requests
          }
        }
      }
      await cat.save();
    }
    console.log('Categories translated successfully.');

    // 2. Translate Questions
    const questions = await Question.find();
    console.log(`Found ${questions.length} questions. Starting translation...`);

    for (const q of questions) {
      for (const lang of TARGET_LANGS) {
        const translations = (q as any).translations || new Map();
        if (!translations.get(lang)) {
          console.log(`Translating question "${q.text.substring(0, 30)}..." to ${lang}...`);
          const translated = await TranslationService.translateQuestion(q, lang);
          
          if (translated && translated.text !== q.text) {
            translations.set(lang, {
              text: translated.text,
              options: translated.options,
              matchingPairs: translated.matchingPairs
            });
            (q as any).translations = translations;
            await delay(2000); // 2 seconds delay for questions (more text)
          }
        }
      }
      await q.save();
    }
    console.log('Questions translated successfully.');

    console.log('Database translation finished!');
  } catch (error) {
    console.error('Translation script error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

translateDB();
