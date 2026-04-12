/// <reference types="vite/client" />
import axios from 'axios';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface GameVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  channelTitle: string;
  duration?: string;
}

const CATEGORY_QUERIES: Record<string, string[]> = {
  'MrBeast style': ['MrBeast', 'Fidias', 'Airrack', 'Ryan Trahan', 'challenge', 'I spent 100 days'],
  'Gaming': ['Minecraft gameplay', 'GTA 5 funny moments', 'Fortnite highlights', 'Roblox', 'Elden Ring boss'],
  'Football': ['Champions league highlights', 'Messi vs Ronaldo', 'Premier league goals', 'football skills'],
  'TikTok / Drama': ['TikTok drama', 'Influencer apology', 'Podcast clips', 'spilling tea'],
  'Random': ['Science documentary', 'National Geographic Abu Dhabi', 'Health and fitness', 'Business and commerce', 'Football highlights', 'Tech review', 'Cooking tutorial', 'Travel vlog', 'Space exploration', 'History documentary']
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to format time ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

export const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}:`;
    formatted += `${minutes.toString().padStart(2, '0')}:`;
  } else {
    formatted += `${minutes}:`;
  }
  formatted += `${seconds.toString().padStart(2, '0')}`;

  return formatted;
};

const MOCK_VIDEOS: GameVideo[] = [
  {
    id: '0e3GPea1Tyg',
    title: '$456,000 Squid Game In Real Life!',
    thumbnailUrl: 'https://i.ytimg.com/vi/0e3GPea1Tyg/hqdefault.jpg',
    viewCount: 600000000,
    publishedAt: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'MrBeast',
    duration: 'PT25M42S'
  },
  {
    id: 'V-_O7nl0Ii0',
    title: 'Backyard Squirrel Maze 1.0- Ninja Warrior Course',
    thumbnailUrl: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg',
    viewCount: 120000000,
    publishedAt: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Mark Rober',
    duration: 'PT21M39S'
  },
  {
    id: 'iQeIGyECMMo',
    title: '$1 vs $1,000,000 Hotel Room!',
    thumbnailUrl: 'https://i.ytimg.com/vi/iQeIGyECMMo/hqdefault.jpg',
    viewCount: 145000000,
    publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'MrBeast',
    duration: 'PT15M10S'
  },
  {
    id: '7_MQWgCQKpc',
    title: 'I Survived 50 Hours In Antarctica',
    thumbnailUrl: 'https://i.ytimg.com/vi/7_MQWgCQKpc/hqdefault.jpg',
    viewCount: 89000000,
    publishedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'MrBeast',
    duration: 'PT12M15S'
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    viewCount: 1500000000,
    publishedAt: new Date(Date.now() - 365 * 14 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Rick Astley',
    duration: 'PT3M33S'
  },
  {
    id: 'p7YXXieGHdc',
    title: 'Lions vs. Hyenas | National Geographic',
    thumbnailUrl: 'https://i.ytimg.com/vi/p7YXXieGHdc/hqdefault.jpg',
    viewCount: 5600000,
    publishedAt: new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'National Geographic',
    duration: 'PT4M12S'
  },
  {
    id: 'jNQXAC9IVRw',
    title: 'Me at the zoo',
    thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
    viewCount: 300000000,
    publishedAt: new Date(Date.now() - 365 * 18 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'jawed',
    duration: 'PT0M19S'
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    thumbnailUrl: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    viewCount: 8300000000,
    publishedAt: new Date(Date.now() - 365 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Luis Fonsi',
    duration: 'PT4M42S'
  },
  {
    id: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
    thumbnailUrl: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',
    viewCount: 5000000000,
    publishedAt: new Date(Date.now() - 365 * 11 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'officialpsy',
    duration: 'PT4M13S'
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You (Official Music Video)',
    thumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    viewCount: 6100000000,
    publishedAt: new Date(Date.now() - 365 * 7 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Ed Sheeran',
    duration: 'PT4M24S'
  },
  {
    id: 'FlsCjmMhFmw',
    title: 'YouTube Rewind 2018: Everyone Controls Rewind',
    thumbnailUrl: 'https://i.ytimg.com/vi/FlsCjmMhFmw/hqdefault.jpg',
    viewCount: 230000000,
    publishedAt: new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'YouTube',
    duration: 'PT8M14S'
  },
  {
    id: 'k85mRPqvMbE',
    title: 'Crazy Plastic Ball PRANK!!',
    thumbnailUrl: 'https://i.ytimg.com/vi/k85mRPqvMbE/hqdefault.jpg',
    viewCount: 120000000,
    publishedAt: new Date(Date.now() - 365 * 8 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'RomanAtwood',
    duration: 'PT2M48S'
  },
  {
    id: 'v64KOxKVLVg',
    title: 'I Bought A Private Island',
    thumbnailUrl: 'https://i.ytimg.com/vi/v64KOxKVLVg/hqdefault.jpg',
    viewCount: 150000000,
    publishedAt: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'MrBeast',
    duration: 'PT15M32S'
  },
  {
    id: 'QhBnZ6NPOY0',
    title: 'I Spent 50 Hours Buried Alive',
    thumbnailUrl: 'https://i.ytimg.com/vi/QhBnZ6NPOY0/hqdefault.jpg',
    viewCount: 300000000,
    publishedAt: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'MrBeast',
    duration: 'PT12M45S'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody | Muppet Music Video',
    thumbnailUrl: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    viewCount: 110000000,
    publishedAt: new Date(Date.now() - 365 * 14 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'The Muppets',
    duration: 'PT4M47S'
  },
  {
    id: 'WcIcjagPDA4',
    title: 'Evolution of Dance',
    thumbnailUrl: 'https://i.ytimg.com/vi/WcIcjagPDA4/hqdefault.jpg',
    viewCount: 310000000,
    publishedAt: new Date(Date.now() - 365 * 17 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Judson Laipply',
    duration: 'PT6M1S'
  },
  {
    id: 'dMH0bHeiRNg',
    title: 'Charlie bit my finger - again !',
    thumbnailUrl: 'https://i.ytimg.com/vi/dMH0bHeiRNg/hqdefault.jpg',
    viewCount: 900000000,
    publishedAt: new Date(Date.now() - 365 * 16 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'HDCYT',
    duration: 'PT0M56S'
  },
  {
    id: 'txqiwrbYGrs',
    title: 'David After Dentist',
    thumbnailUrl: 'https://i.ytimg.com/vi/txqiwrbYGrs/hqdefault.jpg',
    viewCount: 140000000,
    publishedAt: new Date(Date.now() - 365 * 15 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'booba1234',
    duration: 'PT1M59S'
  },
  {
    id: 'OQSNhk5ICTI',
    title: 'Hide and Seek In Your House!',
    thumbnailUrl: 'https://i.ytimg.com/vi/OQSNhk5ICTI/hqdefault.jpg',
    viewCount: 50000000,
    publishedAt: new Date(Date.now() - 365 * 4 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Sidemen',
    duration: 'PT45M12S'
  },
  {
    id: 'b8HO6hba9ZE',
    title: 'Building the Perfect Squirrel Proof Bird Feeder',
    thumbnailUrl: 'https://i.ytimg.com/vi/b8HO6hba9ZE/hqdefault.jpg',
    viewCount: 95000000,
    publishedAt: new Date(Date.now() - 365 * 4 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Mark Rober',
    duration: 'PT21M40S'
  },
  {
    id: 'hY7m5jjJ9mM',
    title: 'I Built a Secret Room in My House!',
    thumbnailUrl: 'https://i.ytimg.com/vi/hY7m5jjJ9mM/hqdefault.jpg',
    viewCount: 45000000,
    publishedAt: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Matthew Beem',
    duration: 'PT14M20S'
  },
  {
    id: 'M1_COJ-Z12w',
    title: 'Minecraft Speedrunner VS 3 Hunters GRAND FINALE',
    thumbnailUrl: 'https://i.ytimg.com/vi/M1_COJ-Z12w/hqdefault.jpg',
    viewCount: 120000000,
    publishedAt: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Dream',
    duration: 'PT42M15S'
  },
  {
    id: '07d2dXHYb94',
    title: 'I Built a Theme Park in my Backyard!',
    thumbnailUrl: 'https://i.ytimg.com/vi/07d2dXHYb94/hqdefault.jpg',
    viewCount: 35000000,
    publishedAt: new Date(Date.now() - 365 * 1 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Stokes Twins',
    duration: 'PT18M30S'
  },
  {
    id: 'tPEE9ZwTmy0',
    title: 'Shortest Video on YouTube',
    thumbnailUrl: 'https://i.ytimg.com/vi/tPEE9ZwTmy0/hqdefault.jpg',
    viewCount: 40000000,
    publishedAt: new Date(Date.now() - 365 * 10 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Mylo the Cat',
    duration: 'PT0M1S'
  },
  {
    id: 'j5a0jTc9S10',
    title: 'I Spent 100 Days in a Zombie Apocalypse in Minecraft',
    thumbnailUrl: 'https://i.ytimg.com/vi/j5a0jTc9S10/hqdefault.jpg',
    viewCount: 65000000,
    publishedAt: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString(),
    channelTitle: 'Forge Labs',
    duration: 'PT45M10S'
  }
];

export const fetchVideoPair = async (category: string): Promise<[GameVideo, GameVideo]> => {
  if (!API_KEY) {
    console.warn('YouTube API key is missing. Using mock data.');
    let idx1 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    let idx2 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    }
    return [MOCK_VIDEOS[idx1], MOCK_VIDEOS[idx2]];
  }

  const queries = CATEGORY_QUERIES[category] || CATEGORY_QUERIES['Random'];
  
  try {
    let video1Id, video2Id;

    if (category === 'Random') {
        const allQueries = Object.values(CATEGORY_QUERIES).flat();
        const query1 = getRandomElement(allQueries);
        let query2 = getRandomElement(allQueries);
        while (query1 === query2) query2 = getRandomElement(allQueries);

        const [res1, res2] = await Promise.all([
            axios.get(`${BASE_URL}/search`, { params: { part: 'snippet', q: query1, type: 'video', maxResults: 5, key: API_KEY } }),
            axios.get(`${BASE_URL}/search`, { params: { part: 'snippet', q: query2, type: 'video', maxResults: 5, key: API_KEY } })
        ]);

        const items1 = res1.data.items as any[];
        const items2 = res2.data.items as any[];

        if (!items1 || !items2 || items1.length === 0 || items2.length === 0) throw new Error('Not enough videos found');

        video1Id = getRandomElement(items1).id.videoId;
        video2Id = getRandomElement(items2).id.videoId;
    } else {
        const query = getRandomElement(queries);
        const searchRes = await axios.get(`${BASE_URL}/search`, {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 10,
            order: 'relevance',
            key: API_KEY,
          },
        });

        const items = searchRes.data.items;
        if (!items || items.length < 2) {
          throw new Error('Not enough videos found');
        }

        let idx1 = Math.floor(Math.random() * items.length);
        let idx2 = Math.floor(Math.random() * items.length);
        while (idx1 === idx2) {
          idx2 = Math.floor(Math.random() * items.length);
        }
        video1Id = items[idx1].id.videoId;
        video2Id = items[idx2].id.videoId;
    }

    // 2. Get video statistics
    const statsRes = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'statistics,snippet,contentDetails',
        id: `${video1Id},${video2Id}`,
        key: API_KEY,
      },
    });

    const statsItems = statsRes.data.items;
    if (!statsItems || statsItems.length < 2) {
      throw new Error('Could not fetch video statistics');
    }

    const mapToGameVideo = (item: any): GameVideo => {
      // Prefer maxres, fallback to high, then medium
      const thumbnails = item.snippet.thumbnails;
      const thumbnailUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;

      return {
        id: item.id,
        title: item.snippet.title,
        thumbnailUrl,
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        duration: item.contentDetails?.duration,
      };
    };

    return [mapToGameVideo(statsItems[0]), mapToGameVideo(statsItems[1])];

  } catch (error: any) {
    console.warn(`YouTube API Error (${error?.response?.status || 'Unknown'}): Falling back to mock data.`);
    let idx1 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    let idx2 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * MOCK_VIDEOS.length);
    }
    return [MOCK_VIDEOS[idx1], MOCK_VIDEOS[idx2]];
  }
};
