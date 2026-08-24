import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
  caller: mongoose.Schema.Types.ObjectId;
  receiver: mongoose.Schema.Types.ObjectId;
  type: 'voice' | 'video';
  status: 'missed' | 'rejected' | 'answered';
  duration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['voice', 'video'],
      required: true,
    },
    status: {
      type: String,
      enum: ['missed', 'rejected', 'answered'],
      default: 'missed',
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Call = mongoose.model<ICall>('Call', callSchema);
