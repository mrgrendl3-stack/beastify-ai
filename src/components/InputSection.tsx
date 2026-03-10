
import React, { useState, useRef, useEffect } from 'react';
import { 
    PenIcon, RecycleIcon, TextIcon, EyeIcon, WandIcon, 
    UploadIcon, LinkIcon, PersonIcon, StyleIcon, BrainIcon,
    SquareIcon, BrushIcon, EraserIcon, UndoIcon, RedoIcon, SparklesIcon, TrashIcon,
    PaletteIcon, LassoIcon, CurveIcon, YouTubeIcon, BucketIcon, HdIcon, MagicIcon,
    TargetIcon, LightBulbIcon, XMarkIcon, GridIcon, MicrophoneIcon, StopIcon,
    SettingsIcon, AdjustmentsIcon, RefreshIcon, SearchIcon
} from './IconComponents';
import { AppMode, PERSONA_LIST, STYLE_CATEGORIES, AnalysisMode, ModeInputState } from '../types';
import { enhancePrompt, editThumbnail, fileToBase64, urlToBase64, transcribeAudio } from '../services/geminiService';
import { fetchSingleChannelStat } from '../services/youtubeService';

interface InputSectionProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onGenerate: (prompt: string, imageFile: File | null, imageUrl: string | null, persona?: string, style?: string, faceFile?: File, analysisMode?: AnalysisMode, language?: string, maskData?: string, useInspiration?: boolean, isLowRes?: boolean, inspirationFiles?: File[]) => void;
  isLoading: boolean;
  lastGeneratedImage?: string;
  predictedCtr?: number;
  inputState: ModeInputState;
  onInputStateChange: (newState: ModeInputState) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ mode, setMode, onGenerate, isLoading, lastGeneratedImage, predictedCtr, inputState, onInputStateChange }) => {
  const [prompt, setPrompt] = useState(inputState?.prompt || '');
  const [imageFile, setImageFile] = useState<File | null>(inputState?.imageFile || null);
  const [imageUrl, setImageUrl] = useState(inputState?.imageUrl || '');
  const [inputType, setInputType] = useState<'UPLOAD' | 'URL'>(inputState?.inputType || 'UPLOAD');
  const [preview, setPreview] = useState<string | null>(inputState?.preview || null);
  const [ratioError, setRatioError] = useState<string | null>(null);

  const [showFaceMenu, setShowFaceMenu] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(inputState?.youtubeUrl || '');
  const [showEnhanceIcon, setShowEnhanceIcon] = useState(false);
  const [briefDescription, setBriefDescription] = useState(inputState?.briefDescription || '');
  const [analyzeStep, setAnalyzeStep] = useState<'NONE' | 'DESCRIBE' | 'ANALYZE'>('NONE');

  const lastProcessedImageRef = useRef<string | undefined>(undefined);

  const [selectedPersona, setSelectedPersona] = useState<string | null>(inputState.selectedPersona || null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(inputState.selectedStyle || null);
  const [customFaceFile, setCustomFaceFile] = useState<File | null>(inputState.customFaceFile || null);
  const [customFacePreview, setCustomFacePreview] = useState<string | null>(inputState.customFacePreview || null);
  const [useInspiration, setUseInspiration] = useState(inputState.useInspiration || false); 
  
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('EXTRACT');
  const [selectedLanguage, setSelectedLanguage] = useState('Arabic');
  const [isLowRes, setIsLowRes] = useState(inputState.isLowRes || false);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>(inputState.inspirationFiles || []);
  const [inspirationPreviews, setInspirationPreviews] = useState<string[]>(inputState.inspirationPreviews || []);

  // Sync internal state with inputState prop when mode changes
  useEffect(() => {
    setPrompt(inputState.prompt || '');
    setImageFile(inputState.imageFile || null);
    setImageUrl(inputState.imageUrl || '');
    setInputType(inputState.inputType || 'UPLOAD');
    setPreview(inputState.preview || null);
    setYoutubeUrl(inputState.youtubeUrl || '');
    setSelectedPersona(inputState.selectedPersona || null);
    setSelectedStyle(inputState.selectedStyle || null);
    setCustomFaceFile(inputState.customFaceFile || null);
    setCustomFacePreview(inputState.customFacePreview || null);
    setUseInspiration(inputState.useInspiration || false);
    setInspirationFiles(inputState.inspirationFiles || []);
    setInspirationPreviews(inputState.inspirationPreviews || []);
    setIsLowRes(inputState.isLowRes || false);
    setBriefDescription(inputState.briefDescription || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Update parent state whenever internal state changes
  useEffect(() => {
    onInputStateChange({
      prompt,
      imageFile,
      imageUrl,
      inputType,
      preview,
      youtubeUrl,
      selectedPersona,
      selectedStyle,
      customFaceFile,
      customFacePreview,
      useInspiration,
      inspirationFiles,
      inspirationPreviews,
      isLowRes,
      briefDescription
    });
  }, [prompt, imageFile, imageUrl, inputType, preview, youtubeUrl, selectedPersona, selectedStyle, customFaceFile, customFacePreview, useInspiration, inspirationFiles, inspirationPreviews, isLowRes, briefDescription, onInputStateChange]);

  // Conversational Workflow: Sync preview with last generated image
  useEffect(() => {
    if (lastGeneratedImage && lastGeneratedImage !== lastProcessedImageRef.current) {
        // Only auto-update preview if we are NOT in a mode that relies on a stable source image (like Face Swap or Edit)
        // This ensures the original uploaded image stays as the source for multiple iterations.
        if (mode !== 'RECREATE' && mode !== 'EDIT') {
            setPreview(lastGeneratedImage);
            setImageFile(null); // Clear the file so we use the URL/Base64 from now on
            setImageUrl('');
        }
        lastProcessedImageRef.current = lastGeneratedImage;
    }
  }, [lastGeneratedImage, mode]);
  
  const [titleArchetype, setTitleArchetype] = useState('EXTREME_CONTRAST');
  
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showMagicFixSettings, setShowMagicFixSettings] = useState(false);
  const [magicFixOptions, setMagicFixOptions] = useState<string[]>([]);
  const [activeStyleTab, setActiveStyleTab] = useState(STYLE_CATEGORIES[0].id);

  const [realCounts, setRealCounts] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // useEffect(() => { setPrompt(''); setRatioError(null); }, [mode]); // REMOVED: Don't reset prompt on mode change

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording or is blocking it in this context.");
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setIsTranscribing(true);
            try {
                const base64 = await fileToBase64(new File([audioBlob], "audio.webm", { type: 'audio/webm' }));
                const transcription = await transcribeAudio(base64, 'audio/webm');
                setPrompt((prev: string) => prev ? `${prev} ${transcription}` : transcription);
            } catch (e) {
                console.error("Transcription failed", e);
                alert("Transcription failed. Please try again.");
            } finally {
                setIsTranscribing(false);
            }
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTimeLeft(60);

        countdownIntervalRef.current = setInterval(() => {
            setRecordingTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Set 1-minute time limit
        recordingTimerRef.current = setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, 60000);

    } catch (err: any) {
        console.error("Error accessing microphone", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert("Microphone access denied. Please allow microphone permissions in your browser settings for this site.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            alert("No microphone found. Please connect a microphone and try again.");
        } else {
            alert("Could not access microphone: " + (err.message || "Unknown error"));
        }
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
    }
    setRecordingTimeLeft(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  useEffect(() => {
      if (showStyleModal) {
          const fetchStatsForTab = async () => {
              const category = STYLE_CATEGORIES.find(c => c.id === activeStyleTab);
              if (!category) return;
              setLoadingStats(true);
              for (const channel of category.channels) {
                   const count = await fetchSingleChannelStat(channel.youtubeUrl);
                   if (count !== null) setRealCounts(prev => ({...prev, [channel.id]: count}));
              }
              setLoadingStats(false);
          };
          fetchStatsForTab();
      }
  }, [showStyleModal, activeStyleTab]);

  const validateImageRatio = (fileOrUrl: string | File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (mode === 'MAGIC_FIX' || mode === 'UPSCALE') return resolve(true);
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ratio - (16/9)) > 0.15) {
          setRatioError("🚨 16:9 thumbnails ONLY for this mode.");
          setPreview(null);
          setImageFile(null);
          resolve(false);
        } else { setRatioError(null); resolve(true); }
      };
      img.src = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && await validateImageRatio(file)) {
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
        setInputType('UPLOAD');
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) return;
    try {
      const base64 = await urlToBase64(imageUrl);
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      if (await validateImageRatio(dataUrl)) {
        setPreview(dataUrl);
        setInputType('UPLOAD');
      }
    } catch (e) { alert("Error loading URL"); }
  };

  const handleFaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setCustomFaceFile(file);
          setCustomFacePreview(URL.createObjectURL(file));
          setSelectedPersona('CUSTOM');
          setShowPersonaModal(false);
      }
  };

  const handleEnhance = async () => {
      setIsEnhancing(true);
      try {
        const enhanced = await enhancePrompt(prompt || "Generate a random viral YouTube thumbnail idea", selectedPersona || undefined, selectedStyle || undefined);
        setPrompt(enhanced);
        setShowEnhanceIcon(false);
      } catch (e) { console.error(e); } finally { setIsEnhancing(false); }
  };

  const handleInspirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
        setInspirationFiles(prev => [...prev, ...files].slice(0, 4));
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setInspirationPreviews(prev => [...prev, ...newPreviews].slice(0, 4));
    }
  };

  const removeInspiration = (index: number) => {
    setInspirationFiles(prev => prev.filter((_, i) => i !== index));
    setInspirationPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleTriggerGenerate = () => {
    if (!prompt.trim() && mode === 'PROMPT') {
        setShowEnhanceIcon(true);
        return;
    }
    let finalPrompt = prompt;
    if (mode === 'MAGIC_FIX') {
        finalPrompt = magicFixOptions.join(', ');
    }
    
    // Combine brief description with prompt if present
    if (briefDescription.trim()) {
        finalPrompt = finalPrompt ? `${finalPrompt}. Additional instruction: ${briefDescription}` : briefDescription;
    }

    onGenerate(finalPrompt, imageFile, preview || imageUrl || (youtubeUrl ? youtubeUrl : null), selectedPersona || undefined, selectedStyle || undefined, customFaceFile || undefined, analysisMode, selectedLanguage, undefined, useInspiration, isLowRes, inspirationFiles);
  };

  const toggleMagicFixOption = (option: string) => {
    setMagicFixOptions(prev => 
        prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const MAGIC_FIX_SETTINGS = [
    { id: 'AI_ENHANCE', label: 'Image AI Enhance', category: 'MAIN' },
    { id: 'MAGIC_FIX', label: 'Image Magic Fix', category: 'MAIN' },
    { id: 'CLARITY', label: 'Enhance Clarity', category: 'DETAIL' },
    { id: 'SHARPNESS', label: 'Enhance Sharpness', category: 'DETAIL' },
    { id: 'COLORS', label: 'Enhance Colors', category: 'DETAIL' },
    { id: 'DETAILS', label: 'Restore Small Details', category: 'DETAIL' },
    { id: 'FACE', label: 'Enhance Facial Details', category: 'DETAIL' },
    { id: 'BLUR', label: 'Remove Motion Blur', category: 'DETAIL' },
    { id: 'PORTRAIT', label: 'Portrait Enhancement', category: 'DETAIL' },
    { id: 'MULTIPLE', label: 'Multiple Adjustments', category: 'DETAIL' },
  ];

  // Conversational Workflow: If mode changes to an image-based mode and we have no preview, 
  // but there are images in history/current, we could potentially use them.
  // However, App.tsx should probably handle passing the 'last generated image' as a prop or similar.
  // For now, let's just ensure the prompt stays.

  const navItems = [
    { id: 'PROMPT', icon: SparklesIcon, label: 'Generate', color: 'text-cyan-400' },
    { id: 'RECREATE', icon: RefreshIcon, label: 'Face Swap', color: 'text-gray-400' },
    { id: 'MASTER_TITLES', icon: TextIcon, label: 'Title', color: 'text-gray-400' },
    { id: 'ANALYZE', icon: EyeIcon, label: 'Analyze', color: 'text-gray-400' },
  ];

  const brandGradient = "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600";
  const brandGradientText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600";

  const getSelectedPersonaName = () => {
      if (selectedPersona === 'CUSTOM') return 'Custom Face';
      const p = PERSONA_LIST.find(x => x.id === selectedPersona);
      return p ? p.name : 'Choose Face';
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Main Input Panel */}
      <div className="relative bg-[#0a0a0a] border border-gray-800/50 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="space-y-8">
            {/* Navigation Tabs - Horizontal layout with icon next to text */}
            <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2 px-2 border-b border-gray-800/30 pb-6">
                {navItems.map((item, index) => (
                <React.Fragment key={item.id}>
                    <button 
                    onClick={() => setMode(item.id as AppMode)} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 border ${mode === item.id ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-600/20 border-cyan-500/50 text-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                    >
                    <div className={`p-2.5 rounded-xl border transition-all ${mode === item.id ? 'border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-cyan-500/10 bg-gray-800/30'}`}>
                        <item.icon className={`w-4 h-4 ${mode === item.id ? 'text-white' : 'text-current'}`} />
                    </div>
                    <span className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap ${mode === item.id ? 'text-white' : ''}`}>{item.label}</span>
                    </button>
                    
                    {/* Insert BEAST MODE after the first item (Generate) */}
                    {index === 0 && (
                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                        onClick={() => setMode('BEAST_MODE')} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-700 border ${mode === 'BEAST_MODE' ? 'bg-white/5 border-orange-500/50 text-orange-400' : 'text-orange-500/40 border-transparent hover:text-orange-400'}`}
                        >
                        <div className={`p-2.5 rounded-xl border transition-all ${mode === 'BEAST_MODE' ? 'border-orange-400 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'border-orange-500/20'}`}>
                            <SparklesIcon className={`w-4 h-4 ${mode === 'BEAST_MODE' ? 'text-white' : 'text-current'}`} />
                        </div>
                        <span className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap ${mode === 'BEAST_MODE' ? 'text-white' : ''}`}>BEAST MODE</span>
                        </button>
                        <div className="w-px h-8 bg-gray-800/50" />
                    </div>
                    )}
                </React.Fragment>
                ))}
            </div>

            {/* Source Toggle - Visible for RECREATE and ANALYZE */}
            {(mode === 'RECREATE' || mode === 'ANALYZE') && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={() => setInputType('UPLOAD')}
                    className={`text-[10px] font-black tracking-[0.2em] transition-all pb-2 border-b-2 ${inputType === 'UPLOAD' ? 'text-cyan-400 border-cyan-400' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                  >
                    UPLOAD SOURCE
                  </button>
                  <button 
                    onClick={() => setInputType('URL')}
                    className={`text-[10px] font-black tracking-[0.2em] transition-all pb-2 border-b-2 ${inputType === 'URL' ? 'text-cyan-400 border-cyan-400' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                  >
                    PASTE LINK
                  </button>
                </div>
                
                {mode === 'ANALYZE' && (
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setAnalysisMode('STRATEGY')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${analysisMode === 'STRATEGY' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                    >
                      STRATEGY
                    </button>
                    <button 
                      onClick={() => setAnalysisMode('EXTRACT')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${analysisMode === 'EXTRACT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                    >
                      EXTRACT
                    </button>
                    <button 
                      onClick={() => setAnalysisMode('DESCRIPTION')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${analysisMode === 'DESCRIPTION' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                    >
                      DESCRIPTION
                    </button>
                  </div>
                )}

                {/* Upload Box */}
                <div className="flex justify-center flex-col items-center gap-4">
                  {inputType === 'URL' ? (
                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-4">
                        {/* Link Input, Brief Description, and Persona side-by-side */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 flex items-center gap-3 p-4 bg-black/50 border border-cyan-500/30 rounded-2xl focus-within:border-cyan-500 transition-colors">
                            <YouTubeIcon className="w-5 h-5 text-red-500" />
                            <input 
                                type="text" 
                                value={youtubeUrl ?? ''}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="Enter YouTube URL..."
                                className={`bg-transparent border-none outline-none flex-1 text-white text-xs font-medium ${analyzeStep === 'ANALYZE' ? 'hidden' : ''}`}
                            />
                          </div>

                          <div className={`flex-1 flex items-center gap-2 bg-black/50 border border-cyan-500/30 rounded-2xl px-4 py-4 group focus-within:border-cyan-500 transition-all ${analyzeStep === 'ANALYZE' ? 'hidden' : ''}`}>
                              <input 
                                  type="text"
                                  value={briefDescription ?? ''}
                                  onChange={(e) => setBriefDescription(e.target.value)}
                                  placeholder="What should I do? (e.g. 'Make him look surprised')"
                                  className="bg-transparent border-none outline-none text-xs text-white flex-1 placeholder:text-gray-600"
                              />
                              <PenIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                          </div>

                          {mode === 'RECREATE' && (
                              <button 
                                  onClick={() => setShowPersonaModal(true)}
                                  className={`p-4 rounded-2xl border transition-all flex items-center justify-center liquid-glass-icon ${selectedPersona ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}
                                  title={selectedPersona ? getSelectedPersonaName() : "Select Face"}
                              >
                                  {selectedPersona && selectedPersona !== 'CUSTOM' ? (
                                  <img src={PERSONA_LIST.find(p => p.id === selectedPersona)?.imageUrl} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                                  ) : selectedPersona === 'CUSTOM' && customFacePreview ? (
                                  <img src={customFacePreview} className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                  <PersonIcon className="w-6 h-6" />
                                  )}
                              </button>
                          )}
                        </div>
                      </div>

                      {/* YouTube Thumbnail Preview */}
                      {getYouTubeId(youtubeUrl) && (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 shadow-2xl animate-fade-in">
                          <img 
                            src={`https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/maxresdefault.jpg`} 
                            className="w-full h-full object-cover"
                            alt="YouTube Preview"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/0.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <YouTubeIcon className="w-12 h-12 text-red-600 drop-shadow-2xl" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-lg space-y-4">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-16 border-2 border-dashed border-cyan-500/30 rounded-2xl flex items-center justify-center gap-4 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group overflow-hidden"
                        >
                          {preview ? (
                            <div className="flex items-center gap-4 px-4 w-full">
                              <img src={preview} className="w-12 h-8 object-cover rounded-md" />
                              <span className="text-[10px] text-gray-400 font-bold truncate flex-1">Image Uploaded</span>
                              <RefreshIcon className="w-3 h-3 text-gray-600" />
                            </div>
                          ) : (
                            <>
                              <UploadIcon className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                              <span className="text-[10px] text-gray-500 font-bold tracking-widest group-hover:text-cyan-400 transition-colors uppercase">Upload Image</span>
                            </>
                          )}
                          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </div>

                        {mode === 'RECREATE' && (
                          <div className="flex items-center gap-4 flex-1">
                             <div className="flex-1 flex items-center gap-2 bg-black/50 border border-cyan-500/30 rounded-2xl px-4 py-4 group focus-within:border-cyan-500 transition-all">
                                  <input 
                                      type="text"
                                      value={briefDescription ?? ''}
                                      onChange={(e) => setBriefDescription(e.target.value)}
                                      placeholder="What should I do?"
                                      className="bg-transparent border-none outline-none text-xs text-white flex-1 placeholder:text-gray-600"
                                  />
                                  <PenIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                              </div>
                            <button 
                                onClick={() => setShowPersonaModal(true)}
                                className={`p-4 rounded-2xl border transition-all flex items-center justify-center liquid-glass-icon ${selectedPersona ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                title={selectedPersona ? getSelectedPersonaName() : "Select Face"}
                            >
                                {selectedPersona && selectedPersona !== 'CUSTOM' ? (
                                  <img src={PERSONA_LIST.find(p => p.id === selectedPersona)?.imageUrl} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : selectedPersona === 'CUSTOM' && customFacePreview ? (
                                  <img src={customFacePreview} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <PersonIcon className="w-6 h-6" />
                                )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Textarea - Hidden for RECREATE, ANALYZE */}
            {(mode === 'PROMPT' || mode === 'BEAST_MODE' || mode === 'EDIT' || mode === 'MAGIC_FIX' || mode === 'UPSCALE' || mode === 'MASTER_TITLES') && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea 
                    value={prompt ?? ''} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder={mode === 'BEAST_MODE' ? "Describe your viral idea... (e.g., 'I built a $100M house in 24 hours')" : mode === 'MASTER_TITLES' ? "Describe your video content to generate viral titles..." : "Describe your thumbnail idea... (e.g., 'Surviving 50 hours in Antarctica')"}
                    className={`w-full h-40 bg-black/40 border rounded-3xl p-6 text-white text-lg placeholder:text-gray-700 transition-all focus:outline-none resize-none ${mode === 'BEAST_MODE' ? 'border-orange-500/30 focus:border-orange-500/50' : 'border-gray-800/50 focus:border-cyan-500/50'}`}
                  />
                  
                  {/* Restored 4 Icons Row */}
                  <div className="absolute right-6 bottom-6 flex items-center gap-3">
                      <button 
                          onClick={handleEnhance}
                          disabled={isEnhancing}
                          className={`p-3 rounded-2xl border transition-all liquid-glass-icon ${isEnhancing ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                          title="Enhance Prompt"
                      >
                          <MagicIcon className={`w-5 h-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
                      </button>
                      <button 
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`p-3 rounded-2xl border transition-all liquid-glass-icon flex items-center gap-2 ${isRecording ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800/50 border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/20'}`}
                          title="Voice Over (1 Min Max)"
                      >
                          <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                          {isRecording && recordingTimeLeft !== null && (
                              <span className="text-xs font-bold font-mono">{recordingTimeLeft}s</span>
                          )}
                      </button>
                      <button 
                          onClick={() => setShowStyleModal(true)}
                          className={`p-3 rounded-2xl border transition-all liquid-glass-icon ${selectedStyle ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-gray-800/50 border-indigo-500/30 text-indigo-400 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/20'}`}
                          title="Styles"
                      >
                          <PaletteIcon className="w-5 h-5" />
                      </button>
                      <button 
                          onClick={() => setShowPersonaModal(true)}
                          className={`p-3 rounded-2xl border transition-all liquid-glass-icon ${selectedPersona ? 'bg-purple-500 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-800/50 border-purple-500/30 text-purple-400 hover:text-white hover:border-purple-400 hover:bg-purple-500/20'}`}
                          title="Characters"
                      >
                          <PersonIcon className="w-5 h-5" />
                      </button>
                  </div>

                  {mode === 'BEAST_MODE' && (
                    <div className="absolute left-6 -bottom-6 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[10px] font-black text-orange-500/70 uppercase tracking-widest">Beast Mode: Concept Engineering Active</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generate Button Row */}
            <div className="flex justify-center pt-4">
              <button 
                onClick={handleTriggerGenerate} 
                disabled={isLoading}
                className={`px-12 py-4 rounded-full font-black text-xl tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl group text-white ${brandGradient} hover:opacity-90`}
              >
                <span>
                    {isLoading ? 'CRAFTING...' : (mode === 'BEAST_MODE' ? 'START MISSION' : (mode === 'RECREATE' ? 'SWAP FACE' : (mode === 'ANALYZE' ? 'ANALYZE' : (mode === 'MASTER_TITLES' ? 'GENERATE TITLES' : 'GENERATE'))))}
                </span>
              </button>
            </div>
          </div>
      </div>

      {/* MAGIC FIX SETTINGS MODAL */}
      {showMagicFixSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="glass-panel rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111]">
                      <div className="flex items-center gap-3">
                        <AdjustmentsIcon className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Magic Fix Engine</h3>
                      </div>
                      <button onClick={() => setShowMagicFixSettings(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                  </div>
                  <div className="p-8 bg-[#0a0a0a]">
                       <div className="mb-6">
                           <h4 className="text-[10px] font-black text-gray-500 mb-4 tracking-[0.2em]">PRIMARY ENGINES</h4>
                           <div className="grid grid-cols-2 gap-4">
                               {MAGIC_FIX_SETTINGS.filter(s => s.category === 'MAIN').map(s => (
                                   <button 
                                        key={s.id} 
                                        onClick={() => toggleMagicFixOption(s.label)}
                                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${magicFixOptions.includes(s.label) ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                                   >
                                       <span className="text-sm font-bold">{s.label}</span>
                                       {magicFixOptions.includes(s.label) && <SparklesIcon className="w-4 h-4" />}
                                   </button>
                               ))}
                           </div>
                       </div>
                       
                       <div>
                           <h4 className="text-[10px] font-black text-gray-500 mb-4 tracking-[0.2em]">ENHANCEMENT MODULES</h4>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                               {MAGIC_FIX_SETTINGS.filter(s => s.category === 'DETAIL').map(s => (
                                   <button 
                                        key={s.id} 
                                        onClick={() => toggleMagicFixOption(s.label)}
                                        className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all ${magicFixOptions.includes(s.label) ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-700'}`}
                                   >
                                       {s.label}
                                   </button>
                               ))}
                           </div>
                       </div>

                       <div className="mt-8 flex justify-end">
                           <button 
                                onClick={() => setShowMagicFixSettings(false)}
                                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-full transition-all shadow-lg shadow-yellow-500/20"
                           >
                               CONFIRM SELECTION
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* STYLE MODAL */}
      {showStyleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="glass-panel rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
                  <div className="w-full md:w-1/3 flex-shrink-0 md:border-r border-gray-800 bg-[#0a0a0a] flex flex-row md:flex-col overflow-x-auto h-16 md:h-full items-center md:items-stretch px-2 md:px-0">
                      {STYLE_CATEGORIES.map(cat => (
                          <button key={cat.id} onClick={() => setActiveStyleTab(cat.id)} className={`whitespace-nowrap px-6 py-4 text-sm font-bold transition-all ${activeStyleTab === cat.id ? 'bg-cyan-900/40 text-cyan-400 md:border-l-4 md:border-l-cyan-400' : 'text-gray-400 hover:bg-gray-800'}`}>{cat.name}</button>
                      ))}
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col h-full bg-[#111]">
                       <div className="p-6 border-b border-gray-800 flex justify-between items-center"><h3 className="text-xl font-bold text-white">Select Style</h3><button onClick={() => setShowStyleModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button></div>
                       <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                           {STYLE_CATEGORIES.find(c => c.id === activeStyleTab)?.channels.map(ch => (
                               <div key={ch.id} onClick={() => { setSelectedStyle(ch.id); setShowStyleModal(false); }} className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center btn-glass ${selectedStyle === ch.id ? 'btn-glass-active' : ''}`}><img src={ch.imageUrl} className="w-10 h-10 rounded-full object-cover mb-2" /><span className="text-[10px] font-bold text-gray-200">{ch.name}</span></div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* PERSONA MODAL */}
      {showPersonaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="glass-panel rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#111]"><h3 className="text-xl font-bold text-white">Select Target Identity</h3><button onClick={() => setShowPersonaModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button></div>
                  <div className="p-6 overflow-y-auto bg-[#0a0a0a] h-full">
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                           <div onClick={() => faceInputRef.current?.click()} className={`p-4 rounded-2xl border border-dashed flex flex-col items-center justify-center h-32 cursor-pointer btn-glass ${selectedPersona === 'CUSTOM' ? 'btn-glass-active' : ''}`}>
                               {customFacePreview ? <img src={customFacePreview} className="w-12 h-12 rounded-full object-cover mb-2" /> : <UploadIcon className="w-6 h-6 text-gray-500 mb-2" />}
                               <span className="text-[10px] font-bold text-purple-400">Upload Face</span>
                               <input ref={faceInputRef} type="file" className="hidden" onChange={handleFaceFileChange} accept="image/*" />
                           </div>
                           {PERSONA_LIST.map(p => (
                               <div key={p.id} onClick={() => { setSelectedPersona(p.id); setCustomFaceFile(null); setShowPersonaModal(false); }} className={`p-4 rounded-2xl border flex flex-col items-center justify-center h-32 cursor-pointer btn-glass ${selectedPersona === p.id ? 'btn-glass-active' : ''}`}>
                                   <img src={p.imageUrl} className="w-12 h-12 rounded-full object-cover mb-2" referrerPolicy="no-referrer" />
                                   <span className="text-[10px] font-bold text-white">{p.name}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InputSection;
