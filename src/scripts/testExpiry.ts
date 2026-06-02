import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testExpiry = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp');
    console.log('Connected to DB');

    const email = 'akash.deep@yopmail.com';
    const code = '123456';
    
    // Set expiry to 5 seconds ago
    const expiredDate = new Date(Date.now() - 5000);
    
    await User.updateOne(
      { email },
      { 
        resetPasswordToken: code,
        resetPasswordExpires: expiredDate 
      }
    );
    console.log(`Set expired OTP for ${email}. Expiry: ${expiredDate}`);

    // Try to find it with $gt now
    const now = new Date();
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: now }
    });

    if (user) {
      console.error('FAIL: Found expired user!');
    } else {
      console.log('SUCCESS: Expired user not found.');
    }

    // Set expiry to 5 seconds in future
    const futureDate = new Date(Date.now() + 5000);
    await User.updateOne(
      { email },
      { 
        resetPasswordToken: code,
        resetPasswordExpires: futureDate 
      }
    );
    console.log(`Set valid OTP for ${email}. Expiry: ${futureDate}`);

    const user2 = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: now }
    });

    if (user2) {
      console.log('SUCCESS: Valid user found.');
    } else {
      console.error('FAIL: Valid user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testExpiry();
