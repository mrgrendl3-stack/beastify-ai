import { Type } from '@google/genai';
import { getClient, prepareImageForAPI, wrapGeminiCall, safeJsonParse } from './geminiService';

export interface StyleVector {
    palette: string[];
    contrast: string;
    face_scale: string;
    emotion: string;
    layout: string;
}

export interface PersonaEmbedding {
    demographic: string;
    expressiveness: string;
    defining_features: string[];
    lighting_preference: string;
}

export const createStyleVector = async (imagesBase64: string[], mimes: string[]): Promise<{ style_id: string, style_vector: StyleVector }> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        
        const parts = await Promise.all(imagesBase64.map(async (base64, index) => {
            const { data, mime } = await prepareImageForAPI(base64, mimes[index] || 'image/jpeg');
            return { inlineData: { data, mimeType: mime } };
        }));
        
        parts.push({ text: "Analyze these thumbnails and extract a normalized style vector. Return JSON." } as any);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts },
            config: {
                temperature: 0,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                        contrast: { type: Type.STRING },
                        face_scale: { type: Type.STRING },
                        emotion: { type: Type.STRING },
                        layout: { type: Type.STRING }
                    },
                    required: ["palette", "contrast", "face_scale", "emotion", "layout"]
                }
            }
        });

        const jsonStr = response.text || "{}";
        const style_vector = safeJsonParse(jsonStr) as StyleVector;
        return {
            style_id: `style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            style_vector
        };
    });
};

export const createPersonaEmbedding = async (name: string, faceImagesBase64: string[], mimes: string[]): Promise<{ persona_id: string, name: string, embedding: PersonaEmbedding, preview_url: string }> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        
        const parts = await Promise.all(faceImagesBase64.map(async (base64, index) => {
            const { data, mime } = await prepareImageForAPI(base64, mimes[index] || 'image/jpeg');
            return { inlineData: { data, mimeType: mime } };
        }));
        
        parts.push({ text: "Analyze this person's face and extract a facial embedding profile. Return JSON." } as any);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts },
            config: {
                temperature: 0,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        demographic: { type: Type.STRING },
                        expressiveness: { type: Type.STRING },
                        defining_features: { type: Type.ARRAY, items: { type: Type.STRING } },
                        lighting_preference: { type: Type.STRING }
                    },
                    required: ["demographic", "expressiveness", "defining_features", "lighting_preference"]
                }
            }
        });

        const jsonStr = response.text || "{}";
        const embedding = safeJsonParse(jsonStr) as PersonaEmbedding;
        
        // Spec: generate preview (white bg, centered face)
        const previewPrompt = `A perfectly centered, studio-quality, plain white background headshot of a person matching this profile: ${embedding.demographic}, features: ${embedding.defining_features.join(', ')}. Expression: neutral but highly engaging.`;
        
        const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: previewPrompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                }
            }
        });

        let preview_url = "";
        if (imgResponse.candidates?.[0]?.content?.parts) {
            for (const part of imgResponse.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    preview_url = `data:image/jpeg;base64,${part.inlineData.data}`;
                    break;
                }
            }
        }

        return {
            persona_id: `persona_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name,
            embedding,
            preview_url
        };
    });
};
