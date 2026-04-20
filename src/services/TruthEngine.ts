import { get, set } from 'idb-keyval';
import { getClient, prepareImageForAPI } from './geminiService';
import { Type } from '@google/genai';

export interface StyleVector {
    palette: string[];
    contrast: string;
    face_scale: string;
    emotion: string;
    layout: string;
}

export interface TruthEngineInput {
    image_binary: string;
    prompt: string;
    style_vector?: StyleVector;
    persona_embedding?: string;
}

export interface TruthEngineResult {
    thumbnail_id: string;
    score: number;
    pillars: {
        clarity: number;
        emotion: number;
        curiosity: number;
        contrast: number;
        composition: number;
    };
    locked: boolean;
    created_at: string;
}

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);                    
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export const getThumbnailId = async (input: TruthEngineInput) => {
    return sha256(
      input.image_binary + 
      (input.prompt || "").trim().toLowerCase() + 
      JSON.stringify(input.style_vector || {}) + 
      (input.persona_embedding || "")
    );
}

// Global wrap function similar to geminiService
const wrapCall = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (e: any) {
        console.error("Truth Engine Error:", e);
        throw e;
    }
}

export const getCachedThumbnail = async (thumbnail_id: string): Promise<TruthEngineResult | null> => {
    return await get(`thumbnail_${thumbnail_id}`) || null;
}

export const analyzeWithTruthEngine = async (input: TruthEngineInput, language: string, mimeType: string = 'image/jpeg'): Promise<TruthEngineResult> => {
    const thumbnail_id = await getThumbnailId(input);
    const cached = await getCachedThumbnail(thumbnail_id);
    
    // CACHE LAYER & LOCK logic
    if (cached && cached.locked) {
        console.log("TruthEngine: Returning CACHED and LOCKED result for ID:", thumbnail_id);
        return cached;
    }

    console.log("TruthEngine: Computing ONCE for ID:", thumbnail_id);
    
    // compute_once
    return wrapCall(async () => {
        const ai = getClient();
        const { data, mime: cleanMime } = await prepareImageForAPI(input.image_binary, mimeType);
        
        const systemInstruction = `
        ROLE: Ruthless Truth Engine for YouTube Thumbnails.
        You MUST calculate deterministic scores for 5 specific pillars.
        Weights:
        - clarity: 25%
        - emotion: 20%
        - curiosity: 20%
        - contrast: 15%
        - composition: 20%
        
        Calculate the exact integer score (0-100) for each pillar based strictly on the visual evidence.
        Then calculate the final weighted 'score'.
        Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data, mimeType: cleanMime } },
                    { text: `Evaluate this thumbnail against the 5 specific pillars in ${language}.` }
                ]
            },
            config: {
                systemInstruction,
                temperature: 0, // Deterministic Config
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clarity: { type: Type.INTEGER },
                        emotion: { type: Type.INTEGER },
                        curiosity: { type: Type.INTEGER },
                        contrast: { type: Type.INTEGER },
                        composition: { type: Type.INTEGER }
                    },
                    required: ["clarity", "emotion", "curiosity", "contrast", "composition"]
                }
            }
        });
        
        const jsonStr = response.text || "{}";
        const result = JSON.parse(jsonStr);
        
        const c = result.clarity || 0;
        const e = result.emotion || 0;
        const cu = result.curiosity || 0;
        const co = result.contrast || 0;
        const comp = result.composition || 0;
        
        const weightedScore = Math.floor((c * 0.25) + (e * 0.20) + (cu * 0.20) + (co * 0.15) + (comp * 0.20));

        const finalResult: TruthEngineResult = {
            thumbnail_id,
            score: weightedScore,
            pillars: {
                clarity: c,
                emotion: e,
                curiosity: cu,
                contrast: co,
                composition: comp
            },
            locked: true,
            created_at: new Date().toISOString()
        };

        await set(`thumbnail_${thumbnail_id}`, finalResult);
        return finalResult;
    });
}
