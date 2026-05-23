import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [{
    spotifyId: String,
    name: String,
    artists: [String],
    albumName: String,
    artworkUrl: String,
    durationMs: Number,
    previewUrl: String,
    energy: Number,
    danceability: Number,
    tempo: Number,
    acousticness: Number,
    valence: Number
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  promptUsed: {
    type: String,
    default: ''
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
