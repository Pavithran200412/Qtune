import express from 'express';
import { createPlaylist, getPlaylists, getUserPlaylists, getPlaylistById, getPlaylistByShareToken, addSongsToPlaylist, removeSongFromPlaylist, deletePlaylist, toggleLikePlaylist } from '../controllers/playlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createPlaylist);
router.get('/', protect, getPlaylists);
router.get('/user', protect, getUserPlaylists);
router.get('/:id', protect, getPlaylistById);
router.get('/share/:token', protect, getPlaylistByShareToken);
router.post('/:playlistId/song', protect, addSongsToPlaylist);
router.delete('/:playlistId/song/:songId', protect, removeSongFromPlaylist);
router.delete('/:id', protect, deletePlaylist);
router.post('/:id/like', protect, toggleLikePlaylist);

export default router;
