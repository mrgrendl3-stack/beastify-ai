
// --- YOUTUBE DATA API SERVICE ---

const YOUTUBE_API_KEY: string = (import.meta as any).env.VITE_YOUTUBE_API_KEY || "";

export interface YouTubeVideo {
  id: string;
  title: string;
  views: string;
  rawViews: number;
  duration: string;
  thumbnail: string;
  isShort: boolean;
}

export interface YouTubeChannel {
  id: string;
  name: string;
  avatar: string;
  subscribers: string;
  videosCount: string;
  uploadsPlaylistId: string;
}

// Helper to format numbers (e.g., 1500000 -> 1.5M)
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Helper to parse ISO 8601 duration (PT1H2M10S) to MM:SS
export const parseDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "0:00";
  const h = (match[1] || "").replace("H", "");
  const m = (match[2] || "").replace("M", "");
  const s = (match[3] || "").replace("S", "");
  
  let result = "";
  if (h) result += `${h}:`;
  result += `${m ? (h ? m.padStart(2, '0') : m) : "0"}:`;
  result += `${s ? s.padStart(2, '0') : "00"}`;
  return result;
};

export const searchChannels = async (query: string): Promise<{ results: YouTubeChannel[]; error?: string }> => {
    if (!YOUTUBE_API_KEY) return { results: [] };
    if (!query || query.trim().length < 3) return { results: [] }; // Require at least 3 characters

    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query.trim())}&maxResults=5&key=${YOUTUBE_API_KEY}`;
        const searchRes = await fetch(searchUrl);
        
        if (!searchRes.ok) {
            const errorData = await searchRes.json().catch(() => ({}));
            console.error("Search API Error:", errorData);
            return { results: [], error: errorData.error?.message || "YouTube API is blocked or unavailable." };
        }

        const searchData = await searchRes.json();
        if (!searchData.items || searchData.items.length === 0) return { results: [] };

        const channelIds = searchData.items
            .map((item: any) => item.id?.channelId || item.snippet?.channelId)
            .filter(Boolean)
            .join(',');

        if (!channelIds) return { results: [] };

        const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
        const statsRes = await fetch(statsUrl);

        if (!statsRes.ok) {
            const errorData = await statsRes.json().catch(() => ({}));
            return { results: [], error: errorData.error?.message || "YouTube API is blocked or unavailable." };
        }

        const statsData = await statsRes.json();
        if (!statsData.items) return { results: [] };

        return {
            results: statsData.items.map((item: any) => ({
                id: item.id,
                name: item.snippet.title,
                avatar: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                subscribers: formatNumber(parseInt(item.statistics.subscriberCount || "0", 10)),
                videosCount: formatNumber(parseInt(item.statistics.videoCount || "0", 10)),
                uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || ""
            }))
        };
    } catch (e) {
        console.error("Failed to search channels:", e);
        return { results: [], error: "Failed to connect to YouTube API." };
    }
};

export const fetchFullChannelData = async (urlOrHandle: string): Promise<{ channel: YouTubeChannel | null, error?: string }> => {
    if (!YOUTUBE_API_KEY) return { channel: null, error: "API Key missing" };

    try {
        let handle = urlOrHandle.trim();
        let queryParams: string[] = [];
        
        if (urlOrHandle.includes('youtube.com/')) {
            const handleMatch = urlOrHandle.match(/@[\w.-]+/);
            const channelIdMatch = urlOrHandle.match(/channel\/(UC[\w-]+)/);
            const usernameMatch = urlOrHandle.match(/user\/([\w-]+)/);
            const cMatch = urlOrHandle.match(/\/c\/([\w-]+)/);
            
            if (handleMatch) {
                queryParams.push(`forHandle=${handleMatch[0]}`);
            } else if (channelIdMatch) {
                queryParams.push(`id=${channelIdMatch[1]}`);
            } else if (usernameMatch) {
                queryParams.push(`forUsername=${usernameMatch[1]}`);
            } else if (cMatch) {
                // we can't reliably resolve /c/ directly via channels endpoint, might need search
                queryParams.push(`forUsername=${cMatch[1]}`);
                // fallback will search anyway
            } else {
                return { channel: null, error: "Invalid YouTube URL" };
            }
        } else if (urlOrHandle.startsWith('@')) {
            queryParams.push(`forHandle=${urlOrHandle}`);
        } else {
            // Assume it's a handle first, then try username
            const cleanHandle = urlOrHandle.replace(/\s+/g, '');
            queryParams.push(`forHandle=@${cleanHandle}`);
            queryParams.push(`forUsername=${cleanHandle}`);
        }

        let statsData = null;
        let lastError = null;

        for (const queryParam of queryParams) {
            const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&${queryParam}&key=${YOUTUBE_API_KEY}`;
            const statsRes = await fetch(statsUrl);
            if (statsRes.ok) {
                const data = await statsRes.json();
                if (data.items && data.items.length > 0) {
                    statsData = data;
                    break;
                }
            } else {
                const errorData = await statsRes.json().catch(() => ({}));
                const reason = errorData.error?.errors?.[0]?.reason;
                if (reason === 'accessNotConfigured' || reason === 'serviceDisabled') {
                    lastError = "YouTube API is disabled in Google Console. Please enable 'YouTube Data API v3'.";
                    break; 
                }
                lastError = errorData.error?.message || `Channels API Error: ${statsRes.status}`;
            }
        }
        
        // Fallback to Search API if we didn't find the channel by handle/id/username
        if (!statsData?.items || statsData.items.length === 0) {
            // If we already hit a critical error like disabled service, stop here
            if (lastError?.includes("disabled")) {
                return { channel: null, error: lastError };
            }

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(urlOrHandle)}&maxResults=1&key=${YOUTUBE_API_KEY}`;
            const searchRes = await fetch(searchUrl);
            
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    // Extract channelId safely
                    const channelId = searchData.items[0].id?.channelId || searchData.items[0].snippet?.channelId;
                    
                    if (channelId) {
                        const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
                        const statsRes = await fetch(statsUrl);
                        if (statsRes.ok) {
                            const data = await statsRes.json();
                            if (data.items && data.items.length > 0) {
                                statsData = data;
                            }
                        } else {
                             const errorData = await statsRes.json().catch(() => ({}));
                             lastError = errorData.error?.message || `Channels API Error: ${statsRes.status}`;
                        }
                    }
                }
            } else {
                const errorData = await searchRes.json().catch(() => ({}));
                lastError = errorData.error?.message || `Search API Error: ${searchRes.status}`;
            }
        }

        if (!statsData?.items || statsData.items.length === 0) {
            return { channel: null, error: lastError ? `API Error: ${lastError}` : "Channel not found" };
        }

        const item = statsData.items[0];
        return {
            channel: {
                id: item.id,
                name: item.snippet.title,
                avatar: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                subscribers: formatNumber(parseInt(item.statistics.subscriberCount || "0")),
                videosCount: formatNumber(parseInt(item.statistics.videoCount || "0")),
                uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads
            }
        };
    } catch (e) {
        return { channel: null, error: "An error occurred" };
    }
};

export const fetchRecentVideos = async (playlistId: string): Promise<YouTubeVideo[]> => {
    if (!YOUTUBE_API_KEY) return [];

    try {
        // 1. Fetch playlist items (increased to 50)
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
        const playlistRes = await fetch(playlistUrl);
        if (!playlistRes.ok) {
            console.error("Failed to fetch playlist items:", await playlistRes.text());
            return [];
        }
        const playlistData = await playlistRes.json();
        
        if (!playlistData.items || playlistData.items.length === 0) return [];

        const videoIds = playlistData.items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean).join(',');
        if (!videoIds) return [];

        // 2. Fetch video details (for duration, views, publishedAt)
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const videosRes = await fetch(videosUrl);
        if (!videosRes.ok) {
            console.error("Failed to fetch video details:", await videosRes.text());
            return [];
        }
        const videosData = await videosRes.json();

        if (!videosData.items) return [];

        const videos = videosData.items.map((item: any) => {
            const durationStr = item.contentDetails.duration;
            const duration = parseDuration(durationStr);
            // A simple heuristic for Shorts: duration <= 60s (1:00)
            const isShort = !durationStr.includes('H') && !durationStr.includes('M') || durationStr === 'PT1M' || durationStr.match(/PT0M\d+S/);
            
            return {
                id: item.id,
                title: item.snippet.title,
                views: formatNumber(parseInt(item.statistics.viewCount || "0")),
                rawViews: parseInt(item.statistics.viewCount || "0"),
                duration: duration,
                thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                isShort: !!isShort,
                publishedAt: new Date(item.snippet.publishedAt).getTime() // Used for sorting
            };
        });

        // Ensure strictly chronological order (newest to oldest) as YouTube API videos endpoint does not guarantee ID order preservation
        videos.sort((a: any, b: any) => b.publishedAt - a.publishedAt);
        
        // Remove publishedAt before returning to match interface exactly if strict typing is an issue, although TS allows extra properties
        return videos.map((v: any) => {
            const { publishedAt, ...rest } = v;
            return rest;
        });
    } catch (e) {
        return [];
    }
};

export const getVideoData = async (videoUrl: string): Promise<{ title: string; thumbnail: string } | { error: string }> => {
    if (!YOUTUBE_API_KEY) {
        return { error: "API Key is missing" };
    }

    try {
        // Extract video ID
        let videoId = "";
        const urlObj = new URL(videoUrl);
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || "";
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }

        if (!videoId) {
            return { error: "Invalid YouTube URL" };
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            return { error: "Failed to fetch video data" };
        }

        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            return { error: "Video not found" };
        }

        const snippet = data.items[0].snippet;
        const title = snippet.title;
        const thumbnails = snippet.thumbnails;
        
        // Prefer maxres, then high, then medium, then default
        const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;

        return { title, thumbnail };
    } catch (error) {
        return { error: "An error occurred while fetching video data" };
    }
};

export const fetchChannelStats = async (channelIds: string[]): Promise<Record<string, number>> => {
    return {};
};

// Function to fetch a single channel's stats efficiently using the Handle (saves API Quota)
export const fetchSingleChannelStat = async (urlOrHandle: string): Promise<number | null> => {
     // Strict check to prevent using invalid/placeholder keys
     if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes("AIzaSyBj") || YOUTUBE_API_KEY === "PASTE_YOUR_API_KEY_HERE") {
         return null;
     }

     try {
         // Extract handle from URL (e.g. https://www.youtube.com/@MrBeast -> @MrBeast)
         let handle = urlOrHandle;
         if (urlOrHandle.includes('youtube.com/')) {
             const handleMatch = urlOrHandle.match(/@[\w.-]+/);
             if (handleMatch) {
                 handle = handleMatch[0];
             } else {
                 return null;
             }
         }

         const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${handle}&key=${YOUTUBE_API_KEY}`;
         
         const statsRes = await fetch(statsUrl);
         
         if (!statsRes.ok) {
             // Silently fail on error to avoid cluttering console with 403s
             return null;
         }

         const statsData = await statsRes.json();
         
         if (statsData?.items?.length > 0) {
             return parseInt(statsData.items[0].statistics.subscriberCount);
         }
     } catch (e) {
         // Silently fail
     }
     return null;
}

// Function to fetch Video Title using oEmbed (No API Key required)
export const fetchVideoTitle = async (videoUrl: string): Promise<string | null> => {
    try {
        // Using NoEmbed service as a proxy for oEmbed data
        const response = await fetch(`https://noembed.com/embed?url=${videoUrl}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.title || null;
    } catch (error) {
        return null;
    }
};
