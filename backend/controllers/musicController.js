import Song from '../models/Song.js';
import Favorite from '../models/Favorite.js';
import ListeningHistory from '../models/ListeningHistory.js';
import User from '../models/User.js';
import { spotifySearch, getAudioFeatures, refreshSpotifyToken } from '../utils/spotify.js';

// Helper to get active Spotify Access Token, refreshing it if expired
const getActiveSpotifyToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.spotifyAccessToken) return null;

  // Refresh token if expired (or within 5 minutes of expiry)
  if (user.spotifyTokenExpiry && new Date(Date.now() + 300000) > user.spotifyTokenExpiry) {
    console.log('Refreshing expired Spotify Token for user:', user.username);
    const refreshed = await refreshSpotifyToken(user.spotifyRefreshToken);
    user.spotifyAccessToken = refreshed.accessToken;
    user.spotifyTokenExpiry = new Date(Date.now() + refreshed.expiresIn * 1000);
    await user.save();
  }

  return user.spotifyAccessToken;
};

export const searchMusic = async (req, res) => {
  const { query } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const token = await getActiveSpotifyToken(req.user._id);
    const results = await spotifySearch(query, token);

    res.json({ success: true, results });
  } catch (error) {
    console.error('Search music error:', error);
    res.status(500).json({ success: false, message: 'Failed to search music' });
  }
};

export const getTrackFeatures = async (req, res) => {
  const { id } = req.params;

  try {
    const token = await getActiveSpotifyToken(req.user._id);
    const features = await getAudioFeatures(id, token);
    res.json({ success: true, features });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audio features' });
  }
};

export const addTrackToHistory = async (req, res) => {
  const { spotifyId, name, artists, albumName, artworkUrl, durationMs, previewUrl } = req.body;

  try {
    if (!spotifyId || !name || !artists) {
      return res.status(400).json({ success: false, message: 'Missing track details' });
    }

    const token = await getActiveSpotifyToken(req.user._id);
    const features = await getAudioFeatures(spotifyId, token);

    // Save to cache collection 'Song'
    let cachedSong = await Song.findOne({ spotifyId });
    if (!cachedSong) {
      cachedSong = await Song.create({
        spotifyId,
        name,
        artists,
        albumName,
        artworkUrl,
        durationMs,
        previewUrl,
        ...features
      });
    }

    // Add to ListeningHistory
    const historyEntry = await ListeningHistory.create({
      user: req.user._id,
      songId: spotifyId,
      songDetails: {
        name,
        artists,
        albumName,
        artworkUrl,
        durationMs,
        previewUrl,
        ...features
      }
    });

    res.status(201).json({ success: true, historyEntry });
  } catch (error) {
    console.error('Add track to history error:', error);
    res.status(500).json({ success: false, message: 'Failed to save to history' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const history = await ListeningHistory.find({ user: req.user._id })
      .sort({ playedAt: -1 })
      .limit(30);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

export const toggleFavoriteTrack = async (req, res) => {
  const { spotifyId, name, artists, albumName, artworkUrl, durationMs, previewUrl } = req.body;

  try {
    const existing = await Favorite.findOne({ user: req.user._id, songId: spotifyId });

    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ success: true, favorited: false, message: 'Removed from favorites' });
    } else {
      const newFav = await Favorite.create({
        user: req.user._id,
        songId: spotifyId,
        songDetails: { name, artists, albumName, artworkUrl, durationMs, previewUrl }
      });
      return res.status(201).json({ success: true, favorited: true, favorite: newFav, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Toggle favorite track error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle favorite track' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).sort({ addedAt: -1 });
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
};

export const checkFavoriteStatus = async (req, res) => {
  const { songId } = req.params;

  try {
    const favorite = await Favorite.findOne({ user: req.user._id, songId });
    res.json({ success: true, favorited: !!favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check favorite status' });
  }
};
