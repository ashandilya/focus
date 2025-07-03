import { useState, useEffect, useCallback, useRef } from 'react';
import ReactPlayer from 'react-player';
import { videoService } from '../services/videoService';
import type { Video } from '../services/videoService';

function getRandomVideo(excludeId?: string): Video {
  const allVideos = videoService.getAllVideos();
  if (allVideos.length === 0) throw new Error('No videos');
  let next;
  do {
    next = allVideos[Math.floor(Math.random() * allVideos.length)];
  } while (excludeId && next.id === excludeId && allVideos.length > 1);
  return next;
}

function getRandomVideoByCategory(category: string, excludeId?: string): Video {
  const categoryVideos = videoService.getVideosByCategory(category);
  if (categoryVideos.length === 0) return getRandomVideo(excludeId);
  
  let next;
  do {
    next = categoryVideos[Math.floor(Math.random() * categoryVideos.length)];
  } while (excludeId && next.id === excludeId && categoryVideos.length > 1);
  return next;
}

// Get all unique categories from videos
function getAllCategories(): string[] {
  const allVideos = videoService.getAllVideos();
  const categories = new Set<string>();
  
  allVideos.forEach(video => {
    if (video.category) {
      categories.add(video.category);
    }
  });
  
  return Array.from(categories).sort();
}

const Home = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('playerVolume');
    return stored ? parseFloat(stored) : 0.8;
  });
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPauseButton, setShowPauseButton] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  
  const retryCountRef = useRef(0);
  const loadTimeoutRef = useRef<number>();
  const playerRef = useRef<ReactPlayer>(null);
  const MAX_RETRIES = 2;
  const MAX_CONSECUTIVE_ERRORS = 3;
  const LOADING_TIMEOUT = 15000; // Reduced to 15 seconds
  const ERROR_COOLDOWN = 2000; // 2 second delay between retries

  // Initialize categories
  useEffect(() => {
    setCategories(getAllCategories());
  }, []);

  // Set initial video only once after user clicks play
  const handleStart = () => {
    setVideo(getRandomVideo());
    setStarted(true);
    setIsPlaying(true);
    setIsLoading(true);
    setConsecutiveErrors(0);
    setError(null);
  };

  useEffect(() => {
    localStorage.setItem('playerVolume', String(volume));
  }, [volume]);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;
    setConsecutiveErrors(0);
    setPlayerKey(prev => prev + 1); // Force player remount
    setVideo(getRandomVideoByCategory(category, video?.id));
  };

  // Next video logic with improved error handling
  const handleNext = useCallback(() => {
    if (!video) return;
    
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
    }
    
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;
    setPlayerKey(prev => prev + 1); // Force player remount
    
    // Get next video based on category if selected
    if (selectedCategory) {
      setVideo(getRandomVideoByCategory(selectedCategory, video.id));
    } else {
      setVideo(getRandomVideo(video.id));
    }
  }, [video, selectedCategory]);

  const handleError = useCallback((e: any) => {
    console.error('Player error:', e);
    
    // Clear loading timeout
    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = undefined;
    }
    
    const newConsecutiveErrors = consecutiveErrors + 1;
    setConsecutiveErrors(newConsecutiveErrors);
    retryCountRef.current += 1;
    
    // If too many consecutive errors, stop trying
    if (newConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      setError('Multiple videos failed to load. Please refresh the page or try again later.');
      setIsLoading(false);
      setIsPlaying(false);
      return;
    }
    
    // If max retries for this video, skip to next
    if (retryCountRef.current >= MAX_RETRIES) {
      setError(`Video unavailable. Skipping to next... (${newConsecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`);
      setTimeout(() => {
        handleNext();
      }, ERROR_COOLDOWN);
      return;
    }

    // Retry current video
    setError(`Loading error. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
    setTimeout(() => {
      setPlayerKey(prev => prev + 1); // Force player remount
      setIsLoading(true);
    }, ERROR_COOLDOWN);
  }, [consecutiveErrors, handleNext]);

  const handleReady = useCallback(() => {
    // Clear loading timeout
    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = undefined;
    }
    
    setIsLoading(false);
    setError(null);
    setConsecutiveErrors(0); // Reset on successful load
    retryCountRef.current = 0;
  }, []);

  const handleProgress = useCallback(() => {
    // Video is playing, reset error count
    if (consecutiveErrors > 0) {
      setConsecutiveErrors(0);
    }
  }, [consecutiveErrors]);

  // Set loading timeout whenever video changes
  useEffect(() => {
    if (video && isLoading) {
      // Clear any existing timeout
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
      }
      
      // Set timeout to handle loading failures
      loadTimeoutRef.current = window.setTimeout(() => {
        console.error('Video loading timeout:', video.id);
        
        const newConsecutiveErrors = consecutiveErrors + 1;
        setConsecutiveErrors(newConsecutiveErrors);
        
        if (newConsecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          setError('Multiple videos failed to load. Please refresh the page or try again later.');
          setIsLoading(false);
          setIsPlaying(false);
        } else {
          setError('Video loading timeout. Skipping to next...');
          setTimeout(() => {
            handleNext();
          }, ERROR_COOLDOWN);
        }
      }, LOADING_TIMEOUT);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [video, isLoading, handleNext, consecutiveErrors]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" 
      style={{ margin: 0, padding: 0, pointerEvents: 'none' }}
    >
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4"></div>
            <p className="text-white text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50 max-w-md text-center">
          {error}
        </div>
      )}
      
      {/* Play Music Overlay */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30" style={{ pointerEvents: 'auto' }}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Focus</h1>
            <p className="text-gray-300 text-lg">Instrumental Music for Deep Work</p>
          </div>
          <button
            onClick={handleStart}
            className="bg-white text-black px-8 py-4 rounded-full text-2xl font-bold shadow-lg hover:bg-gray-200 transition flex items-center gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Music
          </button>
        </div>
      )}
      
      {/* Video Player */}
      {started && video && (
        <>
          <div className="absolute inset-0 z-0">
            <ReactPlayer
              key={`${video.id}-${playerKey}`} // Force remount on errors
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${video.id}`}
              width="100vw"
              height="100vh"
              playing={isPlaying}
              controls={false}
              loop={false}
              muted={muted}
              volume={volume}
              onEnded={handleNext}
              onError={handleError}
              onReady={handleReady}
              onProgress={handleProgress}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh', 
                pointerEvents: 'none' 
              }}
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    fs: 0,
                    iv_load_policy: 3,
                    playsinline: 1,
                    disablekb: 1,
                    cc_load_policy: 0,
                    start: 0,
                    end: 0,
                    loop: 0,
                    playlist: '',
                    origin: window.location.origin
                  },
                  embedOptions: {
                    host: 'https://www.youtube-nocookie.com'
                  }
                }
              }}
              playsinline
            />
          </div>

          {/* Center Pause/Play Button Overlay */}
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ pointerEvents: 'auto' }}
            onMouseEnter={() => setShowPauseButton(true)}
            onMouseLeave={() => setShowPauseButton(false)}
          >
            <button
              onClick={togglePlayPause}
              className={`bg-black/50 backdrop-blur-sm rounded-full p-4 transition-all duration-300 ${
                showPauseButton ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-12 h-12">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="w-12 h-12">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Bottom Controls Box */}
          <div 
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden z-30 transition-all duration-300"
            style={{ 
              pointerEvents: 'auto',
              maxWidth: '90vw',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Categories Section */}
            <div className="flex px-2 py-3 max-w-full overflow-x-auto scrollbar-hide">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setIsLoading(true);
                  setError(null);
                  retryCountRef.current = 0;
                  setConsecutiveErrors(0);
                  setPlayerKey(prev => prev + 1);
                  setVideo(getRandomVideo(video?.id));
                }}
                className={`px-3 py-1 rounded-full mx-1 text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === null 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium shadow-lg' 
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`px-3 py-1 rounded-full mx-1 text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === category 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium shadow-lg' 
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="w-full h-[1px] bg-white/20"></div>
            
            {/* Controls Section */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-white text-xs md:text-sm opacity-80 line-clamp-1 max-w-[50%] mr-4">
                {video.title}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full p-2 shadow transition-all"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.76V9.51c0-.97.71-1.76 1.59-1.76h6.75z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.76V9.51c0-.97.71-1.76 1.59-1.76h6.75z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full p-2 md:p-3 shadow transition-all"
                  aria-label="Next"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 6.75L18.25 12m0 0l-5 5.25M18.25 12H5.75" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;