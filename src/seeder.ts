import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from './models/Category';
import Question from './models/Question';
import User from './models/User';
import Icon from './models/Icon';
import connectDB from './config/db';

dotenv.config();
connectDB();

const categoryTemplates = [
  { name: 'Kids', icon: 'child_care', color: '#FF9800', guestCreditLimit: 2, rewards: { easy: 10, medium: 25, hard: 60 }, translations: { hi: { name: 'बच्चे' }, es: { name: 'Niños' }, fr: { name: 'Enfants' } } },
  { name: 'Movies', icon: 'movie', color: '#E91E63', guestCreditLimit: 3, rewards: { easy: 15, medium: 35, hard: 80 }, translations: { hi: { name: 'फिल्में' }, es: { name: 'Películas' }, fr: { name: 'Films' } } },
  { name: 'General Knowledge', icon: 'public', color: '#2196F3', guestCreditLimit: 5, rewards: { easy: 20, medium: 50, hard: 100 }, translations: { hi: { name: 'सामान्य ज्ञान' }, es: { name: 'Cultura General' }, fr: { name: 'Culture Générale' } } },
  { name: 'Current Affairs', icon: 'event', color: '#4CAF50', guestCreditLimit: 0, rewards: { easy: 50, medium: 100, hard: 250 }, translations: { hi: { name: 'सामयिकी' }, es: { name: 'Actualidad' }, fr: { name: 'Actualités' } } },
  { name: 'Sports', icon: 'fitness_center', color: '#00BCD4', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 120 }, translations: { hi: { name: 'खेल' }, es: { name: 'Deportes' }, fr: { name: 'Sports' } } },
  { name: 'Science', icon: 'science', color: '#673AB7', guestCreditLimit: 4, rewards: { easy: 20, medium: 45, hard: 110 }, translations: { hi: { name: 'विज्ञान' }, es: { name: 'Ciencia' }, fr: { name: 'Science' } } },
  { name: 'History', icon: 'history', color: '#795548', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 90 }, translations: { hi: { name: 'इतिहास' }, es: { name: 'Historia' }, fr: { name: 'Histoire' } } },
  { name: 'Geography', icon: 'explore', color: '#3F51B5', guestCreditLimit: 4, rewards: { easy: 15, medium: 35, hard: 85 }, translations: { hi: { name: 'भूगोल' }, es: { name: 'Geografía' }, fr: { name: 'Géographie' } } },
  { name: 'Music', icon: 'music_note', color: '#F44336', guestCreditLimit: 5, rewards: { easy: 10, medium: 30, hard: 75 }, translations: { hi: { name: 'संगीत' }, es: { name: 'Música' }, fr: { name: 'Musique' } } },
  { name: 'Art', icon: 'brush', color: '#9C27B0', guestCreditLimit: 3, rewards: { easy: 15, medium: 40, hard: 100 }, translations: { hi: { name: 'कला' }, es: { name: 'Arte' }, fr: { name: 'Art' } } },
  { name: 'Technology', icon: 'computer', color: '#607D8B', guestCreditLimit: 2, rewards: { easy: 25, medium: 60, hard: 150 }, translations: { hi: { name: 'तकनीक' }, es: { name: 'Tecnología' }, fr: { name: 'Technologie' } } },
  { name: 'Literature', icon: 'menu_book', color: '#8BC34A', guestCreditLimit: 4, rewards: { easy: 20, medium: 45, hard: 95 }, translations: { hi: { name: 'साहित्य' }, es: { name: 'Literatura' }, fr: { name: 'Littérature' } } },
  { name: 'Food & Drink', icon: 'restaurant', color: '#FF5722', guestCreditLimit: 5, rewards: { easy: 10, medium: 25, hard: 70 }, translations: { hi: { name: 'खाना-पीना' }, es: { name: 'Comida y Bebida' }, fr: { name: 'Nourriture' } } },
  { name: 'Animals', icon: 'pets', color: '#009688', guestCreditLimit: 4, rewards: { easy: 10, medium: 30, hard: 65 }, translations: { hi: { name: 'जानवर' }, es: { name: 'Animales' }, fr: { name: 'Animaux' } } },
  { name: 'Space', icon: 'auto_awesome', color: '#263238', guestCreditLimit: 3, rewards: { easy: 30, medium: 75, hard: 200 }, translations: { hi: { name: 'अंतरिक्ष' }, es: { name: 'Espacio' }, fr: { name: 'Espace' } } }
];

const icons = [
  { name: 'child_care', label: 'Child Care' },
  { name: 'movie', label: 'Movie' },
  { name: 'public', label: 'Public' },
  { name: 'event', label: 'Event' },
  { name: 'school', label: 'School' },
  { name: 'science', label: 'Science' },
  { name: 'history', label: 'History' },
  { name: 'fitness_center', label: 'Sports' },
  { name: 'pets', label: 'Pets' },
  { name: 'explore', label: 'Explore' },
  { name: 'psychology', label: 'Brain' },
  { name: 'menu_book', label: 'Book' },
  { name: 'computer', label: 'Computer' },
  { name: 'music_note', label: 'Music' },
  { name: 'brush', label: 'Art' },
  { name: 'videogame_asset', label: 'Gaming' },
  { name: 'restaurant', label: 'Food' },
  { name: 'auto_awesome', label: 'Space' }
];

const generateQuestions = (categoryId: string, categoryName: string) => {
  const qs = [];
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  for (const diff of difficulties) {
    const count = diff === 'hard' ? 10 : 20;
    for (let i = 1; i <= count; i++) {
      const isBoolean = Math.random() > 0.7;
      qs.push({
        categoryId,
        difficulty: diff,
        type: isBoolean ? 'boolean' : 'mcq',
        text: `${categoryName} ${diff} question ${i}: What is the correct answer for this ${diff} task?`,
        options: isBoolean ? ['True', 'False'] : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: isBoolean ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4),
        weightage: diff === 'easy' ? 10 : (diff === 'medium' ? 20 : 50),
        timeLimit: diff === 'easy' ? 15 : (diff === 'medium' ? 30 : 45),
        translations: {
          hi: {
            text: `${categoryName} ${diff} प्रश्न ${i}: इस ${diff} कार्य के लिए सही उत्तर क्या है?`,
            options: isBoolean ? ['सही', 'गलत'] : [`विकल्प अ`, `विकल्प ब`, `विकल्प स`, `विकल्प द`]
          },
          es: {
            text: `${categoryName} ${diff} pregunta ${i}: ¿Cuál es la respuesta correcta para esta tarea ${diff}?`,
            options: isBoolean ? ['Verdadero', 'Falso'] : [`Opción A`, `Opción B`, `Opción C`, `Opción D`]
          },
          fr: {
            text: `${categoryName} ${diff} question ${i}: Quelle est la bonne réponse pour cette tâche ${diff}?`,
            options: isBoolean ? ['Vrai', 'Faux'] : [`Option A`, `Option B`, `Option C`, `Option D`]
          }
        }
      });
    }
  }
  return qs;
};

const importData = async () => {
  try {
    console.log('Cleaning existing data...');
    await Category.deleteMany();
    await Question.deleteMany();
    await User.deleteMany();
    await Icon.deleteMany();

    try {
      await Category.collection.dropIndexes();
      await User.collection.dropIndexes();
    } catch (e) {
      console.log('No indexes to drop');
    }

    console.log('Inserting icons and categories...');
    await Icon.insertMany(icons);
    
    const preparedCategories = categoryTemplates.map(c => ({
      ...c,
      isGuestAllowed: c.name !== 'Current Affairs',
      guestAccess: {
        easy: true,
        medium: c.name === 'General Knowledge' || c.name === 'Space' || c.name === 'Movies',
        hard: c.name === 'General Knowledge' || c.name === 'Space'
      }
    }));

    const createdCategories = await Category.insertMany(preparedCategories);

    console.log('Generating 750 questions...');
    const allQuestions: any[] = [];
    createdCategories.forEach(cat => {
      const qs = generateQuestions(cat._id.toString(), cat.name);
      allQuestions.push(...qs);
    });

    await Question.insertMany(allQuestions);

    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await User.create([
      {
        username: 'admin',
        email: 'admin@quiz.com',
        password: hashedPassword,
        role: 'admin',
        coins: 10000,
        credits: 10
      },
      {
        username: 'player1',
        email: 'player@quiz.com',
        password: hashedPassword,
        role: 'user',
        coins: 500,
        credits: 3,
        completedLevels: [
          { 
            categoryId: createdCategories[0]._id, 
            difficulty: 'easy', 
            score: 95, 
            stars: 3 
          }
        ],
        categoryLevels: [
          { categoryId: createdCategories[0]._id, level: 5 }
        ]
      }
    ]);

    console.log(`Successfully seeded:
    - ${createdCategories.length} Categories
    - ${allQuestions.length} Questions
    - 2 Users (admin & player1)
    - ${icons.length} Icons`);

    process.exit();
  } catch (error) {
    console.error(`Error during seeding: ${error}`);
    process.exit(1);
  }
};

importData();
