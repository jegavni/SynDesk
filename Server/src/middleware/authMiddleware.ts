import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/userModel.js';
import { JWT_SECRET } from '../config/env.js';

interface DecodedToken {
  userId: string;
}

/**
 * Middleware that protects routes by verifying the short-lived access token.
 *
 * Token lookup order:
 *   1. Authorization: Bearer <token> header
 *   2. `jwt` cookie (legacy / fallback)
 *
 * On a 401 the client should call POST /api/auth/refresh (which uses the
 * httpOnly refreshToken cookie) to obtain a new access token and retry.
 */
export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token — prefer Authorization header over cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt as string;
    }

    if (!token) {
      res.status(401).json({ message: 'Unauthorized - No token provided' });
      return;
    }

    // 2. Verify against the ACCESS token secret
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // 3. Load the user (exclude sensitive fields)
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      res.status(401).json({ message: 'Unauthorized - User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      // Tell the client to refresh — do NOT include a new token here
      res.status(401).json({ message: 'Unauthorized - Access token expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Unauthorized - Invalid token' });
      return;
    }
    console.error('Error in protectRoute middleware:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
