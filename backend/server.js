import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['*'];

// Socket.io Setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins[0] === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins[0] === '*' ? '*' : allowedOrigins,
  credentials: true
}));
app.use(express.json());

// API Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Attach socket.io to request object so controllers can access it if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes Hookups
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/ai', aiRoutes);

// Health Check Root
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'Qtune API Gateway',
    time: new Date()
  });
});

// Socket.io Connection Handler for Real-Time Social Music Interaction
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // User enters a song-listening room
  socket.on('join_song', ({ songId }) => {
    socket.join(`song_${songId}`);
    console.log(`Socket ${socket.id} joined room song_${songId}`);
  });

  // User leaves a song-listening room
  socket.on('leave_song', ({ songId }) => {
    socket.leave(`song_${songId}`);
    console.log(`Socket ${socket.id} left room song_${songId}`);
  });

  // Broadcast real-time comments written by listening users
  socket.on('send_comment', (data) => {
    // data: { comment: { _id, text, reactionEmoji, user: { username, profilePic } }, songId }
    socket.to(`song_${data.songId}`).emit('receive_comment', data.comment);
    console.log(`Broadcasting new comment on song_${data.songId}`);
  });

  // Broadcast flying reaction emojis clicked by active listeners
  socket.on('send_reaction', (data) => {
    // data: { songId, emoji, username }
    io.to(`song_${data.songId}`).emit('receive_reaction', {
      emoji: data.emoji,
      username: data.username,
      timestamp: Date.now()
    });
    console.log(`Realtime Reaction: User ${data.username} sent ${data.emoji} on song_${data.songId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// MongoDB Connection with Local Fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soundsphere';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connection established successfully.');
    // Start Server after database connects
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Qtune Gateway running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB Connection failed! Make sure MongoDB service is running.', err.message);
    console.log('Starting server in Mock Database mode so API calls can still be developed...');
    
    // Fallback start so the server operates even if Mongo isn't running locally!
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Qtune Gateway [DB DISCONNECTED MOCK MODE] running on port ${PORT}`);
    });
  });
