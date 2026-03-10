
import { GoogleGenAI, Modality, Type, Chat, GenerateContentResponse } from "@google/genai";
import { STYLE_CATEGORIES, PERSONA_LIST, AnalysisMode, MasterStrategyResult, AspectRatio, DeepAnalysisItem, AppMode, AnalysisResult, BeastConcept, BeastVisualEngineering, BeastSimulation } from "../types";

const FORENSIC_RULES = `
**MASTERCLASS VISUAL PSYCHOLOGY RULES:**
1. **COLOR THEORY:** Use RED for threats, BLUE for underdogs.
2. **LIGHTING:** Use flat, minimal, and soft front lighting for the subject. NO dramatic side lighting, NO colored rim lights, and NO sunlight effects on the subject's face or body. Environmental lighting (sunlight, glows) MUST be strictly confined to the background elements. The subject should look naturally lit without artificial-looking glows.
2.1 **NO LIGHT LEAKS:** Ensure there are no yellow or colored light lines/leaks on the subject's collar, face, or clothing.
3. **ULTRA-PRECISE FACE SWAP**: When swapping faces, preserve the exact head pose, face angle, eye gaze, and all physical details (scars, wounds, wrinkles, dirt, blood, sweat, skin texture) from the original image. The expression must remain identical.
4. **IDENTITY LOCK:** Never hallucinate a celebrity based on the original subject's profession.
5. **COMPARISON LOGIC:** If comparing two items (e.g., $1 vs $100M), ALWAYS place the cheaper/weaker/older item on the LEFT and the expensive/stronger/newer item on the RIGHT.
6. **COMPOSITION:** Place the main subject's face in the center or follow the Rule of Thirds.
7. **STRICT FACIAL RULES:** The tongue MUST NOT be visible at all. No open mouths showing the tongue.
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
18. **HYPER-REALISM:** Every image MUST be hyper-realistic, with pore-level skin detail and 8K cinematic textures. No cartoonish or stylized elements. This is "Masterpiece" quality.
19. **EYE LOGIC:** Eyes MUST be natural and clear. Never yellow or orange unless it's a specific fantasy creature. For humans, eyes must be realistic and expressive.
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

const CHANNEL_STYLE_RULES: Record<string, string> = {
    'mrbeast': `**STYLE: MrBeast** - Hyper-Saturated, High-Key lighting, "Beast Scream" expression, large bold text, yellow/red accents. EXTREME HYPER-REALISM: Pore-level skin detail, 8K cinematic textures, professional studio photography, no AI artifacts, perfectly clear skies.`,
    'mrbeast_gaming': `**STYLE: MrBeast Gaming** - High energy, gaming-focused, vibrant colors, expressive gaming faces.`,
    'beast_reacts': `**STYLE: Beast Reacts** - Reaction style, split screen vibe, high energy, bright lighting.`,
    'mark_rober': `**STYLE: Mark Rober** - Engineering focus, clean, bright, high-tech but accessible, "glitter bomb" energy.`,
    'beast_philanthropy': `**STYLE: Beast Philanthropy** - Heartwarming, cinematic, clean, focus on positive impact and large-scale charity.`,
    'mrbeast_2': `**STYLE: MrBeast 2** - Secondary channel vibe, slightly more casual but still high energy and viral.`,
    'airrack_2': `**STYLE: Airrack 2** - Behind the scenes, vlog style, high energy, authentic but professional.`,
    'lazarbeam': `**STYLE: LazarBeam** - Humorous, high energy, bright, expressive faces.`,
    'sidemen': `**STYLE: Sidemen** - Energetic, group dynamic, high contrast, vibrant colors, "Sidemen" aesthetic.`,
    'ryan_trahan': `**STYLE: Ryan Trahan** - Authentic, clean, focus on storytelling, slightly muted but professional.`,
    'ksi': `**STYLE: KSI** - High energy, bold, vibrant, expressive faces, "Lord KSI" vibe.`,
    'logan_paul': `**STYLE: Logan Paul** - Cinematic, high energy, vibrant, professional production look.`,
    'dude_perfect': `**STYLE: Dude Perfect** - Sports/Trickshot energy, bright, clean, high-action focal points.`,
    'yes_theory': `**STYLE: Yes Theory** - Adventurous, cinematic, warm tones, focus on human connection.`,
    'mkbhd': `**STYLE: MKBHD** - Matte Black aesthetic, rim lighting, 8K crisp textures, minimalist professional.`,
    'linus_tech_tips': `**STYLE: Linus Tech Tips** - High energy, tech-heavy, bright studio lighting, "LTT orange" accents.`,
    'mrwhosetheboss': `**STYLE: Mrwhosetheboss** - Ultra-premium tech, glowing lights, bokeh backgrounds, futuristic.`,
    'unbox_therapy': `**STYLE: Unbox Therapy** - Clean, high contrast, focus on product details, professional studio.`,
    'verge': `**STYLE: The Verge** - Modern, clean, professional journalism aesthetic, high production.`,
    'ijustine': `**STYLE: iJustine** - Bright, energetic, tech-lifestyle, clean and vibrant.`,
    'dream': `**STYLE: Dream** - Minecraft aesthetic, simple but iconic, high contrast, speedrun energy.`,
    'pewdiepie': `**STYLE: PewDiePie** - Iconic gaming/lifestyle, high energy, expressive, "Brofist" vibe.`,
    'markiplier': `**STYLE: Markiplier** - High energy, dramatic, expressive faces, vibrant gaming style.`,
    'jacksepticeye': `**STYLE: Jacksepticeye** - High energy, "Top of the morning" vibe, vibrant green accents.`,
    'technoblade': `**STYLE: Technoblade** - Iconic Minecraft legend style, high contrast, crown/pig motifs.`,
    'dantdm': `**STYLE: DanTDM** - Clean, energetic, gaming-focused, professional and friendly.`,
    'kurzgesagt': `**STYLE: Kurzgesagt** - Flat design, vibrant vector art style, cosmic/scientific themes.`,
    'veritasium': `**STYLE: Veritasium** - Scientific, cinematic, high production value, intriguing focal points.`,
    'vsauce': `**STYLE: Vsauce** - Philosophical, mysterious, clean but deep, intriguing visuals.`,
    'wendover': `**STYLE: Wendover** - Informative, clean, map-heavy, professional documentary style.`,
    'reallifelore': `**STYLE: RealLifeLore** - Map-focused, high contrast, informative and engaging.`,
    'polymatter': `**STYLE: PolyMatter** - Clean, minimalist vector style, professional and informative.`
};

const DEFAULT_STYLE = `**STYLE: Viral** - High saturation, clear focal point, expressive face.`;

const safeJsonParse = (text: string | undefined, fallback: any = {}) => {
    if (!text) return fallback;
    try {
        // Extract JSON from markdown block if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const cleaned = jsonMatch ? jsonMatch[1].trim() : text.trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse Error. Text preview:", text.substring(0, 200) + "...");
        
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
             
             if (inString) fixedText += '"';
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
        
        return fallback;
    }
};

const getClient = () => {
  const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY) as string;
  return new GoogleGenAI({ apiKey });
};

export const checkProAccess = async (): Promise<boolean> => {
    if (window.aistudio) {
        return await window.aistudio.hasSelectedApiKey();
    }
    return false;
};

const wrapGeminiCall = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        const errorMsg = error.message || "";
        if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("403") || errorMsg.includes("permission")) {
            if (window.aistudio) {
                window.aistudio.openSelectKey();
            }
        }
        throw new Error(`AI Error: ${error.message || "Failed to communicate with AI"}`);
    }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const fileToBase64 = (file: File): Promise<string> => blobToBase64(file);

export const urlToBase64 = async (url: string): Promise<string> => {
    const fetchAndConvert = async (u: string) => {
        const response = await fetch(u);
        const blob = await response.blob();
        return await blobToBase64(blob);
    };
    try { return await fetchAndConvert(url); } catch (e) {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        return await fetchAndConvert(proxyUrl);
    }
};

const resizeImageTo1280x720 = async (base64: string, mimeType: string): Promise<string> => {
    return new Promise((resolve) => {
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
                resolve(canvas.toDataURL('image/jpeg', 1.0));
            } else {
                resolve(`data:${mimeType};base64,${base64}`);
            }
        };
        img.src = `data:${mimeType};base64,${base64}`;
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
                resolve({ data: base64, mime: inputMimeType || 'image/png' });
            }
        };
        img.src = `data:${inputMimeType || 'image/png'};base64,${base64}`;
    });
};

export const recreateThumbnail = async (base64Image: string, mimeType: string, prompt: string, persona?: string, face?: string): Promise<string[]> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-2.5-flash-image';
        const imageSize = '1K';
        
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        const parts: any[] = [{ inlineData: { data, mimeType: mime } }];
        
        const personaObj = PERSONA_LIST.find(p => p.id === persona);
        let personaName = personaObj ? personaObj.name : "the requested person";
        let identityInstruction = `You MUST use the facial features of ${personaName} ONLY. Do NOT use any other celebrity.`;

        if (persona === 'mrbeast') {
            personaName = "MrBeast YouTube channel logo (the blue tiger)";
            identityInstruction = `You MUST use the MrBeast YouTube channel logo (the blue tiger) instead of a human face. Place the logo prominently where a face would be.`;
        } else if (['elon_musk', 'mark_zuckerberg', 'pewdiepie', 'messi', 'logan_paul', 'khabib'].includes(persona || '')) {
            identityInstruction = `CRITICAL: You MUST use the ACTUAL REAL FACE of ${personaName}. Ensure the likeness is 100% accurate to the real person.`;
        }

        if (face) {
            const { data: faceData, mime: faceMime } = await prepareImageForAPI(face, 'image/jpeg');
            parts.push({ inlineData: { data: faceData, mimeType: faceMime } });
        }
        
        // --- STRICT SURGICAL IDENTITY TRANSFER PROTOCOL ---
        const isComparison = prompt.toLowerCase().includes('vs') || prompt.toLowerCase().includes('versus') || prompt.includes('$');
        const comparisonLayout = isComparison ? `
        LAYOUT RULE: This is a COMPARISON. 
        - LEFT SIDE: Show the weak/cheap/old item (e.g., $1 item). This side should be slightly blurry.
        - RIGHT SIDE: Show the strong/expensive/new item (e.g., $100M item). Use luxury colors (emerald, purple, money-green).
        - CENTER: Place the face and upper body of ${personaName} prominently in the center of the image. The body MUST be visible, not just the face. This person acts as the divider between the two halves.
        - FACE: The person MUST be smiling. The tongue MUST NOT be visible.
        - TEXT: Do NOT use "VS". Instead, write the name of the item on the left (e.g., "One Dollar") above it, and the value of the item on the right in words (e.g., "One Hundred Million Dollars") above it. PREFER LETTERS OVER NUMBERS for large values.
        - NO DIVIDER: Do NOT include a white line or any artificial border between the sides.
        ` : "";

        const finalPrompt = `
        TASK: ULTRA-PRECISE SURGICAL FACE SWAP / IDENTITY TRANSFER.
        TARGET IDENTITY: ${personaName}.
        ${comparisonLayout}
        
        CRITICAL EXECUTION RULES (NO EXCEPTIONS):
        1. **PRESERVE POSE & GAZE**: Preserve the exact head pose, face angle, and eye gaze direction from the original image. The swapped face MUST look in the exact same direction.
        2. **PRESERVE ALL PHYSICAL DETAILS**: Preserve all facial details present in the original image including: scars, wounds, wrinkles, dirt, blood, scratches, sweat, water, and pore-level skin texture.
        3. **IDENTICAL EXPRESSION**: The facial expression must remain identical to the original image: same mouth shape, same eyebrow position, same eye openness, and same emotional intensity.
        4. **BODY-WIDE SKIN TONE SYNC**: Match the skin tone of the swapped face perfectly with the body, neck, ears, and hands. Skin color must be fully consistent across the entire body.
        5. **LIGHTING TRANSFER**: Transfer the original lighting conditions to the swapped face: same light direction, same shadows, same highlights, same color temperature, and same contrast.
        6. **PRESERVE ENVIRONMENTAL EFFECTS**: Preserve effects affecting the face such as smoke, fire light, water reflections, dust, and atmospheric lighting.
        7. **ANATOMICAL PROPORTIONS**: Maintain correct anatomical proportions: same head size, same jaw width, same cheek structure, and same facial alignment with the neck.
        8. **PRESERVE HAIR & EARS**: Preserve hairline, ears, and surrounding elements. Do NOT distort hair, beard, or ears during the swap.
        9. **PERSPECTIVE FIDELITY**: Maintain camera perspective and lens distortion exactly as in the original image.
        10. **SEAMLESS INTEGRATION**: Ensure no visible editing artifacts, no warped features, and no mismatched skin blending. The result must look like ${personaName} was originally photographed in that scene.
        11. **IDENTITY LOCK**: ${identityInstruction}
        12. **EYE LOGIC**: Eyes must be natural and clear. No yellow or orange eyes.
        13. **SINGLE FACE SWAP**: Only swap the face of the PRIMARY subject.
        14. **ADDITIONAL COMMANDS**: ${prompt || "Focus on a clean and realistic face swap."}
        
        OUTPUT: 16:9 aspect ratio. Photorealistic. Commercial quality. Masterpiece.
        `;

        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: '16:9', imageSize: imageSize as any } }
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
            console.warn("Gemini returned no images. Response:", JSON.stringify(response));
        }
        
        return images;
    });
};

// ... (باقي الوظائف تبقى كما هي)
const enhanceThumbnailPrompt = async (rawPrompt: string, personaName: string, styleRule: string, inspirationImages?: string[]): Promise<{ visualDescription: string; suggestedTitle: string }> => {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';
    
    // 1. Check if we have inspiration images or need search
    let searchContext = "";
    const isGenericPersona = personaName.toLowerCase().includes("generic") || !personaName;
    const isDefaultStyle = styleRule === DEFAULT_STYLE;

    if (inspirationImages && inspirationImages.length > 0) {
        try {
            const parts = inspirationImages.map(img => ({ inlineData: { data: img, mimeType: 'image/png' } }));
            parts.push({ text: `Analyze these YouTube thumbnail inspiration images. 
            Extract:
            1. COLOR PALETTE: Dominant colors and accent colors.
            2. COMPOSITION: Where are the characters? Where is the focal point?
            3. CHARACTER EXPRESSIONS: What emotions are the people showing?
            4. SYMBOLS & ELEMENTS: Are there maps, flags, weapons, or specific icons?
            5. ATMOSPHERE: Is it dark, cinematic, bright, or news-like?
            
            Return a concise summary of the visual style to be used for a new thumbnail about: "${rawPrompt}".` } as any);

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: { parts }
            });
            searchContext = `VISUAL INSPIRATION ANALYSIS: ${analysisResponse.text}`;
        } catch (e) {
            console.error("Inspiration analysis failed", e);
        }
    } else if (isGenericPersona || isDefaultStyle) {
        try {
            const searchResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Research the visual style, key subjects, and trending thumbnail elements for: "${rawPrompt}". 
                If it's a specific YouTube niche, find what the top creators are doing. 
                Identify key symbols, colors, and compositions that work for this topic.`,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            });
            searchContext = `YOUTUBE TRENDS & VISUAL CONTEXT: ${searchResponse.text}`;
        } catch (e) {
            console.error("Search failed", e);
        }
    }

    const personaObj = PERSONA_LIST.find(p => p.name === personaName) || PERSONA_LIST.find(p => p.id === personaName);
    let identityInstruction = `include ${personaName} in the scene naturally.`;
    if (personaObj?.id === 'mrbeast') {
        identityInstruction = `include the MrBeast YouTube channel logo (the blue tiger) prominently in the scene instead of his face.`;
    } else if (['elon_musk', 'mark_zuckerberg', 'pewdiepie', 'messi', 'logan_paul', 'khabib'].includes(personaObj?.id || '')) {
        identityInstruction = `CRITICAL: You MUST include the ACTUAL REAL FACE of ${personaName}. Ensure the likeness is 100% accurate to the real person.`;
    }

    const systemPrompt = `You are a world-class YouTube thumbnail art director.
    The user has provided a concept for a thumbnail, possibly in Arabic or another language.
    Your task is to translate it to English and expand it into a highly detailed, visual description for an AI image generator.
    
    User's concept: "${rawPrompt}"
    Persona/Character to include: "${personaName}"
    Style: "${styleRule}"
    ${searchContext}
    
    CRITICAL INSTRUCTIONS:
    1. Translate the concept to English.
    2. Describe the SCENE visually. If it's a battle or struggle, describe the intense facial expressions (grit, clenched teeth, sweat) and the direction of the eyes (MUST look directly at the viewer).
    3. For Political/News topics: Focus on the "essence" using wars, weapons, military equipment, and dramatic atmosphere. 
    4. PERSONA RULE: ${identityInstruction}
    5. CINEMATIC DETAILS: Add imaginative environmental details like ice crystals in hair for cold scenes, or stylized scratches with DEEP RED BLOOD-LIKE DROPS for battle scenes. Scars MUST be red. If in snow (e.g., Antarctica), add ice spots/crystals in the hair and eyebrows, and ensure the background is a vast, frozen wasteland with a survival tent if appropriate.
    6. NO MAPS: Avoid generating literal maps for news topics; use symbols or scenes instead.
    7. TEXT DISTILLATION (THE HOOK): Extract only the most critical, high-impact keyword, number, or timeframe (e.g., "50 Hours", "$100k", "2 Days"). Keep it to 1-3 words maximum. You MUST integrate this text naturally into the environment (e.g., carved into a tree, written in the dirt, painted on a sign). Do NOT use floating 3D text or arrows. The visual elements MUST explain the rest of the context (e.g., if the text is "50 Hours", the background must show the "Antarctica" context via snow, a tent, and a suffering expression).
    8. PREFER LETTERS OVER NUMBERS: When generating the suggestedTitle, use words instead of digits for large numbers.
    9. Set the appropriate mood and lighting (e.g., dark and dramatic for war, bright and colorful for entertainment).
    10. THUMBNAIL BEST PRACTICES: 
       - High contrast, dark background, bright foreground.
       - Rule of Thirds composition.
       - Soft, flat front lighting for the subject. NO dramatic side lighting or colored rim lights on the person.
       - Sunlight and environmental glows MUST be background-only.
       - Catchlight in the eyes (if people are present).
       - Safe Zones: Keep main subjects away from edges.
       - Selective color pop: One vibrant element (e.g., fire, money) against a more muted background.
       - CONCEPT OVER REALITY: Prioritize visual clarity and impact over strict realism. Use compositing to place subjects in impossible or extreme situations that tell a story instantly.
       - NO ARROWS OR CIRCLES: Do NOT use red arrows, yellow arrows, or red circles. The viewer should understand the focal point through composition and character eye-lines alone.
       - DETAILED, CLEAR BACKGROUNDS: Do NOT use blurry or out-of-focus backgrounds. The background must be highly detailed and contribute logically to the story (e.g., if in a forest, show specific threats like a bear or a person with a knife).
       - ENVIRONMENTAL TEXT INTEGRATION: If the prompt includes important numbers or short text (e.g., "30 Days", "100 Hours"), integrate it naturally into the environment. Carve it into a tree, write it in the dirt/sand, or place it prominently at the top of the image. Do NOT just float text with an arrow.
       - MINUTE DETAILS & STORYTELLING: Focus heavily on small, logical details that tell the story. Every element in the background and foreground must make sense for the narrative (e.g., if surviving 30 days, show dirt, ripped clothes, and a specific threat).
       - AVENGERS COMPOSITION: For group shots, use symmetrical arrangements with a central, dominant subject. Use flat, high-key lighting to ensure every face is perfectly clear.
       - EXTREME SCALE CONTRAST: Place small human subjects next to massive objects (Pyramids, giant rocks, piles of money) to create a sense of awe and impossibility.
       - THE CONFLICT SPLIT: Use a sharp vertical divider to show two opposing forces or a "Vs" scenario (e.g., Messi vs Ronaldo). Ensure high contrast between the two sides.
       - THE HIDDEN SUBJECT REVEAL: Place a character partially obscured or hiding (e.g., under a desk or behind a door) to create an immediate curiosity gap.
       - SYMBOLIC FOCAL POINT: Have the primary subject hold a single, high-value object (Key, Briefcase, Golden Ticket) directly towards the camera, slightly out of focus to create depth.
       - MASSIVE CROWD DENSITY: Use hundreds of people in a symmetrical, dense arrangement to demonstrate the scale of a challenge or event.
    11. ULTRA-PRECISE FACE SWAP: When swapping faces, preserve the exact head pose, face angle, eye gaze, and all physical details (scars, wounds, wrinkles, dirt, blood, sweat, skin texture) from the original image. The expression must remain identical.
    12. HYPER-REALISM: Ensure the prompt describes pore-level skin detail and 8K cinematic textures. This is Masterpiece quality.
    13. EYE LOGIC: Eyes must be natural, clear, and expressive. No yellow or orange eyes.
    13. LOGICAL CONTEXT: Use logic to ensure the background matches the title. If the title says "Antarctica", the background MUST be Antarctica.
    14. SINGLE FACE SWAP: Only swap the face of the PRIMARY subject. Do NOT swap faces of background people or multiple people unless explicitly requested.
    
    Return the result as a JSON object with two fields:
    - "visualDescription": The detailed English visual description.
    - "suggestedTitle": A powerful, viral 2-4 word title for the thumbnail.
    
    Return ONLY the JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: systemPrompt,
            config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 4096,
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

export const generateThumbnail = async (prompt: string, persona?: string, style?: string, baseImage?: string, mimeType?: string, useInspiration?: boolean, inspirationImages?: string[]): Promise<{ images: string[]; suggestedTitle: string }> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-2.5-flash-image';
        const imageSize = '1K';
        
        const personaObj = PERSONA_LIST.find(p => p.id === persona);
        let personaName = personaObj ? personaObj.name : "A generic energetic person";
        let identityInstruction = `include ${personaName} in the scene naturally.`;

        if (persona === 'mrbeast') {
            personaName = "MrBeast YouTube channel logo (the blue tiger)";
            identityInstruction = `include the MrBeast YouTube channel logo (the blue tiger) prominently in the scene instead of his face.`;
        } else if (['elon_musk', 'mark_zuckerberg', 'pewdiepie', 'messi', 'logan_paul', 'khabib'].includes(persona || '')) {
            identityInstruction = `CRITICAL: You MUST include the ACTUAL REAL FACE of ${personaName}. Ensure the likeness is 100% accurate to the real person.`;
        }

        const styleRule = (style && CHANNEL_STYLE_RULES[style]) ? CHANNEL_STYLE_RULES[style] : DEFAULT_STYLE;
        
        const isComparison = prompt.toLowerCase().includes('vs') || prompt.toLowerCase().includes('versus') || prompt.includes('$');
        const comparisonLayout = isComparison ? `
        LAYOUT RULE: This is a COMPARISON. 
        - LEFT SIDE: Show the weak/cheap/old item (e.g., $1 item). This side should be slightly blurry.
        - RIGHT SIDE: Show the strong/expensive/new item (e.g., $100M item). Use luxury colors (emerald, purple, money-green).
        - CENTER: Place the face and upper body of ${personaName} prominently in the center of the image. The body MUST be visible, not just the face. This person acts as the divider between the two halves.
        - FACE: The person MUST be smiling. The tongue MUST NOT be visible.
        - TEXT: Do NOT use "VS". Instead, write the name of the item on the left (e.g., "One Dollar") above it, and the value of the item on the right in words (e.g., "One Hundred Million Dollars") above it. PREFER LETTERS OVER NUMBERS for large values.
        - NO DIVIDER: Do NOT include a white line or any artificial border between the sides.
        ` : "";

        const { visualDescription, suggestedTitle } = await enhanceThumbnailPrompt(prompt, personaName, styleRule, inspirationImages);

        const finalPrompt = `
        [STYLE: ${styleRule}] 
        ${comparisonLayout}
        
        VISUAL SCENE: ${visualDescription}
        
        QUALITY REQUIREMENTS:
        - 16:9 Aspect Ratio (1280x720).
        - Ultra Hyper-realistic, photorealistic, 8k resolution.
        - Cinematic lighting, professional photography, high detail.
        - Extreme texture detail, pore-level skin realism.
        - High dynamic range (HDR), vibrant but realistic colors.
        - Composition: Rule of Thirds, Center-weighted for mobile.
        - Lighting: Soft, flat front lighting for the subject. NO side lighting, NO colored rim lights, and NO sunlight effects on the subject's face or body. Sunlight effects MUST be background-only.
        - Post-Processing: Dodge & Burn effects (background only), high clarity, selective color pop.
        - CONCEPT OVER REALITY: Prioritize visual clarity and impact over strict realism. Use compositing to place subjects in impossible or extreme situations that tell a story instantly.
        - NO ARROWS OR CIRCLES: Do NOT use red arrows, yellow arrows, or red circles. The viewer should understand the focal point through composition and character eye-lines alone.
        - DETAILED, CLEAR BACKGROUNDS: Do NOT use blurry or out-of-focus backgrounds. The background must be highly detailed and contribute logically to the story (e.g., if in a forest, show specific threats like a bear or a person with a knife).
        - ENVIRONMENTAL TEXT INTEGRATION: If the prompt includes important numbers or short text (e.g., "30 Days", "100 Hours"), integrate it naturally into the environment. Carve it into a tree, write it in the dirt/sand, or place it prominently at the top of the image. Do NOT just float text with an arrow.
        - MINUTE DETAILS & STORYTELLING: Focus heavily on small, logical details that tell the story. Every element in the background and foreground must make sense for the narrative (e.g., if surviving 30 days, show dirt, ripped clothes, and a specific threat).
        - AVENGERS COMPOSITION: For group shots, use symmetrical arrangements with a central, dominant subject. Use flat, high-key lighting to ensure every face is perfectly clear.
        - EXTREME SCALE CONTRAST: Place small human subjects next to massive objects (Pyramids, giant rocks, piles of money) to create a sense of awe and impossibility.
        - THE CONFLICT SPLIT: Use a sharp vertical divider to show two opposing forces or a "Vs" scenario (e.g., Messi vs Ronaldo). Ensure high contrast between the two sides.
        - THE HIDDEN SUBJECT REVEAL: Place a character partially obscured or hiding (e.g., under a desk or behind a door) to create an immediate curiosity gap.
        - SYMBOLIC FOCAL POINT: Have the primary subject hold a single, high-value object (Key, Briefcase, Golden Ticket) directly towards the camera, slightly out of focus to create depth.
        - MASSIVE CROWD DENSITY: Use hundreds of people in a symmetrical, dense arrangement to demonstrate the scale of a challenge or event.
        - TEXT OVERLAY: Do NOT use floating 3D text. All text must be integrated into the environment (carved, written in dirt, painted on a wall, etc.).
        `;
        const parts: any[] = [{ text: finalPrompt }];
        if (baseImage) {
            const { data, mime } = await prepareImageForAPI(baseImage, mimeType || 'image/png');
            parts.unshift({ inlineData: { data, mimeType: mime } });
        }
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
            console.warn("Gemini returned no images. Response:", JSON.stringify(response));
        }

        return { images, suggestedTitle };
    });
};

export const getPredictionScore = (qualityScore: number): { score: string; label: string; color: string; confidence: string } => {
    let score = Math.min(100, Math.max(0, qualityScore));
    let label = "";
    let color = "";
    let confidence = "Medium";
    
    if (score >= 90) {
        label = "VIRAL POTENTIAL";
        color = "text-purple-400";
        confidence = "High";
    } else if (score >= 75) {
        label = "EXCELLENT";
        color = "text-green-400";
        confidence = "Medium";
    } else if (score >= 50) {
        label = "NEEDS IMPROVEMENT";
        color = "text-yellow-400";
        confidence = "Low";
    } else {
        label = "POOR";
        color = "text-red-400";
        confidence = "Low";
    }

    return { score: score.toFixed(0) + "%", label, color, confidence };
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
        ROLE: World-Class YouTube Title Engineer (MasterPeace Strategy).
        MISSION: Transform a video description or raw title into 5 viral, high-CTR titles.
        
        STRATEGIC ARCHITECTURE (Based on MrBeast's "Inverted Production Model"):
        1. **GRADE 0 COMPREHENSION**: Use the simplest words possible. A child should understand it instantly. Monosyllabic words are preferred.
        2. **ACTIVE VOICE & I-STATEMENT**: Use "Active Voice" (e.g., "I Built...") and put the creator as the "Active Protagonist" (e.g., "I Spent 50 Hours...").
        3. **CURIOSITY GAP**: Create a cognitive tension that can only be resolved by clicking.
        4. **COSTLY SIGNALING**: Imply high stakes, massive effort, or extreme cost (e.g., "$1 vs $1,000,000").
        5. **SCALE SHOCK**: Use extreme numbers or "Extreme Digits" to shock the viewer.
        6. **CONCISE & CLEAR**: Keep titles under 60 characters to ensure they aren't cut off on mobile devices.
        7. **EMOTIONAL CONTRAST**: Contrast extreme emotions or situations (e.g., "Poor vs Rich", "Safe vs Dangerous").
        8. **INSTANT FULFILLMENT**: The title must be a "Promise" that the first 60 seconds of the video fulfills immediately.
        
        PATTERNS TO USE:
        - ($) Money Hook: "I Gave Away $1,000,000"
        - (X vs Y) Extreme Contrast: "$1 vs $1,000,000,000 Yacht!"
        - (Time/Endurance) Survival: "I Spent 50 Hours Buried Alive"
        - (Quantity/Novelty) Spectacle: "I Put 100 Million Orbeez In My Friend's Backyard"
        
        OUTPUT: Return a JSON array of 5 objects, each with "title" (the viral title) and "score" (predicted CTR percentage, 85-99).
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
        ROLE: World-Class YouTube Thumbnail Art Director & Prompt Engineer.
        MISSION: Take a raw video description and transform it into a high-quality, detailed visual prompt for an AI image generator.
        
        STRATEGY:
        1. **ENHANCE PERSONALITY**: Infuse the prompt with intense character emotions (grit, shock, determination).
        2. **ENHANCE STYLE**: Apply a viral, high-contrast visual style (cinematic lighting, 8K textures, Rule of Thirds).
        3. **COMPLETE THE PROMPT**: Add specific environmental details, lighting instructions, and composition rules.
        4. **TRANSLATION**: If the input is in ${lang}, translate the core concepts to English for the final prompt.
        
        RULES:
        - TEXT DISTILLATION: Extract a 1-3 word hook (e.g., "50 Hours", "$100k") from the description to place in the image. The visuals must explain the rest of the context.
        - Hyper-realistic, photorealistic, 8K resolution.
        - Focus on visual storytelling and "Curiosity Gap".
        - Max 60 words.
        
        OUTPUT: Return ONLY the enhanced English prompt.
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

const analysisCache = new Map<string, AnalysisResult>();

export const describeImage = async (base64: string, mime: string, lang: string): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime: cleanMime } = await prepareImageForAPI(base64, mime);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: cleanMime } }, 
                    { text: `Describe this YouTube thumbnail in extreme detail in ${lang}. Describe the lighting, colors, characters, facial expressions, background, text, and overall mood. Be as descriptive as possible.` }
                ] 
            },
            config: { 
                maxOutputTokens: 1024
            }
        });
        
        return response.text || "No description generated.";
    });
};

export const analyzeImage = async (base64: string, mime: string, mode: string, lang: string): Promise<AnalysisResult> => {
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

    // Simple cache key based on image data and mode/lang
    const cacheKey = `${base64.substring(0, 1000)}_${base64.length}_${mode}_${lang}`;
    if (analysisCache.has(cacheKey)) {
        console.log("Returning cached analysis result");
        return analysisCache.get(cacheKey)!;
    }

    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime: cleanMime } = await prepareImageForAPI(base64, mime);
        
        const systemInstruction = `
        ROLE: Elite YouTube Forensic Auditor & AI Predictor.
        MISSION: Analyze each provided image individually as a YouTube thumbnail based on advanced computer vision, behavioral psychology, and data analysis. You are feeding this detailed forensic information directly to the website so it understands exactly what is being done. The user will NOT use these images to generate new results like Masterpiece; your sole purpose is precise, forensic extraction of data.
        
        FORENSIC ANALYSIS PROTOCOL:
        - **ULTRA-DETAILED INSPECTION**: You must analyze every single pixel. If there is a tiny scratch on a face, a speck of dust on a hand, a slight wrinkle in clothing, or a minor reflection in an eye, you MUST identify and analyze it. Not a single ant will be missed in the image.
        - **DATA EXTRACTION**: The website will be fed a massive amount of information from your analysis. You must answer internal questions about these images (via the deep_analysis schema) to feed the website's understanding.
        - **TEXT FORENSICS**: Any text, no matter how small or stylized, must be read and analyzed for its psychological impact and readability.
        - **ANATOMICAL AUDIT**: Analyze skin texture, pore-level details, sweat, blood, dirt, exhaustion markers (dark circles, red eyes), tied up with rope, taped to walls/ceilings, or any physical imperfections.
        - **ENVIRONMENTAL AUDIT**: Analyze background elements, lighting leaks, shadows, and atmospheric effects (smoke, fire, rain, snow, dirt, grime, storm clouds, lasers, explosions, water reflections, molten lava, ice, hydraulic presses, space/stars, swarms of animals/insects, massive piles of objects, night vision, giant food pools, real life board games, military equipment/soldiers, burning rooms, underwater/submarines) with extreme precision.
        
        VIRAL PATTERN BENCHMARKS (INTERNAL KNOWLEDGE BASE):
        Evaluate the image against these high-performance archetypes:
        1. **Extreme Comparison**: (e.g., $1 vs $100M, 3100° Lava vs -420° Ice, $1 Car vs $100M Car). High contrast between "poor/broken" and "luxury/gold", or extreme physical properties.
        2. **The "Impossible" Trap/Survival**: (e.g., Spikes, Nuclear Bunker, Buried Alive, Trapped in Ice, Lost at Sea, Deserted Island, Red Circle, Space Station, Trapped in a plane). High biological stress response, claustrophobia, or danger.
        3. **Massive Wealth Hook**: (e.g., Biting stacks of money, Gold Plane, Private Island, Lottery Winner, Eating Gold, Gold Lamborghini/Mansion, Beast Bank, Free Money). Triggers aspiration and greed.
        4. **The "Free" Paradox**: (e.g., $0 Cars, Free Food/Restaurant, Everything Free Store). Triggers immediate skepticism and curiosity.
        5. **Gamification of Reality**: (e.g., Giant Monopoly, Squid Game, Tug of War with a giant). Familiar games scaled to extreme reality.
        6. **Heroic Scale**: (e.g., Standing on clouds, Jungle Explorer, Planting 20,000,000 Trees, Building 100 Houses, Building a massive island). Central subject dominating a vast, high-stakes environment or massive undertaking.
        7. **Endurance/Suffering**: (e.g., Chained together, Buried for days, Prison, Surviving 24 Hours in extreme conditions, Staying in a circle for 100 days, Riding a rollercoaster for days, Sitting in a toilet for days, Buried in noodles/Lego). Visual markers of extreme physical or mental toll.
        8. **Absurd Accumulation**: (e.g., Buying everything in a store, massive piles of cash/groceries/electronics/Lego). Overwhelming visual abundance.
        9. **The "Hidden Treasure" / Dumpster Diving**: (e.g., Finding iPhones in trash, Exploring an ancient tomb). High contrast between a dirty/low-value environment and high-value items.
        10. **The "Surprise Donation" / Philanthropy**: (e.g., Giving $100k to a streamer/homeless person, feeding a village, giving away a custom car, giving 1M food). Capturing genuine shock, life-changing moments, or massive scale charity.
        11. **The "Hunted" / Extreme Chase**: (e.g., Hunted by assassins/bounty hunters, FBI chase, Hunted by a tank). High tension, dynamic action, and expressions of fear/urgency.
        12. **The "Underdog" / Age Reversal**: (e.g., Competing against a 6-year-old, 1 vs 100 ages, 6 year old me vs adult me). Subverting expectations based on age or perceived ability.
        13. **The "Mystery Box" / The "Button"**: (e.g., Giant wooden crate with a question mark, a giant red button). Pure curiosity gap driven by an unknown object or the consequence of an action.
        14. **The "Massive Cleanup"**: (e.g., Cleaning the ocean/beach). Environmental scale, showing a huge problem and the effort to fix it.
        15. **The "Heist" / High Security**: (e.g., Dodging lasers to steal a diamond, Top Secret Vault, Breaking into a house). High stakes, precision, tension, and forbidden access.
        16. **The "Spectacle" / Absurd Scale**: (e.g., Covering a house in millions of lights, Giant Diamond Play Button, Real Life Willy Wonka Factory, Dropping a car on a train). Pure visual overload and absurdity.
        17. **The "Destruction" / Extreme Force**: (e.g., Shooting a yacht with a minigun, Crushing a Lamborghini in a hydraulic press, Dropping a car on a train). High energy, explosions, and chaotic action.
        18. **The "Phobia" Trigger**: (e.g., Bathtub full of snakes, Covered in Rats, Swimming with sharks). Direct targeting of primal human fears.
        19. **Lawlessness / Anarchy**: (e.g., "NO LAWS" sign in a wasteland). Triggers rebellion and curiosity about a world without rules.
        20. **The "Disguise" / Infiltration**: (e.g., Pretending to be a statue). Curiosity about whether the deception will work.
        21. **The "Oblivious" / Imminent Danger**: (e.g., Girl with headphones ignoring zombies behind her). High contrast between a calm subject and an extreme background threat.
        22. **The "Unlimited Power" / Blank Check**: (e.g., Giving a child a credit card). Triggers wish fulfillment and curiosity about the consequences.
        23. **The "Global Competition" / Olympics**: (e.g., Every country in the world competes). Massive scale, representation, and high stakes.
        24. **The "Disaster" / Mid-Air Emergency**: (e.g., Plane engine on fire). Extreme imminent danger and survival instincts.
        25. **The "Transformation"**: (e.g., Day 1 vs Day 200 weight loss). Extreme visual change over time.
        26. **The "Impossible Shot"**: (e.g., Dropping a basketball from a dam). Extreme precision and scale.
        27. **The "Crossover" / Collab**: (e.g., YouTube Rewind with many famous creators). High recognition and star power.
        28. **The "Defying Gravity" / Stuck**: (e.g., Taped to the ceiling).
        29. **The "Creator Collab" / All-Stars**: (e.g., Group shot of famous creators).
        30. **The "Unexpected Briefcase" / Public Surprise**: (e.g., Handing a briefcase of cash to a stranger).
        31. **The "Underwater Explorer" / Marine Life**: (e.g., Submarine with sea turtles).
        32. **The "Giant Board Game" / Real Life Battleship**: (e.g., Real ships exploding on a grid).
        33. **The "Giant Food Pool" / Edible Ocean**: (e.g., Swimming in cereal with a giant spoon).
        34. **The "Zero to Hero" / Massive Streamer Donation**: (e.g., $100k donation to a 0 viewer streamer).
        35. **The "Cash Mountain" / Million Dollar Stack**: (e.g., Standing next to a literal mountain of money).
        36. **The "Shark Swarm" / Stranded**: (e.g., On a small raft surrounded by sharks).
        37. **The "Assassin Attack" / Close Call**: (e.g., Attacked by a hitman with a knife).
        38. **The "Animal Swarm" / 100 Dogs**: (e.g., Surrounded by dozens of dogs).
        39. **The "Running Tally" / Massive Debt/Payment**: (e.g., Showing a huge exact dollar amount paid).
        40. **The "Red Circle" / Stay in the Circle**: (e.g., Pointing at a red circle on the ground).
        41. **The "Night Vision Terror" / Paranormal**: (e.g., Night vision camera with a ghost/monster behind).
        42. **The "Before & After" / Purification**: (e.g., Dirty water vs Clean water).
        43. **The "Holiday Hoard" / Massive Gifts**: (e.g., Buried in Christmas presents).
        44. **The "Time Lapse" / Day 1 vs Day 30**: (e.g., Showing the progression of a challenge over time).
        45. **The "Burning Room" / Tied Up**: (e.g., Tied up on the floor while the room is on fire).
        46. **The "Military Escort" / Army Collab**: (e.g., Surrounded by soldiers/military).
        47. **The "Massive Crowd Challenge"**: (e.g., 100 people in a giant red circle on a field).
        
        CRITICAL RULES:
        1. You cannot predict exact CTR. You provide a "Predicted Click Potential" score (0-100).
        2. Curiosity is a derived metric, calculated from contrast, object rarity, composition, and text pattern.
        3. You must evaluate "Viral Pattern Similarity" (how much it resembles top viral thumbnails like MrBeast's: big face, huge object, strong contrast, simple background).
        
        THE 8 PILLARS OF ANALYSIS:
        1. **Readability at Scale (وضوح التصغير)**: Does it remain clear at 15% size (mobile view)? Are edges sharp?
        2. **Visual Simplicity & Clutter (البساطة البصرية)**: Are there 3 or fewer main elements? Is there visual noise?
        3. **Color Contrast & Psychology (التباين اللوني)**: Is there a high contrast ratio (e.g., >4.5:1)? Does it use pop-out colors (Red/Yellow/Orange vs Dark)?
        4. **Facial Emotion (تعابير الوجه)**: Are faces visible? Do they show intense, exaggerated emotions (shock, joy, sadness, extreme pain/effort, genuine surprise, fear/panic, manic excitement, nausea, despair, extreme focus/tension, oblivious/calm vs danger, disgust/revulsion, extreme exhaustion)?
        5. **Visual Focus Point / Saliency (نقطة التركيز)**: Does the eye immediately go to the most important element?
        6. **Text Optimization (النص)**: Is the text 3-5 words max? Is it bold and highly contrasted?
        7. **Curiosity Gap (الفضول)**: Does the image create an information gap (hidden object, extreme comparison, visual question)?
        8. **Composition & Layout (التركيب)**: Does it follow the Rule of Thirds? Do leading lines or eye gaze point to the main subject/text?
        
        OUTPUT SCHEMA:
        {
            "visual_description": "A detailed description of what is actually in the image. Include forensic details like scratches, dust, dirt, sweat, or tiny imperfections found.",
            "ctr_score": 100, // This represents "Predicted Click Potential" (0-100)
            "pillars": [
                // Must include exactly these 8 pillars + 1 for Viral Pattern Similarity
                { "name": "Readability at Scale", "score": 80, "status": "High", "reasoning": "..." },
                { "name": "Visual Simplicity", "score": 40, "status": "Low", "reasoning": "..." },
                { "name": "Color Contrast", "score": 90, "status": "High", "reasoning": "..." },
                { "name": "Facial Emotion", "score": 70, "status": "Medium", "reasoning": "..." },
                { "name": "Visual Focus Point", "score": 85, "status": "High", "reasoning": "..." },
                { "name": "Text Optimization", "score": 60, "status": "Medium", "reasoning": "..." },
                { "name": "Curiosity Gap", "score": 95, "status": "High", "reasoning": "..." },
                { "name": "Composition & Layout", "score": 80, "status": "High", "reasoning": "..." },
                { "name": "Viral Pattern Similarity", "score": 88, "status": "High", "reasoning": "..." }
            ],
            "color_analysis": {
                "score": 75,
                "range": "50-75",
                "reasoning": "..."
            },
            "pros": ["List of 3-5 strengths"],
            "cons": ["List of 3-5 weaknesses (Actionable Feedback, e.g., 'Text has 8 words, reduce to 4')"],
            "extracted_prompt": "A prompt that could recreate this exact style.",
            "deep_analysis": [
                { "question": "Does this trigger a biological response?", "answer": "...", "category": "BIOLOGICAL" }
            ]
        }
        
        STRICTNESS: Be brutally honest. No humor. No fluff. If it's bad, say why it's bad.
        
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
                        extracted_prompt: { type: Type.STRING },
                        deep_analysis: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer: { type: Type.STRING },
                                    category: { type: Type.STRING }
                                }
                            }
                        }
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
            analysisCache.set(cacheKey, result);
        }
        return result;
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

export const enhancePrompt = async (rawPrompt: string, persona?: string, style?: string): Promise<string> => {
  return wrapGeminiCall(async () => {
      const ai = getClient();
      const personaObj = PERSONA_LIST.find(p => p.id === persona);
      const personaName = personaObj ? personaObj.name : "the main subject";
      const styleRule = (style && CHANNEL_STYLE_RULES[style]) ? CHANNEL_STYLE_RULES[style] : DEFAULT_STYLE;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `ROLE: World-Class YouTube Thumbnail Art Director.
        TASK: Take the user's raw description and transform it into a highly detailed, narrative, hyper-realistic visual prompt.
        
        USER DESCRIPTION: "${rawPrompt || "A viral high-stakes scene"}"
        IDENTIFIED PERSONA: ${personaName}
        IDENTIFIED STYLE: ${styleRule}
        
        INSTRUCTIONS:
        1. REPHRASE the description into a professional, cinematic visual prompt.
        2. INTEGRATE the persona and style naturally into the narrative. Do not just list them.
        3. ADD specific details: Describe intense facial expressions (grit, determination), cinematic lighting (rim lights, high contrast), and environmental textures (pore-level skin, 8K textures).
        4. EYE LOGIC: Explicitly state that the eyes of ${personaName} MUST look directly at the viewer with intense focus.
        5. COLOR LOGIC: If there are injuries or scars, they MUST be DEEP RED (blood-like). Never blue or yellow.
        6. HYPER-REALISM: Use words like "Masterpiece", "Hyper-realistic", "Photorealistic", "8K resolution".
        7. NO TEXT: Do not mention any text or words in the image.
        
        Return ONLY the enhanced English prompt. Max 60 words.`,
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
        const imageSize = '1K';
        
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        
        const upscaleInstruction = isLowRes ? "CRITICAL: This is a LOW RESOLUTION image. You MUST upscale it to 4K quality, sharpening every edge and enhancing every texture to pore-level detail." : "";

        const response = await ai.models.generateContent({
            model: model,
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: `MAGIC STUDIO MISSION: ${userInstruction || "Improve this image."}. 
                    ${upscaleInstruction}
                    ENHANCEMENT PROTOCOL:
                    - If 'Enhance Clarity' is requested: Increase local contrast and edge definition.
                    - If 'Enhance Sharpness' is requested: Sharpen textures and fine details.
                    - If 'Enhance Colors' is requested: Boost saturation and vibrancy while maintaining realism.
                    - If 'Restore Small Details' is requested: Reconstruct micro-textures and fine patterns.
                    - If 'Enhance Facial Details' is requested: Focus on eyes, skin texture, and facial features.
                    - If 'Remove Motion Blur' is requested: De-blur the image and stabilize edges.
                    - Transform into ULTRA HYPER-REALISTIC quality.
                    - 8K resolution, cinematic lighting, professional photography.
                    - Match the high-energy aesthetic of top YouTube creators like MrBeast.` }
                ] 
            },
            config: { imageConfig: { aspectRatio: '16:9', imageSize: imageSize as any } }
        });
        
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Magic Studio blocked by safety filters.");
        }

        for (const part of response.candidates?.[0]?.content?.parts || []) { 
            if (part.inlineData && part.inlineData.data) {
                return await resizeImageTo1280x720(part.inlineData.data, part.inlineData.mimeType || 'image/jpeg');
            }
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
            contents: { parts: [{ inlineData: { data, mimeType: mime } }, { text: "UPSCALE TO 4K. 16:9. Transform this image into a masterpiece of hyper-realism. Sharpen every edge, enhance every texture to pore-level detail, and ensure the lighting is cinematic and professional. The final result must be indistinguishable from a high-end photograph." }] },
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
        throw new Error("Upscale failed to produce an image.");
    });
};

export const oneClickFix = async (base64Image: string, mimeType: string, analysis: any): Promise<string> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const { data, mime } = await prepareImageForAPI(base64Image, mimeType);
        
        const lowPillars = analysis.pillars?.filter((p: any) => p.score < 95).map((p: any) => p.name) || [];
        const cons = analysis.cons?.join('. ') || "General optimization needed.";

        let surgicalInstructions = "";
        if (lowPillars.includes('Virality')) surgicalInstructions += "- VIRALITY FIX: Inject high-stakes visual storytelling. Add extreme weather (lightning, storms), massive wealth (piles of cash, gold), or a ticking countdown clock to create urgency.\n";
        if (lowPillars.includes('Clarity')) surgicalInstructions += "- CLARITY FIX: Aggressively simplify the background. Increase the subject size by 20%. Use a neon rim light (cyan or orange) to surgically separate the subject from the background.\n";
        if (lowPillars.includes('Idea')) surgicalInstructions += "- IDEA FIX: Sharpen the conflict. If it's a comparison, make the difference between sides extreme. Use 'Before vs After' or '$1 vs $100M' logic with massive visual disparity.\n";
        if (lowPillars.includes('Curiosity')) surgicalInstructions += "- CURIOSITY FIX: Add a 'Mystery Box'—an object partially obscured or a visual anomaly that defies logic, forcing the viewer to click to understand.\n";
        if (lowPillars.includes('Emotion')) surgicalInstructions += "- EMOTION FIX: Exaggerate facial expressions to 'Beast-level' intensity. Pupils should be dilated, sweat beads visible, and mouth expressions should be extreme (but no tongue visible).\n";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [
                    { inlineData: { data, mimeType: mime } },
                    { text: `ONE-CLICK VIRAL FIX MISSION: 
                    The objective is to push all 5 viral pillars (Virality, Clarity, Idea, Curiosity, Emotion) ABOVE 95%.
                    
                    CURRENT WEAKNESSES: ${lowPillars.join(', ')}.
                    SPECIFIC AUDIT ISSUES: ${cons}.
                    
                    SURGICAL ENGINEERING PROTOCOL:
                    ${surgicalInstructions || "- Overall Optimization: Apply the MasterPeace strategy to all elements for maximum CTR."}
                    
                    MASTER RULES:
                    - ULTRA-SATURATION: Boost colors to be vibrant and eye-catching.
                    - HIGH-KEY LIGHTING: Ensure the subject is perfectly lit with zero muddy shadows.
                    - SHARPENING: Every edge must be razor-sharp.
                    - HYPER-REALISM: Pore-level detail on skin, 8K cinematic textures.
                    - NO TEXT: Do not add any words or letters.
                    - The final result MUST be a viral masterpiece that commands attention on a mobile screen.` }
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
         parts.push({ text: `EDIT MISSION: ${prompt}. Ensure the output is hyper-realistic, photorealistic, and matches the original lighting perfectly.` });
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
        return ""; 
    });
};

export const generateBeastConcepts = async (idea: string, lang: string = 'Arabic'): Promise<BeastConcept[]> => {
    return wrapGeminiCall(async () => {
        const ai = getClient();
        const model = 'gemini-3-flash-preview';
        
        const systemInstruction = `
        ROLE: AI Orchestrator Agent (Beast Mode).
        MISSION: Transform a raw idea into 5 viral thumbnail concepts following MrBeast's "Conflict Engineering" and "Visual Psychology".
        
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
                        { text: "Transcribe the following audio into text accurately. You can handle any language spoken in the world, including Moroccan Arabic (Darija) or any other dialect. Transcribe it exactly in the original language spoken. Return the transcription as a single continuous paragraph without any artificial line breaks or forced newlines. Return ONLY the transcription text." }
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
