
// --- YOUTUBE DATA API SERVICE ---

// 🔴 IMPORTANT: PASTE YOUR GOOGLE CLOUD API KEY HERE
// 🔴 هام: ضع مفتاح الـ API الذي حصلت عليه هنا داخل علامات التنصيص
const YOUTUBE_API_KEY: string = ""; // CLEARED TO PREVENT 403 ERRORS WITH PLACEHOLDER

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
