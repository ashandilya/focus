import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { videoService } from '../services/videoService';
import type { Video } from '../services/videoService';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState<Video[]>([]);

  useEffect(() => {
    if (query) {
      const searchResults = videoService.searchVideos(query);
      setResults(searchResults);
    }
  }, [query]);

  return (
    <div className="pt-16 pl-64">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white mb-4">
          Search results for: {query}
        </h1>
        <div className="space-y-4">
          {results.map((video) => (
            <div key={video.id} className="flex gap-4">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-64 aspect-video object-cover rounded-lg"
              />
              <div className="flex-1">
                <h2 className="text-xl font-medium text-white">{video.title}</h2>
                <p className="text-gray-400 mt-1">{video.channel}</p>
                <div className="text-gray-400 text-sm mt-1">
                  {video.views} • {video.timestamp}
                </div>
                <p className="text-gray-400 mt-2 line-clamp-2">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search; 