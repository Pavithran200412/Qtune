import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import WaveformVisualizer from './WaveformVisualizer';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Sparkles,
  Heart,
  Plus,
  Check
} from 'lucide-react';
import axios from 'axios';

const MusicPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    isShuffle,
    isRepeat,
    togglePlay,
    seekTo,
    updateVolume,
    nextTrack,
    prevTrack,
    setIsShuffle,
    setIsRepeat
  } = useAudio();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isLiked, setIsLiked] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Shrink player to a compact floating pill on scroll for enhanced premium aesthetics
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsCompact(true);
      } else {
        setIsCompact(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [showDropdown, setShowDropdown] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const close = () => {
      setShowDropdown(false);
      setPlaylistSearch('');
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showDropdown]);

  // Auto-dismiss custom Spotify-Green Toast after 3 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

  const handleAddToPlaylist = async (playlistId, e) => {
    e.stopPropagation();
    setShowDropdown(false);
    setPlaylistSearch('');
    try {
      const res = await axios.post(`/api/playlist/${playlistId}/song`, { song: currentTrack });
      if (res.data.success) {
        const targetPl = playlists.find(p => p._id === playlistId);
        setToastMessage(`Added to playlist "${targetPl ? targetPl.name : 'Library'}"`);
      }
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed adding song to playlist');
    }
  };

  const handleCreateAndAddPlaylist = async (e) => {
    e.stopPropagation();
    const name = prompt("Enter new playlist name:");
    if (!name || !name.trim()) return;

    try {
      const res = await axios.post('/api/playlist', {
        name: name.trim(),
        description: 'Created from player',
        isPublic: true
      });

      if (res.data.success) {
        const newPl = res.data.playlist;
        setPlaylists(prev => [newPl, ...prev]);
        
        const addRes = await axios.post(`/api/playlist/${newPl._id}/song`, { song: currentTrack });
        if (addRes.data.success) {
          setToastMessage(`Created and added to "${name}"`);
        }
      }
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed creating and adding to playlist');
    }
    setShowDropdown(false);
    setPlaylistSearch('');
  };

  // Sync like status on track change
  useEffect(() => {
    if (!currentTrack) return;
    checkLikeStatus();
  }, [currentTrack]);

  const checkLikeStatus = async () => {
    try {
      const res = await axios.get(`/api/music/favorite/${currentTrack.spotifyId}`);
      if (res.data.success) {
        setIsLiked(res.data.favorited);
      }
    } catch (e) {
      console.warn('Failed checking favorite state:', e.message);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentTrack) return;
    try {
      const res = await axios.post('/api/music/favorite', currentTrack);
      if (res.data.success) {
        setIsLiked(res.data.favorited);
      }
    } catch (error) {
      console.error('Failed toggling like:', error);
    }
  };

  const filteredPlaylists = playlists.filter(pl => 
    pl.name.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  if (!currentTrack) return null;

  // Time formatter helpers
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e) => {
    seekTo(parseFloat(e.target.value));
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      updateVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      updateVolume(0);
      setIsMuted(false); // keep state updated
      setIsMuted(true);
    }
  };

  return (
    <div 
      className={`fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-in-out glass-panel neon-glow-player flex flex-col
        ${isCompact 
          ? 'bottom-20 md:bottom-4 w-[92%] md:w-[85%] md:max-w-4xl rounded-2xl md:rounded-full border border-purple-500/20 shadow-2xl shadow-purple-950/20 px-6 py-2 gap-1' 
          : 'bottom-16 md:bottom-0 w-full max-w-full rounded-none border-x-0 border-b-0 px-6 py-3.5 gap-3'
        }
      `}
    >
      
      {/* Waveform Visualization Ribbon */}
      <div className={`absolute top-0 left-0 w-full h-1 overflow-hidden pointer-events-none transition-all duration-500 
        ${isCompact ? 'opacity-30 rounded-t-2xl md:rounded-t-full' : 'opacity-60'}
      `}>
        <WaveformVisualizer height={10} />
      </div>

      <div className={`flex items-center justify-between w-full transition-all duration-500 ${isCompact ? 'flex-row gap-2' : 'flex-col md:flex-row gap-4'}`}>
        
        {/* Track Detail Information */}
        <div className={`flex items-center transition-all duration-500 min-w-0 ${isCompact ? 'gap-2 w-auto max-w-[45%] md:w-1/4' : 'gap-3 w-full md:w-1/4'}`}>
          <div className={`relative rounded-xl overflow-hidden border border-white/5 flex-shrink-0 group transition-all duration-500
            ${isCompact ? 'w-9 h-9' : 'w-14 h-14'}
          `}>
            <img 
              src={currentTrack.artworkUrl} 
              alt={currentTrack.name} 
              className={`w-full h-full object-cover transition-transform duration-500
                ${isPlaying ? 'animate-spin-slow' : ''}
              `}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-slate-100 truncate transition-all duration-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>{currentTrack.name}</h4>
            <p className={`text-slate-400 truncate transition-all duration-500 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>{currentTrack.artists?.join(', ')}</p>
          </div>

          {/* Social Heart Action Button */}
          <button 
            onClick={handleLikeToggle}
            className={`transition-all duration-300 hover:scale-115 active:scale-90 flex-shrink-0
              ${isLiked 
                ? 'text-pink-500 fill-pink-500/20 bg-pink-500/10 border border-pink-500/20' 
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-white/5'
              }
              ${isCompact ? 'p-1 hover:bg-transparent bg-transparent border-0' : 'p-2 rounded-xl'}
            `}
          >
            <Heart className={`transition-all duration-500 ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          </button>

          {/* Add to Playlist Action Button */}
          <div className="relative flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
                if (!showDropdown) fetchPlaylists();
              }}
              className={`transition-all duration-300 hover:scale-115 active:scale-90 text-slate-400 hover:text-slate-200 flex-shrink-0
                ${isCompact ? 'p-1 hover:bg-transparent bg-transparent border-0' : 'p-2 rounded-xl bg-slate-900 border border-white/5'}
              `}
              title="Add to Playlist"
            >
              <Plus className={`transition-all duration-500 ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            </button>

            {/* Add to Playlist Popup Menu (floating upwards) */}
            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl space-y-2 animate-fade-in">
                <p className="text-[9px] uppercase font-bold text-slate-500 px-2 tracking-wider border-b border-white/5 pb-1">
                  Add to Playlist
                </p>
                
                {/* Search / Filter Box */}
                <input 
                  type="text"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="Filter playlists..."
                  className="w-full bg-slate-950 border border-white/5 focus:border-purple-500/30 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 focus:outline-none placeholder-slate-600 transition-colors"
                />

                <div className="max-h-24 overflow-y-auto custom-scrollbar p-0.5 space-y-0.5">
                  {filteredPlaylists.length > 0 ? (
                    filteredPlaylists.map(pl => (
                      <button
                        key={pl._id}
                        onClick={(e) => handleAddToPlaylist(pl._id, e)}
                        className="w-full text-left text-[11px] hover:bg-purple-600/20 hover:text-purple-300 px-3 py-1.5 rounded-lg transition-colors truncate cursor-pointer text-slate-300"
                      >
                        {pl.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-[9px] text-slate-500 italic p-2 text-center">No matching playlists.</p>
                  )}
                </div>
                <button
                  onClick={handleCreateAndAddPlaylist}
                  className="w-full text-center text-[10px] font-bold text-purple-400 hover:bg-purple-600/10 hover:text-purple-300 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border border-dashed border-purple-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create & Add</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Playback Controls & Progress Bar */}
        <div className={`flex flex-col items-center transition-all duration-500 ${isCompact ? 'w-auto flex-1 md:w-2/4 gap-0' : 'w-full md:w-2/4 gap-2'}`}>
          
          {/* Controls Bar */}
          <div className={`flex items-center transition-all duration-500 ${isCompact ? 'gap-3' : 'gap-5'}`}>
            <button 
              onClick={setIsShuffle}
              className={`p-1.5 transition-colors rounded-lg ${isShuffle ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'}
                ${isCompact ? 'hidden md:inline-block' : ''}
              `}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button onClick={prevTrack} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
              <SkipBack className={`fill-current transition-all duration-500 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>

            <button 
              onClick={togglePlay}
              className={`bg-purple-600 hover:bg-purple-500 text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)]
                ${isCompact ? 'p-2' : 'p-3'}
              `}
            >
              {isPlaying ? (
                <Pause className={`fill-current transition-all duration-500 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
              ) : (
                <Play className={`fill-current ml-0.5 transition-all duration-500 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
              )}
            </button>

            <button onClick={nextTrack} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
              <SkipForward className={`fill-current transition-all duration-500 ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>

            <button 
              onClick={setIsRepeat}
              className={`p-1.5 transition-colors rounded-lg ${isRepeat ? 'text-purple-400 bg-purple-500/10' : 'text-slate-500 hover:text-slate-300'}
                ${isCompact ? 'hidden md:inline-block' : ''}
              `}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Slider (Hidden when compact, replaced by micro neon progress bar at the bottom boundary) */}
          <div className={`w-full items-center gap-3 ${isCompact ? 'hidden' : 'flex'}`}>
            <span className="text-[10px] text-slate-500 min-w-8 text-right">{formatTime(currentTime)}</span>
            <input 
              type="range"
              min="0"
              max={duration || 30} // standard 30-sec fallback
              value={currentTime}
              onChange={handleSeekChange}
              className="flex-1 accent-purple-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500/20"
            />
            <span className="text-[10px] text-slate-500 min-w-8">{formatTime(duration || 30)}</span>
          </div>
        </div>

        {/* Volume Level Controls (Hidden or collapsed when compact) */}
        <div className={`hidden md:flex items-center justify-end gap-3 w-1/4 transition-all duration-500 ${isCompact ? 'opacity-0 pointer-events-none w-0 select-none overflow-hidden' : 'opacity-100 w-1/4'}`}>
          <button onClick={handleMuteToggle} className="text-slate-400 hover:text-slate-200 transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4.5 h-4.5" />
            ) : (
              <Volume2 className="w-4.5 h-4.5" />
            )}
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              updateVolume(e.target.value);
              if (isMuted) setIsMuted(false);
            }}
            className="w-24 accent-purple-500 bg-slate-800 rounded-lg appearance-none h-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Floating capsule micro neon bottom progress bar */}
      {isCompact && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-800/40 rounded-b-full overflow-hidden pointer-events-none">
          <div 
            className="h-full bg-purple-500 transition-all duration-300 shadow-[0_0_8px_rgba(29,185,84,0.8)]" 
            style={{ width: `${(currentTime / (duration || 30)) * 100}%` }}
          ></div>
        </div>
      )}

      {/* Sleek Spotify-Green Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 bg-[#1db954] text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-[0_4px_25px_rgba(29,185,84,0.4)] flex items-center gap-2 z-55 transition-all duration-300 border border-white/10 scale-100 hover:scale-105 active:scale-95 select-none animate-bounce">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
