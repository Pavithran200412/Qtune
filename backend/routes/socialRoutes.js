import express from 'express';
import { addComment, getSongComments, toggleFollowUser, getAllUsers } from '../controllers/socialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/comments', protect, addComment);
router.get('/comments/:songId', protect, getSongComments);
router.post('/follow', protect, toggleFollowUser);
router.get('/users', protect, getAllUsers);

export default router;
