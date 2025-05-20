import { useState, useEffect, useCallback } from 'react';
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

  // Set initial video only once after user clicks play
  const handleStart = () => {
    setVideo(getRandomVideo());
    setStarted(true);
  };

  useEffect(() => {
    localStorage.setItem('playerVolume', String(volume));
  }, [volume]);

  // Next video logic
  const handleNext = useCallback(() => {
    if (!video) return;
    setVideo(getRandomVideo(video.id));
  }, [video]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" style={{ margin: 0, padding: 0 }}>
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
                    playsinline: 1
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
          {/* Transparent overlay for hover logic, sibling to ReactPlayer */}
          <div
            className="absolute inset-0 z-10"
            style={{ background: 'transparent' }}
            onMouseEnter={() => setShowNext(true)}
            onMouseLeave={() => setShowNext(false)}
          />
          {/* Next Button (only on hover) */}
          <button
            onClick={handleNext}
            className={`absolute top-1/2 right-6 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-4 md:p-5 shadow transition ${showNext ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{ zIndex: 20, transition: 'opacity 0.2s' }}
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