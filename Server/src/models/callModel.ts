import mongoose, { Schema, Types } from 'mongoose';

export interface ICall {
  caller: Types.ObjectId;
  receiver: Types.ObjectId;
  type: 'voice' | 'video';
  status: 'missed' | 'rejected' | 'answered';
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    caller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
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