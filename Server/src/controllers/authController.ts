import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import cloudinary from '../config/cloudinary.js';
import { JWT_REFRESH_SECRET } from '../config/env.js';

interface DecodedRefresh {
  userId: string;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Issues a new access + refresh token pair, rotates the refresh token in the
 * DB, sets the httpOnly refresh-token cookie, and returns a structured object
 * that the route handlers can include in their JSON responses.
 */
const issueTokens = async (
  userId: string,
  res: Response,
  /** If rotating: the old refresh token to remove from the whitelist */
  oldRefreshToken?: string
) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId, res);

  // Hash the new refresh token before storing (avoids plaintext token in DB)
  const hashedRefresh = await bcrypt.hash(refreshToken, 8);

  // Rotate and persist tokens directly on user document (keep list <= 5 devices)
  const user = await User.findById(userId);
  if (user) {
    let tokens = user.refreshTokens || [];
    if (oldRefreshToken) {
      const remaining: string[] = [];
      for (const t of tokens) {
        const isMatch = await bcrypt.compare(oldRefreshToken, t);
        if (!isMatch) remaining.push(t);
      }
      tokens = remaining;
    }
    tokens.push(hashedRefresh);
    if (tokens.length > 5) {
      tokens = tokens.slice(-5);
    }
    user.refreshTokens = tokens;
    await user.save();
  }

  return { accessToken };
};

// ─── Controllers ────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Please fill in all fields' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashedPassword });

    if (user) {
      await user.save();
      const { accessToken } = await issueTokens(user._id.toString(), res);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        lastSeenPrivacy: user.lastSeenPrivacy,
        accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Error in register controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password || '');

    if (!isPasswordCorrect) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const { accessToken } = await issueTokens(user._id.toString(), res);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      lastSeenPrivacy: user.lastSeenPrivacy,
      accessToken,
    });
  } catch (error: any) {
    console.error('Error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken as string | undefined;

    if (incomingRefreshToken) {
      // Best-effort: remove this refresh token hash from the user's whitelist.
      // We decode without verifying so we can still clean up even if the token
      // has already expired.
      try {
        const decoded = jwt.decode(incomingRefreshToken) as DecodedRefresh | null;
        if (decoded?.userId) {
          const user = await User.findById(decoded.userId);
          if (user) {
            // Remove whichever stored hash matches this refresh token
            const remainingTokens: string[] = [];
            for (const storedHash of user.refreshTokens) {
              const matches = await bcrypt.compare(incomingRefreshToken, storedHash);
              if (!matches) remainingTokens.push(storedHash);
            }
            user.refreshTokens = remainingTokens;
            await user.save();
          }
        }
      } catch {
        // If decode fails just clear cookies and proceed
      }
    }

    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Error in logout controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * POST /api/auth/refresh
 * Accepts the httpOnly refresh-token cookie and returns a new access token +
 * rotates the refresh token (token rotation prevents refresh-token reuse).
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken as string | undefined;

    if (!incomingRefreshToken) {
      res.status(401).json({ message: 'Unauthorized - No refresh token' });
      return;
    }

    // Verify the JWT signature and expiry
    let decoded: DecodedRefresh;
    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        JWT_REFRESH_SECRET
      ) as DecodedRefresh;
    } catch (err: any) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Refresh token expired — please log in again' });
      } else {
        res.status(401).json({ message: 'Invalid refresh token' });
      }
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check the incoming token against stored hashes (whitelist)
    let tokenIsValid = false;
    for (const storedHash of user.refreshTokens) {
      if (await bcrypt.compare(incomingRefreshToken, storedHash)) {
        tokenIsValid = true;
        break;
      }
    }

    if (!tokenIsValid) {
      // Possible token reuse attack — invalidate ALL refresh tokens for this user
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      res.status(401).json({ message: 'Refresh token reuse detected — please log in again' });
      return;
    }

    // Issue new token pair (rotates refresh token)
    const { accessToken } = await issueTokens(user._id.toString(), res, incomingRefreshToken);

    res.status(200).json({ accessToken });
  } catch (error: any) {
    console.error('Error in refresh controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const checkAuth = (req: Request, res: Response): void => {
  try {
    res.status(200).json(req.user);
  } catch (error: any) {
    console.error('Error in checkAuth controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, bio, profilePic, lastSeenPrivacy } = req.body;
    const userId = req.user?._id;

    let imageUrl = profilePic;
    if (profilePic && profilePic.startsWith('data:image/')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
          folder: 'syndesk_avatars',
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError: any) {
        console.error('Failed to upload image to Cloudinary:', uploadError.message);
        res.status(500).json({ message: 'Failed to upload profile picture' });
        return;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(username !== undefined && { username }),
          ...(bio !== undefined && { bio }),
          ...(profilePic !== undefined && { profilePic: imageUrl }),
          ...(lastSeenPrivacy !== undefined && { lastSeenPrivacy }),
        },
      },
      { new: true }
    ).select('-password -refreshTokens');

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error in updateProfile controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
