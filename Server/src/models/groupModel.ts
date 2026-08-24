import mongoose, { Document, Schema } from "mongoose";

export interface IGroup extends Document {
  name: string;
  creator: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isGroup: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model<IGroup>("Group", groupSchema);