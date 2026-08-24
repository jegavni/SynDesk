import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  profilePic: string;
  isOnline: boolean;
  lastSeen: Date;
  bio: string;
  lastSeenPrivacy: 'everyone' | 'nobody';
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    bio: {
      type: String,
      default: 'Hey there! I am using SynDesk.',
    },
    lastSeenPrivacy: {
      type: String,
      enum: ['everyone', 'nobody'],
      default: 'everyone',
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
