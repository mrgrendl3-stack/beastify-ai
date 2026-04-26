
export type AppMode = 'PROMPT' | 'RECREATE' | 'EDIT' | 'TITLE' | 'ANALYZE' | 'MASTER_STRATEGY' | 'UPSCALE' | 'MAGIC_FIX' | 'MASTER_TITLES' | 'OPTIMIZE' | 'BEAST_MODE' | 'GAME';
export type AnalysisMode = 'STRATEGY' | 'EXTRACT' | 'DESCRIPTION';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '3:4' | '4:3';

export interface ModeInputState {
  prompt: string;
  imageFile: File | null;
  imageUrl: string;
  preview: string | null;
  customFaceFile: File | null;
  customFacePreview: string | null;
  inspirationFiles: File[];
  inspirationPreviews: string[];
  useInspiration: boolean;
  isLowRes: boolean;
  youtubeUrl: string;
  inputType: 'UPLOAD' | 'URL';
  briefDescription: string;
  videoTitle?: string;
  selectedPersona?: string | null;
  videoTopic?: string;
  targetAudience?: string;
  mainHook?: string;
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
    details?: {
        observation: string;
        impact: string;
        judgement: string;
        fix: string;
    };
}

export interface DeepAnalysisItem {
    question: string;
    answer: string;
    category: 'BIOLOGICAL' | 'STATUS' | 'CURIOSITY' | 'FEAR' | 'DESIRE';
}

export interface OptimizationConcept {
    name: string;
    description: string;
    predictedCTR: number;
}

export interface OptimizationResult {
    optimizedImageBase64: string;
    optimizedTitle?: string;
    explanation: string;
    promptUsed: string;
    newScore: number;
    newPillars: AnalysisPillar[];
    concepts?: OptimizationConcept[];
    appliedTwists?: string[];
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

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    images?: string[]; // base64 strings
    timestamp: number;
}

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
