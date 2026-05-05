import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCol = mongoose.connection.db.collection('users');
    const indexes = await userCol.indexes();
    console.log('User Indexes:', JSON.stringify(indexes, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkIndexes();
