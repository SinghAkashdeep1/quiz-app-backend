import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Category from './models/Category';
import Question from './models/Question';
import Admin from './models/Admin';
import Icon from './models/Icon';
import connectDB from './config/db';

dotenv.config();
connectDB();

const categories = [
  { name: 'Kids', icon: 'child_care', color: '#FF9800' },
  { name: 'Movies', icon: 'movie', color: '#E91E63' },
  { name: 'General Knowledge', icon: 'public', color: '#2196F3' },
  { name: 'Current Affairs', icon: 'event', color: '#4CAF50' },
  { name: 'Sports', icon: 'fitness_center', color: '#00BCD4' },
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
];

const importData = async () => {
  try {
    await Category.deleteMany();
    await Question.deleteMany();
    await Admin.deleteMany();
    await Icon.deleteMany();

    await Icon.insertMany(icons);

    const createdCategories = await Category.insertMany(categories);

    const kidsId = createdCategories[0]._id;

    const questions = [
      {
        categoryId: kidsId,
        text: 'What is the color of an emerald?',
        options: ['Red', 'Green', 'Blue', 'Yellow'],
        correctAnswerIndex: 1,
      },
      {
        categoryId: kidsId,
        text: 'How many legs does a spider have?',
        options: ['6', '8', '10', '4'],
        correctAnswerIndex: 1,
      },
    ];

    await Question.insertMany(questions);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await Admin.create({ 
      username: 'admin', 
      email: 'admin@quiz.com', 
      password: hashedPassword 
    });

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
