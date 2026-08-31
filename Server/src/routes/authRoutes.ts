import express from 'express';
import {
  checkAuth,
  login,
  logout,
  refresh,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Uses the httpOnly refreshToken cookie — no access token required
router.post('/refresh', refresh);

// ── Protected routes (access token required) ─────────────────────────────────
router.use(protectRoute);

router.get('/check', checkAuth);
router.put('/update-profile', updateProfile);

export default router;
