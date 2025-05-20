import videoData from '../data/videos.json';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  timestamp: string;
  description: string;
  category: string;
}

class VideoService {
  private videos: Video[] = videoData.videos;

  getAllVideos(): Video[] {
    return this.videos;
  }

  getVideoById(id: string): Video | undefined {
    return this.videos.find(video => video.id === id);
  }

  getRelatedVideos(currentVideoId: string, limit: number = 5): Video[] {
    return this.videos
      .filter(video => video.id !== currentVideoId)
      .slice(0, limit);
  }

  searchVideos(query: string): Video[] {
    const searchTerm = query.toLowerCase();
    return this.videos.filter(video => 
      video.title.toLowerCase().includes(searchTerm) ||
      video.description.toLowerCase().includes(searchTerm) ||
      video.category.toLowerCase().includes(searchTerm)
    );
  }

  getVideosByCategory(category: string): Video[] {
    return this.videos.filter(video => video.category === category);
  }
}

export const videoService = new VideoService(); 