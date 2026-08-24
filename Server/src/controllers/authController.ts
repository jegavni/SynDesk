import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/userModel.js';
import { generateToken } from '../utils/generateToken.js';
import cloudinary from '../config/cloudinary.js';

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

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    if (user) {
      await user.save();
      generateToken(user._id.toString(), res);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
        lastSeenPrivacy: user.lastSeenPrivacy,
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

    generateToken(user._id.toString(), res);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      lastSeenPrivacy: user.lastSeenPrivacy,
    });
  } catch (error: any) {
    console.error('Error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Error in logout controller', error.message);
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
    ).select('-password');

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
