import { get, set } from 'idb-keyval';
import { getClient, prepareImageForAPI, safeJsonParse } from './geminiService';
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

export interface PillarDetail {
    score: number;
    observation: string;
    impact: string;
    judgement: string;
    fix: string;
}

export interface TruthEngineResult {
    thumbnail_id: string;
    score: number;
    pillars: {
        clarity: PillarDetail;
        emotion: PillarDetail;
        curiosity: PillarDetail;
        contrast: PillarDetail;
        idea: PillarDetail;
    };
    final_summary?: {
        main_weakness: string;
        top_2_fixes: string[];
    };
    locked?: boolean;
    created_at?: string;
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
    return await get(`thumbnail_v2_${thumbnail_id}`) || null;
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
        ROLE: The Ultimate 180-IQ Truth Engine for YouTube Thumbnails.
        Evaluate thumbnails with lethal precision.
        
        STRICT SCORING CALIBRATION (PIKZELS-LEVEL HARSHNESS):
        - Treat scores above 85 as extremely rare. 
        - Scoring Benchmarks: 90+ (Elite), 80-89 (Strong), 70-79 (Good), 60-69 (Weak), <60 (Poor).
        
        MANDATORY PENALTIES:
        - Clutter: -5 to -10, Weak emotion: -5 to -10, Generic idea: -10, Confusing hook: -15, logos/icons: -5 each.
        
        For EACH pillar, follow this structure in ${language} (KEEP IT CONCISE, max 50 words per field):
         Observation: Exactly what is visible.
         Impact: Scroll behavior effect.
         Judgement: Specific reasoning.
         Fix: Precise improvement.
         Score: exact integer out of 100.
        
        FINAL SUMMARY (CONCISE):
        - Main Weakness
        - Top 2 Fixes
        
        Return JSON matching the schema.
        `;

        const pillarSchema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: "Score out of 100" },
                observation: { type: Type.STRING },
                impact: { type: Type.STRING },
                judgement: { type: Type.STRING },
                fix: { type: Type.STRING }
            },
            required: ["score", "observation", "impact", "judgement", "fix"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
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
                maxOutputTokens: 8192,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pillars: {
                            type: Type.OBJECT,
                            properties: {
                                clarity: pillarSchema,
                                emotion: pillarSchema,
                                curiosity: pillarSchema,
                                contrast: pillarSchema,
                                idea: pillarSchema
                            },
                            required: ["clarity", "emotion", "curiosity", "contrast", "idea"]
                        },
                        final_summary: {
                            type: Type.OBJECT,
                            properties: {
                                main_weakness: { type: Type.STRING },
                                top_2_fixes: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["main_weakness", "top_2_fixes"]
                        }
                    },
                    required: ["pillars", "final_summary"]
                }
            }
        });
        
        const jsonStr = response.text || "{}";
        const result = safeJsonParse(jsonStr);
        
        const c = result.pillars?.clarity?.score || 0;
        const e = result.pillars?.emotion?.score || 0;
        const cu = result.pillars?.curiosity?.score || 0;
        const co = result.pillars?.contrast?.score || 0;
        const id = result.pillars?.idea?.score || 0;
        
        const weightedScore = Math.floor((c * 0.20) + (e * 0.20) + (cu * 0.20) + (co * 0.20) + (id * 0.20));

        const finalResult: TruthEngineResult = {
            thumbnail_id,
            score: weightedScore,
            pillars: result.pillars || {
                clarity: {score:0, observation:"", impact:"", judgement:"", fix:""},
                emotion: {score:0, observation:"", impact:"", judgement:"", fix:""},
                curiosity: {score:0, observation:"", impact:"", judgement:"", fix:""},
                contrast: {score:0, observation:"", impact:"", judgement:"", fix:""},
                idea: {score:0, observation:"", impact:"", judgement:"", fix:""}
            },
            final_summary: result.final_summary || { main_weakness: "", top_2_fixes: [] },
            locked: true,
            created_at: new Date().toISOString()
        };

        await set(`thumbnail_v2_${thumbnail_id}`, finalResult);
        return finalResult;
    });
}
