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
  const [muted, setMuted] = useState(false);
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
  
  const retryCountRef = useRef(0);
  const loadTimeoutRef = useRef<number>();
  const playerRef = useRef<ReactPlayer>(null);
  const MAX_RETRIES = 3;
  const LOADING_TIMEOUT = 8000; // 8 seconds timeout for loading

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
    setVideo(getRandomVideoByCategory(category, video?.id));
  };

  // Next video logic with retry mechanism
  const handleNext = useCallback(() => {
    if (!video) return;
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;
    
    // Clear any existing loading timeout
    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
    }
    
    // Get next video based on category if selected
    if (selectedCategory) {
      setVideo(getRandomVideoByCategory(selectedCategory, video.id));
    } else {
      setVideo(getRandomVideo(video.id));
    }
  }, [video, selectedCategory]);

  const handleError = useCallback((e: any) => {
    console.error('Player error:', e);
    retryCountRef.current += 1;
    
    if (retryCountRef.current >= MAX_RETRIES) {
      setError('Unable to play video. Skipping to next...');
      setIsLoading(false);
      // Skip to next video after a brief delay
      setTimeout(() => {
        handleNext();
      }, 1500);
      return;
    }

    setError(`Error playing video. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
    handleNext();
  }, [handleNext]);

  const handleReady = useCallback(() => {
    // Clear loading timeout
    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = undefined;
    }
    
    setIsLoading(false);
    setError(null);
  }, []);

  // Set loading timeout whenever video changes
  useEffect(() => {
    if (video && isLoading) {
      // Clear any existing timeout
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
      }
      
      // Set timeout to skip video if it doesn't load
      loadTimeoutRef.current = window.setTimeout(() => {
        console.error('Video loading timeout:', video.id);
        setError('Video loading timeout. Skipping to next...');
        handleNext();
      }, LOADING_TIMEOUT);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [video, isLoading, handleNext]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" 
      style={{ margin: 0, padding: 0, pointerEvents: 'none' }} // Disable pointer events for the entire container
    >
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
      
      {/* Play Music Overlay */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={handleStart}
            className="bg-white text-black px-8 py-4 rounded-full text-2xl font-bold shadow-lg hover:bg-gray-200 transition"
          >
            ▶ Play Music
          </button>
        </div>
      )}
      
      {/* Video Player */}
      {started && video && (
        <>
          <div className="absolute inset-0 z-0">
            <ReactPlayer
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${video.id}`}
              width="100vw"
              height="100vh"
              playing={isPlaying}
              controls={false}
              loop={false}
              onEnded={handleNext}
              onError={handleError}
              onReady={handleReady}
              style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}
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
                    origin: window.location.origin,
                    enablejsapi: 1,
                    widget_referrer: window.location.origin,
                    disablekb: 1,
                    cc_load_policy: 0
                  }
                }
              }}
              playsinline
              muted={muted}
              volume={volume}
              // Use wrapper to force object-fit: cover
              wrapper={({ children }) => (
                <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
                  <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
                    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {children}
                    </div>
                  </div>
                </div>
              )}
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
              <div className="text-white text-xs md:text-sm opacity-80 line-clamp-1 max-w-[70%] mr-4">
                {video.title}
              </div>
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
        </>
      )}
    </div>
  );
};

export default Home;