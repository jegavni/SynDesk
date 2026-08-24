import express from 'express';
import { getMessages, getUsersForSidebar, sendMessage, createGroup, deleteMessage } from '../controllers/messageController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/users', protectRoute, getUsersForSidebar);
router.post('/groups', protectRoute, createGroup);
router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, sendMessage);
router.delete('/:id', protectRoute, deleteMessage);

export default router;
