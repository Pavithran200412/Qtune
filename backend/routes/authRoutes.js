import express from 'express';
import { registerUser, loginUser, getProfile, connectSpotify, checkSpotifyStatus } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.post('/spotify', protect, connectSpotify);
router.get('/spotify/status', protect, checkSpotifyStatus);

export default router;
