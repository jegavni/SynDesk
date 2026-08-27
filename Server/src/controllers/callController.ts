import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Call } from '../models/callModel.js';

export const getCallLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
      });
      return;
    }

    const objectUserId = new Types.ObjectId(userId.toString());

    const callLogs = await Call.find({
      $or: [
        { caller: objectUserId },
        { receiver: objectUserId },
      ],
    })
      .populate('caller', 'username profilePic')
      .populate('receiver', 'username profilePic')
      .sort({ createdAt: -1 });

    res.status(200).json(callLogs);
  } catch (error: unknown) {
    console.error('Error in getCallLogs:', error);

    res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};