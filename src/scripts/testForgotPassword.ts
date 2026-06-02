import mongoose from 'mongoose';
import { forgotPassword } from '../controllers/userController';
import User from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testForgotPassword = async () => {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp');
    console.log('Connected to DB.');

    const email = 'akash.deep@yopmail.com'; // Use one from the DB
    console.log(`Testing forgotPassword for: ${email}`);

    // Mock Express req, res, next
    const req = {
      body: { email }
    } as any;

    const res = {
      json: (data: any) => {
        console.log('Response JSON:', data);
      },
      status: (code: number) => {
        console.log('Response Status:', code);
        return res;
      }
    } as any;

    const next = (err: any) => {
      console.error('Next called with error:', err);
    };

    await forgotPassword(req, res, next);
    
    console.log('Test completed.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

testForgotPassword();
