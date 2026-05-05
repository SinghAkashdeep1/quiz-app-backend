const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkIndexes = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    const userCol = mongoose.connection.db.collection('users');
    const indexes = await userCol.indexes();
    console.log('User Indexes:', JSON.stringify(indexes, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkIndexes();
