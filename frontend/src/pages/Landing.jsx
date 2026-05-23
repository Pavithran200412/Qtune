import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MusicCard from '../components/MusicCard';
import SkeletonCard from '../components/SkeletonCard';
import { Sparkles, Music, Star, Flame, Disc, Radio } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const Landing = () => {
  const { playQueue } = useAudio();
  const [loading, setLoading] = useState(true);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Tamil', 'Hindi', 'English', 'Lo-fi', 'K-Pop', 'Podcasts'];

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning 🌅';
    if (hrs < 18) return 'Good Afternoon ☀️';
    return 'Good Evening 🌌';
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      // Query multiple general lists in parallel to get a massive, unlimited catalog
      const queries = ['hits', 'trending', 'viral', 'bollywood', 'pop'];
      const promises = queries.map(q => axios.get(`/api/music/search?query=${q}`));
      
      const responses = await Promise.all(promises);
      
      let allTracks = [];
      responses.forEach(res => {
        if (res.data.success && res.data.results && res.data.results.tracks) {
          allTracks = [...allTracks, ...res.data.results.tracks];
        }
      });

      // Remove duplicates uniquely by spotifyId
      const uniqueTracksMap = new Map();
      allTracks.forEach(t => {
        if (t.spotifyId && !uniqueTracksMap.has(t.spotifyId)) {
          uniqueTracksMap.set(t.spotifyId, t);
        }
      });

      const uniqueTracks = Array.from(uniqueTracksMap.values());
      setTrendingTracks(uniqueTracks);
    } catch (e) {
      console.warn('Failed listing trending tracks:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (trendingTracks.length > 0) {
      playQueue(trendingTracks, 0);
    }
  };

  // Filter based on selected language/category capsule
  const filteredTracks = trendingTracks.filter((track) => {
    if (activeCategory === 'All') return true;
    
    // Check language tags or genre properties
    if (activeCategory === 'Tamil') return track.language === 'Tamil' || track.name.toLowerCase().includes('badass') || track.artists.some(a => a.includes('Anirudh'));
    if (activeCategory === 'Hindi') return track.language === 'Hindi' || track.name.toLowerCase().includes('kesariya') || track.artists.some(a => a.includes('Pritam'));
    if (activeCategory === 'English') return track.language === 'English' || track.artists.some(a => a.includes('Weeknd') || a.includes('Sheeran'));
    if (activeCategory === 'Lo-fi') return track.genre === 'Lo-fi' || track.name.toLowerCase().includes('coding') || track.name.toLowerCase().includes('warm');
    if (activeCategory === 'K-Pop') return track.genre === 'K-Pop' || track.artists.some(a => a.includes('BTS') || a.includes('NewJeans'));
    if (activeCategory === 'Podcasts') return track.name.toLowerCase().includes('podcast') || track.artists.some(a => a.toLowerCase().includes('show') || a.toLowerCase().includes('talks'));
    
    return true;
  });

  return (
    <div className="space-y-8 pb-28">
      {/* Hero Welcome Billboard */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 border-purple-500/10 shadow-[0_0_50px_rgba(147,51,234,0.05)]">
        
        {/* Background ambient glowing nodes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[80px] -z-10 animate-pulse-glow"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-600/10 rounded-full filter blur-[60px] -z-10"></div>

        <div className="space-y-4 max-w-lg text-center md:text-left">
          <div className="flex justify-center md:justify-start gap-2.5 items-center">
            <span className="text-[9px] uppercase tracking-widest font-extrabold bg-purple-500/20 text-purple-400 px-3.5 py-1 rounded-full border border-purple-500/25">
              {getGreeting()}
            </span>
            <span className="text-[9px] uppercase tracking-widest font-extrabold bg-pink-500/20 text-pink-400 px-3.5 py-1 rounded-full border border-pink-500/25">
              AI Music Revolution
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
            Unleash Your Sonic Frequency
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Welcome to Qtune. Discover custom AI playlist compilers, real-time social listening, interactive waveforms, and automated music recommendation networks.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            <button 
              onClick={handlePlayAll}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              Stream Mix
            </button>
            <a 
              href="/ai-generator"
              className="bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-200 font-semibold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Prompt Playlist</span>
            </a>
          </div>
        </div>

        {/* Floating active artwork node */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 hidden sm:block flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-spin-slow filter blur-xl opacity-30"></div>
          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 rotate-3 shadow-2xl relative">
            <img 
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80" 
              alt="Visualizer Cover" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
              <Disc className="w-16 h-16 text-purple-400 animate-spin-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Navigation Slider */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
          <Flame className="w-4.5 h-4.5 text-purple-400" />
          <span>Genre Browse Categories</span>
        </h3>
        
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4.5 py-2.5 text-xs font-semibold rounded-full border transition-all duration-300 whitespace-nowrap cursor-pointer
                ${activeCategory === cat 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.35)]' 
                  : 'bg-slate-900 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Songs Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
            <span>Discover Hits</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-semibold">{filteredTracks.length} tracks catalogued</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredTracks.map((track, index) => (
              <MusicCard 
                key={track.spotifyId} 
                track={track} 
                tracksList={filteredTracks}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/5 rounded-2xl bg-slate-950/10">
            <Radio className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-slate-400">No tracks match the selected category.</p>
            <button 
              onClick={() => setActiveCategory('All')} 
              className="text-xs text-purple-400 mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
