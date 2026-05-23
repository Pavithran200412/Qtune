import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Send, MessageCircle, Smile } from 'lucide-react';
import { SOCKET_URL } from '../utils/api';

const CommentSection = ({ songId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [reactions, setReactions] = useState([]); // Array of flying reactions: { id, emoji, username, x, y }

  const socketRef = useRef(null);
  const commentEndRef = useRef(null);

  const emojiList = ['🔥', '❤️', '😢', '😂', '🎉', '🎸', '🌟'];

  // Fetch comments and setup Sockets on mount/song change
  useEffect(() => {
    if (!songId) return;

    fetchComments();

    // Establish Socket.io connection pointing to Express server proxy/origin
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Join room for this specific song
    socket.emit('join_song', { songId });

    // Listen for comments added by other users
    socket.on('receive_comment', (comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    // Listen for emoji reactions clicked by other users
    socket.on('receive_reaction', (reaction) => {
      triggerFlyingEmoji(reaction.emoji, reaction.username);
    });

    return () => {
      socket.emit('leave_song', { songId });
      socket.disconnect();
    };
  }, [songId]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/social/comments/${songId}`);
      if (res.data.success) {
        setComments(res.data.comments);
      }
    } catch (e) {
      console.warn('Failed to load comments:', e.message);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await axios.post('/api/social/comments', {
        songId,
        text: newComment,
        reactionEmoji: selectedEmoji
      });

      if (res.data.success) {
        const comment = res.data.comment;
        // Append locally
        setComments((prev) => [comment, ...prev]);
        setNewComment('');

        // Broadcast to other listeners
        if (socketRef.current) {
          socketRef.current.emit('send_comment', { comment, songId });
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleSendReaction = (emoji) => {
    if (!user) return;
    
    // Animate locally and broadcast
    triggerFlyingEmoji(emoji, user.username);
    if (socketRef.current) {
      socketRef.current.emit('send_reaction', { songId, emoji, username: user.username });
    }
  };

  // Helper to spawn a flying emoji reaction node
  const triggerFlyingEmoji = (emoji, username) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Randomize pathing positions
    const x = 20 + Math.random() * 60; // Percent offset
    const newReaction = { id, emoji, username, x };
    
    setReactions((prev) => [...prev, newReaction]);

    // Cleanup after animation completes (3s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  return (
    <div className="flex flex-col h-[400px] border border-slate-500/10 rounded-2xl bg-slate-950/20 backdrop-blur-md relative overflow-hidden">
      
      {/* Floating Reaction Canvas Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-2 flex flex-col items-center animate-flying-reaction text-center"
            style={{ left: `${r.x}%` }}
          >
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{r.emoji}</span>
            <span className="text-[9px] text-white/70 bg-black/40 px-1 py-0.5 rounded backdrop-blur-sm truncate max-w-16">
              {r.username}
            </span>
          </div>
        ))}
      </div>

      {/* Header and Flying Reactions Selector */}
      <div className="p-4 border-b border-slate-500/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm">Live Interactions</span>
        </div>

        {/* Reaction Buttons */}
        <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {emojiList.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="hover:scale-125 transition-transform px-1 py-0.5 text-sm"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse custom-scrollbar">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3 bg-slate-900/20 hover:bg-slate-900/40 p-3 rounded-xl border border-white/5 transition-all">
              <img
                src={comment.user?.profilePic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.user?.username}`}
                alt={comment.user?.username}
                className="w-8 h-8 rounded-full border border-purple-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-300 truncate">{comment.user?.username}</span>
                  <div className="flex items-center gap-1.5">
                    {comment.reactionEmoji && (
                      <span className="text-xs bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                        {comment.reactionEmoji}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed break-words">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="my-auto text-center py-10">
            <Smile className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-slate-500">No active chat feeds. Say something first!</p>
          </div>
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handlePostComment} className="p-3 border-t border-slate-500/10 flex gap-2 z-10 bg-slate-950/40">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts on this vibe..."
          className="flex-1 bg-slate-900/60 rounded-xl px-4 py-2 text-xs border border-white/5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-slate-100"
        />

        {/* Reaction selector inside input bar */}
        <select
          value={selectedEmoji}
          onChange={(e) => setSelectedEmoji(e.target.value)}
          className="bg-slate-900 border border-white/5 rounded-xl text-sm px-2 focus:outline-none"
        >
          {emojiList.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
        </select>

        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
