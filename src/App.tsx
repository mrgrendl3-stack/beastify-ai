import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection'; 
import CinematicViewer from './components/SelectionStep'; 
import HistorySidebar from './components/DashboardStep'; 
import Loader from './components/Loader';
import AIChat from './components/AIChat';
import BeastModeUI from './components/BeastModeUI';
import ParticleBackground from './components/ParticleBackground';
import { AppMode, GeneratedImage, HistoryItem, AnalysisResult, AnalysisMode, MasterStrategyResult, BeastModeResult, BeastConcept, ModeInputState } from './types';
import { generateThumbnail, fileToBase64, urlToBase64, generateViralTitles, analyzeImage, generateMasterStrategy, editThumbnail, getPredictionScore, upscaleImage, magicFixImage, recreateThumbnail, generateMasterTitles, oneClickFix, enhanceAndCompletePrompt, generateBeastConcepts, engineerBeastVisual, simulateBeastCTR } from './services/geminiService';
import { fetchVideoTitle } from './services/youtubeService';
import { TextIcon, XMarkIcon, SparklesIcon, SearchIcon, EyeIcon, WandIcon } from './components/IconComponents';

const INITIAL_INPUT_STATE: ModeInputState = {
  prompt: '',
  imageFile: null,
  imageUrl: '',
  preview: null,
  selectedPersona: null,
  selectedStyle: null,
  customFaceFile: null,
  customFacePreview: null,
  inspirationFiles: [],
  inspirationPreviews: [],
  useInspiration: false,
  isLowRes: false,
  youtubeUrl: '',
  inputType: 'UPLOAD',
  briefDescription: ''
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('PROMPT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
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
    'BEAST_MODE': { ...INITIAL_INPUT_STATE }
  });
  const [resultsByMode, setResultsByMode] = useState<Record<AppMode, GeneratedImage[]>>({
    'PROMPT': [],
    'RECREATE': [],
    'ANALYZE': [],
    'TITLE': [],
    'MASTER_TITLES': [],
    'MAGIC_FIX': [],
    'UPSCALE': [],
    'MASTER_STRATEGY': [],
    'EDIT': [],
    'BEAST_MODE': []
  });
  const [analysisResultsByMode, setAnalysisResultsByMode] = useState<Record<string, AnalysisResult | null>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viralTitles, setViralTitles] = useState<{title: string, score: number}[]>([]);
  const [masterStrategy, setMasterStrategy] = useState<MasterStrategyResult | null>(null);
  const [beastModeResult, setBeastModeResult] = useState<BeastModeResult | null>(null);
  const [beastStage, setBeastStage] = useState<number>(0);
  const [lastAnalysisMode, setLastAnalysisMode] = useState<AnalysisMode>('STRATEGY');
  const [analyzedImagePreview, setAnalyzedImagePreview] = useState<string | null>(null);
  const [analyzedVideoTitle, setAnalyzedVideoTitle] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastParams, setLastParams] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCTRModal, setShowCTRModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const triggerCelebration = () => {
    if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#06b6d4', '#8b5cf6', '#d946ef'] });
    }
  };

  const handleGenerate = async (prompt: string, imageFile: File | null, imageUrl: string | null, persona?: string, style?: string, faceFile?: File, analysisMode?: AnalysisMode, language?: string, maskData?: string, useInspiration?: boolean, isLowRes?: boolean, inspirationFiles?: File[]) => {
    setError(''); setIsLoading(true); setAnalyzedVideoTitle(null);
    
    try {
        if (mode === 'BEAST_MODE') {
            setBeastStage(1);
            setLoadingMessage("🔥 ANALYZING CONFLICT & GENERATING CONCEPTS...");
            const concepts = await generateBeastConcepts(prompt, language);
            setBeastModeResult({ concepts });
            setBeastStage(2);
            setIsLoading(false);
            return;
        }

        if (mode === 'TITLE' || mode === 'MASTER_TITLES') {
             setLoadingMessage("ENGINEERING STRATEGIC TITLES...");
             const titles = await generateMasterTitles(prompt, language);
             setViralTitles(titles);
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
                // If it's a YouTube URL, fetch the title for analysis context
                if (imageUrl.includes('youtube.com') || imageUrl.includes('youtu.be')) {
                    fetchVideoTitle(imageUrl).then(t => {
                        if (t) setAnalyzedVideoTitle(t);
                    });
                }
                base64Image = await urlToBase64(imageUrl);
                previewSrc = imageUrl; 
             } catch (e) {
                 throw new Error("Could not process image URL. Please try uploading the image directly.");
             }
        }

        // 2. Resolve Inspiration Images
        let inspirationBase64s: string[] = [];
        if (inspirationFiles && inspirationFiles.length > 0) {
            inspirationBase64s = await Promise.all(inspirationFiles.map(f => fileToBase64(f)));
        }

        if (mode === 'MAGIC_FIX' || mode === 'UPSCALE') {
            setLoadingMessage(isLowRes ? "UPSCALING & FIXING..." : "EXECUTING MAGIC FIX...");
            if (!base64Image) throw new Error("No image provided for Magic Fix.");
            const fixedSrc = await magicFixImage(base64Image, mimeType, prompt, isLowRes);
            const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: fixedSrc, originalSrc: previewSrc, prompt: prompt || (isLowRes ? "4K Upscale & Fix" : "Magic Fix"), timestamp: Date.now(), predictedCtr: 100 }];
            setResultsByMode(prev => ({ ...prev, [mode]: imgBatch }));
            setHistory(prev => [{...imgBatch[0], mode}, ...prev]);
            triggerCelebration();
            setIsLoading(false);
            return;
        }

        if (mode === 'ANALYZE') {
             if (base64Image) {
                 setLoadingMessage("PERFORMING FORENSIC AUDIT...");
                 const result = await analyzeImage(base64Image, mimeType, analysisMode || 'STRATEGY', language!);
                 setAnalysisResultsByMode(prev => ({ ...prev, [previewSrc]: result }));
                 setAnalyzedImagePreview(previewSrc);
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
                 setIsLoading(false);
                 return;
             }
        }

        if (mode === 'MASTER_STRATEGY') {
            setLoadingMessage("BUILDING STRATEGY...");
            const strategy = await generateMasterStrategy(prompt, language!);
            setMasterStrategy(strategy);
            triggerCelebration();
            setIsLoading(false);
            return;
        }

        // --- SPLIT RECREATE & EDIT LOGIC ---
        if (mode === 'EDIT' || mode === 'RECREATE') {
            setLoadingMessage(maskData ? "INPAINTING..." : "REIMAGINING...");
            if (!base64Image) throw new Error("No base image provided.");

            let faceBase64 = undefined;
            if (faceFile) faceBase64 = await fileToBase64(faceFile);
            
            let resultSrc = "";

            if (maskData) {
                // MASK PRESENT -> Use 'Edit' (Inpainting)
                resultSrc = await editThumbnail(base64Image, mimeType, prompt, faceBase64, maskData);
            } else {
                // NO MASK -> Use 'Recreate' (Image-to-Image / Face Swap)
                const results = await recreateThumbnail(base64Image, mimeType, prompt, persona, faceBase64);
                if (results && results.length > 0) {
                    resultSrc = results[0];
                }
            }
            
            if (!resultSrc) throw new Error("Generation failed to produce an image.");

            setLastParams({ prompt, persona, baseImage: base64Image, mimeType, faceFile });
            const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: resultSrc, originalSrc: previewSrc, prompt, timestamp: Date.now(), predictedCtr: 100 }];
            setResultsByMode(prev => ({ ...prev, [mode]: imgBatch }));
            setHistory(prev => [{...imgBatch[0], mode}, ...prev]);
            setIsLoading(false);
            return;
        }

        if (mode === 'PROMPT') {
            setLoadingMessage("BEASTIFYING PROMPT...");
            const enhancedPrompt = await enhanceAndCompletePrompt(prompt, language!);
            setLoadingMessage("GENERATING VISUALS...");
            const { images: imgSrcs, suggestedTitle } = await generateThumbnail(enhancedPrompt, persona, style, base64Image, mimeType, useInspiration, inspirationBase64s);
            setLastParams({ prompt: enhancedPrompt, persona, style, base64Image, mimeType, useInspiration, inspirationBase64s });
            const newBatch: GeneratedImage[] = imgSrcs.map((src, idx) => ({ id: Date.now().toString() + idx, src, prompt: enhancedPrompt, timestamp: Date.now(), suggestedTitle, predictedCtr: 100 }));
            setResultsByMode(prev => ({ ...prev, [mode]: newBatch }));
            if (newBatch.length > 0) {
                setHistory(prev => [{...newBatch[0], mode}, ...prev]);
                triggerCelebration();
            }
            setIsLoading(false);
            return;
        }

        const { images: imgSrcs, suggestedTitle } = await generateThumbnail(prompt, persona, style, base64Image, mimeType, useInspiration, inspirationBase64s);
        setLastParams({ prompt, persona, style, base64Image, mimeType, useInspiration, inspirationBase64s });
        const newBatch: GeneratedImage[] = imgSrcs.map((src, idx) => ({ id: Date.now().toString() + idx, src, prompt, timestamp: Date.now(), suggestedTitle, predictedCtr: 100 }));
        setResultsByMode(prev => ({ ...prev, [mode]: newBatch }));
        if (newBatch.length > 0) {
            setHistory(prev => [{...newBatch[0], mode}, ...prev]);
            triggerCelebration();
        }

    } catch (err: any) { 
        console.error(err);
        const errorMsg = err.message || "Operation failed.";
        
        // Handle Permission/API Key errors by triggering the selector
        if (errorMsg.includes("ACCESS DENIED") || errorMsg.includes("permission") || errorMsg.includes("403")) {
          if (window.aistudio) {
            window.aistudio.openSelectKey();
          }
        }
        
        setError(errorMsg); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleOneClickFix = async () => {
    if (!currentAnalysisResult || !analyzedImagePreview) return;
    setIsLoading(true);
    setLoadingMessage("APPLYING ONE-CLICK VIRAL FIX...");
    try {
        let base64 = "";
        let mime = "image/jpeg";
        if (analyzedImagePreview.startsWith('data:')) {
            base64 = analyzedImagePreview.split(',')[1];
            mime = analyzedImagePreview.split(':')[1].split(';')[0];
        } else {
            base64 = await urlToBase64(analyzedImagePreview);
        }

        const fixedSrc = await oneClickFix(base64, mime, currentAnalysisResult);
        const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: fixedSrc, originalSrc: analyzedImagePreview, prompt: "One-Click Viral Fix", timestamp: Date.now(), predictedCtr: 100 }];
        setResultsByMode(prev => ({ ...prev, [mode]: imgBatch }));
        setHistory(prev => [{...imgBatch[0], mode: 'MAGIC_FIX'}, ...prev]);
        setAnalysisResultsByMode(prev => ({ ...prev, [analyzedImagePreview]: null }));
        triggerCelebration();
    } catch (err: any) {
        setError(err.message || "One-Click Fix failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSelectBeastConcept = async (concept: BeastConcept) => {
    if (!beastModeResult) return;
    setIsLoading(true);
    setBeastStage(3);
    setLoadingMessage("🧠 OPTIMIZING VISUAL PSYCHOLOGY...");
    try {
        const engineering = await engineerBeastVisual(concept);
        setBeastModeResult(prev => prev ? { ...prev, selectedConceptId: concept.id, engineering } : null);
        
        setBeastStage(4);
        setLoadingMessage("🔬 SIMULATING CTR PERFORMANCE...");
        const simulation = await simulateBeastCTR(concept, engineering);
        setBeastModeResult(prev => prev ? { ...prev, simulation } : null);
        
        setBeastStage(5);
        setLoadingMessage("🎨 GENERATING FINAL BEAST THUMBNAIL...");
        // Use the concept description and engineering rules for the final prompt
        const finalPrompt = `
            CONCEPT: ${concept.description}. 
            CONFLICT: ${concept.conflict}. 
            EMOTION: ${concept.emotion}. 
            ENGINEERING: ${engineering.eye_path}, ${engineering.color_psychology}, ${engineering.contrast_optimization}.
            STYLE: MrBeast Hyper-Realistic.
        `;
        const { images } = await generateThumbnail(finalPrompt);
        if (images && images.length > 0) {
            setBeastModeResult(prev => prev ? { ...prev, finalImage: images[0] } : null);
            const imgBatch: GeneratedImage[] = [{ id: Date.now().toString(), src: images[0], prompt: finalPrompt, timestamp: Date.now(), predictedCtr: simulation.ctr_score }];
            setResultsByMode(prev => ({ ...prev, BEAST_MODE: imgBatch }));
            setHistory(prev => [{...imgBatch[0], mode: 'BEAST_MODE'}, ...prev]);
            triggerCelebration();
        }
    } catch (err: any) {
        setError(err.message || "Beast Mode failed.");
    } finally {
        setIsLoading(false);
        setBeastStage(0);
    }
  };

  const currentImages = resultsByMode[mode] || [];
  const currentAnalysisResult = analyzedImagePreview ? analysisResultsByMode[analyzedImagePreview] : null;
  const realisticStats = currentAnalysisResult ? getPredictionScore(currentAnalysisResult.ctr_score) : { score: '0%', label: '', color: '', confidence: '' };

  const handleInputStateChange = useCallback((newState: ModeInputState) => {
    setInputStatesByMode(prev => ({ ...prev, [mode]: newState }));
  }, [mode]);

  return (
    <div className={`min-h-screen bg-black text-white transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'} relative overflow-hidden`}>
      <ParticleBackground />
      <div className="relative z-10">
        <Header onOpenHistory={() => setIsHistoryOpen(true)} onOpenAnalyze={() => setMode('ANALYZE')} notificationPermission={'default'} onRequestNotification={() => {}} />
        <main className="container mx-auto px-4 py-8 pb-32">
        {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-2xl mb-6 flex justify-between items-center"><span>{error}</span><button onClick={() => setError('')}><XMarkIcon className="w-5 h-5" /></button></div>}
        
        <div className={(isLoading && mode !== 'BEAST_MODE') ? 'opacity-50 pointer-events-none blur-sm' : ''}>
             <InputSection 
                mode={mode} 
                setMode={setMode} 
                onGenerate={handleGenerate} 
                isLoading={isLoading} 
                lastGeneratedImage={currentImages.length > 0 ? currentImages[0].src : undefined}
                predictedCtr={currentImages.length > 0 ? currentImages[0].predictedCtr : undefined}
                inputState={inputStatesByMode[mode]}
                onInputStateChange={handleInputStateChange}
             />
        </div>
        
        {isLoading && mode !== 'BEAST_MODE' && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md"><Loader message={loadingMessage} /></div>}
        
        <div className="mt-12 space-y-12">
            {mode === 'BEAST_MODE' && beastModeResult && (
                <BeastModeUI 
                    result={beastModeResult} 
                    stage={beastStage} 
                    onSelectConcept={handleSelectBeastConcept} 
                />
            )}

            {currentImages.length > 0 && mode !== 'BEAST_MODE' && (
                <div className="relative">
                    {/* FLOATING CTR BADGE */}
                    <button 
                        onClick={() => setShowCTRModal(true)}
                        className="absolute -top-6 left-4 z-30 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl hover:bg-white/10 hover:border-white/30 transition-all active:scale-95 group liquid-glass"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-white leading-none">
                                {currentImages[0].predictedCtr ? getPredictionScore(currentImages[0].predictedCtr).score : '100%'}
                            </span>
                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.2em] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Analyze</span>
                        </div>
                    </button>

                    <CinematicViewer 
                        key={currentImages[0]?.id || 'no-images'}
                        images={currentImages} 
                        onDelete={() => setResultsByMode(prev => ({ ...prev, [mode]: [] }))} 
                        onAnalyze={(img) => {
                            setMode('ANALYZE');
                            handleGenerate('', null, img.src, undefined, undefined, undefined, 'STRATEGY', 'Arabic');
                        }} 
                        onRegenerate={() => {
                            if (lastParams) {
                                handleGenerate(lastParams.prompt, null, lastParams.baseImage ? `data:${lastParams.mimeType};base64,${lastParams.baseImage}` : null, lastParams.persona, lastParams.style, undefined, undefined, undefined, undefined, lastParams.useInspiration, undefined, lastParams.inspirationFiles);
                            }
                        }} 
                        onZoom={(src) => {
                            setZoomedImage(src);
                            setShowZoomModal(true);
                        }}
                    />
                </div>
            )}

            {showCTRModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="glass-panel rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        <button 
                            onClick={() => setShowCTRModal(false)}
                            className="absolute top-8 right-8 z-50 p-3 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors shadow-2xl"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-400" />
                        </button>

                        <div className="p-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* IMAGE PREVIEW */}
                                <div className="space-y-6">
                                    <div className="aspect-video rounded-[2rem] overflow-hidden border-4 border-gray-800 shadow-2xl">
                                        <img src={currentImages[0].src} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Predicted Click Potential</span>
                                            <span className="text-5xl font-black text-white">{getPredictionScore(currentImages[0].predictedCtr || 100).score}</span>
                                        </div>
                                        <div className={`px-6 py-3 rounded-2xl border ${getPredictionScore(currentImages[0].predictedCtr || 100).color} font-black uppercase tracking-widest`}>
                                            {getPredictionScore(currentImages[0].predictedCtr || 100).label}
                                        </div>
                                        <div className="px-6 py-3 rounded-2xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest">
                                            Confidence: {getPredictionScore(currentImages[0].predictedCtr || 100).confidence}
                                        </div>
                                    </div>
                                </div>

                                {/* ANALYSIS CONTENT */}
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2">VIRAL AUDIT</h2>
                                        <p className="text-gray-500 text-sm leading-relaxed">
                                            This thumbnail has been analyzed using our proprietary Beast-Logic™ engine. Below is the breakdown of why this thumbnail is predicted to perform at this level.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {(currentAnalysisResult?.pillars?.length ?? 0) > 0 ? (
                                            currentAnalysisResult!.pillars.map((pillar, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pillar.name}</span>
                                                        <span className="text-sm font-black text-white">{pillar.score}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${pillar.score >= 95 ? 'bg-cyan-500' : pillar.score > 80 ? 'bg-green-500' : pillar.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                            style={{ width: `${pillar.score}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed italic">"{pillar.reasoning}"</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-400 leading-relaxed">
                                                {currentAnalysisResult?.visual_description}
                                            </div>
                                        )}
                                    </div>

                                    {!currentAnalysisResult && (
                                        <div className="p-8 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800 flex flex-col items-center justify-center text-center">
                                            <EyeIcon className="w-12 h-12 text-gray-700 mb-4" />
                                            <p className="text-gray-500 text-sm">Deep forensic data is being processed. Click "Analyze" below the image to generate a full report.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentAnalysisResult && showAnalysis && (
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative">
                    <button 
                        onClick={() => setShowAnalysis(false)}
                        className="absolute -top-4 -right-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors shadow-xl"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 glass-panel rounded-3xl p-8 border border-cyan-500/20">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <EyeIcon className="w-6 h-6 text-cyan-400" /> VISION AUDIT
                                    </h2>
                                    <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">Forensic Thumbnail Breakdown</p>
                                </div>
                                <div className={`px-6 py-3 rounded-2xl border ${realisticStats.color} flex flex-col items-center shadow-lg relative group cursor-help`}>
                                    <span className="text-3xl font-black leading-none">{realisticStats.score}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">{realisticStats.label}</span>
                                    
                                    {/* CTR TRUTH TOOLTIP */}
                                    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 bg-black/95 border border-gray-800 p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">PREDICTION CONFIDENCE</h4>
                                        <div className="space-y-2 text-[10px]">
                                            <div className="flex justify-between"><span>Confidence Level</span><span className="text-gray-400">{realisticStats.confidence}</span></div>
                                            <div className="pt-2 border-t border-white/10 mt-2 text-gray-500 italic">
                                                AI gives a Prediction Score, not a final verdict. Real performance must be validated via A/B testing.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(currentAnalysisResult?.pillars?.length ?? 0) > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                        {currentAnalysisResult!.pillars.map((pillar, idx) => (
                                            <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-gray-800 relative group">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pillar.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-black ${pillar.score >= 95 ? 'text-cyan-400' : pillar.score > 80 ? 'text-green-400' : pillar.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pillar.score}%</span>
                                                        {pillar.score < 95 && <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Target: 95%+</span>}
                                                    </div>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${pillar.score >= 95 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : pillar.score > 80 ? 'bg-green-500' : pillar.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pillar.score}%` }}></div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">{pillar.reasoning}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Viral Strengths</h4>
                                            {currentAnalysisResult.pros?.map((pro, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                                    <span className="text-green-500 mt-0.5">✓</span>
                                                    <span>{pro}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Critical Flaws</h4>
                                            {currentAnalysisResult.cons?.map((con, i) => (
                                                <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                                    <span className="text-red-500 mt-0.5">!</span>
                                                    <span>{con}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-400 leading-relaxed bg-black/40 p-6 rounded-2xl border border-gray-800">
                                    {currentAnalysisResult?.visual_description}
                                </div>
                            )}
                        </div>

                        {(currentAnalysisResult?.pillars?.length ?? 0) > 0 && (
                            <div className="space-y-6">
                                <div className="glass-panel rounded-3xl p-6 border border-purple-500/20 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" /> VIRAL OPTIMIZER
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-6 leading-relaxed relative z-10">
                                        Our AI detected critical improvements. Click below to surgically fix all pillars to <span className="text-cyan-400 font-black">95%+</span>.
                                    </p>
                                    <button 
                                        onClick={handleOneClickFix}
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 relative z-10 active:scale-95"
                                    >
                                        <WandIcon className="w-5 h-5" /> ONE-CLICK VIRAL FIX
                                    </button>
                                    
                                    {/* PILLAR STATUS INDICATOR */}
                                    <div className="mt-4 flex justify-center gap-1">
                                        {currentAnalysisResult!.pillars.map((p, i) => (
                                            <div key={i} className={`h-1 w-4 rounded-full ${p.score >= 95 ? 'bg-cyan-500' : 'bg-gray-800'}`}></div>
                                        ))}
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
            
            {viralTitles.length > 0 && (
                <div className="max-w-2xl mx-auto bg-[#0A0A0A] border border-pink-900/30 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-pink-500 mb-6 flex items-center gap-2"><TextIcon className="w-6 h-6" /> WINNING TITLES</h2>
                    <div className="space-y-3">
                        {viralTitles.map((t, i) => (
                            <div key={i} className="bg-[#111] p-4 rounded-2xl border border-gray-800 hover:border-pink-500 transition cursor-pointer group" onClick={() => { navigator.clipboard.writeText(t.title); alert("Copied!"); }}>
                                <div className="flex justify-between">
                                    <span className="group-hover:text-white transition-colors">{t.title}</span>
                                    <span className="text-xs text-gray-500 font-mono font-bold">{t.score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </main>
      
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onSelect={(item) => { setResultsByMode(prev => ({ ...prev, [item.mode]: [item] })); setMode(item.mode); setIsHistoryOpen(false); }} onClear={() => setHistory([])} />
      </div>
    </div>
  );
};

export default App;