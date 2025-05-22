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

const Home = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('playerVolume');
    return stored ? parseFloat(stored) : 0.8;
  });
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hoverTimeoutRef = useRef<number>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const mouseActivityRef = useRef(false);

  // Set initial video only once after user clicks play
  const handleStart = () => {
    setVideo(getRandomVideo());
    setStarted(true);
    setIsLoading(true);
  };

  useEffect(() => {
    localStorage.setItem('playerVolume', String(volume));
  }, [volume]);

  // Next video logic with retry mechanism
  const handleNext = useCallback(() => {
    if (!video) return;
    setIsLoading(true);
    setError(null);
    retryCountRef.current = 0;
    setVideo(getRandomVideo(video.id));
  }, [video]);

  const handleError = useCallback((e: any) => {
    console.error('Player error:', e);
    retryCountRef.current += 1;
    
    if (retryCountRef.current >= MAX_RETRIES) {
      setError('Unable to play video. Please try again later.');
      setIsLoading(false);
      return;
    }

    setError(`Error playing video. Retrying... (${retryCountRef.current}/${MAX_RETRIES})`);
    handleNext();
  }, []);

  const handleReady = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    // Set up document-level mouse move listener to track activity
    const handleMouseMove = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      mouseActivityRef.current = true;
      setShowNext(true);
      
      hoverTimeoutRef.current = setTimeout(() => {
        if (mouseActivityRef.current) {
          mouseActivityRef.current = false;
          // Only hide the button after inactivity
          setShowNext(false);
        }
      }, 2000);
    };
    
    // Handle mouse leaving the window
    const handleMouseLeave = (e: MouseEvent) => {
      // Don't hide controls when mouse leaves the window
      // We'll rely on the inactivity timer instead
      if (e.relatedTarget === null) {
        mouseActivityRef.current = true;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-50">
          {error}
        </div>
      )}
      {/* Play Music Overlay */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30">
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
              url={`https://www.youtube.com/watch?v=${video.id}`}
              width="100vw"
              height="100vh"
              playing
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
                    widget_referrer: window.location.origin
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
          {/* Transparent overlay for hover logic - replaced with document-level listeners */}
          {/* Next Button */}
          <button
            onClick={handleNext}
            className={`absolute top-1/2 right-6 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-4 md:p-5 shadow transition-all duration-300 ease-in-out ${showNext ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
            style={{ zIndex: 20 }}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 md:w-8 md:h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.25 6.75L18.25 12m0 0l-5 5.25M18.25 12H5.75" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Home; 