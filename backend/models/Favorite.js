import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
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
    previewUrl: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate favorites for the same user & song
favoriteSchema.index({ user: 1, songId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
