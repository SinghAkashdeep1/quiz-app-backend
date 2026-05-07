/**
 * Script to clear all cached translations from Categories and Questions in MongoDB.
 * Run with: node src/scripts/clear-translations.js
 * (or via tsx for TypeScript)
 *
 * This forces the new translation system to re-translate everything fresh.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category';
import Question from '../models/Question';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp';

async function clearTranslations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all category translations
    const catResult = await Category.updateMany({}, { $set: { translations: {} } });
    console.log(`🗑️  Cleared translations from ${catResult.modifiedCount} categories`);

    // Clear all question translations
    const qResult = await Question.updateMany({}, { $set: { translations: {} } });
    console.log(`🗑️  Cleared translations from ${qResult.modifiedCount} questions`);

    console.log('\n✅ Done! The new translation system will re-translate everything on next API request.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

clearTranslations();
