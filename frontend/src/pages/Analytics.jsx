import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, Star, Clock, Heart, Award, TrendingUp } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

const Analytics = () => {
  const { playTrack } = useAudio();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    avgEnergy: 0.6,
    avgDanceability: 0.6,
    avgAcousticness: 0.4,
    avgValence: 0.5,
    languageBreakdown: { Tamil: 30, Hindi: 40, English: 30 }
  });

  useEffect(() => {
    fetchHistoryAndCalculate();
  }, []);

  const fetchHistoryAndCalculate = async () => {
    try {
      const res = await axios.get('/api/music/history');
      if (res.data.success) {
        const historyData = res.data.history;
        setHistory(historyData);

        if (historyData.length > 0) {
          // Calculate aggregates
          let totalEnergy = 0;
          let totalDance = 0;
          let totalAcoustic = 0;
          let totalValence = 0;
          const languages = {};

          historyData.forEach((h) => {
            const details = h.songDetails || {};
            totalEnergy += details.energy || 0.6;
            totalDance += details.danceability || 0.6;
            totalAcoustic += details.acousticness || 0.4;
            totalValence += details.valence || 0.5;

            // Simple language resolver
            let lang = 'English';
            if (h.songId.startsWith('mock_tam') || details.artists?.some(a => a.includes('Anirudh'))) lang = 'Tamil';
            else if (h.songId.startsWith('mock_hin') || details.artists?.some(a => a.includes('Pritam') || a.includes('Arijit'))) lang = 'Hindi';
            else if (h.songId.startsWith('mock_kpop') || details.artists?.some(a => a.includes('BTS') || a.includes('NewJeans'))) lang = 'K-Pop';
            else if (h.songId.startsWith('mock_lofi')) lang = 'Lo-Fi';
            
            languages[lang] = (languages[lang] || 0) + 1;
          });

          const count = historyData.length;
          
          // Convert languages to percentages
          const breakdown = {};
          Object.keys(languages).forEach(key => {
            breakdown[key] = Math.round((languages[key] / count) * 100);
          });

          setStats({
            totalCount: count,
            avgEnergy: totalEnergy / count,
            avgDanceability: totalDance / count,
            avgAcousticness: totalAcoustic / count,
            avgValence: totalValence / count,
            languageBreakdown: breakdown
          });
        }
      }
    } catch (e) {
      console.warn('Failed calculating insights:', e.message);
    }
  };

  // SVG Donut slice calculation helper
  const getDonutSlices = () => {
    const breakdown = stats.languageBreakdown;
    const entries = Object.entries(breakdown);
    let cumulativePercent = 0;
    
    return entries.map(([lang, percent], i) => {
      const strokeDash = `${percent} ${100 - percent}`;
      const strokeOffset = 100 - cumulativePercent + 25; // 25 is rotation adjustment
      cumulativePercent += percent;

      // Color maps
      const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
      const color = colors[i % colors.length];

      return { lang, percent, strokeDash, strokeOffset, color };
    });
  };

  return (
    <div className="space-y-8 pb-28">
      {/* Header title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-purple-400" />
          <span>Listening Insights</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          Analyze your sonic vector properties, favorite languages, and historical mood parameters drawn from listening logs.
        </p>
      </div>

      {/* Grid Highlights Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Streamed</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black">{stats.totalCount}</p>
          <span className="text-[9px] text-slate-400">tracks played in system</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Average Energy</span>
            <TrendingUp className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-black">{Math.round(stats.avgEnergy * 100)}%</p>
          <span className="text-[9px] text-slate-400">high activity listening profile</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vibe Valence</span>
            <Heart className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black">{Math.round(stats.avgValence * 100)}%</p>
          <span className="text-[9px] text-slate-400">happiness acoustic factor</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border-white/5 space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Primary Language</span>
            <Award className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-lg font-black truncate capitalize">
            {Object.keys(stats.languageBreakdown)[0] || 'English'}
          </p>
          <span className="text-[9px] text-slate-400">dominant listening tongue</span>
        </div>
      </div>

      {/* Charts row layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Custom SVG Bar Chart: Audio Features */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Acoustic Footprint Averages</h3>
            <p className="text-[10px] text-slate-500">Breakdown of average audio components decoded by Spotify API</p>
          </div>

          <div className="space-y-4">
            {/* Energy bar row */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Energy (Drive/Tempo)</span>
                <span className="font-semibold text-purple-400">{Math.round(stats.avgEnergy * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgEnergy * 100}%` }}></div>
              </div>
            </div>

            {/* Danceability bar row */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Danceability (Groove/Rhythm)</span>
                <span className="font-semibold text-pink-400">{Math.round(stats.avgDanceability * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-pink-500 to-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgDanceability * 100}%` }}></div>
              </div>
            </div>

            {/* Valence bar row */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Valence (Happiness/Positivity)</span>
                <span className="font-semibold text-emerald-400">{Math.round(stats.avgValence * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgValence * 100}%` }}></div>
              </div>
            </div>

            {/* Acousticness bar row */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Acousticness (Organic/Raw)</span>
                <span className="font-semibold text-blue-400">{Math.round(stats.avgAcousticness * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.avgAcousticness * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom SVG Donut Chart: Language Breakdown */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-300">Language Demographics</h3>
            <p className="text-[10px] text-slate-500">Proportional representation of song languages played</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            
            {/* SVG Donut */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                
                {/* Donut Slices */}
                {getDonutSlices().map((slice, i) => (
                  <circle
                    key={slice.lang}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="3.2"
                    strokeDasharray={slice.strokeDash}
                    strokeDashoffset={slice.strokeOffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              
              {/* Central Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">Linguistic</span>
                <span className="text-xs font-bold text-purple-400">Demographic</span>
              </div>
            </div>

            {/* Legend details */}
            <div className="space-y-2">
              {getDonutSlices().map((slice) => (
                <div key={slice.lang} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></div>
                  <span className="text-xs font-semibold text-slate-300 min-w-16">{slice.lang}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded-full font-bold">
                    {slice.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
