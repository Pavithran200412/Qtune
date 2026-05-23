import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getSpotifyTokensFromCode, refreshSpotifyToken } from '../utils/spotify.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'qtune_secret_key_2026_super_secure', {
    expiresIn: '30d'
  });
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email or Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profilePic: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        favoriteGenres: user.favoriteGenres
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server Signup error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        favoriteGenres: user.favoriteGenres,
        spotifyId: user.spotifyId,
        spotifyConnected: !!user.spotifyAccessToken
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Login error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile retrieval error' });
  }
};

export const connectSpotify = async (req, res) => {
  const { code } = req.body;

  try {
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    const tokenData = await getSpotifyTokensFromCode(code);
    
    // Save to user
    const user = await User.findById(req.user._id);
    user.spotifyId = tokenData.spotifyId;
    user.spotifyAccessToken = tokenData.accessToken;
    user.spotifyRefreshToken = tokenData.refreshToken;
    user.spotifyTokenExpiry = new Date(Date.now() + tokenData.expiresIn * 1000);
    
    if (tokenData.profilePic) {
      user.profilePic = tokenData.profilePic;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Spotify account connected successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        spotifyConnected: true,
        spotifyId: user.spotifyId
      }
    });
  } catch (error) {
    console.error('Spotify connection error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect Spotify' });
  }
};

export const checkSpotifyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isConnected = !!user.spotifyAccessToken;
    
    res.json({
      success: true,
      spotifyConnected: isConnected,
      spotifyId: user.spotifyId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check status' });
  }
};
