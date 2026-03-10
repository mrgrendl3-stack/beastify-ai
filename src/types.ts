
export type AppMode = 'PROMPT' | 'RECREATE' | 'EDIT' | 'TITLE' | 'ANALYZE' | 'MASTER_STRATEGY' | 'UPSCALE' | 'MAGIC_FIX' | 'MASTER_TITLES' | 'BEAST_MODE';
export type AnalysisMode = 'STRATEGY' | 'EXTRACT' | 'DESCRIPTION';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '3:4' | '4:3';

export interface ModeInputState {
  prompt: string;
  imageFile: File | null;
  imageUrl: string;
  preview: string | null;
  selectedPersona: string | null;
  selectedStyle: string | null;
  customFaceFile: File | null;
  customFacePreview: string | null;
  inspirationFiles: File[];
  inspirationPreviews: string[];
  useInspiration: boolean;
  isLowRes: boolean;
  youtubeUrl: string;
  inputType: 'UPLOAD' | 'URL';
  briefDescription: string;
}

export interface GeneratedImage {
  id: string;
  src: string;
  originalSrc?: string;
  prompt: string;
  timestamp: number;
  width?: number;
  height?: number;
  predictedCtr?: number;
  suggestedTitle?: string;
}

export interface HistoryItem extends GeneratedImage {
  mode: AppMode;
}

export interface AnalysisPillar {
    name: string;
    score: number; 
    reasoning: string;
    status: 'High' | 'Medium' | 'Low';
}

export interface DeepAnalysisItem {
    question: string;
    answer: string;
    category: 'BIOLOGICAL' | 'STATUS' | 'CURIOSITY' | 'FEAR' | 'DESIRE';
}

export interface AnalysisResult {
    visual_description: string;
    ctr_score: number;
    pillars: AnalysisPillar[];
    color_analysis?: {
        score: number;
        range: string;
        reasoning: string;
    };
    pros: string[];
    cons: string[];
    extracted_prompt?: string; 
    deep_analysis?: DeepAnalysisItem[];
}

export interface MasterStrategyResult {
    team1_analysis: any;
    team2_enhancement: any;
    team3_titles: string[];
    team4_thumbnail: any;
    team5_script: any;
    war_map_2026: any[];
    final_order: any;
}

export interface BeastConcept {
    id: string;
    title: string;
    description: string;
    conflict: string;
    emotion: string;
    result: string;
    target_audience: string;
    estimated_ctr: number;
    sketch_description: string;
}

export interface BeastVisualEngineering {
    eye_path: string;
    color_psychology: string;
    contrast_optimization: string;
    face_ratio: string;
    background_simplification: string;
}

export interface BeastSimulation {
    ctr_score: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string[];
}

export interface BeastModeResult {
    concepts: BeastConcept[];
    selectedConceptId?: string;
    engineering?: BeastVisualEngineering;
    simulation?: BeastSimulation;
    finalImage?: string;
}

export interface Persona {
    id: string;
    name: string;
    category: 'YOUTUBER' | 'CELEBRITY' | 'TECH' | 'POLITICS' | 'BUSINESS' | 'CUSTOM';
    imageUrl: string;
    youtubeUrl?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    images?: string[]; // base64 strings
    timestamp: number;
}

export interface StyleCategory {
    id: string;
    name: string;
    channels: { id: string; name: string; imageUrl: string; youtubeUrl: string; subscriberCount: number; styleGuidelines?: string }[];
}

export const STYLE_CATEGORIES: StyleCategory[] = [
    {
        id: 'health', name: 'Health & Fitness',
        channels: [
            { id: 'huberman', name: 'Huberman Lab', imageUrl: 'https://unavatar.io/youtube/hubermanlab', youtubeUrl: 'https://www.youtube.com/@hubermanlab', subscriberCount: 5000000, styleGuidelines: 'Dark background, high contrast red/blue lighting, serious scientific expression, minimal text, focus on anatomy or brain imagery.' },
            { id: 'doctormike', name: 'Doctor Mike', imageUrl: 'https://unavatar.io/youtube/doctormike', youtubeUrl: 'https://www.youtube.com/@DoctorMike', subscriberCount: 12000000, styleGuidelines: 'Bright studio lighting, wearing scrubs, expressive facial reactions (shock/smile), holding medical props, bold colorful text.' },
            { id: 'athleanx', name: 'ATHLEAN-X', imageUrl: 'https://unavatar.io/youtube/athleanx', youtubeUrl: 'https://www.youtube.com/@athleanx', subscriberCount: 13000000, styleGuidelines: 'High contrast gritty fitness lighting, shirtless showing muscles, red arrows pointing to muscle groups, bold yellow/white text, intense expression.' },
            { id: 'chloeting', name: 'Chloe Ting', imageUrl: 'https://unavatar.io/youtube/chloeting', youtubeUrl: 'https://www.youtube.com/@ChloeTing', subscriberCount: 25000000, styleGuidelines: 'Bright pastel colors, split screen before/after, fitness outfit, clear bold text indicating days or results, approachable smile.' },
            { id: 'drberg', name: 'Dr. Eric Berg', imageUrl: 'https://unavatar.io/youtube/drericberg', youtubeUrl: 'https://www.youtube.com/@drericbergdc', subscriberCount: 11000000, styleGuidelines: 'Whiteboard background or clean studio, holding a specific food item, pointing, large bold text with a question or shocking fact.' },
            { id: 'chrisheria', name: 'Chris Heria', imageUrl: 'https://unavatar.io/youtube/chrisheria', youtubeUrl: 'https://www.youtube.com/@CHRISHERIA', subscriberCount: 4000000, styleGuidelines: 'Urban or gym background, tattoos visible, dynamic action pose, high contrast, minimal text, moody lighting.' }
        ]
    },
    {
        id: 'beast_universe', name: 'The Beast Universe',
        channels: [
            { id: 'mrbeast', name: 'MrBeast', imageUrl: 'https://unavatar.io/youtube/MrBeast', youtubeUrl: 'https://www.youtube.com/@MrBeast', subscriberCount: 310000000, styleGuidelines: 'Extremely high contrast, highly saturated colors, big expressive face (shock/excitement), simple background, large bold text (3-4 words max), red arrows or circles.' },
            { id: 'mrbeast_gaming', name: 'MrBeast Gaming', imageUrl: 'https://unavatar.io/youtube/MrBeastGaming', youtubeUrl: 'https://www.youtube.com/@MrBeastGaming', subscriberCount: 45000000, styleGuidelines: 'Gaming context, high contrast, big expressive face, vibrant colors, Minecraft or GTA elements, bold text.' },
            { id: 'beast_reacts', name: 'Beast Reacts', imageUrl: 'https://unavatar.io/youtube/BeastReacts', youtubeUrl: 'https://www.youtube.com/@BeastReacts', subscriberCount: 35000000, styleGuidelines: 'Split screen or picture-in-picture, extreme reaction faces, colorful borders, high contrast.' },
            { id: 'beast_philanthropy', name: 'Beast Philanthropy', imageUrl: 'https://unavatar.io/youtube/BeastPhilanthropy', youtubeUrl: 'https://www.youtube.com/@BeastPhilanthropy', subscriberCount: 25000000, styleGuidelines: 'Heartwarming or shocking emotional faces, large scale charity context, bright lighting, hopeful colors.' },
            { id: 'mrbeast_2', name: 'MrBeast 2', imageUrl: 'https://unavatar.io/youtube/MrBeast2', youtubeUrl: 'https://www.youtube.com/@MrBeast2', subscriberCount: 40000000 },
            { id: 'mark_rober', name: 'Mark Rober', imageUrl: 'https://unavatar.io/youtube/MarkRober', youtubeUrl: 'https://www.youtube.com/@MarkRober', subscriberCount: 55000000, styleGuidelines: 'Engineering or science context, holding a gadget, bright colors, curious or excited expression, minimal text.' },
        ]
    },
    {
        id: 'challenge', name: 'Viral / Challenge',
        channels: [
            { id: 'airrack', name: 'Airrack', imageUrl: 'https://unavatar.io/youtube/airrack', youtubeUrl: 'https://www.youtube.com/@airrack', subscriberCount: 15000000 },
            { id: 'airrack_2', name: 'Airrack 2', imageUrl: 'https://unavatar.io/youtube/airrack2', youtubeUrl: 'https://www.youtube.com/@airrack2', subscriberCount: 2000000 },
            { id: 'ryan_trahan', name: 'Ryan Trahan', imageUrl: 'https://unavatar.io/youtube/ryantrahan', youtubeUrl: 'https://www.youtube.com/@ryantrahan', subscriberCount: 16500000 },
            { id: 'sidemen', name: 'Sidemen', imageUrl: 'https://unavatar.io/youtube/Sidemen', youtubeUrl: 'https://www.youtube.com/@Sidemen', subscriberCount: 21500000 },
            { id: 'dude_perfect', name: 'Dude Perfect', imageUrl: 'https://unavatar.io/youtube/dudeperfect', youtubeUrl: 'https://www.youtube.com/@dudeperfect', subscriberCount: 60000000 },
            { id: 'yes_theory', name: 'Yes Theory', imageUrl: 'https://unavatar.io/youtube/YesTheory', youtubeUrl: 'https://www.youtube.com/@YesTheory', subscriberCount: 8800000 },
        ]
    },
    {
        id: 'tech', name: 'Tech & Reviews',
        channels: [
            { id: 'mkbhd', name: 'MKBHD', imageUrl: 'https://unavatar.io/youtube/mkbhd', youtubeUrl: 'https://www.youtube.com/@mkbhd', subscriberCount: 19200000 },
            { id: 'mrwhosetheboss', name: 'Mrwhosetheboss', imageUrl: 'https://unavatar.io/youtube/mrwhosetheboss', youtubeUrl: 'https://www.youtube.com/@mrwhosetheboss', subscriberCount: 19400000 },
            { id: 'linus_tech_tips', name: 'Linus Tech Tips', imageUrl: 'https://unavatar.io/youtube/LinusTechTips', youtubeUrl: 'https://www.youtube.com/@LinusTechTips', subscriberCount: 15600000 },
            { id: 'unbox_therapy', name: 'Unbox Therapy', imageUrl: 'https://unavatar.io/youtube/unboxtherapy', youtubeUrl: 'https://www.youtube.com/@unboxtherapy', subscriberCount: 21000000 },
            { id: 'verge', name: 'The Verge', imageUrl: 'https://unavatar.io/youtube/theverge', youtubeUrl: 'https://www.youtube.com/@theverge', subscriberCount: 3400000 },
            { id: 'ijustine', name: 'iJustine', imageUrl: 'https://unavatar.io/youtube/ijustine', youtubeUrl: 'https://www.youtube.com/@ijustine', subscriberCount: 7100000 },
        ]
    },
    {
        id: 'gaming', name: 'Gaming Legends',
        channels: [
            { id: 'pewdiepie', name: 'PewDiePie', imageUrl: 'https://unavatar.io/youtube/pewdiepie', youtubeUrl: 'https://www.youtube.com/@pewdiepie', subscriberCount: 111000000 },
            { id: 'dream', name: 'Dream', imageUrl: 'https://unavatar.io/youtube/dream', youtubeUrl: 'https://www.youtube.com/@dream', subscriberCount: 31000000 },
            { id: 'markiplier', name: 'Markiplier', imageUrl: 'https://unavatar.io/youtube/markiplier', youtubeUrl: 'https://www.youtube.com/@markiplier', subscriberCount: 36000000 },
            { id: 'jacksepticeye', name: 'Jacksepticeye', imageUrl: 'https://unavatar.io/youtube/jacksepticeye', youtubeUrl: 'https://www.youtube.com/@jacksepticeye', subscriberCount: 30000000 },
            { id: 'technoblade', name: 'Technoblade', imageUrl: 'https://unavatar.io/youtube/technoblade', youtubeUrl: 'https://www.youtube.com/@technoblade', subscriberCount: 16000000 },
            { id: 'dantdm', name: 'DanTDM', imageUrl: 'https://unavatar.io/youtube/dantdm', youtubeUrl: 'https://www.youtube.com/@dantdm', subscriberCount: 28000000 },
        ]
    },
    {
        id: 'edu_doc', name: 'Edu & Documentary',
        channels: [
            { id: 'kurzgesagt', name: 'Kurzgesagt', imageUrl: 'https://unavatar.io/youtube/kurzgesagt', youtubeUrl: 'https://www.youtube.com/@kurzgesagt', subscriberCount: 22000000 },
            { id: 'veritasium', name: 'Veritasium', imageUrl: 'https://unavatar.io/youtube/veritasium', youtubeUrl: 'https://www.youtube.com/@veritasium', subscriberCount: 15000000 },
            { id: 'vsauce', name: 'Vsauce', imageUrl: 'https://unavatar.io/youtube/vsauce', youtubeUrl: 'https://www.youtube.com/@vsauce', subscriberCount: 21000000 },
            { id: 'wendover', name: 'Wendover Productions', imageUrl: 'https://unavatar.io/youtube/WendoverProductions', youtubeUrl: 'https://www.youtube.com/@WendoverProductions', subscriberCount: 4500000 },
            { id: 'reallifelore', name: 'RealLifeLore', imageUrl: 'https://unavatar.io/youtube/RealLifeLore', youtubeUrl: 'https://www.youtube.com/@RealLifeLore', subscriberCount: 7500000 },
            { id: 'polymatter', name: 'PolyMatter', imageUrl: 'https://unavatar.io/youtube/polymatter', youtubeUrl: 'https://www.youtube.com/@polymatter', subscriberCount: 1800000 },
        ]
    }
];

export const PERSONA_LIST: Persona[] = [
    { id: 'mrbeast', name: 'MrBeast', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/MrBeast', youtubeUrl: 'https://www.youtube.com/@MrBeast' },
    { id: 'elon_musk', name: 'Elon Musk', category: 'TECH', imageUrl: 'https://unavatar.io/twitter/elonmusk' },
    { id: 'bill_gates', name: 'Bill Gates', category: 'TECH', imageUrl: 'https://unavatar.io/twitter/BillGates' },
    { id: 'jeff_bezos', name: 'Jeff Bezos', category: 'TECH', imageUrl: 'https://unavatar.io/twitter/JeffBezos' },
    { id: 'mark_zuckerberg', name: 'Mark Zuckerberg', category: 'TECH', imageUrl: 'https://unavatar.io/instagram/zuck' },
    { id: 'pewdiepie', name: 'PewDiePie', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/pewdiepie' },
    { id: 'ronaldo', name: 'C. Ronaldo', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/twitter/Cristiano' },
    { id: 'messi', name: 'Lionel Messi', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/instagram/leomessi' },
    { id: 'taylor_swift', name: 'Taylor Swift', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/twitter/taylorswift13' },
    { id: 'the_rock', name: 'Dwayne Johnson', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/twitter/TheRock' },
    { id: 'gordon_ramsay', name: 'Gordon Ramsay', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/twitter/GordonRamsay' },
    { id: 'khaby_lame', name: 'Khaby Lame', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/instagram/khaby00' },
    { id: 'logan_paul', name: 'Logan Paul', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/loganpaul' },
    { id: 'jake_paul', name: 'Jake Paul', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/jakepaul' },
    { id: 'ksi', name: 'KSI', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/KSI' },
    { id: 'david_dobrik', name: 'David Dobrik', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/daviddobrik' },
    { id: 'emma_chamberlain', name: 'Emma Chamberlain', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/emmachamberlain' },
    { id: 'casey_neistat', name: 'Casey Neistat', category: 'YOUTUBER', imageUrl: 'https://unavatar.io/youtube/caseyneistat' },
    { id: 'mkbhd', name: 'MKBHD', category: 'TECH', imageUrl: 'https://unavatar.io/youtube/mkbhd' },
    { id: 'joe_rogan', name: 'Joe Rogan', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/instagram/joerogan' },
    { id: 'khabib', name: 'Khabib Nurmagomedov', category: 'CELEBRITY', imageUrl: 'https://unavatar.io/instagram/khabib_nurmagomedov' },
];
export const VIRAL_TEMPLATES: any[] = [];

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        };
        confetti: any;
    }
}
