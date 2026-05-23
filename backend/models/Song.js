import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  artists: {
    type: [String],
    required: true
  },
  albumName: {
    type: String,
    default: ''
  },
  artworkUrl: {
    type: String,
    default: ''
  },
  durationMs: {
    type: Number,
    required: true
  },
  previewUrl: {
    type: String,
    default: ''
  },
  energy: {
    type: Number,
    default: 0
  },
  danceability: {
    type: Number,
    default: 0
  },
  tempo: {
    type: Number,
    default: 0
  },
  acousticness: {
    type: Number,
    default: 0
  },
  valence: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Song = mongoose.model('Song', songSchema);
export default Song;
