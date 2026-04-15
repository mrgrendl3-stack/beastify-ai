
import { GoogleGenAI, Modality, Type, Chat, GenerateContentResponse } from "@google/genai";
import { AnalysisMode, MasterStrategyResult, AspectRatio, DeepAnalysisItem, AppMode, AnalysisResult, BeastConcept, BeastVisualEngineering, BeastSimulation, OptimizationResult } from "../types";

const FORENSIC_RULES = `
**MASTERCLASS VISUAL PSYCHOLOGY RULES:**
1. **COLOR THEORY:** Use RED for threats, BLUE for underdogs.
2. **LIGHTING:** Use flat, minimal, and soft front lighting for the subject. NO dramatic side lighting, NO colored rim lights, and NO sunlight effects on the subject's face or body. Environmental lighting (sunlight, glows) MUST be strictly confined to the background elements. The subject should look naturally lit without artificial-looking glows.
2.1 **NO LIGHT LEAKS:** Ensure there are no yellow or colored light lines/leaks on the subject's collar, face, or clothing.
3. **ULTRA-PRECISE FACE SWAP**: When swapping faces, preserve the exact head pose, face angle, eye gaze, and all physical details (scars, wounds, wrinkles, dirt, blood, sweat, skin texture) from the original image. The expression must remain identical.
4. **IDENTITY LOCK:** Never hallucinate a celebrity based on the original subject's profession.
5. **COMPARISON LOGIC:** If comparing two items (e.g., $1 vs $100M), ALWAYS place the cheaper/weaker/older item on the LEFT and the expensive/stronger/newer item on the RIGHT.
6. **COMPOSITION:** Place the main subject's face in the center or follow the Rule of Thirds.
7. **STRICT FACIAL RULES:** MOUTH RULE (CRITICAL): The subject's mouth MUST NOT be unnaturally wide open. A closed or slightly open mouth performs better. Do NOT generate wide-open "soy face" expressions.
8. **NO DIVIDER LINE:** Do NOT draw a white line or any artificial border between the two sides. The transition should be seamless or natural.
9. **VISUAL CONTRAST:** The left side (cheap/small) should be slightly blurry or lower quality to emphasize the right side (expensive/big) which should be crystal clear and vibrant.
10. **CONCEPT OVER REALITY:** Prioritize visual clarity and impact over strict realism. Use compositing to place subjects in impossible or extreme situations that tell a story instantly.
11. **REDUNDANT POINTER TECHNIQUE:** Use multiple directional cues (e.g., arrows, pointing fingers, and character eye-lines) all converging on the same focal point to force viewer attention.
12. **BLANK CANVAS BACKGROUND:** If the foreground is complex, use a solid color or heavy Gaussian blur for the background to eliminate visual noise and make the subject "pop".
13. **AVENGERS COMPOSITION:** For group shots, use symmetrical arrangements with a central, dominant subject. Use flat, high-key lighting to ensure every face is perfectly clear.
14. **LUXURY COLORS:** Use colors that convey luxury for the right side (e.g., deep emerald, royal purple, or vibrant money-green), not just gold.
15. **SAFE ZONES:** Keep critical elements (faces, text) away from the edges (30-40px margin).
16. **EXPRESSIVE REALISM:** Faces MUST show intense emotion matching the scene. If fighting, show grit, sweat, and struggle. Eyes MUST look directly at the viewer with intense focus, creating a connection with the user.
17. **IMAGINATIVE DETAILS:** Add cinematic environmental details like ice crystals in hair for cold scenes, or stylized scratches with DEEP RED BLOOD-LIKE DROPS for battle scenes. Scars MUST be red, never blue or yellow.
18. **EYE LOGIC:** Eyes MUST be natural and clear. Never yellow or orange unless it's a specific fantasy creature. For humans, eyes must be realistic and expressive.
19. **REALISTIC FACES:** Faces MUST look like real human photographs, not 3D renders, cartoons, or AI-generated plastic faces. Skin texture should be highly realistic with natural pores and imperfections.
`;

const MASTER_TITLE_RULES = `
**MASTERPEACE TITLE STRATEGY:**
1. **GRADE 0 COMPREHENSION**: Simple words, monosyllabic preferred.
2. **ACTIVE VOICE**: "I Built..." instead of "Something Was Built...".
3. **CURIOSITY GAP**: Create tension that requires a click.
4. **COSTLY SIGNALING**: High stakes, high cost ($1 vs $1M).
5. **CONCISE**: Under 60 characters.
6. **I-STATEMENT**: The creator is the active protagonist.
`;

const safeJsonParse = (text: string | undefined, fallback: any = {}) => {
    if (!text) return fallback;
    try {
        // Extract JSON from markdown block if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let cleaned = jsonMatch ? jsonMatch[1].trim() : text.trim();
        
        return JSON.parse(cleaned);
    } catch (e) {
        // Attempt to fix common truncation issues (missing closing braces/brackets)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)(?:\s*```)?$/);
        let fixedText = jsonMatch ? jsonMatch[1].trim() : text.trim();
        
        // Basic attempt to close JSON if it looks like an object or array
        if ((fixedText.startsWith('{') || fixedText.startsWith('['))) {
             let openBraces = 0;
             let openBrackets = 0;
             let inString = false;
             
             for (let i = 0; i < fixedText.length; i++) {
                 if (fixedText[i] === '"' && fixedText[i-1] !== '\\') inString = !inString;
                 if (!inString) {
                     if (fixedText[i] === '{') openBraces++;
                     else if (fixedText[i] === '}') openBraces--;
                     else if (fixedText[i] === '[') openBrackets++;
                     else if (fixedText[i] === ']') openBrackets--;
                 }
             }
             
             if (inString) {
                 while (fixedText.endsWith('\\')) {
                     fixedText = fixedText.slice(0, -1);
                 }
                 fixedText += '"';
             }
             while (openBraces > 0) { fixedText += '}'; openBraces--; }
             while (openBrackets > 0) { fixedText += ']'; openBrackets--; }
             
             try {
                 return JSON.parse(fixedText);
             } catch (innerE) {
                 // Still failed, try one more aggressive truncation fix
                 try {
                    const lastBrace = fixedText.lastIndexOf('}');
                    const lastBracket = fixedText.lastIndexOf(']');
                    const lastValidIndex = Math.max(lastBrace, lastBracket);
                    if (lastValidIndex > 0) {
                        return JSON.parse(fixedText.substring(0, lastValidIndex + 1));
                    }
                 } catch (finalE) {
                    // Give up
                 }
             }
        }
        
        console.error("JSON Parse Error. Text preview:", text.substring(0, 200) + "...");
        return fallback;
    }
};

const getClient = () => {
  // Support both Vite's import.meta.env (for Vercel) and process.env (for AI Studio)
  const apiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    (typeof process !== 'undefined' ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : undefined)
  ) as string;
  return new GoogleGenAI({ apiKey });
};

export const checkProAccess = async (): Promise<boolean> => {
    if (window.aistudio) {
        return await window.aistudio.hasSelectedApiKey();
    }
    return false;
};

const wrapGeminiCall = async <T>(fn: () => Promise<T>, timeoutMs = 120000, maxRetries = 2): Promise<T> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs / 1000} seconds`)), timeoutMs);
            });
            return await Promise.race([fn(), timeoutPromise]);
        } catch (error: any) {
            attempt++;
            console.error(`Gemini API Error (Attempt ${attempt}/${maxRetries + 1}):`, error);
            
            let errorMsg = "";
            if (typeof error === 'string') {
                errorMsg = error;
            } else if (error instanceof Error) {
                errorMsg = error.message;
            } else if (error && typeof error === 'object') {
                try {
                    errorMsg = JSON.stringify(error);
                } catch (e) {
                    errorMsg = String(error);
                }
            } else {
                errorMsg = String(error);
            }

            const isTimeoutOr503 = errorMsg.includes('timed out') || errorMsg.includes('503') || errorMsg.includes('Deadline expired');
            const isQuota = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");

            if (attempt <= maxRetries && (isTimeoutOr503 || isQuota)) {
                const delay = isQuota ? 5000 : Math.pow(2, attempt) * 1000; // Wait longer for quota
                console.log(`Retrying in ${delay/1000}s due to ${isQuota ? 'Quota/Rate Limit' : 'Timeout'}...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("permission") || isQuota) {
                if (window.aistudio) {
                    window.aistudio.openSelectKey();
                }
            }
            if (isQuota) {
                throw new Error("API Quota Exceeded. You have reached the rate limit for this API key. Please select a different API key or wait a few minutes before trying again.");
            }
            throw new Error(`AI Error: ${errorMsg || "Failed to communicate with AI"}`);
        }
    }
    throw new Error("Max retries reached.");
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const isObjectOnly = async (base64Image: string): Promise<boolean> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { text: 'Analyze this image. Does it contain a person, human face, or any part of a human body? Answer strictly with YES or NO.' },
                    { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
                ]
            }
        });
        const text = response.text?.trim().toUpperCase() || '';
        // If it says YES (contains person), return false (not object only).
        // If it says NO (no person), return true (object only).
        return text.includes('NO');
    });
};

export const fileToBase64 = (file: File): Promise<string> => blobToBase64(file);

export const urlToBase64 = async (url: string, timeoutMs = 15000): Promise<string> => {
    if (url.startsWith('data:image')) {
        const parts = url.split(',');
        return parts.length > 1 ? parts[1] : url;
    }
    const fetchWithTimeout = async (u: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(u, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for url: ${u}`);
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
                console.warn(`Unexpected content type: ${contentType} for url: ${u}`);
            }
            const blob = await response.blob();
            return await blobToBase64(blob);
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };
    try { return await fetchWithTimeout(url); } catch (e) {
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            return await fetchWithTimeout(proxyUrl);
        } catch (e2) {
            try {
                const proxyUrl2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                return await fetchWithTimeout(proxyUrl2);
            } catch (e3) {
                try {
                    const jsonProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const response = await fetch(jsonProxyUrl);
                    if (!response.ok) throw new Error('allorigins get failed');
                    const data = await response.json();
                    if (data.contents && data.contents.startsWith('data:image')) {
                        const parts = data.contents.split(',');
                        return parts.length > 1 ? parts[1] : data.contents;
                    }
                    throw new Error('Invalid contents from allorigins');
                } catch (e4) {
                    try {
                        const proxyUrl3 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
                        return await fetchWithTimeout(proxyUrl3);
                    } catch (e5) {
                        try {
                            const proxyUrl4 = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
                            return await fetchWithTimeout(proxyUrl4);
                        } catch (e6) {
                            throw new Error(`Failed to load image from URL: ${url}. The image might be private, deleted, or blocking our servers. Please try uploading the image directly from your device.`);
                        }
                    }
                }
            }
        }
    }
};

const resizeImageTo1280x720 = async (base64: string, mimeType: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1280;
            canvas.height = 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Use high quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, 1280, 720);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve(`data:${mimeType};base64,${base64}`);
            }
        };
        img.onerror = () => {
            console.error("Failed to load image for resizing");
            resolve(`data:${mimeType};base64,${base64}`); // Fallback to original
        };
        img.src = base64.startsWith('data:') ? base64 : `data:${mimeType};base64,${base64}`;
    });
};

const prepareImageForAPI = async (base64: string, inputMimeType: string): Promise<{data: string, mime: string}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 2048; 
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
                width *= scale; height *= scale;
            }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
                resolve({ data: dataUrl.split(',')[1], mime: 'image/jpeg' });
            } else {
                const cleanBase64 = base64.startsWith('data:') ? base64.split(',')[1] : base64;
                resolve({ data: cleanBase64, mime: inputMimeType || 'image/png' });
            }
        };
        img.onerror = () => {
            console.error("Failed to load image for API preparation");
            const cleanBase64 = base64.startsWith('data:') ? base64.split(',')[1] : base64;
            resolve({ data: cleanBase64, mime: inputMimeType || 'image/png' });
        };
        img.src = base64.startsWith('data:') ? base64 : `data:${inputMimeType || 'image/png'};base64,${base64}`;
    });
};

export const recreateThumbnail = async (base64Image: string, mimeType: string, prompt: string, face?: string | string[]): Promise<string[]> => {
    return wrapGeminiCall(async () => {
        const model = 'gemini-2.5-flash-image';
        const ai = getClient();
        
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        const parts: any[] = [{ inlineData: { data, mimeType: mime } }];
        
        let identityInstruction = `The new face MUST EXACTLY match the requested identity in the prompt. If a specific celebrity or person is named, you MUST use their exact, real-life facial features. DO NOT mix faces. Ensure 100% accurate likeness to the real person.`;

        if (face) {
            const faces = Array.isArray(face) ? face : [face];
            for (const f of faces) {
                const { data: faceData, mime: faceMime } = await prepareImageForAPI(f, 'image/jpeg');
                parts.push({ inlineData: { data: faceData, mimeType: faceMime } });
            }
            identityInstruction = `CRITICAL FACE SWAP INSTRUCTION: 
            - The additional images provided are REFERENCE FACES of the exact person you must use.
            - You MUST perfectly recreate this EXACT person's face on the main subject in the first image. DO NOT invent a random face. DO NOT use a generic face. It MUST be the person in the reference image.
            - CRITICAL: You MUST extract the facial expression, lighting, and clothing style from the ORIGINAL FIRST IMAGE and apply them to this new person.
            - The new person must have the EXACT SAME facial expression (smile, shock, anger, etc.), lighting, and pose as the original subject.
            - Ensure 100% photorealistic likeness to the reference face, but adapted to the original image's environment.`;
        }
        
        // --- STRICT SURGICAL IDENTITY TRANSFER PROTOCOL ---
        const isComparison = /\bvs\.?\b|\bversus\b/i.test(prompt);
        const comparisonLayout = isComparison ? `
        LAYOUT RULE: This is a "Cheap vs Expensive" COMPARISON (MrBeast Style). 
        - LEFT SIDE: Show the first item (the cheap/poor/broken item). The environment here can be stormy or cloudy, but it MUST be well-lit and clearly visible. Do NOT make it too dark or obscure the item.
        - RIGHT SIDE: Show the second item (the expensive/luxurious/new item). The environment here MUST be beautiful, sunny, clear blue sky, and premium. Do NOT make the item solid gold unless explicitly requested.
        - CENTER: Place a person prominently in the center of the image looking directly at the camera. Show ONLY the face and upper chest/shoulders. Do NOT show hands or arms. This person acts as the divider between the two halves.
        - FACE: The person MUST be smiling or looking shocked.
        - TEXT: Do NOT use the word "VS". You MUST write the price/value of the left item at the top left, and the price/value of the right item at the top right. 
        - TEXT ABBREVIATION: You MUST abbreviate large numbers! For example, write "$100M" instead of "$100,000,000" or "100 Million". Write "$1B" instead of "$1,000,000,000". Write "$10K" instead of "$10,000". The text must be huge, bold, white with a thick black outline.
        - NO DIVIDER: Do NOT include a white line or any artificial border between the sides. The person in the center is the divider.
        ` : "";

        const finalPrompt = `
        TASK: ULTRA-PRECISE SURGICAL FACE SWAP / IDENTITY TRANSFER.
        ${face ? "You are provided with TWO images. IMAGE 1 is the base thumbnail. IMAGE 2 is the reference face. You MUST replace the face of the primary subject in IMAGE 1 with the exact face from IMAGE 2." : "You MUST replace the face in the image with the exact identity requested in the prompt."}
        
        ${comparisonLayout}
        
        CRITICAL EXECUTION RULES:
        1. **PRESERVE POSE & GAZE**: Preserve the exact head pose, face angle, and eye gaze direction from the original image.
        2. **PRESERVE ALL PHYSICAL DETAILS (CRITICAL)**: You MUST preserve all facial details present in the original image including scars, blood, dirt, sweat, and wrinkles. Apply them exactly to the new face in the exact same positions.
        3. **EXPRESSION & MOUTH RULE**: The facial expression must match the original image's emotion. DO NOT open the mouth wide. The mouth should be closed or only slightly open.
        4. **BODY-WIDE SKIN TONE SYNC**: Match the skin tone of the swapped face perfectly with the body of the original image.
        5. **LIGHTING & SHADOW TRANSFER (CRITICAL)**: Transfer the exact original lighting conditions, shadows, and highlights to the swapped face. Focus on hyper-realistic quality like MrBeast thumbnails.
        6. **PRESERVE ENVIRONMENTAL EFFECTS**: Preserve effects affecting the face such as smoke or water reflections.
        7. **ANATOMICAL PROPORTIONS**: Maintain correct anatomical proportions.
        8. **PRESERVE HAIR & EARS**: Preserve hairline, ears, and surrounding elements.
        9. **PERSPECTIVE FIDELITY**: Maintain camera perspective and lens distortion exactly as in the original image.
        10. **SEAMLESS INTEGRATION**: Ensure no visible editing artifacts.
        11. **IDENTITY LOCK**: ${identityInstruction}
        12. **EYE LOGIC**: Eyes must be natural and clear. No yellow or orange eyes.
        13. **SINGLE FACE SWAP**: Only swap the face of the PRIMARY subject.
        14. **NO LETTERBOXING**: Do NOT add black bars. The image must fill the 16:9 canvas perfectly.
        15. **EMOTION & ACTION**: The character's facial expression MUST strongly match the mood of the scene.
        16. **REALISTIC FACES**: Faces MUST look like real human photographs.
        17. **ADDITIONAL COMMANDS**: ${prompt || "Focus on a clean and realistic face swap."}
        
        OUTPUT: 16:9 aspect ratio. Photorealistic. Commercial quality. Masterpiece.
        `;

        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: '16:9' } }
        });
        
        const images: string[] = [];
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Generation blocked by safety filters. Try a different prompt or persona.");
        }

        if(response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) { 
                if (part.inlineData && part.inlineData.data) {
                    const resized = await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
                    images.push(resized);
                }
            }
        }
        
        if (images.length === 0) {
            const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
            console.warn("Gemini returned no images. Response:", JSON.stringify(response));
            if (textResponse) {
                throw new Error(`Generation failed. Model returned text instead of image: ${textResponse}`);
            }
        }
        
        return images;
    });
};

// ... (باقي الوظائف تبقى كما هي)
const enhanceThumbnailPrompt = async (rawPrompt: string, inspirationImages?: string[]): Promise<{ visualDescription: string; suggestedTitle: string }> => {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';
    
    const parts: any[] = [];
    
    if (inspirationImages && inspirationImages.length > 0) {
        inspirationImages.forEach(img => {
            parts.push({ inlineData: { data: img, mimeType: 'image/png' } });
        });
        parts.push({ text: `Analyze these uploaded images. 
        SCENARIO A (Object Extraction): If the user's prompt asks to extract a specific object, describe that exact object in extreme detail and IGNORE any person holding it.
        SCENARIO B (Thumbnail Remaster/Upgrade): If the uploaded image is a basic, weak, or boring thumbnail (e.g., plain white background, simple text) and the user wants to improve it or recreate it, act as an expert YouTube Thumbnail Designer. Extract the core concept, text, and subject from the weak image, and UPGRADE the visual description to be highly cinematic, engaging, and high-CTR. Change boring backgrounds to dynamic, well-lit studio or thematic backgrounds (like dark cinematic rooms with neon accents). Add glowing effects to text or charts, rim lighting to subjects, and dramatic contrast. Make it look like a top-tier professional YouTube thumbnail.` });
    } else {
        parts.push({ text: `Research the visual style, key subjects, and trending thumbnail elements for this topic. Identify key symbols, colors, and compositions that work for this niche.` });
    }

    parts.push({ text: `User's concept: "${rawPrompt}"\n\nCreate the visual description and suggested title.` });

    const systemPrompt = `You are a world-class YouTube thumbnail art director.
    The user has provided a concept for a thumbnail, possibly in Arabic or another language.
    Your task is to translate it to English and expand it into a highly detailed, visual description for an AI image generator.
    
    CRITICAL INSTRUCTIONS:
    0. OBJECT EXTRACTION & REMASTERING: If the user uploaded an image, follow the SCENARIO instructions provided. If remastering, completely transform the weak image into a masterpiece while keeping the core message.
    1. Translate the concept to English.
    2. DETECT COMPARISONS (MrBeast Style): If the user's prompt implies a comparison between a cheap/bad item and an expensive/luxurious item (e.g., "$1 vs $100M house", "دولار ضد 100 مليون سيارة", "cheap vs expensive"), you MUST format the visual description to explicitly mention the two sides:
       - LEFT SIDE: The cheap/bad item in a stormy or cloudy environment, but it MUST remain bright and clearly visible. Do NOT make it too dark or obscure the item.
       - RIGHT SIDE: The expensive/luxurious item in a beautiful, sunny, premium environment. (NOTE: Do NOT make it solid gold unless requested. Just make it look highly luxurious, modern, and expensive).
       - CENTER: A person (like MrBeast) looking directly at the camera, smiling or looking shocked, acting as the divider. Show ONLY the face and upper chest. Do NOT show hands or arms.
       - TEXT: You MUST include the abbreviated prices/values at the top. For example, if the prompt says "$100,000,000", write "$100M". If it says "1 dollar", write "$1". Place the small amount text on the top left, and the large amount text on the top right.
    3. Describe the SCENE visually. ADAPT TO THE STYLE: If it's a cooking style, describe food textures, steam, and warm lighting. If it's a travel style, describe the landscape, golden hour lighting, and the subject's awe. If it's a challenge/viral style, describe intense facial expressions (grit, clenched teeth, sweat) and the direction of the eyes (MUST look directly at the viewer).
    4. For Political/News topics: Focus on the "essence" using wars, weapons, military equipment, and dramatic atmosphere. 
    5. CINEMATIC DETAILS: Add imaginative environmental details that MATCH THE NICHE. For survival/challenge scenes, add ice crystals in hair for cold scenes, or stylized scratches with DEEP RED BLOOD-LIKE DROPS for battle scenes. For cooking, add flying flour or dripping sauce.
    6. NO MAPS: Avoid generating literal maps for news topics; use symbols or scenes instead.
    7. TEXT DISTILLATION (THE HOOK): If the user's concept explicitly contains a short, high-impact keyword, number, or timeframe (e.g., "50 Hours", "$100k", "2 Days"), you may extract it (1-3 words max) to integrate naturally into the environment. If the concept does NOT contain such specific hooks, DO NOT invent or add any text (like money amounts or random numbers). The visual elements MUST explain the context without relying on hallucinated text.
    8. PREFER LETTERS OVER NUMBERS: When generating the suggestedTitle, use words instead of digits for large numbers.
    9. Set the appropriate mood and lighting based on the style (e.g., dark and dramatic for war, bright and colorful for entertainment, warm and inviting for food).
    10. DEFAULT LAYOUT & COMPOSITION RULE (CRITICAL):
       - FACE VISIBILITY: Show ONLY the face and shoulders/arms of the main subject. Do NOT show the full body. Do NOT add gaming headsets or helmets unless explicitly requested by the user.
       - PLACEMENT LOGIC: 
         * If the face is on the RIGHT side, the main object/action MUST be clearly visible on the LEFT side.
         * If the face is on the LEFT side, the main object/action MUST be clearly visible on the RIGHT side.
         * If the face is in the MIDDLE, the objects/actions MUST be visible on BOTH the left and right sides.
       - GAZE: The subject should either look directly at the viewer OR look directly at the main object/action.
       - CLARITY: The main object or action being reacted to MUST be extremely clear, large, and easy to understand.
    11. GAME CHARACTER RULE (CRITICAL): If the user's prompt mentions a specific video game (e.g., "Minecraft", "Fortnite", "Free Fire", "Call of Duty", "GTA", "Roblox"), you MUST explicitly describe using authentic 3D characters/skins from that specific game for any secondary characters or crowds. Do NOT use generic men or women. For example, if the prompt says "4 players vs 100 players in Minecraft", describe "4 distinct Minecraft avatars (like Steve or Alex) in specific colors on one side, and a crowd of 100 uniform Minecraft characters on the other side". The main subject (the reactor face) should still be realistic (unless otherwise specified), but the in-game elements MUST use the game's specific art style and character models.
    12. CROWDS & GROUPS RULE: If the prompt asks for a crowd, a group of people, or many people (e.g., "100 men", "50 pilots", "a large crowd"):
       - The people MUST look 100% photorealistic and human (UNLESS the Game Character Rule applies). DO NOT make them look like 3D models, cartoons, or video game characters.
       - They must have diverse, realistic human faces, skin textures, and clothing.
    13. COMPETITION & RIVALRY RULE: If the prompt implies a competition, battle, or rivalry (e.g., "100 pilots competing", "men vs women", "fighting for a prize"):
       - The people MUST NOT just stand next to each other passively.
       - They MUST look like they are actively competing, struggling, or facing off.
       - Give them intense, aggressive, or determined facial expressions (grit, clenched teeth, glaring).
       - Show dynamic action: climbing over each other, pushing, running towards the goal, or staring each other down in a tense standoff.
    14. CHANNEL STYLE ADAPTATION: If the user mentions a specific YouTube channel style (e.g., MrBeast, Ali Abdaal, Iman Gadzhi, Gaming channels), adapt the lighting, composition, and text style to match that channel's iconic look perfectly. For example, MrBeast = high saturation, shocked faces, clear comparisons. Iman Gadzhi = dark cinematic, glowing charts, money, serious expressions.
    15. NICHE ADAPTATION: Adapt the visual style perfectly to the user's requested niche (e.g., Gaming, Animal Reactions, Science, Tech, Vlogs). Make it highly professional and tailored to that niche's visual language while maintaining high CTR principles.
    16. TEXT COLOR & PLACEMENT: If text is included, specify that it MUST NOT be all one color. Use varied, high-contrast colors for emphasis (e.g., one important word GOLD or YELLOW, another word WHITE or RED). Specify that text MUST be fully visible and NOT cut off.
    17. THUMBNAIL BEST PRACTICES: 
       - EXACT LIKENESS RULE: If a specific celebrity or public figure is named (e.g., MrBeast, Elon Musk, Cristiano Ronaldo), you MUST generate their exact, real-life facial features. Do NOT generate a generic face. Ensure 100% accurate likeness.
       - NO LETTERBOXING: Do NOT add black bars at the top or bottom of the image. The image must fill the entire 16:9 canvas perfectly. Do NOT add cinematic borders.
       - EMOTION & ACTION: The character's facial expression MUST strongly match the mood of the scene (e.g., shocked, angry, excited, terrified). For standard thumbnails, the character MUST be doing something active with their hands. However, for COMPARISON thumbnails, keep the hands hidden and focus ONLY on the face and chest. Do NOT generate characters just standing still with neutral expressions.
       - MOUTH RULE: The subject's mouth MUST NOT be unnaturally wide open. A closed or slightly open mouth performs better. Do NOT generate wide-open "soy face" expressions.
       - High contrast, dark background, bright foreground (unless the style dictates otherwise, like minimalist).
       - Rule of Thirds composition.
       - Soft, flat front lighting for the subject. NO dramatic side lighting or colored rim lights on the person (unless it's a tech/gaming style).
       - Sunlight and environmental glows MUST be background-only.
       - Catchlight in the eyes (if people are present).
       - Safe Zones: Keep main subjects away from edges.
       - Selective color pop: One vibrant element against a more muted background.
       - CONCEPT OVER REALITY: Prioritize visual clarity and impact over strict realism. Use compositing to place subjects in impossible or extreme situations that tell a story instantly.
       - NO ARROWS OR CIRCLES: Do NOT use red arrows, yellow arrows, or red circles. The viewer should understand the focal point through composition and character eye-lines alone.
       - DETAILED, CLEAR BACKGROUNDS: Do NOT use blurry or out-of-focus backgrounds. The background must be highly detailed and contribute logically to the story.
       - ENVIRONMENTAL TEXT INTEGRATION: If the prompt includes important numbers or short text, integrate it naturally into the environment. Do NOT just float text with an arrow.
       - MINUTE DETAILS & STORYTELLING: Focus heavily on small, logical details that tell the story. Every element in the background and foreground must make sense for the narrative.
       - AVENGERS COMPOSITION: For group shots, use symmetrical arrangements with a central, dominant subject. Use flat, high-key lighting to ensure every face is perfectly clear.
       - EXTREME SCALE CONTRAST: Place small human subjects next to massive objects to create a sense of awe and impossibility.
       - THE CONFLICT SPLIT: Use a sharp vertical divider to show two opposing forces or a "Vs" scenario. Ensure high contrast between the two sides.
       - THE HIDDEN SUBJECT REVEAL: Place a character partially obscured or hiding to create an immediate curiosity gap.
       - SYMBOLIC FOCAL POINT: Have the primary subject hold a single, high-value object directly towards the camera, slightly out of focus to create depth.
       - MASSIVE CROWD DENSITY: Use hundreds of people in a symmetrical, dense arrangement to demonstrate the scale of a challenge or event.
    10. ULTRA-PRECISE FACE SWAP: When swapping faces, preserve the exact head pose, face angle, eye gaze, and all physical details from the original image. The expression must remain identical.
    11. EYE LOGIC: Eyes must be natural, clear, and expressive. No yellow or orange eyes.
    12. BRAND ICONS & UI ELEMENTS: If the prompt mentions specific apps (ChatGPT, Claude, Google, Photoshop, Premiere, Stripe, Instagram, etc.), file types (PDF), or UI elements (notifications, chat bubbles, money alerts):
        - Describe them as distinct, recognizable graphic elements (e.g., 'the official ChatGPT logo icon', 'a red PDF document icon', 'a glowing smartphone notification bubble').
        - Integrate them dynamically: Describe them as floating in mid-air at a slight dynamic angle, glowing with rim lighting, or displayed clearly on a screen.
        - Do NOT just write the word; explicitly describe the visual icon/logo and its physical presence in the scene.
    13. LOGICAL CONTEXT: Use logic to ensure the background matches the title. If the title says "Antarctica", the background MUST be Antarctica.
    14. SINGLE FACE SWAP: Only swap the face of the PRIMARY subject. Do NOT swap faces of background people or multiple people unless explicitly requested.
    15. REALISTIC FACES: Faces MUST look like real human photographs, not 3D renders, cartoons, or AI-generated plastic faces. Skin texture should be highly realistic with natural pores and imperfections.
    16. DO NOT add "hyper realistic", "photorealistic", "8k", or any specific style keywords like that. The platform already knows the strong style and applies it automatically.
    
    Return the result as a JSON object with two fields:
    - "visualDescription": The detailed English visual description.
    - "suggestedTitle": A powerful, viral 2-4 word title for the thumbnail.
    
    Return ONLY the JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { 
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                maxOutputTokens: 4096,
                tools: (!inspirationImages || inspirationImages.length === 0) ? [{ googleSearch: {} }] : undefined,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        visualDescription: { type: Type.STRING },
                        suggestedTitle: { type: Type.STRING }
                    },
                    required: ["visualDescription", "suggestedTitle"]
                }
            }
        });
        const result = safeJsonParse(response.text, {});
        return {
            visualDescription: result.visualDescription || rawPrompt,
            suggestedTitle: result.suggestedTitle || ""
        };
    } catch (e) {
        console.error("Failed to enhance prompt", e);
        return { visualDescription: rawPrompt, suggestedTitle: "" };
    }
};

export const generateThumbnail = async (prompt: string, baseImage?: string, mimeType?: string, useInspiration?: boolean, inspirationImages?: string[], faceBase64?: string | string[], count: number = 1): Promise<{ images: string[]; suggestedTitle: string }> => {
    return wrapGeminiCall(async () => {
        const model = 'gemini-2.5-flash-image';
        const ai = getClient();
        
        const { visualDescription, suggestedTitle } = await enhanceThumbnailPrompt(prompt, inspirationImages);

        const isComparison = visualDescription.includes('LEFT SIDE:') && visualDescription.includes('RIGHT SIDE:');
        const comparisonLayout = isComparison ? `
        LAYOUT RULE: This is a "Cheap vs Expensive" COMPARISON (MrBeast Style). 
        - LEFT SIDE: Show the first item (the cheap/poor/broken item). The environment here can be stormy or cloudy, but it MUST be well-lit and clearly visible. Do NOT make it too dark or obscure the item.
        - RIGHT SIDE: Show the second item (the expensive/luxurious/new item). The environment here MUST be beautiful, sunny, clear blue sky, and premium. Do NOT make the item solid gold unless explicitly requested; just make it look highly luxurious, modern, and expensive using premium materials (sleek metal, glass, high-end design).
        - CENTER: Place a person prominently in the center of the image looking directly at the camera. Show ONLY the face and upper chest/shoulders. Do NOT show hands or arms. This person acts as the divider between the two halves.
        - FACE: The person MUST be smiling or looking shocked.
        - TEXT: Do NOT use the word "VS". You MUST write the price/value of the left item at the top left, and the price/value of the right item at the top right. 
        - TEXT ABBREVIATION: You MUST abbreviate large numbers! For example, write "$100M" instead of "$100,000,000" or "100 Million". Write "$1B" instead of "$1,000,000,000". Write "$10K" instead of "$10,000". The text must be huge, bold, white with a thick black outline.
        - NO DIVIDER: Do NOT include a white line or any artificial border between the sides. The person in the center is the divider.
        ` : "";

        const finalPrompt = `
        [STYLE: MrBeast] 
        ${comparisonLayout}
        
        VISUAL SCENE: ${visualDescription}
        
        QUALITY REQUIREMENTS:
        - DEFAULT LAYOUT & COMPOSITION RULE (CRITICAL):
          * FACE VISIBILITY: Show ONLY the face and shoulders/arms of the main subject. Do NOT show the full body. Do NOT add gaming headsets or helmets unless explicitly requested.
          * PLACEMENT LOGIC: If the face is on the RIGHT, the main object/action MUST be on the LEFT. If the face is on the LEFT, the main object/action MUST be on the RIGHT. If the face is in the MIDDLE, objects/actions MUST be on BOTH sides.
          * GAZE: The subject should either look directly at the viewer OR look directly at the main object/action.
          * CLARITY: The main object or action being reacted to MUST be extremely clear, large, and easy to understand.
        - CROWDS, GROUPS & COMPETITIONS RULE (CRITICAL): 
          * If the prompt involves groups competing (e.g., "50 Men vs 50 Women", "100 Streamers"), place one group clearly on the left side and the other on the right side.
          * If it's a united group or team, they MUST wear uniform clothing of a single color (e.g., all wearing blue tracksuits or red uniforms).
          * Do NOT focus solely on the main character's face. The competitors/crowd MUST be highly visible, detailed, and show intense emotions (struggling, fighting, determined).
          * The prize (e.g., airplane, Lamborghini, yacht, island, money) must be massive and prominent in the background.
          * Always leave some space at the top of the image to show a bit of the sky.
        - HYPER-REALISM RULE: The image MUST be hyper-realistic, 8k resolution, highly detailed photography. Do NOT make it look like a painting or cartoon unless requested. Skin textures, lighting, and environments must look like a real high-budget YouTube production.
        - NICHE ADAPTATION: Adapt the visual style perfectly to the user's requested niche (e.g., Gaming, Animal Reactions, Science, Tech, Vlogs). Make it highly professional and tailored to that niche's visual language while maintaining high CTR principles.
        - CRITICAL TEXT RULES: NEVER cut off text. All text must be fully visible within the frame. DO NOT make all text the same color. Use varied, high-contrast colors for emphasis (e.g., make one important word GOLD or YELLOW, and another word WHITE or RED). Text must be huge, bold, and have a thick black outline or drop shadow for readability.
        - EXACT LIKENESS RULE: If a specific celebrity is named, generate their exact real-life facial features.
        - NO LETTERBOXING: Do NOT add black bars. The image must fill the 16:9 canvas.
        - EMOTION & ACTION: The character's facial expression MUST strongly match the mood.
        - MOUTH RULE: The subject's mouth MUST NOT be unnaturally wide open. A closed or slightly open mouth performs better.
        - REALISTIC FACES: Faces MUST look like real human photographs.
        - 16:9 Aspect Ratio (1280x720).
        - Cinematic lighting, professional photography, high detail.
        - High dynamic range (HDR), vibrant but realistic colors.
        - Lighting: Soft, flat front lighting for the subject. NO side lighting on the face.
        - NO ARROWS OR CIRCLES: Do NOT use red arrows or red circles.
        - ENVIRONMENTAL TEXT INTEGRATION: If the prompt includes text, integrate it naturally into the environment. Do NOT just float text.
        `;
        const parts: any[] = [];
        
        if (faceBase64) {
            const faces = Array.isArray(faceBase64) ? faceBase64 : [faceBase64];
            for (const face of faces) {
                const { data, mime } = await prepareImageForAPI(face, 'image/png');
                parts.push({ inlineData: { data, mimeType: mime } });
            }
            parts.push({ text: "CRITICAL IDENTITY & COMPOSITION INSTRUCTION:\n1. You MUST use the exact face(s) provided in the reference images above for the MAIN CHARACTER in the generated image. Maintain their exact real-life identity and facial features.\n2. FOREGROUND PLACEMENT: This main character MUST be placed prominently in the FOREGROUND (usually on the left or right side), taking up a significant portion of the frame, exactly like MrBeast does in his thumbnails.\n3. REACTION: The character must be reacting to the scene behind them (e.g., looking shocked, excited, or intense) or looking directly at the camera to engage the viewer." });
        }

        if (baseImage) {
            const { data, mime } = await prepareImageForAPI(baseImage, mimeType || 'image/png');
            parts.push({ inlineData: { data, mimeType: mime } });
        }
        
        parts.push({ text: finalPrompt });

        const generateSingle = async () => {
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts },
                config: { imageConfig: { aspectRatio: '16:9' } } 
            });
            
            if (response.candidates?.[0]?.finishReason === 'SAFETY') {
                throw new Error("Generation blocked by safety filters. Try a different prompt or persona.");
            }

            if(response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) { 
                    if (part.inlineData && part.inlineData.data) {
                        return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
                    }
                }
            }
            
            const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
            console.warn("Gemini returned no images. Response:", JSON.stringify(response));
            if (textResponse) {
                throw new Error(`Generation failed. Model returned text instead of image: ${textResponse}`);
            } else {
                throw new Error("Generation failed. No image or text returned.");
            }
        };

        const images: string[] = [];
        for (let i = 0; i < count; i++) {
            try {
                const img = await generateSingle();
                images.push(img);
            } catch (err) {
                console.error(`Failed to generate image ${i + 1}/${count}:`, err);
                // If it's the first image and it fails, throw the error
                if (i === 0) throw err;
                // Otherwise, just continue and return whatever we have so far
            }
        }

        if (images.length === 0) {
            throw new Error("Generation failed to produce any images.");
        }

        return { images, suggestedTitle };
    });
};

export const getPredictionScore = (qualityScore: number): { score: string; label: string; color: string; borderColor: string; shadowColor: string; confidence: string } => {
    let score = Math.min(100, Math.max(0, qualityScore));
    let label = "";
    let color = "";
    let borderColor = "";
    let shadowColor = "";
    let confidence = "Medium";
    
    if (score >= 90) {
        label = "VIRAL POTENTIAL";
        color = "text-emerald-400";
        borderColor = "border-emerald-500/50";
        shadowColor = "shadow-[0_0_40px_rgba(16,185,129,0.2)]";
        confidence = "High";
    } else if (score >= 75) {
        label = "EXCELLENT";
        color = "text-green-400";
        borderColor = "border-green-500/50";
        shadowColor = "shadow-[0_0_40px_rgba(34,197,94,0.2)]";
        confidence = "Medium";
    } else if (score >= 50) {
        label = "NEEDS IMPROVEMENT";
        color = "text-yellow-400";
        borderColor = "border-yellow-500/50";
        shadowColor = "shadow-[0_0_40px_rgba(234,179,8,0.2)]";
        confidence = "Low";
    } else if (score >= 25) {
        label = "POOR";
        color = "text-orange-400";
        borderColor = "border-orange-500/50";
        shadowColor = "shadow-[0_0_40px_rgba(249,115,22,0.2)]";
        confidence = "Low";
    } else {
        label = "TERRIBLE";
        color = "text-red-500";
        borderColor = "border-red-500/50";
        shadowColor = "shadow-[0_0_40px_rgba(239,68,68,0.2)]";
        confidence = "Low";
    }

    return { score: score.toFixed(0) + "%", label, color, borderColor, shadowColor, confidence };
};

export const generateViralTitles = async (topic: string, lang: string = 'English'): Promise<{title: string, score: number}[]> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `Generate 5 viral titles for topic "${topic}" in ${lang}. Return JSON array of {title, score}.`,
            config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 1024,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            score: { type: Type.NUMBER }
                        },
                        required: ["title", "score"]
                    }
                }
            }
        });
        return safeJsonParse(response.text, []);
    });
};

export const generateMasterTitles = async (description: string, lang: string = 'Arabic'): Promise<{title: string, score: number}[]> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: World-Class YouTube Title Engineer (MrBeast Strategy).
        MISSION: The user will provide a long, detailed description of their entire video. Your job is to extract the most powerful, high-stakes core concept and generate EXACTLY 3 viral titles.
        
        STRATEGIC ARCHITECTURE:
        1. **EXTRACT THE CORE**: Ignore the boring details. Find the most extreme, expensive, dangerous, or emotionally charged element in the description.
        2. **KEEP IT MYSTERIOUS**: Do not tell the whole story in the title. Leave a "Curiosity Gap" that forces the viewer to click to find out what happens.
        3. **MRBEAST STYLE**: Use simple words (Grade 0 comprehension). Use Active Voice ("I Spent...", "I Survived..."). Use extreme numbers or stakes.
        4. **EXACTLY 3 VARIATIONS**: You MUST output exactly 3 titles. These 3 titles should NOT be completely different concepts. They should be 3 slightly different variations of the SAME winning concept (e.g., changing a specific number, swapping an adjective, or slightly altering the framing).
        5. **CONCISE**: Keep titles under 50-60 characters.
        
        OUTPUT: Return a JSON array of exactly 3 objects, each with "title" (the viral title) and "score" (predicted CTR percentage, 85-99).
        LANGUAGE: Generate titles in ${lang}.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Video Context: "${description}"`,
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            score: { type: Type.NUMBER }
                        },
                        required: ["title", "score"]
                    }
                }
            }
        });
        return safeJsonParse(response.text, []);
    });
};

export const enhanceAndCompletePrompt = async (description: string, lang: string = 'Arabic'): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: Expert Prompt Engineer for Image Generation.
        MISSION: Take a raw video description and transform it into a highly effective visual prompt for an AI image generator.
        
        STRATEGY:
        1. Analyze the user's prompt and determine what is written and in what language.
        2. **STRICT LANGUAGE PRESERVATION**: DO NOT translate the prompt to English. You MUST write the optimized prompt in the EXACT SAME LANGUAGE as the user's input (e.g., if it's in Arabic, the output MUST be in Arabic; if it's in French, the output MUST be in French).
        3. Add necessary details (lighting, composition, subject focus) to make the description better and easier for the platform to understand, while staying in the ORIGINAL LANGUAGE.
        4. Remove unnecessary details or conversational filler.
        5. DO NOT add "hyper realistic", "photorealistic", "8k", or any specific style keywords like that. The platform already knows the strong Mr. Beast style and applies it automatically.
        6. Focus purely on the subject, action, environment, and composition.
        
        RULES:
        - MOUTH RULE: The subject's mouth MUST NOT be unnaturally wide open. A closed or slightly open mouth performs better.
        - TEXT DISTILLATION: If the description explicitly contains a short, high-impact keyword, number, or timeframe (e.g., "50 Hours", "$100k"), you may extract it (1-3 words max) to place in the image. If it does NOT contain such specific hooks, DO NOT invent or add any text.
        - BRAND ICONS & UI ELEMENTS: If the prompt mentions specific apps or UI elements, describe them as distinct, recognizable graphic elements floating or displayed clearly.
        - Max 60 words.
        
        OUTPUT: Return ONLY the optimized prompt in the SAME LANGUAGE as the input.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Description: "${description}"`,
            config: { 
                systemInstruction,
                maxOutputTokens: 1024
            }
        });
        return response.text || description;
    });
};

const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

const analysisCache = new Map<string, AnalysisResult>();

const getCachedAnalysis = (key: string): AnalysisResult | null => {
    if (analysisCache.has(key)) return analysisCache.get(key)!;
    try {
        const stored = localStorage.getItem(`analysis_${key}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            analysisCache.set(key, parsed);
            return parsed;
        }
    } catch (e) {
        console.warn("Failed to read analysis from localStorage", e);
    }
    return null;
};

const setCachedAnalysis = (key: string, result: AnalysisResult) => {
    analysisCache.set(key, result);
    try {
        localStorage.setItem(`analysis_${key}`, JSON.stringify(result));
    } catch (e) {
        console.warn("Failed to save analysis to localStorage", e);
    }
};

export const describeImage = async (base64: string, mime: string, lang: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime: cleanMime } = await prepareImageForAPI(base64, mime);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: cleanMime } }, 
                    { text: `Provide a highly comprehensive and extremely detailed visual description of this image in ${lang}. 
                    Do not omit any details. Describe:
                    1. The exact identity of any recognizable characters or people (if known).
                    2. Every detail of what they are wearing (clothing, accessories, colors).
                    3. Their exact poses, facial expressions, and where they are looking.
                    4. The lighting in extreme detail (direction, shadows, highlights, colors, intensity).
                    5. The complete color palette, contrast, and mood.
                    6. Every object, text, and element in the background and foreground.
                    Do not analyze or judge, just describe everything visually present with maximum detail.` }
                ] 
            }
        });
        
        return response.text || "No description generated.";
    });
};

export const generateImageDescription = async (base64Image: string, mimeType: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);

        const prompt = `
        Provide a highly detailed, objective visual description of this image.
        Focus ONLY on what is visually present. Do not analyze CTR, do not give advice, do not judge the quality.
        Describe:
        1. The main subject(s) and their poses/expressions.
        2. The lighting (direction, color, intensity).
        3. The color palette and contrast.
        4. The background and environment.
        5. Any text, graphics, or overlays present.
        6. The overall composition and layout.
        
        Write it as a cohesive, detailed paragraph or two.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: prompt }
                ]
            }
        });

        return response.text || "Could not generate description.";
    });
};

export const analyzeStyleFromImages = async (base64Images: string[]): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const parts: any[] = [
            { text: `ROLE: Expert YouTube Thumbnail Designer & Art Director.
TASK: Analyze these thumbnails from a specific YouTube channel and extract their exact visual style, composition rules, color grading, and lighting techniques.

OUTPUT: Write a highly detailed "Style Prompt" (1-2 paragraphs) that can be appended to any image generation prompt to perfectly replicate this channel's aesthetic.

Focus on:
1. Lighting (e.g., bright flat lighting, cinematic rim lights, dark moody)
2. Colors (e.g., high saturation, specific dominant colors, neon accents)
3. Composition (e.g., extreme close-ups, wide shots, rule of thirds)
4. Texture/Realism (e.g., hyper-realistic, glossy, grainy, cartoonish)
5. Facial Expressions (e.g., exaggerated shock, serious, smiling)

DO NOT describe the specific subjects in the images (e.g., do not say "a man in a red shirt"). Describe the STYLE that applies to ALL of them.
Return ONLY the style prompt text.` }
        ];

        for (const base64 of base64Images) {
            const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({
                inlineData: {
                    data: cleanBase64,
                    mimeType: 'image/jpeg' // Assuming jpeg/png
                }
            });
        }

        const response = await ai.models.generateContent({
            model,
            contents: parts,
            config: { maxOutputTokens: 1024 }
        });

        return response.text || "High contrast, vibrant colors, cinematic lighting, hyper-realistic.";
    });
};

export const analyzeImage = async (base64: string, mime: string, mode: string, lang: string, title?: string): Promise<AnalysisResult> => {
    if (mode === 'DESCRIPTION') {
        const description = await describeImage(base64, mime, lang);
        return {
            visual_description: description,
            ctr_score: 0,
            pillars: [],
            pros: [],
            cons: []
        };
    }

    // Simple cache key based on image data and mode/lang/title
    const cacheKey = hashString(`${base64.substring(0, 500)}_${base64.length}_${mode}_${lang}_${title || ''}`);
    const cached = getCachedAnalysis(cacheKey);
    if (cached) {
        console.log("Returning cached analysis result");
        return cached;
    }

    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime: cleanMime } = await prepareImageForAPI(base64, mime);
        
        const systemInstruction = `
        You are a brutal YouTube thumbnail + title strategist AND a high-performance thumbnail design engine.

        Your mission:
        1) Judge thumbnails like a ruthless CTR expert
        2) Then redesign them using elite visual systems

        ---
        🔴 CORE PRINCIPLE
        Thumbnail = click trigger
        Title = promise
        Both must sell ONE idea instantly
        If the viewer needs to think -> FAIL

        ---
        🧠 PART 1: BRUTAL ANALYSIS
        Analyze thumbnail + title as ONE system.
        Rules: Viewer sees thumbnail <1 second. Clarity is priority #1. No explanation allowed.
        Evaluate:
        1) Clarity: Can the idea be understood instantly?
        2) Emotion: What exact emotion is triggered?
        3) Curiosity: Does it create “I need to know more”?
        4) Visual Hierarchy: Is there a clear focal point?
        5) Simplicity: Is there only ONE idea?
        6) Cognitive Load: Is it easy or mentally exhausting?
        7) Mobile Readability: Is it clear when small?
        8) Title Match: Do thumbnail + title reinforce each other?
        9) Goal Clarity: Is the reward or outcome obvious?
        10) Scroll Test: Would people STOP or SCROLL?

        🚨 DETECT FAILURES: Call out Clutter, Too many ideas, Weak focus, No clear goal, Fake intensity, Title mismatch, “Cool but not clickable”. If it’s bad -> say it clearly.

        ---
        🎨 PART 3: DESIGN SYSTEM (MANDATORY REDESIGN)
        1) COLOR SYSTEM (3 layers only): SUBJECT (Bold color), GOAL (Clean color), BACKGROUND (Calm). If colors compete -> FAIL.
        2) VISUAL HIERARCHY: ENTRY -> ACTION -> GOAL.
        3) SHAPE SYSTEM: Pyramid (challenge), Line (race), Circle (focus), Vertical (struggle).
        4) SUBJECT CONTROL: One main subject ONLY.
        5) EMOTION SYSTEM: Strong facial emotion. Background supports, not distracts.
        6) BACKGROUND CONTROL: Remove noise.
        7) SIMPLICITY FILTER: One idea? Instant understanding? Clear goal?
        8) SCROLL TEST: STOP or SCROLL?
        
        🔥 PART 4: HIGH CTR LOGIC
        Winning formula: One person + One danger OR one goal + One clear situation.
        Face Rule: No fully open mouth. Slightly open OR closed mouth only. Best: tension, subtle smile, shocked but controlled.

        ${title ? `VIDEO TITLE PROVIDED: "${title}"` : ''}

        ---
        OUTPUT SCHEMA:
        You MUST return the analysis strictly in the following JSON format to integrate with the application.
        {
            "visual_description": "A) One-sentence brutal verdict. F) Redesign plan: Core Idea, Color Plan, Composition Layout, Shape Logic, Emotion Plan. G) Final improved thumbnail concept.",
            "ctr_score": 85,
            "pillars": [
                { "name": "Curiosity", "score": 80, "status": "High", "reasoning": "..." },
                { "name": "Virality", "score": 40, "status": "Low", "reasoning": "..." },
                { "name": "Idea", "score": 70, "status": "Medium", "reasoning": "..." },
                { "name": "Clarity", "score": 60, "status": "Medium", "reasoning": "..." },
                { "name": "Emotion", "score": 90, "status": "High", "reasoning": "..." }
            ],
            "pros": ["What is working"],
            "cons": ["What is killing CTR (Failures detected)"],
            "extracted_prompt": "A prompt that could recreate this exact style."
        }
        
        STRICTNESS: Be brutally honest. No humor. No fluff. If it's bad, say why it's bad.
        CRITICAL: You MUST provide EXACTLY these 5 pillars: "Curiosity", "Virality", "Idea", "Clarity", "Emotion". Do not add any other pillars.
        
        CONSTRAINTS:
        - DO NOT include any base64 image data, URLs, or extremely long descriptions.
        - Keep 'visual_description' under 150 words.
        - Keep each pillar's 'reasoning' under 80 words.
        - Return ONLY the JSON object.
        
        LANGUAGE: Perform the analysis and provide all text in ${lang}.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: cleanMime } }, 
                    { text: `Perform a deep ${mode} forensic audit of this YouTube thumbnail. Return the result as a strictly valid JSON object following the provided schema.` }
                ] 
            },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                maxOutputTokens: 4096,
                temperature: 0,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        visual_description: { type: Type.STRING },
                        ctr_score: { type: Type.NUMBER },
                        pillars: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    score: { type: Type.NUMBER },
                                    status: { type: Type.STRING },
                                    reasoning: { type: Type.STRING }
                                },
                                required: ["name", "score", "status", "reasoning"]
                            }
                        },
                        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                        extracted_prompt: { type: Type.STRING }
                    },
                    required: ["visual_description", "ctr_score", "pillars", "pros", "cons"]
                }
            }
        });
        const result = safeJsonParse(response.text, {
            visual_description: "Analysis failed due to a technical error.",
            ctr_score: 0,
            pillars: [],
            pros: [],
            cons: []
        });
        if (result && result.ctr_score) {
            setCachedAnalysis(cacheKey, result);
        }
        return result;
    });
};

export const optimizeThumbnail = async (
    base64Image: string, 
    mimeType: string, 
    title: string, 
    analysis: AnalysisResult,
    lang: string,
    pastOptimizations: any[] = []
): Promise<OptimizationResult> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        
        // Step 1: Strategic Thinking & Prompt Generation (Brain)
        let pastContext = "";
        if (pastOptimizations.length > 0) {
            pastContext = `\nPAST SUCCESSFUL OPTIMIZATIONS (Learn from these):\n`;
            pastOptimizations.forEach((opt, idx) => {
                pastContext += `Example ${idx + 1}:\n- Original Score: ${opt.originalScore}\n- New Score: ${opt.newScore}\n- Strategy Used: ${opt.explanation}\n- Prompt Used: ${opt.promptUsed}\n\n`;
            });
            pastContext += `Use these past successes to inform your strategy for this new thumbnail.\n`;
        }

        // Stage 1: Generate Concepts
        let bestConcept: any = null;
        let attempts = 0;
        let conceptsLog: any[] = [];
        
        while (attempts < 2 && (!bestConcept || bestConcept.predictedCTR < 90)) {
            const conceptPrompt = `
            🎯 ROLE
            You are an advanced AI Thumbnail Optimization Engine.
            Your mission is to generate high-CTR thumbnail concepts based on the provided image and title.

            ${pastContext}
            🧠 INPUT:
            - Current Title: "${title}"
            - Current Analysis: ${JSON.stringify(analysis.pillars)}
            - Current Score: ${analysis.ctr_score}
            
            Follow this exact thought process:
            1. Generate 3 completely different thumbnail concepts:
               - Concept A: Safe / classic
               - Concept B: Curiosity-driven
               - Concept C: Extreme / shocking
            
            2. Predict CTR score (0-100) for each based on:
               - clarity speed (<1s recognition)
               - emotional intensity
               - novelty (seen vs unseen)
               - curiosity gap strength
            
            Return the 3 concepts and their predicted scores.
            `;

            const conceptResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { data, mimeType: mime } },
                        { text: conceptPrompt }
                    ]
                },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            concepts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        predictedCTR: { type: Type.NUMBER }
                                    },
                                    required: ["name", "description", "predictedCTR"]
                                }
                            }
                        },
                        required: ["concepts"]
                    }
                }
            });

            const conceptData = JSON.parse(conceptResponse.text || "{}");
            const concepts = conceptData.concepts || [];
            conceptsLog.push(concepts);
            
            if (concepts.length > 0) {
                const currentBest = concepts.reduce((prev: any, current: any) => (prev.predictedCTR > current.predictedCTR) ? prev : current);
                if (!bestConcept || currentBest.predictedCTR > bestConcept.predictedCTR) {
                    bestConcept = currentBest;
                }
            }
            attempts++;
        }

        if (!bestConcept) {
            bestConcept = { name: "Fallback", description: "A highly optimized, high-contrast YouTube thumbnail.", predictedCTR: 85 };
        }

        // Stage 2: Refine and Optimize the Best Concept
        const refinePrompt = `
        🎯 ROLE
        You are an advanced AI Thumbnail Optimization Engine.
        We have selected the following high-CTR thumbnail concept:
        - Concept Name: ${bestConcept.name}
        - Concept Description: ${bestConcept.description}
        - Predicted CTR: ${bestConcept.predictedCTR}

        Now, apply the following optimization rules to this concept before generating the final prompt:
        
        1. Check if the concept looks similar to common YouTube patterns. IF similarity > threshold:
           → FORCE a visual twist (unusual angle, unexpected element, abnormal scale, contradiction).
           RULE: Familiar = ignored, Different = clicked
        
        2. Force extreme contrast (dark vs bright, rich vs poor, safe vs danger, normal vs abnormal).
           IF contrast is medium:
           → exaggerate it further.
           RULE: Moderate contrast = mid CTR, Extreme contrast = viral CTR
        
        3. Ensure visual path. Eye flow must be:
           1. Face / main subject
           2. Secondary object
           3. Curiosity element
           IF no clear path:
           → redesign layout.
        
        4. Compress text. IF text > 3 words:
           → compress to 1–2 words OR symbols (e.g., "$0 → $1M" instead of "ZERO TO MILLION").
           RULE: Reading kills speed, Symbols boost speed
        
        5. Detect visual overload. IF elements > 3:
           → auto-remove lowest impact element until 2–3 elements only.
        
        6. Blur thumbnail mentally. Ask: "Can I still understand the idea?"
           IF NO:
           → rebuild thumbnail.

        ✍️ STEP 7: FINAL PROMPT ENGINE
        Based on the surviving, highly-optimized concept, generate the final image generation prompt.
        
        🧠 EXPLANATION SYSTEM:
        Explain: What was wrong originally, what changed in this new concept, what visual twists/contrast/path optimizations were applied, and why it improves CTR.
        
        OUTPUT JSON FORMAT:
        {
            "prompt": "The detailed image generation prompt for the final selected concept...",
            "suggestedTitle": "A new, better title (optional, keep original if good)",
            "explanation": "What was wrong, what changed, and why it improves CTR..."
        }
        `;

        const refineResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: refinePrompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: { type: Type.STRING },
                        suggestedTitle: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                    },
                    required: ["prompt", "explanation"]
                }
            }
        });

        const strategyData = JSON.parse(refineResponse.text || "{}");
        const finalPrompt = strategyData.prompt || "A highly optimized YouTube thumbnail.";
        const explanation = strategyData.explanation || "Optimized for higher CTR.";
        const newTitle = strategyData.suggestedTitle || title;

        // Step 3: Regenerate Image
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: `[STYLE: MrBeast] ${finalPrompt}. High contrast, vibrant colors, clear subject, emotional face, readable text.` }
                ]
            }
        });

        let newImageBase64 = '';
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                newImageBase64 = part.inlineData.data;
                break;
            }
        }

        if (!newImageBase64) {
            throw new Error("Failed to generate optimized image.");
        }

        // Step 4: Re-analyze the new image
        const newAnalysis = await analyzeImage(newImageBase64, 'image/png', 'STRATEGY', lang, newTitle);

        return {
            optimizedImageBase64: newImageBase64,
            optimizedTitle: newTitle,
            explanation: explanation,
            promptUsed: finalPrompt,
            newScore: newAnalysis.ctr_score,
            newPillars: newAnalysis.pillars,
            concepts: conceptsLog[0] || [],
            appliedTwists: strategyData.appliedTwists || []
        };
    });
};

export const generateMasterStrategy = async (idea: string, lang: string): Promise<any> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: `Create a Master YouTube Strategy for the idea: "${idea}" in ${lang}. 
            Provide a viral title, thumbnail concept, and 3 key psychological hooks.`,
            config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 2048,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        thumbnail_concept: { type: Type.STRING },
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "thumbnail_concept", "hooks"]
                }
            }
        });
        return safeJsonParse(response.text, {});
    });
};

export const enhancePrompt = async (rawPrompt: string): Promise<string> => {
  return wrapGeminiCall(async () => {
      const ai = getClient();
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `Role: You are a Prompt Enhancer, not a Prompt Generator.

STRICT RULES:
- Do NOT change the core idea.
- Do NOT remove key elements (numbers, objects, context).
- Do NOT replace the concept with a new one.
- Keep the same meaning, intent, and structure.

ALLOWED:
- Improve clarity and wording
- Add visual details (lighting, emotion, composition, colors)
- Increase cinematic and viral appeal
- Fix contradictions ONLY if they break the idea

FORBIDDEN:
- Changing the subject
- Changing quantities (numbers like 50, 100, etc.)
- Ignoring important elements
- Simplifying into a different idea

OUTPUT STYLE:
- Same idea, but clearer, stronger, more visual, more clickable.

If conflict exists:
→ Resolve it while preserving the original idea.

Input:
${rawPrompt || "A viral high-stakes scene"}

Output:
Enhanced version only.`,
        config: {
            maxOutputTokens: 1024
        }
      });
      return response.text || rawPrompt;
  });
};

export const getChatResponse = async (message: string, images?: string[]): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient(); 
        const model = 'gemini-3-flash-preview';
        
        const parts: any[] = [];
        if (images && images.length > 0) {
            images.forEach(img => { parts.push({ inlineData: { mimeType: 'image/png', data: img } }); });
        }
        parts.push({ text: message });
        const result = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                systemInstruction: `ROLE: Ruthless YouTube Strategist. ${FORENSIC_RULES} ${MASTER_TITLE_RULES}`,
                maxOutputTokens: 2048
            }
        });
        return result.text || "No response.";
    });
};

export const magicFixImage = async (base64Image: string, mimeType: string, userInstruction: string, isLowRes?: boolean): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-2.5-flash-image';
        
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        
        const upscaleInstruction = isLowRes ? "CRITICAL: This is a LOW RESOLUTION image. You MUST upscale it to 4K quality, sharpening every edge and enhancing every texture to pore-level detail." : "";

        const response = await ai.models.generateContent({
            model: model,
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: `Enhance this image based on the following instruction: ${userInstruction || "Improve this image."}. 
                    ${upscaleInstruction}
                    
                    STRICT ENHANCEMENT PROTOCOL:
                    - DO NOT completely redraw the image. Keep it as close to the original as possible, just better quality.
                    - DO NOT add random objects, text, or extreme weather unless they were already there.
                    - KEEP faces and identities exactly the same, just better lit and sharper.
                    - REALISTIC FACES: Faces MUST look like real human photographs, not 3D renders, cartoons, or AI-generated plastic faces. Skin texture should be highly realistic with natural pores and imperfections.
                    - NO LETTERBOXING: Do NOT add black bars.
                    - The final result must look like a professionally color-graded and retouched version of the original.` }
                ] 
            },
            config: { imageConfig: { aspectRatio: '16:9' } }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Magic Studio blocked by safety filters.");
        }

        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData && part.inlineData.data) {
                return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
            }
        }
        
        const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
            throw new Error(`Magic Studio failed. Model returned text instead of image: ${textResponse}`);
        }
        
        throw new Error("Magic Studio failed to produce an image.");
    });
};

export const upscaleImage = async (base64Image: string, mimeType: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ inlineData: { data, mimeType: mime } }, { text: "Upscale this image to a higher resolution. Subtly enhance clarity, sharpness, and details without changing the original content, layout, or faces. Do not completely redraw the image. Keep it as close to the original as possible. NO LETTERBOXING: Do NOT add black bars." }] },
            config: { imageConfig: { aspectRatio: "16:9" } }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Upscale blocked by safety filters.");
        }

        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData && part.inlineData.data) {
                return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
            }
        }
        
        const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
            throw new Error(`Upscale failed. Model returned text instead of image: ${textResponse}`);
        }
        
        throw new Error("Upscale failed to produce an image.");
    });
};

export const oneClickFix = async (base64Image: string, mimeType: string, analysis: any, contextStr?: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        
        const weaknesses = analysis?.pillars?.filter((p: any) => p.score < 90).map((p: any) => p.name).join(', ') || '';
        const strengths = analysis?.pillars?.filter((p: any) => p.score >= 90).map((p: any) => p.name).join(', ') || '';

        const promptText = `You are a YouTube thumbnail expert.
Rebuild the input thumbnail to maximize click-through rate based on the analysis.

${contextStr ? `CONTEXT:\n${contextStr}\n` : ''}

CURRENT ANALYSIS:
- Strengths to PRESERVE (Score >= 90%): ${strengths || 'None identified.'}
- Weaknesses to FIX (Score < 90%): ${weaknesses || 'None identified. Just make it more viral.'}

DECISION PRIORITY SYSTEM:
1. Focus on fixing the identified weaknesses to push their scores above 90%.
2. CRITICAL CONSTRAINT: Do not degrade the identified strengths. Keep them exactly as they are or better.
3. To fix weaknesses like 'Curiosity Gap', you MUST change multiple elements: enhance text, exaggerate facial expressions, improve color contrast, simplify the visual layout, and ensure clarity when scaled down.
4. The new version must be a highly viral, click-optimized thumbnail.

STRUCTURAL PRESERVATION (CRITICAL):
- You MUST maintain the overall structure and composition of the original image.
- You can change the shooting angle slightly or replace specific elements, but the fundamental perspective and layout MUST remain the same.

Apply these improvements carefully:
- Add strong emotional expression ONLY if emotion is a weakness.
- Create one clear focal point.
- Replace weak elements with stronger ones if needed.
- Use bold, minimal text (max 3-4 words).

Output a high-performing thumbnail that looks viral and modern. NO LETTERBOXING.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: promptText }
                ] 
            },
            config: { imageConfig: { aspectRatio: '16:9' } }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("One-Click Fix blocked by safety filters.");
        }

        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData && part.inlineData.data) {
                return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
            }
        }
        
        const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
            throw new Error(`One-Click Fix failed. Model returned text instead of image: ${textResponse}`);
        }
        
        throw new Error("One-Click Fix failed to produce an image.");
    });
};

export const editThumbnail = async (base64Image: string, mimeType: string, prompt: string, faceRef?: string, mask?: string): Promise<string> => {
     return wrapGeminiCall(async () => {
         const ai = getClient();
         const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
         const parts: any[] = [{ inlineData: { data, mimeType: mime } }];
         
         if (mask) {
             const { data: mData, mime: mMime } = await prepareImageForAPI(mask, 'image/png');
             parts.push({ inlineData: { data: mData, mimeType: mMime } });
         }

         let instructionText = `Edit this image based on the following instruction: ${prompt}. 
         
         STRICT RULES:
         - The user's instruction might be in ANY language (including Arabic, Moroccan Darija, Tamazight/Shilha, English, etc.). You must understand the intent perfectly regardless of the language.
         - DO NOT completely redraw the image. Keep it as close to the original as possible.
         - Only change what was explicitly requested in the instruction.
         - Apply the edit EXACTLY where it makes sense based on the instruction.
         - NO LETTERBOXING: Do NOT add black bars.
         - Ensure the lighting and style of the new elements match the original image perfectly.
         - CROWDS & GROUPS RULE: If adding a crowd or many people, they MUST look 100% photorealistic and human, not like 3D models or cartoons.
         - COMPETITION & RIVALRY RULE: If adding a competition or battle, the people MUST look like they are actively competing with intense, aggressive facial expressions (grit, glaring) and dynamic action, not just standing passively.`;

         if (mask) {
             instructionText += `\n\nMASK INSTRUCTION:\n- A black and white mask image has been provided.\n- The WHITE areas in the mask indicate the exact regions you are allowed to modify.\n- The BLACK areas MUST remain 100% identical to the original image. Do not change them.`;
         }

         if (faceRef) {
             const { data: fData, mime: fMime } = await prepareImageForAPI(faceRef, 'image/jpeg');
             parts.push({ inlineData: { data: fData, mimeType: fMime } });
             instructionText += `\n\nCRITICAL FACE SWAP INSTRUCTION:\n- The second image provided is a REFERENCE FACE.\n- You MUST perfectly recreate this exact person's face on the main subject in the first image.\n- Ensure 100% photorealistic likeness to the reference face.\n- CRITICAL: You MUST preserve the exact expressions, emotions, and lighting of the original image.\n- If the original image does not have a person, generate the reference person in the image with an expression matching the overall mood.\n- Do not make it look like a cartoon or 3D render.\n- It must look like a real photograph of the person in the reference image.\n- Ensure the new face matches the lighting, angle, and skin tone of the original body.`;
         } else {
             instructionText += `\n\nCRITICAL FACE PRESERVATION INSTRUCTION:\n- DO NOT alter the face in any way.\n- The face must remain 100% identical to the original image.\n- Do not add or change any facial features, hair, or expressions.\n- ONLY modify the specific elements requested in the prompt.`;
         }

         parts.push({ text: instructionText });

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { imageConfig: { aspectRatio: '16:9' } }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Edit blocked by safety filters.");
        }

         for (const part of response.candidates?.[0]?.content?.parts || []) { 
             if (part.inlineData && part.inlineData.data) {
                 return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
             }
         }
         
         const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
         if (textResponse) {
             throw new Error(`Edit failed. Model returned text instead of image: ${textResponse}`);
         }
         
        return ""; 
    });
};

export const generateBeastConcepts = async (idea: string, lang: string = 'Arabic'): Promise<BeastConcept[]> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: AI Orchestrator Agent (Beast Mode).
        MISSION: Transform a raw idea into 5 viral thumbnail concepts following viral "Conflict Engineering" and "Visual Psychology".
        
        STAGE 1: IDEA PARSER
        - Extract Conflict (e.g., AI vs Human, $1 vs $100M).
        - Identify Emotion (Shock, Fear, Curiosity, Greed).
        - Define Result (The "Promise" of the video).
        - Target Audience (e.g., YouTubers, Tech Enthusiasts).
        
        STAGE 2: VISUAL GENERATOR
        - Create 5 distinct visual concepts.
        - Each concept must have a title, description, and a "mini sketch" description for SVG generation.
        
        OUTPUT: Return a JSON array of 5 BeastConcept objects.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Idea: "${idea}"`,
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                maxOutputTokens: 3072,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            conflict: { type: Type.STRING },
                            emotion: { type: Type.STRING },
                            result: { type: Type.STRING },
                            target_audience: { type: Type.STRING },
                            estimated_ctr: { type: Type.NUMBER },
                            sketch_description: { type: Type.STRING }
                        },
                        required: ["id", "title", "description", "conflict", "emotion", "result", "target_audience", "estimated_ctr", "sketch_description"]
                    }
                }
            }
        });
        return safeJsonParse(response.text, []);
    });
};

export const engineerBeastVisual = async (concept: BeastConcept, lang: string = 'Arabic'): Promise<BeastVisualEngineering> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: Visual Psychology Agent.
        MISSION: Apply advanced visual engineering to a thumbnail concept.
        
        APPLY:
        - Eye Path Simulation (Z-pattern, Triangle).
        - Color Psychology (Red for danger, Blue for tech, Green for profit).
        - Contrast Optimization (Aggressive contrast rules).
        - Face Enlargement Ratio (Exaggeration physics).
        - Background Simplification (Isolation principle).
        
        OUTPUT: Return a JSON BeastVisualEngineering object.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Concept: ${JSON.stringify(concept)}`,
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        eye_path: { type: Type.STRING },
                        color_psychology: { type: Type.STRING },
                        contrast_optimization: { type: Type.STRING },
                        face_ratio: { type: Type.STRING },
                        background_simplification: { type: Type.STRING }
                    },
                    required: ["eye_path", "color_psychology", "contrast_optimization", "face_ratio", "background_simplification"]
                }
            }
        });
        return safeJsonParse(response.text, {});
    });
};

export const simulateBeastCTR = async (concept: BeastConcept, engineering: BeastVisualEngineering, lang: string = 'Arabic'): Promise<BeastSimulation> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: Testing Agent.
        MISSION: Simulate CTR performance for the engineered thumbnail.
        
        CRITERIA:
        - Visual Intensity.
        - Curiosity Gap.
        - Clarity from afar (Mobile view).
        - Emotional Resonance.
        
        OUTPUT: Return a JSON BeastSimulation object.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Concept: ${JSON.stringify(concept)}, Engineering: ${JSON.stringify(engineering)}`,
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ctr_score: { type: Type.NUMBER },
                        confidence: { type: Type.STRING },
                        reasoning: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["ctr_score", "confidence", "reasoning"]
                }
            }
        });
        return safeJsonParse(response.text, {});
    });
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        { inlineData: { data: base64Audio, mimeType } },
                        { text: "Transcribe the following audio into text accurately. You can handle any language spoken in the world, including Moroccan Arabic (Darija) or any other dialect. Transcribe it exactly in the original language spoken. Return the transcription as a single continuous paragraph without any artificial line breaks or forced newlines. Return ONLY the transcription text. IF THERE IS NO SPEECH, OR ONLY SILENCE/NOISE, RETURN EXACTLY AN EMPTY STRING AND NOTHING ELSE." }
                    ]
                }
            ],
            config: {
                maxOutputTokens: 2048
            }
        });
        return response.text || "";
    });
};

export const generateAudioSummary = async (ctx: any, lang: string): Promise<string | null> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        
        // 1. Generate a concise text summary first using a standard model
        const textSummaryResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Summarize the following YouTube thumbnail analysis data into a concise, energetic 2-3 sentence script for a viral strategist to read aloud in ${lang}. Focus on the most important strengths and weaknesses. Data: ${JSON.stringify(ctx)}`,
            config: {
                maxOutputTokens: 512
            }
        });
        
        const textToSpeak = textSummaryResponse.text || "Analysis complete.";

        // 2. Pass the text summary to the TTS model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: { 
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    });
};
