import Comment from '../models/Comment.js';
import User from '../models/User.js';

export const addComment = async (req, res) => {
  const { songId, text, reactionEmoji } = req.body;

  try {
    if (!songId || !text) {
      return res.status(400).json({ success: false, message: 'Song ID and comment text are required' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      songId,
      text,
      reactionEmoji: reactionEmoji || ''
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'username profilePic');

    // Return the newly created comment
    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
};

export const getSongComments = async (req, res) => {
  const { songId } = req.params;

  try {
    const comments = await Comment.find({ songId })
      .populate('user', 'username profilePic')
      .sort({ createdAt: -1 });

    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

export const toggleFollowUser = async (req, res) => {
  const { followId } = req.body;

  try {
    if (followId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(followId);
    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const followIndex = currentUser.followedUsers.indexOf(followId);

    if (followIndex > -1) {
      // Unfollow
      currentUser.followedUsers.splice(followIndex, 1);
      await currentUser.save();
      res.json({ success: true, followed: false, message: `Unfollowed ${userToFollow.username}` });
    } else {
      // Follow
      currentUser.followedUsers.push(followId);
      await currentUser.save();
      res.json({ success: true, followed: true, message: `Followed ${userToFollow.username}` });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Failed to follow user' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Return other users in the system to connect with
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username profilePic favoriteGenres')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users list' });
  }
};
