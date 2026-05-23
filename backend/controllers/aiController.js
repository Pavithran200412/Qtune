import { getSpotifyRecommendations, spotifySearch, getAudioFeatures, MOCK_SONGS } from '../utils/spotify.js';
import User from '../models/User.js';
import Playlist from '../models/Playlist.js';
import crypto from 'crypto';

// Helper to check user token
const getActiveSpotifyToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.spotifyAccessToken) return null;
  return user.spotifyAccessToken;
};

// Advanced Local Semantic/NLP Prompt Parser
const parsePromptLocally = (prompt) => {
  const lowercase = prompt.toLowerCase();
  const result = {
    query: '',
    seeds: {
      seed_genres: 'pop',
      target_energy: '0.6',
      target_danceability: '0.6',
      target_tempo: '110',
      target_acousticness: '0.3',
      target_valence: '0.5'
    },
    language: 'English',
    mood: 'chill'
  };

  // 1. Language Detection
  if (lowercase.includes('tamil') || lowercase.includes('kuthu') || lowercase.includes('anirudh')) {
    result.language = 'Tamil';
    result.query = 'Tamil';
    result.seeds.seed_genres = 'indian';
  } else if (lowercase.includes('hindi') || lowercase.includes('arijit') || lowercase.includes('bollywood')) {
    result.language = 'Hindi';
    result.query = 'Hindi';
    result.seeds.seed_genres = 'indian';
  } else if (lowercase.includes('telugu') || lowercase.includes('tollywood')) {
    result.language = 'Telugu';
    result.query = 'Telugu';
    result.seeds.seed_genres = 'indian';
  } else if (lowercase.includes('malayalam')) {
    result.language = 'Malayalam';
    result.query = 'Malayalam';
    result.seeds.seed_genres = 'indian';
  } else if (lowercase.includes('kpop') || lowercase.includes('k-pop') || lowercase.includes('korean') || lowercase.includes('bts')) {
    result.language = 'Korean';
    result.query = 'K-Pop';
    result.seeds.seed_genres = 'k-pop';
  } else if (lowercase.includes('japanese') || lowercase.includes('anime') || lowercase.includes('jpop')) {
    result.language = 'Japanese';
    result.query = 'J-Pop';
    result.seeds.seed_genres = 'j-pop';
  }

  // 2. Mood & Activity Detection
  if (lowercase.includes('workout') || lowercase.includes('gym') || lowercase.includes('run') || lowercase.includes('energetic') || lowercase.includes('hype')) {
    result.mood = 'workout';
    result.seeds.target_energy = '0.88';
    result.seeds.target_danceability = '0.80';
    result.seeds.target_tempo = '130';
    result.seeds.target_valence = '0.70';
    result.seeds.target_acousticness = '0.05';
    if (result.seeds.seed_genres === 'pop') result.seeds.seed_genres = 'dance,edm';
  } else if (lowercase.includes('sad') || lowercase.includes('broken') || lowercase.includes('cry') || lowercase.includes('pain') || lowercase.includes('alone')) {
    result.mood = 'sad';
    result.seeds.target_energy = '0.35';
    result.seeds.target_danceability = '0.45';
    result.seeds.target_valence = '0.20';
    result.seeds.target_acousticness = '0.75';
    result.seeds.target_tempo = '85';
    if (result.seeds.seed_genres === 'pop') result.seeds.seed_genres = 'acoustic,sad';
  } else if (lowercase.includes('study') || lowercase.includes('coding') || lowercase.includes('focus') || lowercase.includes('programming') || lowercase.includes('relax')) {
    result.mood = 'coding';
    result.seeds.target_energy = '0.30';
    result.seeds.target_danceability = '0.50';
    result.seeds.target_acousticness = '0.80';
    result.seeds.target_tempo = '78';
    result.seeds.target_valence = '0.40';
    if (lowercase.includes('lofi') || lowercase.includes('lo-fi') || lowercase.includes('chill')) {
      result.seeds.seed_genres = 'lofi,chill';
    } else {
      result.seeds.seed_genres = 'ambient,piano';
    }
  } else if (lowercase.includes('happy') || lowercase.includes('dance') || lowercase.includes('party') || lowercase.includes('joy')) {
    result.mood = 'happy';
    result.seeds.target_energy = '0.80';
    result.seeds.target_danceability = '0.85';
    result.seeds.target_valence = '0.85';
    result.seeds.target_tempo = '120';
    result.seeds.target_acousticness = '0.10';
    if (result.seeds.seed_genres === 'pop') result.seeds.seed_genres = 'dance,pop';
  }

  // 3. Fallback Query construction
  if (!result.query) {
    result.query = prompt;
  } else {
    // Combine language + prompt descriptors
    const descriptors = [];
    if (lowercase.includes('lofi') || lowercase.includes('lo-fi')) descriptors.push('lofi');
    if (lowercase.includes('sad')) descriptors.push('sad');
    if (lowercase.includes('romantic') || lowercase.includes('love')) descriptors.push('love');
    if (lowercase.includes('slow')) descriptors.push('melody');
    
    result.query = `${result.query} ${descriptors.join(' ')}`.trim();
  }

  return result;
};

// Gemini API REST Client
const parsePromptWithGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const promptInstructions = `
      Analyze the following music playlist creation request: "${prompt}".
      Output a valid raw JSON object representing the search query and acoustic properties. Do NOT include markdown tags like \`\`\`json. Just output the JSON.
      JSON structure:
      {
        "query": "string (Spotify search keywords, e.g., 'Tamil kuthu')",
        "seed_genres": "string (comma separated list of up to 3 Spotify genres, e.g., 'indian,pop,dance')",
        "target_energy": "string float (0.0 to 1.0)",
        "target_danceability": "string float (0.0 to 1.0)",
        "target_tempo": "string integer (e.g. '120')",
        "target_acousticness": "string float (0.0 to 1.0)",
        "target_valence": "string float (0.0 to 1.0, representing mood happiness)",
        "language": "string (e.g., 'Tamil', 'Hindi', 'English')",
        "mood": "string ('happy', 'sad', 'workout', 'coding', 'chill')"
      }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptInstructions }] }]
      })
    });

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResponse) {
      // Strip out markdown code blocks if any exist
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        query: parsed.query || prompt,
        seeds: {
          seed_genres: parsed.seed_genres || 'pop',
          target_energy: parsed.target_energy || '0.6',
          target_danceability: parsed.target_danceability || '0.6',
          target_tempo: parsed.target_tempo || '110',
          target_acousticness: parsed.target_acousticness || '0.3',
          target_valence: parsed.target_valence || '0.5'
        },
        language: parsed.language || 'English',
        mood: parsed.mood || 'chill'
      };
    }
  } catch (error) {
    console.error('Gemini API call failed, falling back to local NLP engine:', error);
  }
  return null;
};

export const generateMoodRecommendations = async (req, res) => {
  const { mood } = req.query; // 'happy', 'chill', 'sad', 'workout'

  try {
    const token = await getActiveSpotifyToken(req.user._id);
    let seeds = {};

    switch (mood) {
      case 'happy':
        seeds = { seed_genres: 'pop,happy', target_valence: '0.85', target_energy: '0.75' };
        break;
      case 'workout':
        seeds = { seed_genres: 'dance,edm', target_energy: '0.90', target_danceability: '0.80' };
        break;
      case 'sad':
        seeds = { seed_genres: 'acoustic,sad', target_valence: '0.20', target_energy: '0.30' };
        break;
      case 'chill':
      default:
        seeds = { seed_genres: 'lofi,chill', target_energy: '0.30', target_acousticness: '0.80' };
        break;
    }

    const tracks = await getSpotifyRecommendations(seeds, token);
    res.json({ success: true, mood, tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

export const generateAiPlaylist = async (req, res) => {
  const { prompt } = req.body;

  try {
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt text is required' });
    }

    console.log(`AI parsing prompt: "${prompt}"`);

    // Try Gemini, fallback to Local NLP Parser
    let parsedData = await parsePromptWithGemini(prompt);
    if (!parsedData) {
      parsedData = parsePromptLocally(prompt);
    }

    const token = await getActiveSpotifyToken(req.user._id);
    let tracks = [];

    // 1. Fetch tracks matching semantic queries
    if (!token || token.startsWith('mock_')) {
      // Mock filter path
      console.log(`Mock AI Engine resolving query: ${parsedData.query}`);
      const filteredMock = MOCK_SONGS.filter(s => {
        const langMatch = s.language.toLowerCase() === parsedData.language.toLowerCase();
        
        let moodMatch = true;
        if (parsedData.mood === 'sad') moodMatch = s.valence < 0.45;
        if (parsedData.mood === 'workout') moodMatch = s.energy > 0.75;
        if (parsedData.mood === 'coding') moodMatch = s.energy < 0.45;
        if (parsedData.mood === 'happy') moodMatch = s.valence > 0.65;

        return langMatch || moodMatch;
      });

      tracks = filteredMock.length > 0 ? filteredMock : MOCK_SONGS.slice(0, 10);
    } else {
      // Connect to Spotify Recommendations using seed search
      console.log(`Spotify AI query: "${parsedData.query}" matching seeds:`, parsedData.seeds);
      
      // Search to find seed track/artists for the query
      const searchRes = await spotifySearch(parsedData.query, token);
      const seedTracks = searchRes.tracks.slice(0, 2).map(t => t.spotifyId).join(',');
      
      const recommendationParams = {
        ...parsedData.seeds,
        ...(seedTracks ? { seed_tracks: seedTracks } : {})
      };

      tracks = await getSpotifyRecommendations(recommendationParams, token);
      
      // Fallback: If Spotify recommendations returns empty, use searched tracks directly
      if (tracks.length === 0) {
        tracks = searchRes.tracks;
      }
    }

    // 2. Create the playlist model structure
    const shareToken = crypto.randomBytes(16).toString('hex');
    const newPlaylist = await Playlist.create({
      name: `AI: ${parsedData.language} ${parsedData.mood.toUpperCase()} Vibe`,
      description: `AI-Generated soundtrack matching your prompt: "${prompt}"`,
      creator: req.user._id,
      songs: tracks,
      isPublic: true,
      promptUsed: prompt,
      shareToken
    });

    res.status(201).json({
      success: true,
      playlist: newPlaylist,
      analysis: {
        detectedLanguage: parsedData.language,
        detectedMood: parsedData.mood,
        seedsUsed: parsedData.seeds
      }
    });
  } catch (error) {
    console.error('AI playlist generation error:', error);
    res.status(500).json({ success: false, message: 'AI failed to construct playlist' });
  }
};
