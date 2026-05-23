import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, Plus, MoreVertical, Heart, Volume2 } from 'lucide-react';
import axios from 'axios';

const MusicCard = ({ track, tracksList = [], index = -1 }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, playQueue, queue } = useAudio();
  const [isLiked, setIsLiked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  const isCurrent = currentTrack?.spotifyId === track.spotifyId;

  useEffect(() => {
    checkLike();
  }, [track.spotifyId]);

  const checkLike = async () => {
    try {
      const res = await axios.get(`/api/music/favorite/${track.spotifyId}`);
      if (res.data.success) {
        setIsLiked(res.data.favorited);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      if (tracksList.length > 0 && index > -1) {
        playQueue(tracksList, index);
      } else {
        playTrack(track);
      }
    }
  };

  const handleLikeToggle = async (e) => {
    e.stopPropagation();
    try {
      const res = await axios.post('/api/music/favorite', track);
      if (res.data.success) {
        setIsLiked(res.data.favorited);
      }
    } catch (error) {
      console.error('Failed toggling favorite:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get('/api/playlist/user');
      if (res.data.success) {
        setPlaylists(res.data.playlists);
      }
    } catch (e) {
      console.warn('Failed listing user playlists');
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchPlaylists();
    }
  };

  const handleAddToPlaylist = async (playlistId, e) => {
    e.stopPropagation();
    setShowDropdown(false);
    try {
      const res = await axios.post(`/api/playlist/${playlistId}/song`, { song: track });
      if (res.data.success) {
        alert(`Successfully appended "${track.name}" to playlist!`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed appending song to playlist');
    }
  };

  const handleCreateAndAddPlaylist = async (e) => {
    e.stopPropagation();
    const name = prompt("Enter new playlist name:");
    if (!name || !name.trim()) return;

    try {
      const res = await axios.post('/api/playlist', {
        name: name.trim(),
        description: 'Created from song card',
        isPublic: true
      });

      if (res.data.success) {
        const newPl = res.data.playlist;
        setPlaylists(prev => [newPl, ...prev]);
        
        // Now add the song to this new playlist
        const addRes = await axios.post(`/api/playlist/${newPl._id}/song`, { song: track });
        if (addRes.data.success) {
          alert(`Successfully created playlist "${name}" and added "${track.name}"!`);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed creating and adding to playlist');
    }
    setShowDropdown(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const close = () => setShowDropdown(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showDropdown]);

  return (
    <div 
      onClick={handleCardClick}
      className={`glass-panel glass-panel-hover p-4 rounded-2xl flex flex-col gap-3 relative cursor-pointer min-w-[160px] max-w-[210px] w-full select-none
        ${isCurrent ? 'border-purple-500/40 shadow-[0_0_20px_rgba(147,51,234,0.1)]' : ''}
      `}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/5 group">
        <img 
          src={track.artworkUrl} 
          alt={track.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          loading="lazy"
        />

        {/* Hover overlay shadow */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
          <button 
            className="bg-purple-600 text-white p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-purple-600/30"
            onClick={(e) => {
              e.stopPropagation();
              isCurrent ? togglePlay() : (tracksList.length > 0 && index > -1 ? playQueue(tracksList, index) : playTrack(track));
            }}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Playing live status indicator */}
        {isCurrent && isPlaying && (
          <div className="absolute bottom-2 right-2 bg-purple-600/90 text-white p-1.5 rounded-lg flex items-center gap-1 backdrop-blur-md">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          </div>
        )}
      </div>

      {/* Meta Text Information */}
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-xs text-slate-100 truncate pr-4">{track.name}</h5>
        <p className="text-[10px] text-slate-400 truncate mt-0.5">{track.artists?.join(', ')}</p>
      </div>

      {/* Tags & Action row */}
      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
        {/* Language/Genre Capsule tag */}
        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/15">
          {track.language || 'English'}
        </span>

        {/* Utility buttons */}
        <div className="flex items-center gap-1 relative">
          <button 
            onClick={handleLikeToggle}
            className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors
              ${isLiked ? 'text-pink-500' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button 
            onClick={handleMoreClick}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Add to Playlist Popup menu */}
          {showDropdown && (
            <div className="absolute bottom-full right-0 mb-1 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 z-35 backdrop-blur-xl">
              <p className="text-[9px] uppercase font-bold text-slate-500 px-3.5 py-1.5 tracking-wider border-b border-white/5">
                Add to Playlist
              </p>
              <div className="max-h-24 overflow-y-auto custom-scrollbar p-0.5 mt-1 border-b border-white/5">
                {playlists.length > 0 ? (
                  playlists.map(pl => (
                    <button
                      key={pl._id}
                      onClick={(e) => handleAddToPlaylist(pl._id, e)}
                      className="w-full text-left text-[11px] hover:bg-purple-600/20 hover:text-purple-300 px-3 py-1.5 rounded-lg transition-colors truncate cursor-pointer"
                    >
                      {pl.name}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-500 italic p-2 text-center">No playlists created.</p>
                )}
              </div>
              <button
                onClick={handleCreateAndAddPlaylist}
                className="w-full text-center text-[10px] font-bold text-purple-400 hover:bg-purple-600/10 hover:text-purple-300 py-2 mt-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-dashed border-purple-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create & Add</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicCard;
