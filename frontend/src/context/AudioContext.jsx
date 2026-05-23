import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SOCKET_URL } from '../utils/api';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  
  const [queue, setQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(-1);

  // Audio References
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  // State refs to keep track of the latest values in our event listeners and callbacks
  const queueRef = useRef([]);
  const currentQueueIndexRef = useRef(-1);
  const isShuffleRef = useRef(false);
  const isRepeatRef = useRef(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentQueueIndexRef.current = currentQueueIndex; }, [currentQueueIndex]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);

  const handleTrackEndedRef = useRef(null);

  // Initialize Audio Element exactly ONCE on mount
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous'; // Crucial for Web Audio API visualizer CORS
    audioRef.current = audio;

    // Track state listeners
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (handleTrackEndedRef.current) {
        handleTrackEndedRef.current();
      }
    };
    
    // Recovery trigger if CORS policy blocks the cross-origin preview stream
    const onError = (e) => {
      console.warn('Audio resource load failed due to CORS or stream error. Recovering...', e);
      if (audio.crossOrigin === 'anonymous') {
        // Disable CORS restrictions, load, and play directly
        audio.removeAttribute('crossorigin');
        audio.load();
        audio.play().catch(err => console.warn('CORS recovery playback attempt failed:', err.message));
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  // Update handleTrackEnded ref on every render to ensure it has latest closures/states
  useEffect(() => {
    handleTrackEndedRef.current = () => {
      if (isRepeatRef.current) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.warn('Playback error:', e));
        }
      } else {
        nextTrack();
      }
    };
  });

  // Setup Web Audio API pipeline
  const setupWebAudio = () => {
    // Only configure Web Audio if we have CORS clearance (crossOrigin is set)
    if (!audioRef.current || !audioRef.current.crossOrigin) {
      analyserRef.current = null;
      return;
    }
    if (audioContextRef.current) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      // Pipe source
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      console.log('Web Audio API Pipeline successfully configured.');
    } catch (e) {
      console.error('Failed to setup Web Audio API (CORS/Browser permissions):', e);
      analyserRef.current = null;
    }
  };

  const playTrack = async (track, forceIndex = undefined) => {
    if (!audioRef.current) return;
    
    // Set track
    const changed = !currentTrack || currentTrack.spotifyId !== track.spotifyId;
    
    if (changed) {
      const isSpotifyStream = track.previewUrl && (track.previewUrl.includes('spotify') || track.previewUrl.includes('rap.is.'));
      
      if (isSpotifyStream) {
        console.log('Spotify CDN resource detected. Bypassing Web Audio node routing to ensure full volume output...');
        audioRef.current.removeAttribute('crossorigin');
      } else {
        audioRef.current.crossOrigin = 'anonymous';
      }
      
      audioRef.current.src = track.previewUrl;
      setCurrentTrack(track);
      setCurrentTime(0);
      
      // Update queue index if part of queue
      if (forceIndex !== undefined) {
        setCurrentQueueIndex(forceIndex);
      } else {
        const idx = queueRef.current.findIndex(q => q.spotifyId === track.spotifyId);
        if (idx > -1) {
          setCurrentQueueIndex(idx);
        }
      }
    }

    try {
      const isSpotifyStream = track.previewUrl && (track.previewUrl.includes('spotify') || track.previewUrl.includes('rap.is.'));
      
      if (!isSpotifyStream) {
        // Setup web audio on user interaction for CORS-cleared lofi/mock sources
        setupWebAudio();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } else {
        // Force visualizer to return to a calm wave state for non-CORS Spotify streams
        analyserRef.current = null;
      }

      await audioRef.current.play();
      setIsPlaying(true);

      // Hit Backend History Router asynchronously
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/music/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(track)
      }).catch(e => console.warn('Failed logging listener history:', e));

    } catch (error) {
      console.warn('Playback failed:', error.message);
      setIsPlaying(false);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = async () => {
    if (audioRef.current && currentTrack) {
      try {
        setupWebAudio();
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Resume failed:', e);
      }
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const updateVolume = (value) => {
    const vol = parseFloat(value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    setVolume(vol);
  };

  // Queue Operations using hoisted standard functions to prevent ordering issues
  function playQueue(tracksList, startIndex = 0) {
    if (!tracksList || tracksList.length === 0) return;
    setQueue(tracksList);
    setCurrentQueueIndex(startIndex);
    playTrack(tracksList[startIndex], startIndex);
  }

  function nextTrack() {
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;

    let nextIdx = currentQueueIndexRef.current + 1;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else if (nextIdx >= currentQueue.length) {
      nextIdx = 0; // Loop back
    }

    setCurrentQueueIndex(nextIdx);
    playTrack(currentQueue[nextIdx], nextIdx);
  }

  function prevTrack() {
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;

    let prevIdx = currentQueueIndexRef.current - 1;
    if (prevIdx < 0) {
      prevIdx = currentQueue.length - 1; // Go to last
    }

    setCurrentQueueIndex(prevIdx);
    playTrack(currentQueue[prevIdx], prevIdx);
  }

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      duration,
      currentTime,
      volume,
      isShuffle,
      isRepeat,
      queue,
      currentQueueIndex,
      analyser: analyserRef.current,
      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlay,
      seekTo,
      updateVolume,
      playQueue,
      nextTrack,
      prevTrack,
      setIsShuffle: () => setIsShuffle(!isShuffle),
      setIsRepeat: () => setIsRepeat(!isRepeat)
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
