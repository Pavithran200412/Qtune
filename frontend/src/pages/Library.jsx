import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import { Library as LibIcon, Heart, History, Plus, Music, Play, Trash2, FolderPlus, Radio } from 'lucide-react';
import MusicCard from '../components/MusicCard';
import SkeletonCard from '../components/SkeletonCard';

const Library = () => {
  const { playTrack, playQueue } = useAudio();
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists', 'favorites', 'history'
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Playlist Modal state variables
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const location = useLocation();

  // Listen for navigation parameters to trigger playlist creation instantly
  useEffect(() => {
    if (location.search.includes('create=true')) {
      setActiveTab('playlists');
      setShowModal(true);
    }
  }, [location]);

  useEffect(() => {
    fetchLibraryData();
  }, [activeTab]);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'playlists') {
        const res = await axios.get('/api/playlist/user');
        if (res.data.success) setPlaylists(res.data.playlists);
      } else if (activeTab === 'favorites') {
        const res = await axios.get('/api/music/favorite');
        if (res.data.success) setFavorites(res.data.favorites);
      } else if (activeTab === 'history') {
        const res = await axios.get('/api/music/history');
        if (res.data.success) setHistory(res.data.history);
      }
    } catch (e) {
      console.warn('Library load failure:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylistSubmit = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await axios.post('/api/playlist', {
        name: newPlaylistName,
        description: newPlaylistDesc,
        isPublic
      });

      if (res.data.success) {
        setPlaylists((prev) => [res.data.playlist, ...prev]);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setShowModal(false);
      }
    } catch (err) {
      alert('Failed creating playlist');
    }
  };

  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const res = await axios.delete(`/api/playlist/${id}`);
      if (res.data.success) {
        setPlaylists((prev) => prev.filter(pl => pl._id !== id));
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  const playEntireQueue = (tracks) => {
    if (tracks.length === 0) return;
    playQueue(tracks, 0);
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Header and horizontal tabs navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <LibIcon className="w-6.5 h-6.5 text-purple-400" />
            <span>My Music Library</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Manage your custom playlist compilations, favorite liked songs, and complete listening logs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-4.5 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Navigation horizontal Tabs bar */}
      <div className="flex border-b border-white/5 pb-0.5 gap-2.5">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 pb-3 px-4.5 text-xs font-semibold border-b-2 transition-all cursor-pointer
            ${activeTab === 'playlists' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }
          `}
        >
          <Music className="w-4 h-4" />
          <span>My Playlists</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-2 pb-3 px-4.5 text-xs font-semibold border-b-2 transition-all cursor-pointer
            ${activeTab === 'favorites' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }
          `}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Tracks</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 pb-3 px-4.5 text-xs font-semibold border-b-2 transition-all cursor-pointer
            ${activeTab === 'history' 
              ? 'border-purple-500 text-purple-400 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }
          `}
        >
          <History className="w-4 h-4" />
          <span>Listening History</span>
        </button>
      </div>

      {/* Dynamic Content Views */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeTab === 'playlists' ? (
          playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map(pl => (
                <div
                  key={pl._id}
                  onClick={() => playEntireQueue(pl.songs)}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer relative group border-white/5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition-colors">
                      <Music className="w-6 h-6 text-purple-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-100 truncate">{pl.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{pl.songs.length} tracks catalogued</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDeletePlaylist(pl._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-slate-950/10">
              <FolderPlus className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-400 font-semibold">No custom playlists created yet.</p>
              <button onClick={() => setShowModal(true)} className="text-xs text-purple-400 mt-2 hover:underline">
                Create one now
              </button>
            </div>
          )
        ) : activeTab === 'favorites' ? (
          favorites.length > 0 ? (
            (() => {
              const mappedTracks = favorites.map((fav) => ({
                spotifyId: fav.songId,
                name: fav.songDetails.name,
                artists: fav.songDetails.artists,
                albumName: fav.songDetails.albumName,
                artworkUrl: fav.songDetails.artworkUrl,
                durationMs: fav.songDetails.durationMs,
                previewUrl: fav.songDetails.previewUrl,
                language: fav.songDetails.language,
                genre: fav.songDetails.genre
              }));
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mappedTracks.map((track, idx) => (
                    <MusicCard 
                      key={track.spotifyId} 
                      track={track} 
                      tracksList={mappedTracks}
                      index={idx}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-slate-950/10">
              <Heart className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-400 font-semibold">You have not liked any tracks yet.</p>
            </div>
          )
        ) : (
          /* History View */
          history.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recently Played Logs</span>
                <button
                  onClick={() => playEntireQueue(history.map(h => ({
                    spotifyId: h.songId,
                    ...h.songDetails
                  })))}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Play All History
                </button>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                {history.map((h, i) => (
                  <div
                    key={h._id}
                    onClick={() => {
                      const historyTracks = history.map(x => ({
                        spotifyId: x.songId,
                        ...x.songDetails
                      }));
                      playQueue(historyTracks, i);
                    }}
                    className="flex items-center justify-between p-3 bg-slate-900/20 hover:bg-purple-600/10 rounded-2xl border border-white/5 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400 hidden group-hover:block mr-0.5" />
                      <span className="text-xs font-bold text-slate-500 w-4.5 text-center group-hover:hidden">{i + 1}</span>

                      <img src={h.songDetails.artworkUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-200">{h.songDetails.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{h.songDetails.artists?.join(', ')}</p>
                      </div>
                    </div>

                    <span className="text-[9px] text-slate-500 font-semibold italic">
                      {new Date(h.playedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-slate-950/10">
              <Radio className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-400 font-semibold">Your listening log is currently empty.</p>
            </div>
          )
        )}
      </div>

      {/* Playlist modal overlays */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleCreatePlaylistSubmit}
            className="w-full max-w-md glass-panel rounded-3xl p-6 border-purple-500/20 shadow-[0_0_50px_rgba(147,51,234,0.15)] space-y-5"
          >
            <h3 className="text-base font-bold tracking-tight">Compile New Playlist</h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Late Night Beats"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Description (Optional)</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="Describe the mood of your mix..."
                  rows="3"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  type="checkbox"
                  id="pl-public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-purple-500 rounded"
                />
                <label htmlFor="pl-public" className="text-slate-300 font-medium cursor-pointer">Make playlist public</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Library;
