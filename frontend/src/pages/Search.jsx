import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MusicCard from '../components/MusicCard';
import SkeletonCard from '../components/SkeletonCard';
import RecommendationGraph from '../components/RecommendationGraph';
import { Search as SearchIcon, Compass, Sparkles, AlertCircle } from 'lucide-react';

const Search = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  
  const [suggestedTracks, setSuggestedTracks] = useState([]);
  const [suggestedArtists, setSuggestedArtists] = useState([]);
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [activeSearchTab, setActiveSearchTab] = useState('songs'); // 'songs', 'artists'
  const [artistTracks, setArtistTracks] = useState([]);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [genreTracks, setGenreTracks] = useState([]);

  // Popular multilingual seed keywords
  const popularPills = [
    { label: 'Anirudh Hits 💥', query: 'Anirudh Tamil hits' },
    { label: 'Arijit Romantic ❤️', query: 'Arijit Hindi romance' },
    { label: 'K-Pop Beats 🎧', query: 'BTS Blackpink K-pop' },
    { label: 'Telugu Mass ⚡', query: 'Telugu dance energy' },
    { label: 'Malayalam Melodies 🍃', query: 'Malayalam melody soft' },
    { label: 'Lofi Focus ☕', query: 'lofi study focus relax' },
    { label: 'Anime/J-Pop 🎌', query: 'J-pop anime' },
    { label: 'Weekend Pop 🌟', query: 'Weeknd English hits' }
  ];

  // Fetch deep relationship recommendations once search results load
  useEffect(() => {
    if (!results || results.tracks.length === 0) {
      setArtistTracks([]);
      setAlbumTracks([]);
      setGenreTracks([]);
      return;
    }

    const firstTrack = results.tracks[0];
    
    // Fetch More by Artist
    if (firstTrack.artists && firstTrack.artists.length > 0) {
      axios.get(`/api/music/search?query=${encodeURIComponent(firstTrack.artists[0])}`)
        .then(res => {
          if (res.data.success) {
            const filtered = res.data.results.tracks.filter(t => t.spotifyId !== firstTrack.spotifyId);
            setArtistTracks(filtered.slice(0, 6));
          }
        }).catch(e => console.warn('More by artist fetch failed:', e));
    } else {
      setArtistTracks([]);
    }

    // Fetch More from Album / Movie
    if (firstTrack.albumName && firstTrack.albumName !== 'Single' && firstTrack.albumName !== 'Saavn Album') {
      axios.get(`/api/music/search?query=${encodeURIComponent(firstTrack.albumName)}`)
        .then(res => {
          if (res.data.success) {
            const filtered = res.data.results.tracks.filter(t => t.spotifyId !== firstTrack.spotifyId);
            setAlbumTracks(filtered.slice(0, 6));
          }
        }).catch(e => console.warn('More by album fetch failed:', e));
    } else {
      setAlbumTracks([]);
    }

    // Fetch Similar in Genre / Language
    const genreQuery = firstTrack.genre || firstTrack.language || 'Bollywood';
    axios.get(`/api/music/search?query=${encodeURIComponent(genreQuery)}`)
      .then(res => {
        if (res.data.success) {
          const filtered = res.data.results.tracks.filter(t => t.spotifyId !== firstTrack.spotifyId);
          setGenreTracks(filtered.slice(0, 6));
        }
      }).catch(e => console.warn('More by genre fetch failed:', e));

    fetchRecommendations(firstTrack.spotifyId);
  }, [results]);

  const fetchRecommendations = async (trackId) => {
    try {
      const res = await axios.get(`/api/ai/mood?mood=chill`); // default fetch chill recommendations linked
      if (res.data.success) {
        setRecommendations(res.data.tracks);
      }
    } catch (e) {
      console.warn('Failed listing recommendations:', e.message);
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSuggestedTracks([]);
    setSuggestedArtists([]);
    setSuggestedCategories([]);
    setArtistTracks([]);
    setAlbumTracks([]);
    setGenreTracks([]);

    try {
      setLoading(true);
      const res = await axios.get(`/api/music/search?query=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch (error) {
      console.error('Failed to run search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Instant Autocomplete suggestions loop (multiple choice categorization based on input characters)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestedTracks([]);
      setSuggestedArtists([]);
      setSuggestedCategories([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/music/search?query=${encodeURIComponent(query)}`);
        if (res.data.success) {
          setSuggestedTracks(res.data.results.tracks.slice(0, 3));
          setSuggestedArtists(res.data.results.artists.slice(0, 2));

          // Smart dynamic categories matching query characters
          const lowerQuery = query.toLowerCase();
          const matchCategories = [];
          if ('tamil'.includes(lowerQuery) || 'kuthu'.includes(lowerQuery)) matchCategories.push({ name: 'Tamil hits 💥', query: 'Tamil hits' });
          if ('hindi'.includes(lowerQuery) || 'arijit'.includes(lowerQuery)) matchCategories.push({ name: 'Hindi romance ❤️', query: 'Arijit Hindi romance' });
          if ('kpop'.includes(lowerQuery) || 'bts'.includes(lowerQuery)) matchCategories.push({ name: 'K-Pop beats 🎧', query: 'K-pop dance' });
          if ('lofi'.includes(lowerQuery) || 'chill'.includes(lowerQuery)) matchCategories.push({ name: 'Lofi Focus ☕', query: 'lofi chill' });
          if ('telugu'.includes(lowerQuery)) matchCategories.push({ name: 'Telugu Energetic ⚡', query: 'Telugu dance energy' });
          if ('malayalam'.includes(lowerQuery)) matchCategories.push({ name: 'Malayalam Melodies 🍃', query: 'Malayalam melody' });
          
          setSuggestedCategories(matchCategories.slice(0, 2));
        }
      } catch (e) {}
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSuggestionClick = (searchVal) => {
    setQuery(searchVal);
    setSuggestedTracks([]);
    setSuggestedArtists([]);
    setSuggestedCategories([]);
    // Run search
    setTimeout(() => handleSearchSubmit(), 100);
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Search Input Banner Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Compass className="w-6 h-6 text-purple-400" />
          <span>Multilingual Music Discovery</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          Search songs, artists, albums, or languages (Tamil, Hindi, Telugu, K-pop) and visualize connections.
        </p>

        {/* Input Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Tamil, Hindi, English, K-Pop, Lo-Fi tracks..."
            className="w-full bg-slate-900/60 border border-white/5 group-hover:border-purple-500/30 focus:border-purple-500/50 rounded-2xl px-5 py-4 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/10 text-slate-100 transition-all backdrop-blur-md"
          />
          <SearchIcon className="absolute left-4.5 top-4 text-slate-400 w-5 h-5 group-hover:text-purple-400 transition-colors" />
          
          {query.trim() && (
            <button
              type="submit"
              className="absolute right-3.5 top-2.5 bg-purple-600 hover:bg-purple-500 font-semibold text-[10px] px-3.5 py-2.5 rounded-xl shadow-md text-white transition-all hover:scale-105 active:scale-95"
            >
              Search
            </button>
          )}

          {/* Autocomplete suggestions box overlay (divided multiple choices by type) */}
          {(suggestedTracks.length > 0 || suggestedArtists.length > 0 || suggestedCategories.length > 0) && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-950/90 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-950/25 p-3 z-30 backdrop-blur-2xl animate-fade-in transition-all duration-300 space-y-3">
              
              {/* Category/Genre Suggestions Choice */}
              {suggestedCategories.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[8px] uppercase font-black text-slate-500 px-3 tracking-widest">
                    Quick Genres & Moods
                  </p>
                  <div className="flex flex-wrap gap-2 px-2 pt-1">
                    {suggestedCategories.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSuggestionClick(cat.query)}
                        className="bg-purple-600/10 hover:bg-purple-600 border border-purple-500/20 hover:border-purple-500 text-purple-300 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Artist Suggestions Choice */}
              {suggestedArtists.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[8px] uppercase font-black text-slate-500 px-3 tracking-widest">
                    Artists Matching
                  </p>
                  {suggestedArtists.map((artist, idx) => {
                    const artImage = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&q=80';
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(artist.name);
                          setSuggestedTracks([]);
                          setSuggestedArtists([]);
                          setSuggestedCategories([]);
                          setActiveSearchTab('artists');
                          setTimeout(() => handleSearchSubmit(), 100);
                        }}
                        className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={artImage} alt="" className="w-7 h-7 rounded-full object-cover border border-white/5" />
                          <p className="text-xs font-bold truncate text-slate-300 group-hover:text-purple-400 transition-colors">{artist.name}</p>
                        </div>
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all">
                          View Artist
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Track Suggestions Choice */}
              {suggestedTracks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[8px] uppercase font-black text-slate-500 px-3 tracking-widest">
                    Songs Matching
                  </p>
                  {suggestedTracks.map(track => (
                    <div
                      key={track.spotifyId}
                      onClick={() => handleSuggestionClick(`${track.name} ${track.artists[0]}`)}
                      className="flex items-center justify-between gap-3 px-3 py-1.5 hover:bg-white/5 rounded-xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={track.artworkUrl} alt="" className="w-7 h-7 rounded-lg object-cover border border-white/5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-300 group-hover:text-white transition-colors">{track.name}</p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5">{track.artists.join(', ')}</p>
                        </div>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-white/5 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all">
                        Play
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Hot Seed Pills */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {popularPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => {
                setQuery(pill.query);
                setTimeout(() => handleSearchSubmit(), 100);
              }}
              className="bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-purple-500/20 text-slate-400 hover:text-purple-300 transition-all px-3 py-1.5 rounded-xl text-[10px] font-semibold cursor-pointer"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Recommendation Graph Ribbon */}
      {results && results.tracks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5 text-purple-400" />
            <span>AI Recommendation Network Graph</span>
          </h3>
          <RecommendationGraph recommendations={recommendations} />
        </div>
      )}

      {/* Grid Results display */}
      <div className="space-y-5">
        {results && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold tracking-tight">
              Search Results for <span className="text-purple-400 font-extrabold">"{query}"</span>
            </h2>

            {/* Premium search tabs toggler */}
            <div className="flex gap-2 bg-slate-950/40 p-1 rounded-xl border border-white/5 self-start sm:self-auto select-none">
              <button
                type="button"
                onClick={() => setActiveSearchTab('songs')}
                className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer
                  ${activeSearchTab === 'songs' 
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                    : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                Songs ({results.tracks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSearchTab('artists')}
                className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer
                  ${activeSearchTab === 'artists' 
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                    : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                Artists ({results.artists?.length || 0})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results ? (
          activeSearchTab === 'artists' ? (
            results.artists && results.artists.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {results.artists.map((artist, idx) => {
                  const artistImage = artist.images?.[0]?.url || artist.images?.[1]?.url || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&q=80';
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setQuery(artist.name);
                        setActiveSearchTab('songs');
                        // Trigger search for artist
                        setTimeout(() => handleSearchSubmit(), 100);
                      }}
                      className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col items-center gap-4 cursor-pointer text-center relative border-white/5 group select-none"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/20 group-hover:border-purple-500/50 group-hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-950/20 flex-shrink-0">
                        <img src={artistImage} alt={artist.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate px-2">{artist.name}</h4>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mt-1.5 inline-block">Artist</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-slate-950/10">
                <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-slate-400">No artists match your search.</p>
              </div>
            )
          ) : (
            results.tracks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.tracks.map((track, idx) => (
                  <MusicCard 
                    key={track.spotifyId} 
                    track={track} 
                    tracksList={results.tracks}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-slate-950/10">
                <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                <p className="text-sm text-slate-400">No tracks match your search.</p>
              </div>
            )
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-3xl bg-slate-950/10">
            <Compass className="w-12 h-12 text-slate-800 mb-3 animate-pulse" />
            <p className="text-sm text-slate-400 font-semibold">Enter a search query or click one of the trending seed pills above</p>
          </div>
        )}
      </div>

      {/* Deep Search recommendations section */}
      {results && results.tracks.length > 0 && (
        <div className="space-y-8 pt-8 border-t border-white/5 animate-fade-in">
          
          {/* More by same Artist */}
          {artistTracks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <span>More by {results.tracks[0].artists[0]}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {artistTracks.map((track, idx) => (
                  <MusicCard 
                    key={track.spotifyId} 
                    track={track} 
                    tracksList={artistTracks}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* More from same Album / Movie */}
          {albumTracks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
                <span>More from Album: {results.tracks[0].albumName}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albumTracks.map((track, idx) => (
                  <MusicCard 
                    key={track.spotifyId} 
                    track={track} 
                    tracksList={albumTracks}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Similar in Genre */}
          {genreTracks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
                <span>Similar in Genre: {results.tracks[0].genre || results.tracks[0].language || 'Bollywood'}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {genreTracks.map((track, idx) => (
                  <MusicCard 
                    key={track.spotifyId} 
                    track={track} 
                    tracksList={genreTracks}
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Search;
