import mongoose from 'mongoose';
import Category from './src/models/Category';
import Question from './src/models/Question';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';

async function seedGlobalTranslations() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Add translations for Categories
  const categories = await Category.find();
  for (const cat of categories) {
    if (cat.name === 'Science') {
      (cat as any).translations.set('hi', { name: 'विज्ञान' });
      (cat as any).translations.set('es', { name: 'Ciencia' });
      (cat as any).translations.set('fr', { name: 'Science' });
      await cat.save();
      console.log('Updated translations for Science');
    } else if (cat.name === 'History') {
      (cat as any).translations.set('hi', { name: 'इतिहास' });
      (cat as any).translations.set('es', { name: 'Historia' });
      (cat as any).translations.set('fr', { name: 'Histoire' });
      await cat.save();
      console.log('Updated translations for History');
    }
  }

  // 2. Add translations for first Science question
  const scienceCat = await Category.findOne({ name: 'Science' });
  if (scienceCat) {
    const q = await Question.findOne({ categoryId: scienceCat._id });
    if (q) {
         (q as any).translations.set('es', { 
            text: 'Primera pregunta de ciencia: ¿Cuál es la respuesta correcta?', 
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'] 
         });
         (q as any).translations.set('fr', { 
            text: 'Première question de science : quelle est la bonne réponse ?', 
            options: ['Option A', 'Option B', 'Option C', 'Option D'] 
         });
         await q.save();
         console.log('Added Spanish/French translations for first Science question');
    }
  }

  console.log('Seeding finished');
  await mongoose.disconnect();
}

seedGlobalTranslations().catch(err => console.error(err));
