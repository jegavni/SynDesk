import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const generateToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  });

  res.cookie('jwt', token, {
    maxAge: 1 * 60 * 60 * 1000, // 1 hour in MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none', // Allow cross-site cookies in production
    secure: process.env.NODE_ENV !== 'development',
  });

  return token;
};
