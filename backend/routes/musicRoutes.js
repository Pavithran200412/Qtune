import express from 'express';
import { searchMusic, getTrackFeatures, addTrackToHistory, getHistory, toggleFavoriteTrack, getFavorites, checkFavoriteStatus } from '../controllers/musicController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', protect, searchMusic);
router.get('/features/:id', protect, getTrackFeatures);
router.post('/history', protect, addTrackToHistory);
router.get('/history', protect, getHistory);
router.post('/favorite', protect, toggleFavoriteTrack);
router.get('/favorite', protect, getFavorites);
router.get('/favorite/:songId', protect, checkFavoriteStatus);

export default router;
