import express from 'express';
import { checkAuth, login, logout, register, updateProfile } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/check', protectRoute, checkAuth);
router.put('/update-profile', protectRoute, updateProfile);

export default router;
