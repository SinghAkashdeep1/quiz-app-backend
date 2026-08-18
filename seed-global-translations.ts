import mongoose from 'mongoose';
import Category from './src/models/Category';
import Translation from './src/models/Translation';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';

const CORE_TRANSLATIONS: Record<string, Record<string, string>> = {
  'General Knowledge': {
    hi: 'सामान्य ज्ञान',
    es: 'Cultura General',
    fr: 'Culture Générale'
  },
  'Science': {
    hi: 'विज्ञान',
    es: 'Ciencia',
    fr: 'Science'
  },
  'Mathematics': {
    hi: 'गणित',
    es: 'Matemáticas',
    fr: 'Mathématiques'
  },
  'History': {
    hi: 'इतिहास',
    es: 'Historia',
    fr: 'Histoire'
  },
  'Geography': {
    hi: 'भूगोल',
    es: 'Geografía',
    fr: 'Géographie'
  },
  'Sports': {
    hi: 'खेल',
    es: 'Deportes',
    fr: 'Sports'
  },
  'Movies': {
    hi: 'फ़िल्में',
    es: 'Películas',
    fr: 'Films'
  }
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = await Category.find();

  for (const cat of categories) {
    const translations = CORE_TRANSLATIONS[cat.name];
    if (translations) {
      console.log(`Seeding translations for category: ${cat.name}`);

      const update: any = { translations: cat.translations || new Map() };

      for (const [lang, name] of Object.entries(translations)) {
        update.translations.set(lang, { name });

        // Also seed global translations table for the name itself
        await Translation.findOneAndUpdate(
          { key: cat.name, lang },
          { text: name },
          { upsert: true }
        );
      }

      await Category.updateOne({ _id: cat._id }, { $set: { translations: update.translations } });
    }
  }

  // Also seed some common UI labels for Admin Portal
  const labels: Record<string, Record<string, string>> = {
    'Dashboard': { hi: 'डैशबोर्ड', es: 'Tablero' },
    'Categories': { hi: 'श्रेणियाँ', es: 'Categorías' },
    'Questions': { hi: 'सवाल', es: 'Preguntas' },
    'Users': { hi: 'उपयोगकर्ता', es: 'Usuarios' },
    'Logout': { hi: 'लॉगआउट', es: 'Cerrar sesión' },
    'Dark Mode': { hi: 'डार्क मोड', es: 'Modo oscuro' },
    'Light Mode': { hi: 'लाइट मोड', es: 'Modo luz' },
    'Administrator': { hi: 'प्रशासक', es: 'Administrador' }
  };

  for (const [key, trans] of Object.entries(labels)) {
    for (const [lang, text] of Object.entries(trans)) {
      await Translation.findOneAndUpdate(
        { key, lang },
        { text },
        { upsert: true }
      );
    }
  }

  console.log('Global seeding finished');
  await mongoose.disconnect();
}

seed().catch(err => console.error(err));
