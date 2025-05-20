import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { videoService } from '../services/videoService';
import type { Video } from '../services/videoService';

const Watch = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (videoId) {
      const currentVideo = videoService.getVideoById(videoId);
      if (currentVideo) {
        setVideo(currentVideo);
        const related = videoService.getRelatedVideos(videoId);
        setRelatedVideos(related);
      }
    }
  }, [videoId]);

  if (!video) return null;

  return (
    <div className="pt-16 pl-64">
      <div className="flex gap-6 p-4">
        <div className="flex-1">
          <div className="aspect-video bg-black">
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${video.id}`}
              width="100%"
              height="100%"
              controls
              playing
            />
          </div>
          <div className="mt-4">
            <h1 className="text-xl font-bold text-white">{video.title}</h1>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center text-gray-400">
                <span>{video.views}</span>
                <span className="mx-2">•</span>
                <span>{video.timestamp}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-[#1f1f1f] rounded-lg">
              <p className="text-white">{video.description}</p>
            </div>
          </div>
        </div>

        <div className="w-96">
          <h2 className="text-white font-medium mb-4">Related Videos</h2>
          <div className="space-y-4">
            {relatedVideos.map((relatedVideo) => (
              <div key={relatedVideo.id} className="flex gap-2">
                <img
                  src={relatedVideo.thumbnail}
                  alt={relatedVideo.title}
                  className="w-40 aspect-video object-cover rounded-lg"
                />
                <div>
                  <h3 className="text-white font-medium line-clamp-2">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {relatedVideo.channel}
                  </p>
                  <div className="text-gray-400 text-sm">
                    {relatedVideo.views} • {relatedVideo.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch; 