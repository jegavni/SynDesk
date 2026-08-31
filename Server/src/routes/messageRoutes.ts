import express from 'express';
import { getMessages, getUsersForSidebar, sendMessage, createGroup, deleteMessage } from '../controllers/messageController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/users', getUsersForSidebar);
router.post('/groups', createGroup);
router.get('/:id', getMessages);
router.post('/send/:id', sendMessage);
router.delete('/:id', deleteMessage);

export default router;
