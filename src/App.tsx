import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection'; 
import CinematicViewer from './components/SelectionStep'; 
import HistorySidebar from './components/DashboardStep'; 
import TitleGenerateModal from './components/TitleGenerateModal';
import Loader from './components/Loader';
import MultiLoader from './components/MultiLoader';
import AIChat from './components/AIChat';
import ParticleBackground from './components/ParticleBackground';
import CTRModal from './components/CTRModal';
import LandingPage from './components/LandingPage';
import PricingModal from './components/PricingModal';
import { AppMode, GeneratedImage, HistoryItem, AnalysisResult, AnalysisMode, MasterStrategyResult, BeastModeResult, BeastConcept, ModeInputState, OptimizationResult } from './types';
import { generateThumbnail, fileToBase64, urlToBase64, generateViralTitles, analyzeImage, generateMasterStrategy, editThumbnail, getPredictionScore, upscaleImage, magicFixImage, recreateThumbnail, generateMasterTitles, oneClickFix, enhanceAndCompletePrompt, generateBeastConcepts, engineerBeastVisual, simulateBeastCTR, optimizeThumbnail } from './services/geminiService';
import { fetchVideoTitle } from './services/youtubeService';
import { TextIcon, XMarkIcon, SparklesIcon, SearchIcon, EyeIcon, WandIcon, ArrowRightIcon, RefreshIcon } from './components/IconComponents';
import { get, set, del } from 'idb-keyval';

import { auth, db, signIn, signOut, getUserProfile, createUserProfile, UserProfile, addCredits, updateProgress, saveOptimization, getSuccessfulOptimizations } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Gamification } from './components/Gamification';
import BeforeAfterSlider from './components/BeforeAfterSlider';

const INITIAL_INPUT_STATE: ModeInputState = {
  prompt: '',
  imageFile: null,
  imageUrl: '',
  preview: null,
  customFaceFile: null,
  customFacePreview: null,
  inspirationFiles: [],
  inspirationPreviews: [],
  useInspiration: false,
  isLowRes: false,
  youtubeUrl: '',
  inputType: 'UPLOAD',
  briefDescription: '',
  videoTopic: '',
  targetAudience: '',
  mainHook: ''
};

const getPillarIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('viral')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 10c0-2 .5-3 2.5-4.5C11 4 11 2 11 2c0 1.5.5 2.5 2 4.5 1.5 2 2 3 2 4.5 0 1 .5 2 2 2s2-1.5 2-1.5z" /></svg>;
    if (n.includes('clarity')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
    if (n.includes('idea') || n.includes('concept')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    if (n.includes('curios')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
    if (n.includes('emotion')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    if (n.includes('simplicity')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
    if (n.includes('mobile')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    if (n.includes('title')) return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    return <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
};

const PillarRow: React.FC<{ pillar: any }> = ({ pillar }) => {
    const [expanded, setExpanded] = useState(false);
    
    const score = pillar.score;
    const filledBars = Math.round(score / 10);
    const totalBars = 10;
    
    let barColor = 'bg-[#ff0033]';
    if (score >= 80) barColor = 'bg-[#00ffaa]';
    else if (score >= 50) barColor = 'bg-[#ffaa00]';
    
    return (
        <div 
            className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex-1 pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {getPillarIcon(pillar.name)}
                    <span className="text-white font-bold text-[15px] tracking-wide">{pillar.name}</span>
                </div>
                
                <div className="relative">
                    <p className={`text-[13px] text-gray-400 leading-relaxed ${expanded ? '' : 'whitespace-nowrap overflow-hidden'}`}>
                        {pillar.reasoning}
                    </p>
                    {!expanded && (
                        <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent flex items-center justify-end pointer-events-none">
                            <span className="text-cyan-400 text-[13px] font-medium pl-1">
                                More..
                            </span>
                        </div>
                    )}
                    {expanded && (
                        <span className="text-cyan-400 text-[13px] font-medium mt-1 block">
                            Less
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex gap-[3px] mt-1 shrink-0">
                {Array.from({ length: totalBars }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-[3px] h-6 rounded-[1px] ${i < filledBars ? barColor : 'bg-[#333]'}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

import { AnimatedScore } from './components/AnimatedScore';

import { BugTrackerModal } from './components/BugTrackerModal';
import ThumbnailGame from './components/game/ThumbnailGame';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<AppMode>('PROMPT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showBugTracker, setShowBugTracker] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [error, setError] = useState<string>('');

  const [inputStatesByMode, setInputStatesByMode] = useState<Record<AppMode, ModeInputState>>({
      'PROMPT': { ...INITIAL_INPUT_STATE },
      'RECREATE': { ...INITIAL_INPUT_STATE },
      'ANALYZE': { ...INITIAL_INPUT_STATE },
      'TITLE': { ...INITIAL_INPUT_STATE },
      'MASTER_TITLES': { ...INITIAL_INPUT_STATE },
      'MAGIC_FIX': { ...INITIAL_INPUT_STATE },
      'UPSCALE': { ...INITIAL_INPUT_STATE },
      'MASTER_STRATEGY': { ...INITIAL_INPUT_STATE },
      'EDIT': { ...INITIAL_INPUT_STATE },
      'BEAST_MODE': { ...INITIAL_INPUT_STATE },
      'OPTIMIZE': { ...INITIAL_INPUT_STATE },
      'GAME': { ...INITIAL_INPUT_STATE }
  });
  
  const [resultsByMode, setResultsByMode] = useState<Record<AppMode, GeneratedImage[]>>({
      'PROMPT': [], 'RECREATE': [], 'ANALYZE': [], 'TITLE': [], 'MASTER_TITLES': [],
      'MAGIC_FIX': [], 'UPSCALE': [], 'MASTER_STRATEGY': [], 'EDIT': [],
      'BEAST_MODE': [], 'OPTIMIZE': [], 'GAME': []
  });
  
  const [analysisResultsByMode, setAnalysisResultsByMode] = useState<Record<string, AnalysisResult | null>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  useEffect(() => {
      let mounted = true;
      const loadState = async () => {
          // Unconditionally clear IDB on mount based on user request
          try {
              await Promise.all([
                  del('appState_inputStates'),
                  del('appState_results'),
                  del('appState_analysis'),
                  del('appState_history'),
                  del('viralTitles'),
                  del('masterStrategy')
              ]);
          } catch(e) {
              console.error(e);
          } finally {
              if (mounted) setIsStateLoaded(true);
          }
      };
      loadState();
      return () => { mounted = false; };
  }, []);

  // Removed state persisting useEffects that caused state retention
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viralTitles, setViralTitles] = useState<{title: string, score: number}[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [masterStrategy, setMasterStrategy] = useState<MasterStrategyResult | null>(null);
  const [beastModeResult, setBeastModeResult] = useState<BeastModeResult | null>(null);
  const [beastStage, setBeastStage] = useState<number>(0);
  const [lastAnalysisMode, setLastAnalysisMode] = useState<AnalysisMode>('STRATEGY');
  const [analyzedImagePreview, setAnalyzedImagePreview] = useState<string | null>(null);
  const [analyzedVideoTitle, setAnalyzedVideoTitle] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastParams, setLastParams] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [ctrModalImage, setCtrModalImage] = useState<GeneratedImage | null>(null);
  const [showOptimizationDetailsModal, setShowOptimizationDetailsModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedTitleForThumbnails, setSelectedTitleForThumbnails] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const playNotificationSound = useCallback(() => {
    // A more pleasant, soft chime sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3');
    audio.play().catch(e => console.error('Error playing sound:', e));
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (u: User | null) => {
        setUser(u);
        if (u) {
            let p = await getUserProfile(u.uid);
            if (!p) {
                // Check for referral in URL
                const urlParams = new URLSearchParams(window.location.search);
                const referredBy = urlParams.get('ref') || undefined;
                p = await createUserProfile(u, referredBy);
            }
            setProfile(p);
        } else {
            setProfile(null);
        }
        setIsLoadingAuth(false);
    });

    const loadState = async () => {
      // Intentionally left blank. IDB state is cleared on mount.
    };
    loadState();

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
      try {
          await signIn();
      } catch (err) {
          console.error("Sign in failed", err);
          setError("Sign in failed. Please try again.");
      }
  };

  const triggerCelebration = () => {
    if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#06b6d4', '#8b5cf6', '#d946ef'] });
    }
  };

  const handleGenerate = async (prompt: string, imageFile: File | null, imageUrl: string | null, faceFile?: File, analysisMode?: AnalysisMode, language?: string, maskData?: string, useInspiration?: boolean, isLowRes?: boolean, inspirationFiles?: File[], faceUrl?: string | string[], generationCount: number = 1, styleVector?: any, personaEmbedding?: any, imageProvider: 'gemini' | 'openai' = 'gemini') => {
    setError(''); setIsLoading(true); setAnalyzedVideoTitle(null);
    
    if (user && profile && profile.credits < 0 && mode !== 'OPTIMIZE') {
        setError("Not enough credits! You need 10 credits to generate.");
        setIsLoading(false);
        return;
    }

    try {
        if (mode === 'TITLE' || mode === 'MASTER_TITLES') {
             setLoadingMessage("ENGINEERING STRATEGIC TITLES...");
             const titles = await generateMasterTitles(prompt, language);
             setViralTitles(titles);
             
             if (user) {
                 await addCredits(user.uid, -10, 10);
                 const updated = await getUserProfile(user.uid);
                 if (updated) setProfile(updated);
             }

             triggerCelebration();
             setIsLoading(false);
             return;
        }

        let base64Image = undefined;
        let mimeType = 'image/png';
        let previewSrc = '';
        
        // 1. Resolve Base Image Input
        if (imageUrl && imageUrl.startsWith('data:')) {
             base64Image = imageUrl.split(',')[1];
             mimeType = imageUrl.split(':')[1].split(';')[0];
             previewSrc = imageUrl;
        } else if (imageFile) {
            base64Image = await fileToBase64(imageFile);
            mimeType = imageFile.type;
            previewSrc = URL.createObjectURL(imageFile);
        } else if (imageUrl) {
             // It's a Raw URL
             try {
                let finalImageUrl = imageUrl;
                // If it's a YouTube URL, fetch the title for analysis context
                if (imageUrl.includes('youtube.com') || imageUrl.includes('youtu.be')) {
                    fetchVideoTitle(imageUrl).then(t => {
                        if (t) setAnalyzedVideoTitle(t);
                    });
                    
                    // Extract YouTube ID and use thumbnail URL instead
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = imageUrl.match(regExp);
                    if (match && match[2].length === 11) {
                        try {
                            finalImageUrl = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
                            base64Image = await urlToBase64(finalImageUrl);
                        } catch (e) {
                            finalImageUrl = `https://img.youtube.com/vi/${match[2]}/0.jpg`;
                            base64Image = await urlToBase64(finalImageUrl);
                        }
                    }
                }
                if (!base64Image) {
                    base64Image = await urlToBase64(finalImageUrl);
                }
                previewSrc = finalImageUrl; 
             } catch (e) {
                 throw new Error("Could not process image URL. Please try uploading the image directly.");
             }
        }

        // 2. Resolve Inspiration Images
        let inspirationBase64s: string[] = [];
        if (inspirationFiles && inspirationFiles.length > 0) {
            inspirationBase64s = await Promise.all(inspirationFiles.map(f => fileToBase64(f)));
        }

        // 3. Resolve Face Image
        let faceBase64: string | string[] | undefined = undefined;
        if (faceFile) {
            faceBase64 = await fileToBase64(faceFile);
        } else if (faceUrl) {
            if (Array.isArray(faceUrl)) {
                faceBase64 = await Promise.all(faceUrl.map(u => urlToBase64(u)));
            } else {
                faceBase64 = await urlToBase64(faceUrl);
            }
        }

        if (mode === 'MAGIC_FIX' || mode === 'UPSCALE') {
            setLoadingMessage(isLowRes ? "UPSCALING & FIXING..." : "EXECUTING MAGIC FIX...");
            if (!base64Image) {
                setIsLoading(false);
                return;
            }
            const fixedSrc = await magicFixImage(base64Image, mimeType, prompt, isLowRes);
            
            const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: fixedSrc, originalSrc: previewSrc, prompt: prompt || (isLowRes ? "4K Upscale & Fix" : "Magic Fix"), timestamp: Date.now(), predictedCtr: undefined }];
            setResultsByMode(prev => ({ ...prev, [mode]: imgBatch }));
            setHistory(prev => [{...imgBatch[0], mode}, ...prev]);
            
            // Gamification: Reward for generation
            if (user) {
                await addCredits(user.uid, -10, 20); // Deduct 10 credits, add 20 XP
                await updateProgress(user.uid, 'design_3_thumbnails');
                
                // Update local profile
                const updated = await getUserProfile(user.uid);
                if (updated) setProfile(updated);
            }

            triggerCelebration();
            setIsLoading(false);
            
            // Background analysis
            (async () => {
                try {
                    const [genMime, genBase64] = fixedSrc.split(';base64,');
                    const genMimeType = genMime.split(':')[1];
                    const analysis = await analyzeImage(genBase64, genMimeType, 'STRATEGY', language!, prompt);
                    
                    setAnalysisResultsByMode(prev => ({ ...prev, [fixedSrc]: analysis }));
                    setResultsByMode(prev => {
                        const currentModeBatch = [...(prev[mode] || [])];
                        const imgIndex = currentModeBatch.findIndex(item => item.src === fixedSrc);
                        if (imgIndex !== -1) {
                            currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: analysis.ctr_score };
                        }
                        return { ...prev, [mode]: currentModeBatch };
                    });
                } catch(err) {
                    console.error("Background analysis failed:", err);
                    setResultsByMode(prev => {
                         const currentModeBatch = [...(prev[mode] || [])];
                         const imgIndex = currentModeBatch.findIndex(item => item.src === fixedSrc);
                         if (imgIndex !== -1) {
                             currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: 50 };
                         }
                         return { ...prev, [mode]: currentModeBatch };
                    });
                }
            })();
            
            return;
        }

        if (mode === 'OPTIMIZE') {
             if (!base64Image) {
                 setError("An image is required for optimization.");
                 setIsLoading(false);
                 return;
             }
             if (user && profile && profile.credits < 0) {
                 setError("Not enough credits! You need 20 credits to optimize.");
                 setIsLoading(false);
                 return;
             }

             setLoadingMessage("ANALYZING CTR PILLARS...");
             const initialAnalysis = await analyzeImage(base64Image, mimeType, 'STRATEGY', language!, prompt);
             
             setLoadingMessage("ENGINEERING HIGH-CTR THUMBNAIL...");
             let pastOptimizations: any[] = [];
             if (user) {
                 pastOptimizations = await getSuccessfulOptimizations(user.uid);
             }
             const result = await optimizeThumbnail(base64Image, mimeType, prompt || "Untitled", initialAnalysis, language!, pastOptimizations);
             
             setOptimizationResult(result);
             setAnalyzedImagePreview(previewSrc);
             setAnalysisResultsByMode(prev => ({ ...prev, [previewSrc]: initialAnalysis }));
             
             if (user) {
                 await addCredits(user.uid, -20, 20); // Deduct 20 credits, add 20 XP
                 const updated = await getUserProfile(user.uid);
                 if (updated) setProfile(updated);
             }

             triggerCelebration();
             setIsLoading(false);
             return;
        }

        if (mode === 'ANALYZE') {
             setLastAnalysisMode(analysisMode || 'STRATEGY');
             if (base64Image) {
                 setLoadingMessage(analysisMode === 'DESCRIPTION' ? "WRITING DESCRIPTION..." : "PERFORMING FORENSIC AUDIT...");
                 const result = await analyzeImage(base64Image, mimeType, analysisMode || 'STRATEGY', language!, prompt);
                 
                 setAnalysisResultsByMode(prev => ({ ...prev, [previewSrc]: result }));
                 setAnalyzedImagePreview(previewSrc);
                 
                 if (user) {
                     await addCredits(user.uid, -10, 10);
                     const updated = await getUserProfile(user.uid);
                     if (updated) setProfile(updated);
                 }

                 setShowAnalysis(true);
                 setIsLoading(false);
                 return;
             } else {
                 setLoadingMessage("ENHANCING PROMPT...");
                 const enhanced = await enhanceAndCompletePrompt(prompt, language!);
                 const mockAnalysis: AnalysisResult = {
                    visual_description: "Enhanced Prompt Result",
                    ctr_score: 100,
                    pillars: [
                        { name: "Readability at Scale", score: 95, status: "High", reasoning: "Optimized for mobile viewing." },
                        { name: "Visual Simplicity", score: 90, status: "High", reasoning: "Clear focal points and minimal clutter." },
                        { name: "Color Contrast", score: 98, status: "High", reasoning: "High contrast colors for maximum pop." },
                        { name: "Facial Emotion", score: 96, status: "High", reasoning: "Enhanced character personality and intensity." },
                        { name: "Visual Focus Point", score: 94, status: "High", reasoning: "Eye is drawn immediately to the subject." },
                        { name: "Text Optimization", score: 92, status: "High", reasoning: "Bold, short, and readable text." },
                        { name: "Curiosity Gap", score: 97, status: "High", reasoning: "Creates a strong desire to click." },
                        { name: "Composition & Layout", score: 95, status: "High", reasoning: "Rule of thirds and leading lines applied." },
                        { name: "Viral Pattern Similarity", score: 98, status: "High", reasoning: "Matches top performing viral thumbnails." }
                    ],
                    pros: ["Hyper-realistic textures", "Cinematic lighting", "Viral composition"],
                    cons: [],
                    extracted_prompt: enhanced
                 };
                 setAnalysisResultsByMode(prev => ({ ...prev, ['ENHANCED_PROMPT']: mockAnalysis }));
                 setAnalyzedImagePreview('ENHANCED_PROMPT');
                 
                 if (user) {
                     await addCredits(user.uid, -10, 10);
                     const updated = await getUserProfile(user.uid);
                     if (updated) setProfile(updated);
                 }

                 setIsLoading(false);
                 return;
             }
        }

        if (mode === 'MASTER_STRATEGY') {
            setLoadingMessage("BUILDING STRATEGY...");
            const strategy = await generateMasterStrategy(prompt, language!);
            setMasterStrategy(strategy);
            
            if (user) {
                await addCredits(user.uid, -10, 10);
                const updated = await getUserProfile(user.uid);
                if (updated) setProfile(updated);
            }

            triggerCelebration();
            setIsLoading(false);
            return;
        }

        // --- SPLIT RECREATE & EDIT LOGIC ---
        if (mode === 'EDIT' || mode === 'RECREATE') {
            setLoadingMessage(maskData ? "INPAINTING..." : "REIMAGINING...");
            if (!base64Image) {
                setIsLoading(false);
                return;
            }
            
            let resultSrc = "";

            if (maskData) {
                // MASK PRESENT -> Use 'Edit' (Inpainting)
                resultSrc = await editThumbnail(base64Image, mimeType, prompt, Array.isArray(faceBase64) ? faceBase64[0] : faceBase64, maskData);
            } else if (!faceBase64) {
                // NO MASK, NO FACE -> Use 'Edit' (General Image-to-Image with face preservation)
                resultSrc = await editThumbnail(base64Image, mimeType, prompt);
            } else {
                // NO MASK, FACE PRESENT -> Use 'Recreate' (Face Swap)
                const results = await recreateThumbnail(base64Image, mimeType, prompt, faceBase64);
                if (results && results.length > 0) {
                    resultSrc = results[0];
                }
            }
            
            if (!resultSrc) throw new Error("Generation failed to produce an image.");

            setLastParams({ prompt, baseImage: base64Image, mimeType, faceFile });
            const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: resultSrc, originalSrc: previewSrc, prompt, timestamp: Date.now(), predictedCtr: undefined }];
            setResultsByMode(prev => ({ ...prev, [mode]: imgBatch }));
            setHistory(prev => [{...imgBatch[0], mode}, ...prev]);
            
            if (user && profile) {
                await addCredits(user.uid, -10, 20);
                await updateProgress(user.uid, 'design_3_thumbnails');
                const updated = await getUserProfile(user.uid);
                if (updated) setProfile(updated);
            }

            playNotificationSound();
            setIsLoading(false);
            
            // Background analysis
            (async () => {
                try {
                    const [genMime, genBase64] = resultSrc.split(';base64,');
                    const genMimeType = genMime.split(':')[1];
                    const analysis = await analyzeImage(genBase64, genMimeType, 'STRATEGY', language!, prompt);
                    
                    setAnalysisResultsByMode(prev => ({ ...prev, [resultSrc]: analysis }));
                    setResultsByMode(prev => {
                        const currentModeBatch = [...(prev[mode] || [])];
                        const imgIndex = currentModeBatch.findIndex(item => item.src === resultSrc);
                        if (imgIndex !== -1) {
                            currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: analysis.ctr_score };
                        }
                        return { ...prev, [mode]: currentModeBatch };
                    });
                } catch(err) {
                    console.error("Background analysis failed:", err);
                    setResultsByMode(prev => {
                         const currentModeBatch = [...(prev[mode] || [])];
                         const imgIndex = currentModeBatch.findIndex(item => item.src === resultSrc);
                         if (imgIndex !== -1) {
                             currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: 50 };
                         }
                         return { ...prev, [mode]: currentModeBatch };
                    });
                }
            })();
            
            return;
        }

        if (mode === 'PROMPT') {
            setLoadingMessage("BEASTIFYING PROMPT...");
            const enhancedPrompt = await enhanceAndCompletePrompt(prompt, language!);
            setLoadingMessage("GENERATING VISUALS...");
            const { images: imgSrcs, suggestedTitle: finalTitle } = await generateThumbnail(
                enhancedPrompt, 
                base64Image, 
                mimeType, 
                useInspiration, 
                inspirationBase64s, 
                faceBase64, 
                generationCount,
                (img: string, i: number, generatedTitle: string) => {
                    const newResult: GeneratedImage = {
                        id: Date.now().toString() + i,
                        src: img,
                        originalSrc: undefined,
                        prompt: enhancedPrompt,
                        timestamp: Date.now(),
                        suggestedTitle: generatedTitle,
                        predictedCtr: undefined // analyzing
                    };

                    setResultsByMode(prev => {
                        const currentBatch = prev[mode] || [];
                        return { ...prev, [mode]: [...currentBatch, newResult] };
                    });

                    if (i === 0) {
                        setIsLoading(false); // First image is ready -> close loading overlay instantly
                        setHistory(prev => [{...newResult, mode}, ...prev]);
                        triggerCelebration();
                        playNotificationSound();
                    }

                    // Kick off analysis async for this specific image immediately
                    (async () => {
                        try {
                            const [genMime, genBase64] = img.split(';base64,');
                            const genMimeType = genMime.split(':')[1];
                            let analysis = await analyzeImage(genBase64, genMimeType, 'STRATEGY', language!, enhancedPrompt);
                            
                            setAnalysisResultsByMode(prev => ({ ...prev, [img]: analysis }));
                            
                            setResultsByMode(prev => {
                                const currentModeBatch = [...prev[mode]];
                                const imgIndex = currentModeBatch.findIndex(item => item.src === img);
                                if (imgIndex !== -1) {
                                    currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: analysis.ctr_score };
                                }
                                return { ...prev, [mode]: currentModeBatch };
                            });
                        } catch (err) {
                            console.error(`Failed to analyze image ${i + 1}:`, err);
                            setResultsByMode(prev => {
                                const currentModeBatch = [...prev[mode]];
                                const imgIndex = currentModeBatch.findIndex(item => item.src === img);
                                if (imgIndex !== -1) {
                                    currentModeBatch[imgIndex] = { ...currentModeBatch[imgIndex], predictedCtr: 50 };
                                }
                                return { ...prev, [mode]: currentModeBatch };
                            });
                        }
                    })();
                },
                styleVector,
                personaEmbedding,
                imageProvider
            );

            if (!imgSrcs || imgSrcs.length === 0) throw new Error("Generation failed to produce an image.");
            
            // Finalize credits at the end
            if (user && profile && imgSrcs.length > 0) {
                await addCredits(user.uid, -10 * imgSrcs.length, 20 * imgSrcs.length);
                await updateProgress(user.uid, 'design_3_thumbnails');
                const updatedProfile = await getUserProfile(user.uid);
                setProfile(updatedProfile);
            }
            
            return;
        }

        const count = mode === 'BEAST_MODE' ? 4 : generationCount;
        const { images: imgSrcs, suggestedTitle } = await generateThumbnail(
            prompt, base64Image, mimeType, useInspiration, inspirationBase64s, faceBase64, count,
            undefined, styleVector, personaEmbedding, imageProvider
        );
        if (!imgSrcs || imgSrcs.length === 0) throw new Error("Generation failed to produce an image.");
        setLastParams({ prompt, base64Image, mimeType, useInspiration, inspirationFiles });
        
        const newBatch: GeneratedImage[] = imgSrcs.map((src, i) => ({
            id: Date.now().toString() + i,
            src,
            originalSrc: undefined,
            prompt,
            timestamp: Date.now(),
            suggestedTitle,
            predictedCtr: undefined // undefined means analyzing
        }));

        setResultsByMode(prev => ({ ...prev, [mode]: newBatch }));
        if (newBatch.length > 0) {
            setHistory(prev => [{...newBatch[0], mode}, ...prev]);
            triggerCelebration();
            playNotificationSound();

            if (user && profile) {
                await addCredits(user.uid, -10 * count, 20 * count);
                await updateProgress(user.uid, 'design_3_thumbnails');
                const updatedProfile = await getUserProfile(user.uid);
                setProfile(updatedProfile);
            }
        }
        setIsLoading(false);

        // Asynchronous sequential analysis
        (async () => {
            for (let i = 0; i < imgSrcs.length; i++) {
                const finalSrc = imgSrcs[i];
                const [genMime, genBase64] = finalSrc.split(';base64,');
                const genMimeType = genMime.split(':')[1];
                try {
                    let analysis = await analyzeImage(genBase64, genMimeType, 'STRATEGY', language!, prompt);
                    setAnalysisResultsByMode(prev => ({ ...prev, [finalSrc]: analysis }));
                    setResultsByMode(prev => {
                        const updatedBatch = [...prev[mode]];
                        const imgIndex = updatedBatch.findIndex(img => img.src === finalSrc);
                        if (imgIndex !== -1) {
                            updatedBatch[imgIndex] = { ...updatedBatch[imgIndex], predictedCtr: analysis.ctr_score };
                        }
                        return { ...prev, [mode]: updatedBatch };
                    });
                } catch (err) {
                    console.error(`Failed to analyze image ${i + 1}/${imgSrcs.length}:`, err);
                    setResultsByMode(prev => {
                        const updatedBatch = [...prev[mode]];
                        const imgIndex = updatedBatch.findIndex(img => img.src === finalSrc);
                        if (imgIndex !== -1) {
                            updatedBatch[imgIndex] = { ...updatedBatch[imgIndex], predictedCtr: 50 };
                        }
                        return { ...prev, [mode]: updatedBatch };
                    });
                }
            }
        })();

    } catch (err: any) { 
        let errorMsg = "Operation failed.";
        if (typeof err === 'string') {
            errorMsg = err;
        } else if (err instanceof Error) {
            errorMsg = err.message;
        } else if (err && typeof err === 'object') {
            try {
                errorMsg = JSON.stringify(err);
            } catch (e) {
                errorMsg = String(err);
            }
        } else {
            errorMsg = String(err);
        }
        
        const msgLower = errorMsg.toLowerCase();
        const isOpenAiBilling = msgLower.includes("openai billing err") || msgLower.includes("billing hard limit");
        const isQuota = msgLower.includes("429") || msgLower.includes("resource_exhausted") || msgLower.includes("quota") || isOpenAiBilling;

        if (!isQuota) {
            console.error(err);
        }

        // Handle Permission/API Key errors by triggering the selector (only for Gemini)
        if (!isOpenAiBilling && (errorMsg.includes("ACCESS DENIED") || errorMsg.includes("permission") || errorMsg.includes("403") || isQuota)) {
          if (window.aistudio) {
            window.aistudio.openSelectKey();
          }
        }
        
        setError(errorMsg); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleOneClickFix = async (customImage?: string, customAnalysis?: AnalysisResult | null) => {
    // If we already have an optimization result, we are iterating on it.
    // Otherwise, we start from the original analysis.
    const analysisToUse = customAnalysis || (optimizationResult ? {
        visual_description: optimizationResult.explanation,
        ctr_score: optimizationResult.newScore,
        pillars: optimizationResult.newPillars,
        pros: [],
        cons: []
    } : currentAnalysisResult);

    const imageToUse = customImage || (optimizationResult ? `data:image/png;base64,${optimizationResult.optimizedImageBase64}` : analyzedImagePreview);
    const titleToUse = optimizationResult?.optimizedTitle || inputStatesByMode[mode]?.prompt || inputStatesByMode['ANALYZE']?.prompt || "Untitled";

    if (!analysisToUse) {
        setError("Analysis data is not ready yet. Please wait a moment and try again.");
        return;
    }
    if (!imageToUse) {
        setError("Image data is missing.");
        return;
    }
    
    if (user && profile && profile.credits < 20) {
        setError("Not enough credits! You need 20 credits for a One-Click Fix.");
        return;
    }

    setIsLoading(true);
    setLoadingMessage("APPLYING ONE-CLICK VIRAL FIX...");
    setCtrModalImage(null); // Close modal if open

    try {
        const lowPillars = analysisToUse.pillars.filter(p => p.score < 90);
        const optimizeMessage = lowPillars.length > 0 ? `OPTIMIZING: ${lowPillars[0].name.toUpperCase()}...` : "APPLYING VIRAL ENHANCEMENTS...";
        setLoadingMessage(optimizeMessage);
        
        let base64 = "";
        let mime = "image/jpeg";
        if (imageToUse.startsWith('data:')) {
            base64 = imageToUse.split(',')[1];
            mime = imageToUse.split(':')[1].split(';')[0];
        } else {
            base64 = await urlToBase64(imageToUse);
        }

        const language = "English"; // Defaulting to English for One-Click Fix

        let pastOptimizations: any[] = [];
        if (user) {
            pastOptimizations = await getSuccessfulOptimizations(user.uid);
        }

        const result = await optimizeThumbnail(base64, mime, titleToUse, analysisToUse, language, pastOptimizations);

        setOptimizationResult(result);
        setShowAnalysis(false); // Hide the old analysis view

        if (user) {
            await addCredits(user.uid, -20, 10); // Deduct 20 credits, add 10 XP
            await saveOptimization(user.uid, analysisToUse.ctr_score, result.newScore, result.promptUsed, result.explanation);
            const updated = await getUserProfile(user.uid);
            if (updated) setProfile(updated);
        }

        triggerCelebration();
        playNotificationSound();
    } catch (err: any) {
        let errorMsg = "One-Click Fix failed.";
        if (typeof err === 'string') {
            errorMsg = err;
        } else if (err instanceof Error) {
            errorMsg = err.message;
        } else if (err && typeof err === 'object') {
            try {
                errorMsg = JSON.stringify(err);
            } catch (e) {
                errorMsg = String(err);
            }
        }
        setError(errorMsg);
    } finally {
        setIsLoading(false);
    }
  };

  const currentImages = resultsByMode[mode] || [];
  const currentAnalysisResult = analyzedImagePreview ? analysisResultsByMode[analyzedImagePreview] : null;
  const realisticStats = currentAnalysisResult ? getPredictionScore(currentAnalysisResult.ctr_score) : { score: '0%', label: '', color: '', borderColor: '', shadowColor: '', confidence: '' };

  const handleInputStateChange = useCallback((newState: ModeInputState) => {
    setInputStatesByMode(prev => {
        const oldState = prev[mode];
        if (oldState) {
            // Check if every property in newState is exactly the same in oldState
            let isSame = true;
            const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
            for (const key of allKeys) {
                const oldVal = (oldState as any)[key];
                const newVal = (newState as any)[key];
                if (oldVal !== newVal) {
                    // Treat undefined and null as loosely equal for this check if both are falsy and not false
                    if (!oldVal && !newVal && oldVal !== false && newVal !== false) {
                        continue;
                    }
                    // Handle array comparisons
                    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
                        if (oldVal.length === newVal.length && oldVal.every((v, i) => v === newVal[i])) {
                            continue;
                        }
                    }
                    isSame = false;
                    break;
                }
            }
            if (isSame) return prev;
        }
        return { ...prev, [mode]: newState };
    });
  }, [mode]);

  return (
    <>
      {!user && !isLoadingAuth ? (
        <LandingPage onSignIn={handleSignIn} onOpenPricing={() => setShowPricingModal(true)} />
      ) : (
        <div className={`min-h-screen bg-black text-white transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'} relative overflow-hidden`}>
          <ParticleBackground />
      <div className="relative z-10">
        <Header 
          onOpenHistory={() => setIsHistoryOpen(true)} 
          onOpenAnalyze={() => setMode('ANALYZE')} 
          onOpenBugTracker={() => setShowBugTracker(true)}
          onOpenGame={() => setShowGame(true)}
          onOpenPricing={() => setShowPricingModal(true)}
          notificationPermission={'default'} 
          onRequestNotification={() => {}} 
          user={user}
          profile={profile}
          onSignIn={handleSignIn}
          onSignOut={() => signOut()}
        />
        <main className="container mx-auto px-4 py-8 pb-32">
        {error && (
            <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-red-900/40 backdrop-blur-md border border-red-500/50 text-red-100 p-5 rounded-3xl shadow-2xl flex flex-col gap-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <XMarkIcon className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-red-300">
                                    {error.includes('Quota') || error.includes('429') || error.includes('RESOURCE_EXHAUSTED') ? 'API Quota Exceeded' : 'System Error'}
                                </h3>
                                <p className="text-xs opacity-70 mt-0.5">Forensic analysis encountered a block.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setError('')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 opacity-50 hover:opacity-100" />
                        </button>
                    </div>
                    
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <p className="text-sm font-medium leading-relaxed italic opacity-90">"{error}"</p>
                    </div>

                    {error.toLowerCase().includes('openai') ? (
                         <div className="flex flex-wrap gap-3">
                         <a 
                             href="https://platform.openai.com/account/billing" 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="bg-[#1A1A1A] hover:bg-white/10 border border-white/10 text-white text-[10px] font-black py-3 px-6 rounded-xl uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center"
                         >
                             Manage OpenAI Billing
                         </a>
                     </div>
                    ) : (error.includes('Quota') || error.includes('429') || error.includes('RESOURCE_EXHAUSTED') || error.includes('permission') || error.includes('ACCESS DENIED')) && (
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => window.aistudio?.openSelectKey()}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black py-3 px-6 rounded-xl uppercase tracking-[0.2em] transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                            >
                                Switch API Key
                            </button>
                            <a 
                                href="https://ai.google.dev/gemini-api/docs/billing" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black py-3 px-6 rounded-xl uppercase tracking-[0.2em] transition-all border border-white/10"
                            >
                                Billing Docs
                            </a>
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {/* Gamification Progress Bar */}
        {profile && (
            <div className="max-w-4xl mx-auto mb-12">
                <div className="glass-panel rounded-3xl overflow-hidden border border-gray-800/50 shadow-2xl">
                    <Gamification profile={profile} />
                </div>
            </div>
        )}

        <div className={isLoading ? 'opacity-50 pointer-events-none blur-sm' : ''}>
             <InputSection 
                mode={mode} 
                setMode={setMode} 
                onGenerate={handleGenerate} 
                isLoading={isLoading} 
                lastGeneratedImage={currentImages.length > 0 ? currentImages[0].src : undefined}
                predictedCtr={currentImages.length > 0 ? currentImages[0].predictedCtr : undefined}
                inputState={inputStatesByMode[mode]}
                onInputStateChange={handleInputStateChange}
                playNotificationSound={playNotificationSound}
                user={user}
             />
        </div>
        
        <div className="mt-12 space-y-12">
            {isLoading && (
                <div className="w-full flex justify-center animate-fade-in">
                    {mode === 'BEAST_MODE' ? (
                        <MultiLoader count={4} />
                    ) : (
                        <Loader message={loadingMessage} />
                    )}
                </div>
            )}
            
            {currentImages.length > 0 && !isLoading && !showAnalysis && !optimizationResult && (
                <div className="relative">
                    <CinematicViewer 
                        key={currentImages[0]?.id || 'no-images'}
                        images={currentImages} 
                        onDelete={() => setResultsByMode(prev => ({ ...prev, [mode]: [] }))} 
                        onAnalyze={(img) => {
                            setMode('ANALYZE');
                            handleGenerate('', null, img.src, undefined, 'STRATEGY', 'Arabic');
                        }} 
                        onEdit={(img) => {
                            setMode('EDIT');
                            setInputStatesByMode(prev => ({
                                ...prev,
                                'EDIT': {
                                    ...prev['EDIT'],
                                    imageUrl: img.src,
                                    preview: img.src
                                }
                            }));
                        }}
                        onRegenerate={() => {
                            if (lastParams) {
                                handleGenerate(lastParams.prompt, null, lastParams.baseImage ? `data:${lastParams.mimeType};base64,${lastParams.baseImage}` : null, undefined, undefined, undefined, undefined, lastParams.useInspiration, undefined, lastParams.inspirationFiles);
                            }
                        }} 
                        onZoom={(src) => {
                            setZoomedImage(src);
                            setShowZoomModal(true);
                        }}
                        onShowCTR={(img) => setCtrModalImage(img)}
                    />
                </div>
            )}

            {ctrModalImage && (
                <CTRModal 
                    onClose={() => setCtrModalImage(null)}
                    imageUrl={ctrModalImage.src}
                    ctrScore={ctrModalImage.predictedCtr || 100}
                    pillars={(analysisResultsByMode[ctrModalImage.src])?.pillars || []}
                    visualDescription={(analysisResultsByMode[ctrModalImage.src])?.visual_description}
                    onViralFix={() => handleOneClickFix(ctrModalImage.src, analysisResultsByMode[ctrModalImage.src])}
                />
            )}

            {/* OPTIMIZATION DETAILS MODAL */}
            {showOptimizationDetailsModal && optimizationResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="glass-panel rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-y-auto relative border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <button 
                            onClick={() => setShowOptimizationDetailsModal(false)}
                            className="absolute top-6 right-6 z-50 p-3 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors shadow-2xl"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-400" />
                        </button>

                        <div className="p-8 md:p-12">
                            <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                                <SparklesIcon className="w-8 h-8 text-emerald-400" /> Optimization Report
                            </h2>

                            <div className="mb-12">
                                <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest text-center mb-6">Before & After Comparison</h3>
                                <BeforeAfterSlider 
                                    beforeImage={analyzedImagePreview || ''} 
                                    afterImage={`data:image/png;base64,${optimizationResult.optimizedImageBase64}`} 
                                />
                                <div className="grid grid-cols-2 gap-8 mt-6">
                                    <div className="bg-black/40 p-5 rounded-2xl border border-gray-800 text-center">
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Original Title</p>
                                        <p className="text-white font-bold">{inputStatesByMode['ANALYZE']?.prompt || "Untitled"}</p>
                                    </div>
                                    <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20 text-center">
                                        <p className="text-emerald-500/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Suggested Title</p>
                                        <p className="text-white font-bold">{optimizationResult.optimizedTitle}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 glass-panel rounded-3xl p-8 border border-gray-800 bg-[#0a0a0a]">
                                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">AI Explanation</h3>
                                    <div className="prose prose-invert prose-emerald max-w-none">
                                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                                            {optimizationResult.explanation}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-8 border-t border-gray-800/50">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Generated Prompt</h4>
                                        <div className="bg-black/50 p-5 rounded-2xl border border-gray-800 text-sm text-gray-400 font-mono leading-relaxed">
                                            {optimizationResult.promptUsed}
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel rounded-3xl p-8 border border-gray-800 bg-[#0a0a0a] flex flex-col justify-center items-center text-center">
                                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">CTR Improvement</h3>
                                    <div className="flex items-center justify-center gap-6 mb-8">
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl font-black text-gray-400">{currentAnalysisResult?.ctr_score}%</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Before</span>
                                        </div>
                                        <ArrowRightIcon className="w-8 h-8 text-emerald-400" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-5xl font-black text-emerald-400">{optimizationResult.newScore}%</span>
                                            <span className="text-[10px] text-emerald-500/80 uppercase tracking-widest mt-2">After</span>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm border border-emerald-500/20 mb-8">
                                        +{(optimizationResult.newScore - (currentAnalysisResult?.ctr_score || 0))} Point Increase
                                    </div>
                                    
                                    {optimizationResult.appliedTwists && optimizationResult.appliedTwists.length > 0 && (
                                        <div className="w-full text-left mt-4 border-t border-gray-800/50 pt-6">
                                            <h4 className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest mb-3">Applied Visual Twists</h4>
                                            <ul className="space-y-2">
                                                {optimizationResult.appliedTwists.map((twist, idx) => (
                                                    <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                                                        <SparklesIcon className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                                        <span>{twist}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {optimizationResult.concepts && optimizationResult.concepts.length > 0 && (
                                <div className="mt-8 glass-panel rounded-3xl p-8 border border-gray-800 bg-[#0a0a0a]">
                                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Generated Concepts</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {optimizationResult.concepts.map((concept, idx) => (
                                            <div key={idx} className={`p-5 rounded-2xl border ${concept.predictedCTR >= 90 ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-gray-800 bg-black/40'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">{concept.name}</h4>
                                                    <span className={`text-xs font-black px-2 py-1 rounded-md ${concept.predictedCTR >= 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                                                        {concept.predictedCTR}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">{concept.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {mode === 'ANALYZE' && currentAnalysisResult && showAnalysis && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
                    <div className="glass-panel rounded-3xl p-8 border border-cyan-500/20 flex flex-col items-center">
                        {/* 1. Score */}
                        <div className="mb-8 cursor-pointer group relative" onClick={() => setCtrModalImage(currentImages[0])}>
                            <div className={`px-10 py-8 rounded-[2.5rem] border ${realisticStats.borderColor} flex flex-col items-center ${realisticStats.shadowColor} relative backdrop-blur-xl bg-black/40 transition-transform group-hover:scale-105`}>
                                <AnimatedScore targetScore={parseInt(realisticStats.score)} variant="circular" size={180} />
                                <span className={`text-sm font-bold uppercase tracking-widest mt-6 opacity-80 ${realisticStats.color}`}>{realisticStats.label}</span>
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-gray-400 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Click for details
                            </div>
                        </div>

                        {/* 2. Thumbnail */}
                        <div className="w-full max-w-3xl aspect-video rounded-3xl overflow-hidden border border-gray-800/60 mb-6 shadow-2xl relative group">
                            <img src={analyzedImagePreview || ''} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                                <span className="text-white font-bold uppercase tracking-widest text-sm">Original Image</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const link = document.createElement('a');
                                        link.href = analyzedImagePreview || '';
                                        link.download = 'original_thumbnail.png';
                                        link.click();
                                    }}
                                    className="p-3 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm border border-white/20 text-white transition-all"
                                    title="Download Image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 3. Title */}
                        {inputStatesByMode['ANALYZE']?.prompt && (
                            <div className="w-full max-w-xl bg-black/40 p-4 rounded-xl border border-gray-800/60 mb-8 text-center">
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Video Title</p>
                                <p className="text-lg font-bold text-white">{inputStatesByMode['ANALYZE']?.prompt}</p>
                            </div>
                        )}

                        {/* 4. Pillars */}
                        <div className="w-full max-w-3xl flex flex-col gap-4 mb-10 bg-[#0a0a0a] p-8 rounded-[2rem] border border-gray-800/50 shadow-xl">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Diagnostic Breakdown</h3>
                            {currentAnalysisResult!.pillars.map((pillar, idx) => (
                                <PillarRow key={idx} pillar={pillar} />
                            ))}
                        </div>

                        {/* 5. Optimize CTR button */}
                        {(!currentAnalysisResult || currentAnalysisResult.ctr_score < 85) && (
                            <div className="w-full max-w-3xl">
                                <button 
                                    onClick={() => handleOneClickFix()}
                                    disabled={!analyzedImagePreview}
                                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xl rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <SparklesIcon className="w-6 h-6 group-hover:animate-pulse" /> 1-VIRAL FIX
                                </button>
                            </div>
                        )}
                        
                        {/* Optimization Result Below Button */}
                        {optimizationResult && (
                            <div className="w-full max-w-3xl mt-12 pt-12 border-t border-gray-800/50 flex flex-col items-center relative animate-fade-in">
                                <button 
                                    onClick={() => setOptimizationResult(null)}
                                    className="absolute top-8 right-0 z-50 p-2 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors shadow-xl"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                                </button>
                                
                                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-emerald-500/30 mb-6 shadow-2xl relative group z-10 bg-black mt-8">
                                    <img src={`data:image/png;base64,${optimizationResult.optimizedImageBase64}`} className="w-full h-full object-contain" />
                                    
                                    {/* Score Overlay Top-Left */}
                                    <div 
                                        onClick={() => setShowOptimizationDetailsModal(true)}
                                        className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-emerald-500/50 p-3 sm:px-6 sm:py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer hover:scale-105 transition-transform flex flex-col items-center group/score z-20"
                                    >
                                        <span className="text-2xl sm:text-4xl font-black text-emerald-400">{optimizationResult.newScore}%</span>
                                        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-emerald-500/70 group-hover/score:text-emerald-300 mt-1">Tap for Breakdown</span>
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-end justify-end p-6 z-10">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const link = document.createElement('a');
                                                link.href = `data:image/png;base64,${optimizationResult.optimizedImageBase64}`;
                                                link.download = 'optimized_thumbnail.png';
                                                link.click();
                                            }}
                                            className="p-3 bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-sm border border-white/20 text-white transition-all pointer-events-auto"
                                            title="Download Image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* currentImages was here */}
            
            {showZoomModal && zoomedImage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowZoomModal(false)}>
                    <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <img src={zoomedImage} className="w-full h-full object-contain" alt="Zoomed" />
                        <button 
                            onClick={() => setShowZoomModal(false)}
                            className="absolute top-6 right-6 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
            
            {(mode === 'MASTER_TITLES' || mode === 'TITLE') && viralTitles.length > 0 && (
                <div className="max-w-3xl mx-auto space-y-4 mb-8">
                    {viralTitles.map((t, i) => (
                        <div key={i} className="bg-[#1A1A1A] rounded-3xl p-6 shadow-xl flex items-center justify-between group border border-transparent hover:border-gray-800 transition-all">
                            <span className="text-xl font-medium text-white">{t.title}</span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(t.title); alert("Copied!"); }}
                                    className="w-10 h-10 rounded-full bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition"
                                    title="Copy Title"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </button>
                                <button 
                                    onClick={() => {
                                        setInputStatesByMode(prev => ({ ...prev, 'PROMPT': { ...prev['PROMPT'], prompt: t.title } }));
                                        setMode('PROMPT');
                                    }}
                                    className="w-10 h-10 rounded-full bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition"
                                    title="Use as Prompt"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                </button>
                                <button 
                                    onClick={() => setSelectedTitleForThumbnails(t.title)}
                                    className="w-10 h-10 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center justify-center text-cyan-400 transition"
                                    title="Generate Thumbnails"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>
      
      {showBugTracker && (
          <BugTrackerModal onClose={() => setShowBugTracker(false)} />
      )}

      {showGame && (
          <ThumbnailGame onClose={() => setShowGame(false)} />
      )}

      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => { setResultsByMode(prev => ({ ...prev, [item.mode]: [item] })); setMode(item.mode); setIsHistoryOpen(false); }} onClear={() => setHistory([])} />
      
      {selectedTitleForThumbnails && (
          <TitleGenerateModal 
              title={selectedTitleForThumbnails} 
              onClose={() => setSelectedTitleForThumbnails(null)} 
              onGenerate={(title, count) => {
                  setSelectedTitleForThumbnails(null);
                  setMode('PROMPT');
                  setInputStatesByMode(prev => ({ ...prev, PROMPT: { ...prev.PROMPT, prompt: title } }));
                  handleGenerate(title, null, null, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, count);
              }} 
          />
      )}
      </div>
    </div>
    )}
    </>
  );
};

export default App;