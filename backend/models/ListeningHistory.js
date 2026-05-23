import mongoose from 'mongoose';

const listeningHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songId: {
    type: String,
    required: true,
    index: true
  },
  songDetails: {
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
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

const ListeningHistory = mongoose.model('ListeningHistory', listeningHistorySchema);
export default ListeningHistory;
