import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp');
    const user = await User.findOne({ email: 'akash.deep@yopmail.com' });
    if (user) {
      console.log('User found:', user.email);
      console.log('User role:', user.role);
    } else {
      console.log('User NOT found');
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error: ', error);
  }
};

checkUser();
