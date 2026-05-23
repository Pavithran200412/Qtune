import React, { useState, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Sparkles } from 'lucide-react';

const RecommendationGraph = ({ recommendations = [] }) => {
  const { currentTrack, playTrack } = useAudio();
  const [nodes, setNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!currentTrack) return;

    // Center Node (Active Playing Song)
    const centerNode = {
      id: currentTrack.spotifyId,
      name: currentTrack.name,
      artists: currentTrack.artists,
      artworkUrl: currentTrack.artworkUrl,
      previewUrl: currentTrack.previewUrl,
      isCenter: true,
      x: 200,
      y: 200,
      features: {
        energy: currentTrack.energy || 0.6,
        danceability: currentTrack.danceability || 0.6,
        valence: currentTrack.valence || 0.5
      }
    };

    // Slice up to 5 recommendations to prevent overcrowding
    const orbitTracks = recommendations.slice(0, 5);
    const orbitNodes = orbitTracks.map((track, i) => {
      // Position nodes in a clean circle orbit around the center
      const angle = (i * 2 * Math.PI) / orbitTracks.length;
      const radius = 120; // Distance from center
      return {
        id: track.spotifyId || `mock_rec_${i}`,
        name: track.name,
        artists: track.artists,
        artworkUrl: track.artworkUrl,
        previewUrl: track.previewUrl,
        isCenter: false,
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        features: {
          energy: track.energy || Math.random().toFixed(2),
          danceability: track.danceability || Math.random().toFixed(2),
          valence: track.valence || Math.random().toFixed(2)
        }
      };
    });

    setNodes([centerNode, ...orbitNodes]);
  }, [currentTrack, recommendations]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-slate-500/10 rounded-2xl bg-slate-950/20 backdrop-blur-md p-6 text-center">
        <Sparkles className="w-10 h-10 text-purple-500 mb-3 animate-pulse" />
        <p className="text-slate-400 text-sm">Play a track to visualize its AI recommendation network</p>
      </div>
    );
  }

  return (
    <div className="relative w-full glass-panel rounded-2xl p-5 overflow-hidden flex flex-col md:flex-row gap-5">
      {/* SVG Viewport */}
      <div className="flex-1 flex justify-center items-center bg-slate-950/30 rounded-xl relative p-4" style={{ minHeight: '380px' }}>
        <svg viewBox="0 0 400 400" className="w-full max-w-[360px] h-full max-h-[360px] overflow-visible">
          {/* Neon Gradients Definition */}
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="glowLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Symmetrical Orbit Rings */}
          <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(147, 51, 234, 0.15)" strokeWidth="1" strokeDasharray="5,5" />
          <circle cx="200" cy="200" r="55" fill="url(#centerGlow)" />

          {/* Connection Lines */}
          {nodes.filter(n => !n.isCenter).map((node, i) => (
            <line
              key={`line-${node.id}`}
              x1="200"
              y1="200"
              x2={node.x}
              y2={node.y}
              stroke="url(#glowLine)"
              strokeWidth={hoveredNode?.id === node.id ? "2" : "1"}
              strokeOpacity={hoveredNode?.id === node.id ? "0.8" : "0.35"}
              className="transition-all duration-300"
            />
          ))}

          {/* Rendering Nodes */}
          {nodes.map((node) => (
            <g
              key={`node-${node.id}`}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => !node.isCenter && playTrack(node)}
            >
              {/* Outer Glow Ring on Hover */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.isCenter ? 32 : 22}
                fill="none"
                stroke={node.isCenter ? "#a855f7" : "#ec4899"}
                strokeWidth={hoveredNode?.id === node.id ? "3" : "1.5"}
                strokeOpacity={hoveredNode?.id === node.id ? "0.9" : "0.4"}
                className="transition-all duration-300"
              />

              {/* Node Artwork Image clipping */}
              <foreignObject
                x={node.x - (node.isCenter ? 28 : 18)}
                y={node.y - (node.isCenter ? 28 : 18)}
                width={node.isCenter ? 56 : 36}
                height={node.isCenter ? 56 : 36}
                className="rounded-full overflow-hidden"
              >
                <div className="w-full h-full relative group">
                  <img
                    src={node.artworkUrl}
                    alt={node.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Hover play icon indicator on surrounding nodes */}
                  {!node.isCenter && (
                    <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>

      {/* Info Tooltip Sidebar Panel */}
      <div className="w-full md:w-56 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-500/10 pt-4 md:pt-0 md:pl-5">
        <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Acoustic Profile</span>
        </h4>

        {hoveredNode ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold truncate">{hoveredNode.name}</p>
              <p className="text-xs text-slate-400 truncate">{hoveredNode.artists.join(', ')}</p>
            </div>
            
            {hoveredNode.isCenter && (
              <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                Playing Now
              </span>
            )}

            <div className="space-y-2 border-t border-slate-500/10 pt-3">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Energy</span>
                  <span>{Math.round(hoveredNode.features.energy * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${hoveredNode.features.energy * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Danceability</span>
                  <span>{Math.round(hoveredNode.features.danceability * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full transition-all duration-300" style={{ width: `${hoveredNode.features.danceability * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Valence (Happy)</span>
                  <span>{Math.round(hoveredNode.features.valence * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${hoveredNode.features.valence * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-6">
            Hover over a node to analyze its specific audio footprint (energy, danceability, valence) in the recommendation web.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationGraph;
