import Playlist from '../models/Playlist.js';
import crypto from 'crypto';

export const createPlaylist = async (req, res) => {
  const { name, description, songs, isPublic, promptUsed } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Playlist name is required' });
    }

    const shareToken = crypto.randomBytes(16).toString('hex');

    const playlist = await Playlist.create({
      name,
      description,
      creator: req.user._id,
      songs: songs || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      promptUsed: promptUsed || '',
      shareToken
    });

    res.status(201).json({ success: true, playlist });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ success: false, message: 'Failed to create playlist' });
  }
};

export const getPlaylists = async (req, res) => {
  try {
    // Get all public playlists OR private ones created by the logged-in user
    const playlists = await Playlist.find({
      $or: [
        { isPublic: true },
        { creator: req.user._id }
      ]
    })
    .populate('creator', 'username profilePic')
    .sort({ createdAt: -1 });

    res.json({ success: true, playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch playlists' });
  }
};

export const getUserPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ creator: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, playlists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user playlists' });
  }
};

export const getPlaylistById = async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await Playlist.findById(id).populate('creator', 'username profilePic');

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    // Check privacy
    if (!playlist.isPublic && playlist.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'This playlist is private' });
    }

    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch playlist' });
  }
};

export const getPlaylistByShareToken = async (req, res) => {
  const { token } = req.params;

  try {
    const playlist = await Playlist.findOne({ shareToken: token }).populate('creator', 'username profilePic');

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch shared playlist' });
  }
};

export const addSongsToPlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const { song } = req.body; // Full track details { spotifyId, name, artists, albumName, artworkUrl, durationMs, previewUrl... }

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this playlist' });
    }

    // Check if song already in playlist
    const duplicate = playlist.songs.some(s => s.spotifyId === song.spotifyId);
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Song is already in the playlist' });
    }

    playlist.songs.push(song);
    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add song to playlist' });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this playlist' });
    }

    playlist.songs = playlist.songs.filter(s => s.spotifyId !== songId);
    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove song from playlist' });
  }
};

export const deletePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this playlist' });
    }

    await Playlist.deleteOne({ _id: id });
    res.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete playlist' });
  }
};

export const toggleLikePlaylist = async (req, res) => {
  const { id } = req.params;

  try {
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    const likeIndex = playlist.likes.indexOf(req.user._id);

    if (likeIndex > -1) {
      playlist.likes.splice(likeIndex, 1);
      await playlist.save();
      return res.json({ success: true, liked: false, likesCount: playlist.likes.length });
    } else {
      playlist.likes.push(req.user._id);
      await playlist.save();
      return res.json({ success: true, liked: true, likesCount: playlist.likes.length });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to like/unlike playlist' });
  }
};
