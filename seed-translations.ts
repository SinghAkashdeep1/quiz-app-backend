import mongoose from 'mongoose';
import Category from './src/models/Category';
import Question from './src/models/Question';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';

async function seedTranslations() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Add translation for a Category
  const categories = await Category.find();
  for (const cat of categories) {
    if (cat.name === 'Science') {
      (cat as any).translations = new Map([
        ['hi', { name: 'विज्ञान' }]
      ]);
      await cat.save();
      console.log('Added Hindi translation for Science category');
    } else if (cat.name === 'History') {
      (cat as any).translations = new Map([
        ['hi', { name: 'इतिहास' }]
      ]);
      await cat.save();
      console.log('Added Hindi translation for History category');
    }
  }

  // 2. Add translations for some Questions in Science category
  const scienceCat = await Category.findOne({ name: 'Science' });
  if (scienceCat) {
    const questions = await Question.find({ categoryId: scienceCat._id });
    for (const q of questions) {
      if (q.text.includes('planet') && q.text.includes('Red')) {
         (q as any).translations = new Map([
           ['hi', { 
             text: 'कौन से ग्रह को लाल ग्रह के नाम से जाना जाता है?', 
             options: ['पृथ्वी', 'मंगल', 'बृहस्पति', 'शुक्र'] 
           }]
         ]);
         await q.save();
         console.log('Added Hindi translation for Mars question');
      }
    }
  }

  console.log('Seeding finished');
  await mongoose.disconnect();
}

seedTranslations().catch(err => console.error(err));
