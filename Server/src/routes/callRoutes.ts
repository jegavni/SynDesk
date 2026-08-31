import express from 'express';
import { getCallLogs } from '../controllers/callController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getCallLogs);

export default router;
