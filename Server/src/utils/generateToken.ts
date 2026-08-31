import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/env.js';

/**
 * Signs and returns a short-lived access token (default 15 min).
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

/**
 * Signs a long-lived refresh token (default 7 days), sets it as an
 * httpOnly cookie and returns the raw token string so it can be
 * persisted (hashed) in the database.
 */
export const generateRefreshToken = (userId: string, res: Response): string => {
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });

  // 7 days in ms
  const maxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie('refreshToken', refreshToken, {
    maxAge,
    httpOnly: true,  // not accessible via JS — XSS protection
    sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none',
    secure: process.env.NODE_ENV !== 'development',
    path: '/api/auth/refresh', // scope cookie to refresh endpoint only
  });

  return refreshToken;
};
