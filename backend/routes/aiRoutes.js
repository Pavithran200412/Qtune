import express from 'express';
import { generateMoodRecommendations, generateAiPlaylist } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mood', protect, generateMoodRecommendations);
router.post('/playlist', protect, generateAiPlaylist);

export default router;
