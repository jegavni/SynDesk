import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Call } from './src/models/callModel.js';
import { User } from './src/models/userModel.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || '');
    console.log('Connected to DB');
    
    const calls = await Call.find().populate('caller').populate('receiver');
    console.log('Total calls in DB:', calls.length);
    if (calls.length > 0) {
      console.log('Sample call:', JSON.stringify(calls[0], null, 2));
    } else {
      console.log('No calls found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
};

run();
