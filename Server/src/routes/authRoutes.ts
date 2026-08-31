import express from 'express';
import { checkAuth, login, logout, register, updateProfile } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.use(protectRoute);

router.get('/check', checkAuth);
router.put('/update-profile', updateProfile);

export default router;
