
import React, { useState, useRef, useEffect } from 'react';
import PersonaModal from './PersonaModal';
import StylesModal from './StylesModal';
import CanvasEditor from './CanvasEditor';
import { 
    PenIcon, RecycleIcon, TextIcon, EyeIcon, WandIcon, 
    UploadIcon, LinkIcon, StyleIcon, BrainIcon,
    SquareIcon, BrushIcon, EraserIcon, UndoIcon, RedoIcon, SparklesIcon, TrashIcon,
    PaletteIcon, LassoIcon, CurveIcon, YouTubeIcon, BucketIcon, HdIcon, MagicIcon,
    TargetIcon, LightBulbIcon, XMarkIcon, GridIcon, MicrophoneIcon, StopIcon,
    SettingsIcon, AdjustmentsIcon, RefreshIcon, SearchIcon, ClipboardIcon, PlusIcon, UserIcon, CheckIcon, BoxIcon
} from './IconComponents';
import { AppMode, AnalysisMode, ModeInputState } from '../types';
import { enhancePrompt, editThumbnail, fileToBase64, urlToBase64, transcribeAudio, isObjectOnly, validateUploadedObject } from '../services/geminiService';
import { fetchSingleChannelStat, getVideoData } from '../services/youtubeService';

import { User } from 'firebase/auth';
import { getCustomPersonas, getCustomStyles, saveCustomPersona, saveCustomStyle, deleteCustomPersona, deleteCustomStyle, CustomItem } from '../firebase';

interface InputSectionProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onGenerate: (prompt: string, imageFile: File | null, imageUrl: string | null, faceFile?: File, analysisMode?: AnalysisMode, language?: string, maskData?: string, useInspiration?: boolean, isLowRes?: boolean, inspirationFiles?: File[], faceUrl?: string | string[], generationCount?: number, styleVector?: any, personaEmbedding?: any, imageProvider?: 'gemini' | 'openai') => void;
  isLoading: boolean;
  lastGeneratedImage?: string;
  predictedCtr?: number;
  inputState: ModeInputState;
  onInputStateChange: (newState: ModeInputState) => void;
  playNotificationSound: () => void;
  user: User | null;
}

const FAMOUS_YOUTUBERS = [
    { name: 'PewDiePie', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/PewDiePie' },
    { name: 'KSI', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/KSI' },
    { name: 'MKBHD', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/mkbhd' },
    { name: 'Elon Musk', tag: 'TECH', image: 'https://unavatar.io/tesla.com' },
    { name: 'Mark Zuckerberg', tag: 'TECH', image: 'https://unavatar.io/meta.com' },
    { name: 'MrBeast', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/MrBeast' },
    { name: 'Jeff Bezos', tag: 'TECH', image: 'https://unavatar.io/amazon.com' },
    { name: 'Bill Gates', tag: 'TECH', image: 'https://unavatar.io/microsoft.com' },
    { name: 'Ronaldo', tag: 'SPORTS', image: 'https://unavatar.io/youtube/CristianoRonaldo' },
    { name: 'Markiplier', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/markiplier' },
    { name: 'Jacksepticeye', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/jacksepticeye' },
    { name: 'Logan Paul', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/LoganPaulVlogs' },
    { name: 'Ryan Trahan', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/ryantrahan' },
    { name: 'IShowSpeed', tag: 'YOUTUBER', image: 'https://unavatar.io/youtube/IShowSpeed' },
    { name: 'Lionel Messi', tag: 'SPORTS', image: 'https://unavatar.io/youtube/LeoMessi' },
    { name: 'Taylor Swift', tag: 'MUSIC', image: 'https://unavatar.io/youtube/TaylorSwift' },
    { name: 'Joe Rogan', tag: 'PODCAST', image: 'https://unavatar.io/youtube/joerogan' },
    { name: 'Gordon Ramsay', tag: 'CHEF', image: 'https://unavatar.io/youtube/gordonramsay' },
    { name: 'Will Smith', tag: 'ACTOR', image: 'https://unavatar.io/youtube/WillSmith' },
    { name: 'Dwayne Johnson', tag: 'ACTOR', image: 'https://unavatar.io/youtube/therock' }
];

const CHANNEL_CATEGORIES = [
    {
        name: 'MRBEAST STYLE',
        channels: [
            { name: 'MrBeast', image: 'https://unavatar.io/youtube/MrBeast' },
            { name: 'MrBeast Gaming', image: 'https://unavatar.io/youtube/MrBeastGaming' },
            { name: 'Beast Philanthropy', image: 'https://unavatar.io/youtube/BeastPhilanthropy' }
        ]
    },
    {
        name: 'CHALLENGE / VLOG',
        channels: [
            { name: 'Dude Perfect', image: 'https://unavatar.io/youtube/DudePerfect' },
            { name: 'Sidemen', image: 'https://unavatar.io/youtube/Sidemen' },
            { name: 'Ryan Trahan', image: 'https://unavatar.io/youtube/ryantrahan' },
            { name: 'Airrack', image: 'https://unavatar.io/youtube/airrack' }
        ]
    },
    {
        name: 'GAMING LEGENDS',
        channels: [
            { name: 'PewDiePie', image: 'https://unavatar.io/youtube/PewDiePie' },
            { name: 'Markiplier', image: 'https://unavatar.io/youtube/markiplier' },
            { name: 'Dream', image: 'https://unavatar.io/youtube/dream' }
        ]
    },
    {
        name: 'TECH & FUTURE',
        channels: [
            { name: 'MKBHD', image: 'https://unavatar.io/youtube/mkbhd' },
            { name: 'Linus Tech Tips', image: 'https://unavatar.io/youtube/LinusTechTips' },
            { name: 'Mrwhosetheboss', image: 'https://unavatar.io/youtube/Mrwhosetheboss' }
        ]
    },
    {
        name: 'SCIENCE & EDUCATION',
        channels: [
            { name: 'Mark Rober', image: 'https://unavatar.io/youtube/MarkRober' },
            { name: 'Veritasium', image: 'https://unavatar.io/youtube/veritasium' },
            { name: 'Vsauce', image: 'https://unavatar.io/youtube/Vsauce' },
            { name: 'SmarterEveryDay', image: 'https://unavatar.io/youtube/smartereveryday' }
        ]
    },
    {
        name: 'ANIMAL REACTIONS',
        channels: [
            { name: 'Brave Wilderness', image: 'https://unavatar.io/youtube/BraveWilderness' },
            { name: 'Jack Hanna', image: 'https://unavatar.io/youtube/JackHanna' },
            { name: 'Steve Irwin', image: 'https://unavatar.io/youtube/SteveIrwin' }
        ]
    }
];

const InputSection: React.FC<InputSectionProps> = ({ mode, setMode, onGenerate, isLoading, lastGeneratedImage, predictedCtr, inputState, onInputStateChange, playNotificationSound, user }) => {
  const [prompt, setPrompt] = useState(inputState?.prompt || '');
  const [imageFile, setImageFile] = useState<File | null>(inputState?.imageFile || null);
  const [imageUrl, setImageUrl] = useState(inputState?.imageUrl || '');
  const [inputType, setInputType] = useState<'UPLOAD' | 'URL'>(inputState?.inputType || 'UPLOAD');
  const [preview, setPreview] = useState<string | null>(inputState?.preview || null);
  const [ratioError, setRatioError] = useState<string | null>(null);
  const [showCountMenu, setShowCountMenu] = useState(false);
  const [generationCount, setGenerationCount] = useState(2);
  const [imageProvider, setImageProvider] = useState<'gemini' | 'openai'>('gemini');

  // Sync internal state with inputState when mode changes
  useEffect(() => {
    if (inputState) {
        setPrompt(prev => prev === (inputState.prompt || '') ? prev : (inputState.prompt || ''));
        setImageFile(prev => prev === (inputState.imageFile || null) ? prev : (inputState.imageFile || null));
        setImageUrl(prev => prev === (inputState.imageUrl || '') ? prev : (inputState.imageUrl || ''));
        setInputType(prev => prev === (inputState.inputType || 'UPLOAD') ? prev : (inputState.inputType || 'UPLOAD'));
        setPreview(prev => prev === (inputState.preview || null) ? prev : (inputState.preview || null));
        setSelectedPersona(prev => prev === (inputState.selectedPersona || null) ? prev : (inputState.selectedPersona || null));
        
        // Sync additional properties
        setYoutubeUrl(prev => prev === (inputState.youtubeUrl || '') ? prev : (inputState.youtubeUrl || ''));
        setVideoTitle(prev => prev === (inputState.videoTitle || '') ? prev : (inputState.videoTitle || ''));
        setBriefDescription(prev => prev === (inputState.briefDescription || '') ? prev : (inputState.briefDescription || ''));
        setUseInspiration(prev => prev === (inputState.useInspiration || false) ? prev : (inputState.useInspiration || false));
        setIsLowRes(prev => prev === (inputState.isLowRes || false) ? prev : (inputState.isLowRes || false));
        
        setInspirationFiles(prev => {
            if (prev.length === (inputState.inspirationFiles?.length || 0) && prev.every((f, i) => f === inputState.inspirationFiles![i])) return prev;
            return inputState.inspirationFiles || [];
        });
        setInspirationPreviews(prev => {
            if (prev.length === (inputState.inspirationPreviews?.length || 0) && prev.every((p, i) => p === inputState.inspirationPreviews![i])) return prev;
            return inputState.inspirationPreviews || [];
        });

        // Also sync customFace parameters to support edits
        setCustomFaceFile(prev => prev === (inputState.customFaceFile || null) ? prev : (inputState.customFaceFile || null));
        setCustomFacePreview(prev => prev === (inputState.customFacePreview || null) ? prev : (inputState.customFacePreview || null));
    } else {
        setPrompt(prev => prev === '' ? prev : '');
        setImageFile(prev => prev === null ? prev : null);
        setImageUrl(prev => prev === '' ? prev : '');
        setPreview(prev => prev === null ? prev : null);
        setSelectedPersona(prev => prev === null ? prev : null);
        setYoutubeUrl(prev => prev === '' ? prev : '');
        setVideoTitle(prev => prev === '' ? prev : '');
        setBriefDescription(prev => prev === '' ? prev : '');
        setUseInspiration(prev => prev === false ? prev : false);
        setIsLowRes(prev => prev === false ? prev : false);
        setInspirationFiles(prev => prev.length === 0 ? prev : []);
        setInspirationPreviews(prev => prev.length === 0 ? prev : []);
    }
  }, [mode, inputState]); // Sync when mode changes or inputState force updates

  useEffect(() => {
      if (mode === 'TITLE') {
          if (![3, 6].includes(generationCount)) setGenerationCount(3);
      } else {
          if (![1, 2, 4].includes(generationCount)) setGenerationCount(2);
      }
  }, [mode, generationCount]);

  const getCountOptions = () => {
      if (mode === 'TITLE') return [3, 6];
      return [1, 2, 4];
  };

  const [showFaceMenu, setShowFaceMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showChannelsMenu, setShowChannelsMenu] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(inputState?.selectedPersona || null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customCharacters, setCustomCharacters] = useState<CustomItem[]>([]);
  const [customStyles, setCustomStyles] = useState<CustomItem[]>(() => {
      const saved = localStorage.getItem('customStyles');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('customStyles', JSON.stringify(customStyles));
  }, [customStyles]);

  useEffect(() => {
      if (user) {
          getCustomPersonas(user.uid).then(setCustomCharacters).catch(console.error);
          getCustomStyles(user.uid).then(fetchedStyles => {
              // Merge local and remote styles
              setCustomStyles(prev => {
                  const merged = [...prev];
                  for (const style of fetchedStyles) {
                      if (!merged.find(s => s.id === style.id)) {
                          merged.push(style);
                      }
                  }
                  return merged;
              });
          }).catch(console.error);
      }
  }, [user]);
  const [personaTab, setPersonaTab] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [channelTab, setChannelTab] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const [youtubeUrl, setYoutubeUrl] = useState(inputState?.youtubeUrl || '');
  const [videoTitle, setVideoTitle] = useState(inputState?.videoTitle || '');
  const [showEnhanceIcon, setShowEnhanceIcon] = useState(false);
  const [briefDescription, setBriefDescription] = useState(inputState?.briefDescription || '');
  const [analyzeStep, setAnalyzeStep] = useState<'NONE' | 'DESCRIBE' | 'ANALYZE'>('NONE');
  const [editSubMode, setEditSubMode] = useState<'EDIT' | 'FACESWAP'>('EDIT');
  const [maskData, setMaskData] = useState<string | null>(null);

  const getSelectedPersonaImage = () => {
    if (!selectedPersona) return null;
    const persona = FAMOUS_YOUTUBERS.find(p => p.name === selectedPersona);
    if (persona) return persona.image;
    const custom = customCharacters.find(c => c.name === selectedPersona);
    if (custom) return custom.images?.[0] || custom.avatar || null;
    return null;
  };

  const getSelectedStyleImage = () => {
      if (!selectedStyle) return null;
      for (const cat of CHANNEL_CATEGORIES) {
          const builtin = cat.channels.find(c => c.name === selectedStyle);
          if (builtin) return builtin.image;
      }
      const custom = customStyles.find(s => s.name === selectedStyle);
      if (custom) return custom.avatar || custom.images?.[0];
      return null;
  };

  // YouTube URL Data Fetching
  useEffect(() => {
    const fetchVideoInfo = async () => {
      if (!youtubeUrl || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be'))) {
        setVideoTitle(prev => prev === '' ? prev : '');
        return;
      }

      const data = await getVideoData(youtubeUrl);
      if ('title' in data) {
        setVideoTitle(prev => prev === data.title ? prev : data.title);
        if (data.thumbnail) {
          setPreview(prev => prev === data.thumbnail ? prev : data.thumbnail);
        }
      }
    };

    const timeoutId = setTimeout(fetchVideoInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [youtubeUrl]);

  const [customFaceFile, setCustomFaceFile] = useState<File | null>(inputState.customFaceFile || null);
  const [customFacePreview, setCustomFacePreview] = useState<string | null>(inputState.customFacePreview || null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedImageRef = useRef<string | undefined>(undefined);

  // Global Drag and Drop
  useEffect(() => {
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (mode === 'RECREATE') {
              setCustomFacePreview(prev => prev !== dataUrl ? dataUrl : prev);
              setSelectedPersona(prev => prev !== 'CUSTOM' ? 'CUSTOM' : prev);
            } else {
              setPreview(prev => prev !== dataUrl ? dataUrl : prev);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('drop', handleGlobalDrop);
    window.addEventListener('dragover', handleDragOver);

    return () => {
      window.removeEventListener('drop', handleGlobalDrop);
      window.removeEventListener('dragover', handleDragOver);
    };
  }, [mode]);
  const [useInspiration, setUseInspiration] = useState(inputState.useInspiration || false); 
  
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('EXTRACT');
  const [selectedLanguage, setSelectedLanguage] = useState('Arabic');
  const [isLowRes, setIsLowRes] = useState(inputState.isLowRes || false);
  const [inspirationFiles, setInspirationFiles] = useState<File[]>(inputState.inspirationFiles || []);
  const [inspirationPreviews, setInspirationPreviews] = useState<string[]>(inputState.inspirationPreviews || []);
  const [objectFile, setObjectFile] = useState<File | null>(null);
  const [objectPreview, setObjectPreview] = useState<string | null>(null);
  const [objectDescription, setObjectDescription] = useState<string | null>(null);
  const [isAnalyzingObject, setIsAnalyzingObject] = useState(false);
  const [showObjectSuccess, setShowObjectSuccess] = useState(false);
  const objectInputRef = useRef<HTMLInputElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view on mount
  useEffect(() => {
      // User request: Don't animate/scroll the nav container when changing tabs.
  }, [mode]);

  const prevInputStateRef = useRef(inputState);

  // Update parent state whenever internal state changes
  useEffect(() => {
     // Check if the current render was caused by (or coincided with) a new inputState prop.
     // If so, our local states might be stale while the downward sync is processing.
     // By skipping upward sync when the props change, we mathematically eliminate the ping-pong reflection loop.
     if (prevInputStateRef.current !== inputState) {
         prevInputStateRef.current = inputState;
         return;
     }

    onInputStateChange({
      prompt,
      imageFile,
      imageUrl,
      inputType,
      preview,
      youtubeUrl,
      customFaceFile,
      customFacePreview,
      useInspiration,
      inspirationFiles,
      inspirationPreviews,
      isLowRes,
      briefDescription,
      videoTitle,
      selectedPersona
    });
  }, [prompt, imageFile, imageUrl, inputType, preview, youtubeUrl, customFaceFile, customFacePreview, useInspiration, inspirationFiles, inspirationPreviews, isLowRes, briefDescription, videoTitle, selectedPersona, onInputStateChange, inputState]);

  // Conversational Workflow: Sync preview with last generated image
  useEffect(() => {
    if (lastGeneratedImage && lastGeneratedImage !== lastProcessedImageRef.current) {
        // Auto-update preview for iterative editing.
        // We now allow EDIT mode to iteratively update the source image.
        if (mode !== 'RECREATE') {
            setPreview(lastGeneratedImage);
            setImageFile(null); // Clear the file so we use the URL/Base64 from now on
            setImageUrl(lastGeneratedImage); // Set imageUrl to the generated image so it's used as the new source
        }
        lastProcessedImageRef.current = lastGeneratedImage;
    }
  }, [lastGeneratedImage, mode]);
  
  const [titleArchetype, setTitleArchetype] = useState('EXTREME_CONTRAST');
  
  const [showMagicFixSettings, setShowMagicFixSettings] = useState(false);
  const [magicFixOptions, setMagicFixOptions] = useState<string[]>([]);

  const [realCounts, setRealCounts] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // useEffect(() => { setPrompt(''); setRatioError(null); }, [mode]); // REMOVED: Don't reset prompt on mode change

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        let msg = "Your browser does not support audio recording or it is blocked.";
        if (window.self !== window.top) {
            msg += " Try opening the app in a new tab.";
        }
        setRecordingError(msg);
        setTimeout(() => setRecordingError(null), 8000);
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
                if (transcription && transcription.trim() !== "") {
                    setPrompt((prev: string) => prev ? `${prev} ${transcription.trim()}` : transcription.trim());
                }
            } catch (e) {
                console.error("Transcription failed", e);
                setRecordingError("Transcription failed. Please try again.");
                setTimeout(() => setRecordingError(null), 8000);
            } finally {
                setIsTranscribing(false);
            }
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTimeLeft(120);

        countdownIntervalRef.current = setInterval(() => {
            setRecordingTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(countdownIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Set 2-minute time limit
        recordingTimerRef.current = setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, 120000);

    } catch (err: any) {
        console.error("Error accessing microphone", err);
        let errorMsg = "Microphone access denied. Please check your browser permissions.";
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg = "No microphone found. Please connect a microphone and try again.";
        } else {
            errorMsg = "Could not access microphone: " + (err.message || "Unknown error");
        }
        
        if (window.self !== window.top) {
            errorMsg += " Note: Microphone access may be blocked inside this preview frame. Try opening the app in a new tab.";
        }
        
        setRecordingError(errorMsg);
        setTimeout(() => setRecordingError(null), 8000);
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

  const validateImageRatio = (fileOrUrl: string | File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ratio - (16/9)) > 0.15) {
          setRatioError(`المقاس الحالي لصورتك هو ${img.naturalWidth}x${img.naturalHeight}. المقياس المطلوب للصور المصغرة في هذه المساحة هو 16:9 (مثلاً 1280x720).`);
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
          setShowPersonaMenu(false);
      }
  };

  const [customStyleFile, setCustomStyleFile] = useState<File | null>(null);
  const [customStylePreview, setCustomStylePreview] = useState<string | null>(null);

  const handleStyleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setCustomStyleFile(file);
          setCustomStylePreview(URL.createObjectURL(file));
          setSelectedStyle('CUSTOM');
          setShowChannelsMenu(false);
      }
  };

  const handleEnhance = async () => {
      setIsEnhancing(true);
      try {
        const enhanced = await enhancePrompt(prompt || "Generate a random viral YouTube thumbnail idea");
        setPrompt(enhanced);
        setShowEnhanceIcon(false);
        playNotificationSound();
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

  const handleObjectChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsAnalyzingObject(true);
        try {
            const base64 = await fileToBase64(file);
            const validation = await validateUploadedObject(base64, file.type);
            
            if (!validation.isValid) {
                alert(validation.error || "Image rejected. Characters and faces are not allowed here.");
                if (objectInputRef.current) objectInputRef.current.value = '';
                setObjectFile(null);
                setObjectPreview(null);
                setObjectDescription(null);
                return;
            }

            setObjectDescription(validation.description);
            setObjectFile(file);
            setObjectPreview(URL.createObjectURL(file));
            setShowObjectSuccess(true);
            setTimeout(() => setShowObjectSuccess(false), 5000);
        } catch (error) {
            console.error("Error analyzing object image:", error);
            alert("Failed to analyze image. Please try again.");
        } finally {
            setIsAnalyzingObject(false);
        }
    }
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

    // Strict face swap instruction for RECREATE and EDIT (FACESWAP) mode
    if ((mode === 'RECREATE' || (mode === 'EDIT' && editSubMode === 'FACESWAP')) && selectedPersona) {
        finalPrompt = `STRICT_FACE_SWAP: Replace the face in the image with the real-life ${selectedPersona}. You MUST use the exact, real-life facial features of ${selectedPersona}. DO NOT mix their face with anyone else. Ensure 100% accurate likeness to the real ${selectedPersona}. CRITICAL: You MUST preserve the exact expressions, emotions, and lighting of the original image. If the original image does not have a person, generate ${selectedPersona} with an expression matching the overall mood of the image. Do not change background or clothes unless explicitly requested. ${finalPrompt}`;
    } else if (mode === 'PROMPT' && selectedPersona) {
        finalPrompt = `CRITICAL REQUIREMENT: The main subject of this image MUST be the real-life ${selectedPersona}. Ensure 100% accurate likeness to the real ${selectedPersona}. DO NOT generate a generic person. ${finalPrompt}`;
    }

    if (selectedStyle) {
        const custom = customStyles.find(s => s.name === selectedStyle);
        if (custom && custom.stylePrompt) {
            finalPrompt = `[STYLE INSTRUCTIONS: ${custom.stylePrompt}] ${finalPrompt}`;
        } else {
            finalPrompt = `[NICHE/STYLE: ${selectedStyle}] ${finalPrompt}`;
        }
    }

    if (objectFile && objectDescription) {
        finalPrompt = `[INTEGRATE OBJECT: I have provided a reference object describing "${objectDescription}". You MUST integrate this object seamlessly into the thumbnail. Remove its original background entirely, and place the object naturally within the scene so it looks professional and part of the composition.] ${finalPrompt}`;
    }

    const sourceImage = inputType === 'UPLOAD' ? preview : (youtubeUrl ? youtubeUrl : null);

    let faceUrl = undefined;
    let customFaceImages: string[] | undefined = undefined;
    let personaEmbeddingToPass = undefined;
    if (selectedPersona) {
        const persona = FAMOUS_YOUTUBERS.find(p => p.name === selectedPersona);
        if (persona) {
            faceUrl = persona.image;
        } else {
            const custom = customCharacters.find(c => c.name === selectedPersona);
            if (custom) {
                customFaceImages = custom.images;
                faceUrl = custom.images?.[0]; // Fallback if no avatar
                personaEmbeddingToPass = custom.embedding;
            }
        }
    }

    let styleVectorToPass = undefined;
    if (selectedStyle) {
        const custom = customStyles.find(s => s.name === selectedStyle);
        if (custom) {
            styleVectorToPass = custom.style_vector;
        }
    }

    onGenerate(
        finalPrompt, 
        inputType === 'UPLOAD' ? imageFile : null, 
        sourceImage, 
        customFaceFile || undefined, 
        analysisMode, 
        selectedLanguage, 
        maskData || undefined, 
        useInspiration, 
        isLowRes, 
        [...inspirationFiles, ...(objectFile ? [objectFile] : [])],
        customFaceImages || faceUrl,
        generationCount,
        styleVectorToPass,
        personaEmbeddingToPass,
        imageProvider
    );
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
    { id: 'RECREATE', icon: RefreshIcon, label: 'Recreate', color: 'text-gray-400' },
    { id: 'ANALYZE', icon: EyeIcon, label: 'Analyze', color: 'text-gray-400' },
    { id: 'EDIT', icon: BrushIcon, label: 'Edit', color: 'text-emerald-400' },
    { id: 'MASTER_TITLES', icon: TextIcon, label: 'Title', color: 'text-gray-400' },
  ];

  const brandGradient = "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600";
  const brandGradientText = "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600";

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isImageRequired = ['RECREATE', 'EDIT', 'MAGIC_FIX', 'UPSCALE', 'OPTIMIZE'].includes(mode);
  const hasImage = inputType === 'UPLOAD' ? !!preview : !!youtubeUrl;
  const hasText = !!prompt.trim() || !!briefDescription.trim();
  
  let isGenerateDisabled = isLoading;
  if (isImageRequired && !hasImage) isGenerateDisabled = true;
  if (['PROMPT', 'MASTER_TITLES', 'MASTER_STRATEGY', 'OPTIMIZE'].includes(mode) && !hasText) isGenerateDisabled = true;
  if (mode === 'ANALYZE' && !hasImage) isGenerateDisabled = true;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hidden Inputs */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
      <input ref={faceInputRef} type="file" className="hidden" onChange={handleFaceFileChange} accept="image/*" />
      <input ref={styleInputRef} type="file" className="hidden" onChange={handleStyleFileChange} accept="image/*" />
      <input ref={inspirationInputRef} type="file" className="hidden" onChange={handleInspirationChange} accept="image/*" multiple />

      {/* Main Input Panel */}
      <div className="relative bg-[#0a0a0a] border border-gray-800/50 rounded-[2.5rem] p-8 shadow-2xl min-h-[500px] flex flex-col">
          <div className="space-y-8 flex-1">
            {/* Navigation Tabs - Horizontal layout with icon next to text */}
            <div ref={navContainerRef} className="flex items-center justify-start md:justify-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2 px-2 border-b border-gray-800/30 pb-6">
                {navItems.map((item) => (
                <button 
                onClick={() => setMode(item.id as AppMode)} 
                key={item.id}
                data-active={mode === item.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 border ${mode === item.id ? (item.id === 'EDIT' ? 'bg-white/5 border-emerald-500/50 text-emerald-400' : 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-600/20 border-cyan-500/50 text-white') : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                >
                <div className={`p-2.5 rounded-xl border transition-all liquid-glass-icon ${mode === item.id ? (item.id === 'EDIT' ? 'border-emerald-400 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]') : 'border-cyan-500/10 bg-gray-800/30'}`}>
                    <item.icon className={`w-4 h-4 ${mode === item.id ? 'text-white' : 'text-current'}`} />
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap ${mode === item.id ? 'text-white' : ''}`}>{item.label}</span>
                </button>
                ))}
            </div>

            {/* Source Toggle - Visible for RECREATE, ANALYZE, and EDIT */}
            {(mode === 'RECREATE' || mode === 'ANALYZE' || mode === 'EDIT') && (
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
                
                {/* Upload Box */}
                <div className="flex justify-center flex-col items-center gap-4">
                  {mode === 'EDIT' && hasImage ? (
                    <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
                      {/* Main Editor Area */}
                      <CanvasEditor 
                        imageUrl={inputType === 'UPLOAD' ? preview! : (getYouTubeId(youtubeUrl) ? `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/maxresdefault.jpg` : youtubeUrl)}
                        onMaskChange={setMaskData}
                        onChangeImage={() => {
                            setPreview(null);
                            setImageUrl('');
                            setYoutubeUrl('');
                            setMaskData(null);
                        }}
                      />

                      {/* Bottom Controls */}
                      <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-4">
                        {/* Edit / FaceSwap Toggle */}
                        <div className="flex items-center gap-2 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800">
                          <button 
                            onClick={() => setEditSubMode('EDIT')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${editSubMode === 'EDIT' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setEditSubMode('FACESWAP')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${editSubMode === 'FACESWAP' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                            Face Swap
                          </button>
                        </div>

                        {/* Description Input / Face Swap UI */}
                        {editSubMode === 'EDIT' ? (
                          <div className="w-full flex items-center gap-3 bg-black/50 border border-gray-800 rounded-2xl p-2 focus-within:border-emerald-500/50 transition-colors">
                            <div className="p-3 rounded-xl bg-gray-800/50">
                              <PenIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <input 
                              type="text"
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Describe what you'd like to add, remove or replace..."
                              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm"
                            />
                          </div>
                        ) : (
                          <div className="w-full flex flex-col items-center gap-4">
                             <div 
                                onClick={() => faceInputRef.current?.click()}
                                className={`w-full ${customFacePreview ? 'h-auto aspect-video' : 'h-16'} border-2 border-dashed border-emerald-500/30 rounded-2xl flex items-center justify-center gap-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group overflow-hidden relative`}
                              >
                                {customFacePreview ? (
                                    <img src={customFacePreview} className="w-full h-full object-contain" alt="Face Preview" />
                                ) : (
                                  <>
                                    <UploadIcon className="w-4 h-4 text-gray-700 group-hover:text-emerald-400 transition-colors" />
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest group-hover:text-emerald-400 transition-colors uppercase">Upload Face Image</span>
                                  </>
                                )}
                              </div>
                              <button 
                                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                  className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border transition-all liquid-glass-button ${showPersonaMenu || selectedPersona ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-800/50 border-emerald-500/30 text-emerald-400 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/20'}`}
                              >
                                  {getSelectedPersonaImage() ? (
                                      <img src={getSelectedPersonaImage()!} alt={selectedPersona!} className="w-5 h-5 rounded-full object-cover border border-white/50" />
                                  ) : (
                                      <UserIcon className="w-4 h-4" />
                                  )}
                                  <span className="text-[10px] font-black uppercase tracking-widest">{selectedPersona || 'Select Character'}</span>
                              </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : inputType === 'URL' ? (
                    <div className="w-full space-y-4">
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full flex items-center gap-2 bg-black/50 border border-cyan-500/30 rounded-2xl px-4 py-4 group focus-within:border-cyan-500 transition-all relative">
                          <input 
                            type="text" 
                            value={youtubeUrl || ''}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="Enter YouTube URL..."
                            className="bg-transparent border-none outline-none flex-1 text-white text-xs font-medium"
                          />
                          <button 
                            onClick={async () => {
                              try {
                                const text = await navigator.clipboard.readText();
                                setYoutubeUrl(text);
                              } catch (err) {
                                console.error('Failed to read clipboard contents: ', err);
                                alert("Could not read clipboard. Please paste the link manually.");
                              }
                            }}
                            className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Paste from clipboard"
                          >
                            <ClipboardIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 w-full flex flex-col items-center gap-4">
                          <div className="w-full flex items-center gap-2 bg-black/50 border border-cyan-500/30 rounded-2xl px-4 py-4 group focus-within:border-cyan-500 transition-all relative">
                            <input 
                              type="text"
                              value={briefDescription || ''}
                              onChange={(e) => setBriefDescription(e.target.value)}
                              placeholder="What should I do?"
                              className="bg-transparent border-none outline-none text-xs text-white flex-1 placeholder:text-gray-600"
                            />
                            <PenIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                          </div>

                          {mode === 'RECREATE' && (
                            <div className="flex flex-col items-center gap-4 w-full">
                               <button 
                                    onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                    className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border transition-all liquid-glass-button ${showPersonaMenu || selectedPersona ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                                >
                                    {getSelectedPersonaImage() ? (
                                        <img src={getSelectedPersonaImage()!} alt={selectedPersona!} className="w-5 h-5 rounded-full object-cover border border-white/50" />
                                    ) : (
                                        <UserIcon className="w-4 h-4" />
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedPersona || 'Select Character'}</span>
                                </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* URL Thumbnail Preview */}
                      {youtubeUrl && (
                        <div className="space-y-3 animate-fade-in">
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                            <img 
                              src={getYouTubeId(youtubeUrl) ? `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/maxresdefault.jpg` : youtubeUrl} 
                            className="w-full h-full object-cover"
                            alt="URL Preview"
                            onError={(e) => {
                              const id = getYouTubeId(youtubeUrl);
                              if (id) {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault')) {
                                    target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                                } else if (target.src.includes('hqdefault')) {
                                    target.src = `https://img.youtube.com/vi/${id}/0.jpg`;
                                } else {
                                    target.style.display = 'none';
                                }
                              } else {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }
                            }}
                            onLoad={(e) => {
                                (e.target as HTMLImageElement).style.display = 'block';
                            }}
                          />
                          </div>
                          {videoTitle && (
                            <div className="bg-black/40 border border-gray-800/50 rounded-xl px-4 py-3">
                              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Video Title</p>
                              <p className="text-sm text-white font-medium line-clamp-2 leading-relaxed">{videoTitle}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-lg space-y-4">
                      <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="flex justify-center flex-col items-center gap-4">
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.add('border-cyan-500', 'bg-cyan-500/10');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/10');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-500/10');
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            const file = e.dataTransfer.files[0];
                                            if (file.type.startsWith('image/')) {
                                                handleFileChange({ target: { files: [file] } } as any);
                                            }
                                        }
                                    }}
                                    className={`w-full ${preview ? 'h-auto aspect-video' : 'h-16'} border-2 border-dashed border-cyan-500/30 rounded-2xl flex items-center justify-center gap-4 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group overflow-hidden relative`}
                                  >
                                    {preview ? (
                                          <img src={preview} className="w-full h-full object-contain" alt="Uploaded Preview" />
                                    ) : (
                                      <>
                                        <UploadIcon className="w-4 h-4 text-gray-700 group-hover:text-cyan-400 transition-colors" />
                                        <span className="text-[10px] text-gray-500 font-bold tracking-widest group-hover:text-cyan-400 transition-colors uppercase">Upload Image</span>
                                      </>
                                    )}
                                  </div>
                                  {ratioError && (
                                    <div className="text-red-500 text-xs text-center w-full" dir="rtl">
                                        {ratioError}
                                    </div>
                                  )}
                                </div>

                        <div className="flex flex-col items-center gap-4 flex-1 w-full">
                           {/* Small description box for UPLOAD mode in RECREATE */}
                            {mode === 'RECREATE' && (
                              <div className="w-full flex flex-col items-center gap-4">
                                <div className="w-full flex items-center gap-2 bg-black/50 border border-cyan-500/30 rounded-2xl px-4 py-4 group focus-within:border-cyan-500 transition-all relative">
                                   <input 
                                     type="text"
                                     value={briefDescription || ''}
                                     onChange={(e) => setBriefDescription(e.target.value)}
                                     placeholder="What should I do?"
                                     className="bg-transparent border-none outline-none text-xs text-white flex-1 placeholder:text-gray-600"
                                   />
                                   <PenIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                                 </div>
                                 
                                 <button 
                                     onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                     className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl border transition-all liquid-glass-button ${showPersonaMenu || selectedPersona ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                                 >
                                     {getSelectedPersonaImage() ? (
                                         <img src={getSelectedPersonaImage()!} alt={selectedPersona!} className="w-5 h-5 rounded-full object-cover border border-white/50" />
                                     ) : (
                                         <UserIcon className="w-4 h-4" />
                                     )}
                                     <span className="text-[10px] font-black uppercase tracking-widest">{selectedPersona || 'Select Character'}</span>
                                 </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {mode === 'ANALYZE' && hasImage && (
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex justify-center gap-2 p-1 bg-gray-900/50 rounded-2xl border border-gray-800">
                        <button 
                          onClick={() => setAnalysisMode('STRATEGY')}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${analysisMode === 'STRATEGY' ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          Strategy
                        </button>
                        <button 
                          onClick={() => setAnalysisMode('DESCRIPTION')}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${analysisMode === 'DESCRIPTION' ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          Description
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* Textarea - Hidden for RECREATE, EDIT, and conditionally for ANALYZE */}
            {((mode === 'PROMPT' || mode === 'MAGIC_FIX' || mode === 'UPSCALE' || mode === 'MASTER_TITLES' || mode === 'OPTIMIZE') || 
              (mode === 'ANALYZE' && inputType !== 'URL' && analysisMode !== 'DESCRIPTION')) && (
              <div className="space-y-3">
                {recordingError && (
                    <div className="p-3 mb-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl animate-fade-in">
                        {recordingError}
                    </div>
                )}
                <div className="relative">
                  {mode === 'ANALYZE' ? (
                    <input 
                      type="text"
                      value={prompt || ''} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Enter your video title here..."
                      className="w-full h-14 bg-black/40 border rounded-2xl px-6 text-white text-base md:text-lg placeholder:text-gray-700 transition-all focus:outline-none border-gray-800/50 focus:border-cyan-500/50"
                    />
                  ) : (
                    <textarea 
                      value={prompt || ''} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder={mode === 'MASTER_TITLES' ? "Describe your video content to generate viral titles..." : mode === 'OPTIMIZE' ? "Enter your video title here..." : "Describe your thumbnail idea... (e.g., 'Surviving 50 hours in Antarctica')"}
                      className="w-full h-40 bg-black/40 border rounded-3xl p-4 md:p-6 pb-16 md:pb-20 text-white text-base md:text-lg placeholder:text-gray-700 transition-all focus:outline-none resize-none border-gray-800/50 focus:border-cyan-500/50"
                    />
                  )}
                  
                  {/* Centered 4 Icons Row - Only show if not ANALYZE */}
                  {mode !== 'ANALYZE' && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-2 md:gap-4 px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-800/50 shadow-2xl z-10">
                        
                        {/* Generate Mode Icons (5 Icons) */}
                        {(mode === 'PROMPT') && (
                        <>
                          {/* Left Group */}
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="relative">
                              <button 
                                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center justify-center overflow-hidden ${showPersonaMenu || selectedPersona ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                                  title="Character Selection"
                              >
                                  {getSelectedPersonaImage() ? (
                                      <img src={getSelectedPersonaImage()!} alt={selectedPersona!} className="w-full h-full object-cover" />
                                  ) : (
                                      <UserIcon className="w-4 h-4 md:w-5 md:h-5" />
                                  )}
                              </button>
                            </div>

                            <div className="relative">
                              <button 
                                  onClick={() => setShowChannelsMenu(!showChannelsMenu)}
                                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center justify-center overflow-hidden ${showChannelsMenu || selectedStyle ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800/50 border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/20'}`}
                                  title="Channel Style"
                              >
                                  {getSelectedStyleImage() ? (
                                      <img src={getSelectedStyleImage()!} alt={selectedStyle!} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="grid grid-cols-2 gap-0.5 w-4 h-4 md:w-5 md:h-5">
                                          <img src="https://unavatar.io/youtube/MrBeast" alt="MrBeast" className="w-full h-full object-cover rounded-tl-sm" />
                                          <img src="https://unavatar.io/youtube/DudePerfect" alt="Dude Perfect" className="w-full h-full object-cover rounded-tr-sm" />
                                          <img src="https://unavatar.io/youtube/Sidemen" alt="Sidemen" className="w-full h-full object-cover rounded-bl-sm" />
                                          <img src="https://unavatar.io/youtube/ryantrahan" alt="Ryan Trahan" className="w-full h-full object-cover rounded-br-sm" />
                                      </div>
                                  )}
                              </button>
                            </div>
                            
                            <input
                                type="file"
                                ref={objectInputRef}
                                onChange={handleObjectChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="relative">
                                <button 
                                    onClick={() => objectInputRef.current?.click()}
                                    disabled={isAnalyzingObject}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center justify-center overflow-hidden relative ${objectFile ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-800/50 border-emerald-500/30 text-emerald-400 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/20'} ${isAnalyzingObject ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Upload Object"
                                >
                                    {objectPreview ? (
                                        <img src={objectPreview} alt="Object" className="w-full h-full object-cover" />
                                    ) : (
                                        <BoxIcon className={`w-4 h-4 md:w-5 md:h-5 ${isAnalyzingObject ? 'animate-pulse' : ''}`} />
                                    )}
                                </button>
                                {showObjectSuccess && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-fade-in-up flex items-center gap-1">
                                        <CheckIcon className="w-3 h-3" /> Object Added!
                                    </div>
                                )}
                            </div>
                          </div>

                          {/* Spacer */}
                          <div className="w-px h-8 bg-gray-800 mx-2"></div>

                          {/* Right Group */}
                          <div className="flex items-center gap-2 md:gap-4">
                            <button 
                                onClick={handleEnhance}
                                disabled={isEnhancing}
                                className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon ${isEnhancing ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                                title="Enhance Prompt"
                            >
                                <MagicIcon className={`w-4 h-4 md:w-5 md:h-5 ${isEnhancing ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isTranscribing}
                                className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center gap-1.5 md:gap-2 ${isRecording || isTranscribing ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800/50 border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/20'}`}
                                title="Voice Over"
                            >
                                <MicrophoneIcon className={`w-4 h-4 md:w-5 md:h-5 ${isTranscribing ? 'animate-spin' : isRecording ? 'animate-pulse' : ''}`} />
                                {isRecording && recordingTimeLeft !== null && (
                                    <span className="text-[10px] md:text-xs font-bold font-mono">
                                        {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                )}
                            </button>
                          </div>
                        </>
                      )}

                      {/* Magic Fix / Upscale (2 Icons) */}
                      {(mode === 'MAGIC_FIX' || mode === 'UPSCALE') && (
                        <>
                          <button 
                              onClick={handleEnhance}
                              disabled={isEnhancing}
                              className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon ${isEnhancing ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800/50 border-cyan-500/30 text-cyan-400 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20'}`}
                              title="Enhance Prompt"
                          >
                              <MagicIcon className={`w-4 h-4 md:w-5 md:h-5 ${isEnhancing ? 'animate-spin' : ''}`} />
                          </button>
                          <button 
                              onClick={isRecording ? stopRecording : startRecording}
                              disabled={isTranscribing}
                              className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center gap-1.5 md:gap-2 ${isRecording || isTranscribing ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800/50 border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/20'}`}
                              title="Voice Over"
                          >
                              <MicrophoneIcon className={`w-4 h-4 md:w-5 md:h-5 ${isTranscribing ? 'animate-spin' : isRecording ? 'animate-pulse' : ''}`} />
                              {isRecording && recordingTimeLeft !== null && (
                                  <span className="text-[10px] md:text-xs font-bold font-mono">
                                      {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                                  </span>
                              )}
                          </button>
                        </>
                      )}

                      {/* Title Mode (1 Icon) */}
                      {mode === 'MASTER_TITLES' && (
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 md:p-3 rounded-xl md:rounded-2xl border transition-all liquid-glass-icon flex items-center gap-1.5 md:gap-2 ${isRecording ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800/50 border-blue-500/30 text-blue-400 hover:text-white hover:border-blue-400 hover:bg-blue-500/20'}`}
                            title="Voice Over"
                        >
                            <MicrophoneIcon className={`w-4 h-4 md:w-5 md:h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                            {isRecording && recordingTimeLeft !== null && (
                                <span className="text-[10px] md:text-xs font-bold font-mono">
                                    {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                                </span>
                            )}
                        </button>
                      )}
                  </div>
                  )}

                  {/* Redundant menus removed */}
                </div>
              </div>
            )}

            {/* Generate Button Row */}
            <div className="flex justify-center pt-4">
              <div className="flex items-center">
                <button 
                  onClick={handleTriggerGenerate} 
                  disabled={isGenerateDisabled}
                  className={`px-10 py-4 ${mode !== 'ANALYZE' ? 'rounded-l-full' : 'rounded-full'} font-black text-xl tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center gap-2 text-white ${brandGradient} hover:opacity-90`}
                >
                  <SparklesIcon className="w-6 h-6" />
                  <span>
                      {isLoading ? 'CRAFTING...' : 'Generate'}
                  </span>
                </button>
                {mode !== 'ANALYZE' && (
                  <div className="relative flex items-center">
                    <button 
                      onClick={() => setShowCountMenu(!showCountMenu)}
                      disabled={isGenerateDisabled}
                      className={`px-6 py-4 border-l border-white/20 font-black text-xl tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl flex items-center gap-1 text-white ${brandGradient} hover:opacity-90 rounded-r-full`}
                    >
                      {generationCount}x <span className="text-sm ml-1">›</span>
                    </button>

                    {showCountMenu && (
                      <div className="absolute bottom-full right-0 mb-4 w-32 bg-[#1A1A1A] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                        {getCountOptions().map(count => (
                          <button
                            key={count}
                            onClick={() => { setGenerationCount(count); setShowCountMenu(false); }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors ${generationCount === count ? 'text-cyan-400 font-bold' : 'text-white'}`}
                          >
                            {count}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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

      {/* PERSONA SELECTION MODAL */}
      <PersonaModal 
        isOpen={showPersonaMenu} 
        onClose={() => setShowPersonaMenu(false)} 
        selectedPersona={selectedPersona} 
        setSelectedPersona={setSelectedPersona} 
        famousYoutubers={FAMOUS_YOUTUBERS} 
        customCharacters={customCharacters}
        setCustomCharacters={setCustomCharacters}
        user={user}
      />

      <StylesModal 
        isOpen={showChannelsMenu}
        onClose={() => setShowChannelsMenu(false)}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
        channelCategories={CHANNEL_CATEGORIES}
        customStyles={customStyles}
        setCustomStyles={setCustomStyles}
        user={user}
      />
    </div>
  );
};

export default InputSection;
