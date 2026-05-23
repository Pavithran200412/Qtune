import React, { useState } from 'react';
import axios from 'axios';
import { useAudio } from '../context/AudioContext';
import { Sparkles, Terminal, Play, Save, CheckCircle, Flame, Music, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const AIGenerator = () => {
  const { playQueue } = useAudio();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Suggested pre-set AI prompts
  const suggestions = [
    "Late night coding session focus lo-fi",
    "High energy Tamil gym workout playlist",
    "Sad emotional Hindi melodies for rainy days",
    "Uplifting chill K-Pop morning motivation"
  ];

  const handleGenerate = async (selectedPrompt) => {
    const text = selectedPrompt || prompt;
    if (!text.trim()) return;

    try {
      setLoading(true);
      setPlaylist(null);
      setIsSaved(false);

      const res = await axios.post('/api/ai/playlist', { prompt: text });
      if (res.data.success) {
        setPlaylist(res.data.playlist);
        setAnalysis(res.data.analysis);
        
        // Trigger success confetti bursts!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#3b82f6']
        });
      }
    } catch (e) {
      alert('AI Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      playQueue(playlist.songs, 0);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!playlist) return;
    try {
      // Playlist is already saved in DB on generation, we just mark saved status
      setIsSaved(true);
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    } catch (e) {}
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Header and prompt bar */}
      <div className="space-y-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Sparkles className="w-6.5 h-6.5 text-purple-400 animate-pulse" />
          <span>AI Playlist Generator</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          Input an expressive prompt describing your mood, activity, language, or environment, and watch Qtune compile a personalized soundtrack.
        </p>

        {/* Prompt Input Form */}
        <div className="relative max-w-2xl group glass-panel rounded-2xl p-2.5 flex items-center gap-2 border-white/5">
          <Terminal className="w-5 h-5 text-slate-500 pl-2" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Type 'Workout songs', 'Coding playlist', 'Sad Tamil songs'..."
            className="flex-1 bg-transparent px-3 py-3 text-xs focus:outline-none text-slate-100 disabled:opacity-50"
          />
          <button
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:scale-100"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Compile</span>
          </button>
        </div>

        {/* Suggestion Pills */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-500 px-1 tracking-wider">Need Inspiration?</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setPrompt(s);
                  handleGenerate(s);
                }}
                disabled={loading}
                className="bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-purple-500/20 text-slate-400 hover:text-purple-300 transition-all px-3.5 py-2.5 rounded-xl text-[10px] font-semibold cursor-pointer disabled:opacity-50 text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Spotify Playback Deck Embed */}
      {!playlist && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 border-white/5 space-y-4 max-w-2xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div>
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Music className="w-4.5 h-4.5 text-purple-400" />
                <span>Featured Streaming Deck</span>
              </h3>
              <p className="text-[10px] text-slate-500">Official Spotify embedded player for continuous streaming</p>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/25 animate-pulse">
              Live Stream
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/20 shadow-2xl">
            <iframe
              title="Spotify Embed: Recommendation Playlist "
              src="https://open.spotify.com/embed/playlist/1qRuv8OA7HFiVOraZ25pwn?utm_source=generator&theme=0"
              width="100%"
              height="360px"
              style={{ minHeight: '360px' }}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-2xl"
            />
          </div>
        </motion.div>
      )}

      {/* Loading Scanning Animation */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel border border-purple-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-5 overflow-hidden relative min-h-[220px]"
          >
            {/* Holographic scanner line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-bounce"></div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full filter blur-xl animate-pulse"></div>
              <Sparkles className="w-12 h-12 text-purple-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-200">Analyzing Prompt Semantic Nodes...</h4>
              <p className="text-xs text-slate-500 animate-pulse">Decoding languages, mapping target danceability, acousticness, and valence vectors</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results View */}
      {playlist && analysis && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* AI Semantic profile card */}
          <div className="lg:col-span-1 glass-panel rounded-3xl p-6 flex flex-col justify-between gap-5 relative border-purple-500/10">
            <div className="space-y-4">
              <span className="text-[9px] uppercase font-black bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">
                AI Vector Footprint
              </span>
              
              <div>
                <h3 className="text-lg font-bold truncate leading-snug">{playlist.name}</h3>
                <p className="text-xs text-slate-400 mt-1 italic">"{playlist.description}"</p>
              </div>

              {/* Statistical seeds parsed list */}
              <div className="space-y-3.5 border-t border-white/5 pt-4 mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Language Detected</span>
                  <span className="font-bold text-purple-400">{analysis.detectedLanguage}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Target Vibe/Mood</span>
                  <span className="font-bold text-pink-400 capitalize">{analysis.detectedMood}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Target Energy</span>
                  <span className="font-bold text-slate-200">{Math.round(parseFloat(analysis.seedsUsed.target_energy) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Target Danceability</span>
                  <span className="font-bold text-slate-200">{Math.round(parseFloat(analysis.seedsUsed.target_danceability) * 100)}%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Target Acousticness</span>
                  <span className="font-bold text-slate-200">{Math.round(parseFloat(analysis.seedsUsed.target_acousticness) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Play/Save Action footer row */}
            <div className="flex gap-3 border-t border-white/5 pt-4 mt-2">
              <button
                onClick={handlePlayAll}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Vibe</span>
              </button>

              <button
                onClick={handleSaveToLibrary}
                className={`flex-1 border text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95
                  ${isSaved 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/10 bg-slate-900/60 hover:bg-slate-900 text-slate-300'
                  }
                `}
              >
                {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Saved' : 'Save Mix'}</span>
              </button>
            </div>
          </div>

          {/* Song Rows list */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-sm tracking-wide text-slate-300 flex items-center gap-2">
              <Music className="w-4.5 h-4.5 text-purple-400" />
              <span>Track Listing ({playlist.songs.length})</span>
            </h4>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {playlist.songs.map((song, i) => (
                <div
                  key={song.spotifyId || i}
                  onClick={() => playQueue(playlist.songs, i)}
                  className="flex items-center justify-between p-2.5 bg-slate-900/20 hover:bg-purple-600/10 rounded-xl border border-white/5 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-500 w-5 text-center group-hover:hidden">{i + 1}</span>
                    <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400 hidden group-hover:block mr-1.5" />
                    
                    <img src={song.artworkUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-slate-200">{song.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{song.artists.join(', ')}</p>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full">
                    {Math.round(song.energy * 100)}% E
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AIGenerator;
