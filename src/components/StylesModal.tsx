import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PlusIcon, TrashIcon, SparklesIcon } from './IconComponents';
import { User } from 'firebase/auth';
import { saveCustomStyle, deleteCustomStyle } from '../firebase';
import { fetchFullChannelData, fetchRecentVideos, YouTubeChannel, YouTubeVideo } from '../services/youtubeService';
import { analyzeStyleFromImages } from '../services/geminiService';

interface CustomStyle {
  id: string;
  name: string;
  images: string[];
  status?: 'PROCESSING' | 'READY';
  avatar?: string;
}

interface StylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStyle: string | null;
  setSelectedStyle: (style: string | null) => void;
  channelCategories: any[];
  customStyles: CustomStyle[];
  setCustomStyles: React.Dispatch<React.SetStateAction<CustomStyle[]>>;
  user: User | null;
}

type ModalView = 'MAIN' | 'CREATE_STYLE' | 'SELECT_VIDEOS';
type CreateTab = 'YOUTUBE' | 'UPLOAD';

const StylesModal: React.FC<StylesModalProps> = ({
  isOpen,
  onClose,
  selectedStyle,
  setSelectedStyle,
  channelCategories,
  customStyles,
  setCustomStyles,
  user
}) => {
  const [view, setView] = useState<ModalView>('MAIN');
  const [mainTab, setMainTab] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [createTab, setCreateTab] = useState<CreateTab>('YOUTUBE');
  const [videoTab, setVideoTab] = useState<'RECENT' | 'POPULAR' | 'SHORTS'>('RECENT');
  
  // Create Style State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessingChannel, setIsProcessingChannel] = useState(false);
  const [channelError, setChannelError] = useState('');
  const [fetchedChannel, setFetchedChannel] = useState<YouTubeChannel | null>(null);
  const [fetchedVideos, setFetchedVideos] = useState<YouTubeVideo[]>([]);
  const [styleName, setStyleName] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetCreateState = () => {
    setYoutubeUrl('');
    setIsProcessingChannel(false);
    setChannelError('');
    setFetchedChannel(null);
    setFetchedVideos([]);
    setStyleName('');
    setUploadedImages([]);
    setSelectedVideos([]);
    setIsGenerating(false);
    setCreateTab('YOUTUBE');
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView('MAIN');
      setMainTab('PUBLIC');
      resetCreateState();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      const remainingSlots = 3 - uploadedImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === filesToProcess.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinueYoutube = async () => {
    if (!youtubeUrl) return;
    setIsProcessingChannel(true);
    setChannelError('');
    
    const { channel, error } = await fetchFullChannelData(youtubeUrl);
    
    if (error || !channel) {
        setChannelError(error || "Failed to fetch channel");
        setIsProcessingChannel(false);
        return;
    }

    setFetchedChannel(channel);
    
    const videos = await fetchRecentVideos(channel.uploadsPlaylistId);
    setFetchedVideos(videos);
    
    setIsProcessingChannel(false);
    setView('SELECT_VIDEOS');
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else if (prev.length < 3) {
        return [...prev, videoId];
      }
      return prev;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    let newStyle: CustomStyle;
    const uniqueId = crypto.randomUUID();
    
    if (createTab === 'YOUTUBE' && fetchedChannel) {
      const selectedThumbnails = fetchedVideos
        .filter(v => selectedVideos.includes(v.id))
        .map(v => v.thumbnail);
        
      newStyle = {
        id: uniqueId,
        name: fetchedChannel.name,
        images: selectedThumbnails,
        avatar: fetchedChannel.avatar,
        status: 'PROCESSING'
      };
    } else {
      newStyle = {
        id: uniqueId,
        name: styleName,
        images: uploadedImages,
        status: 'PROCESSING'
      };
    }

    setCustomStyles(prev => [...prev, newStyle]);
    setIsGenerating(false);
    setView('MAIN');
    setMainTab('PRIVATE');
    
    // Actually process the style
    processStyle(newStyle.id, newStyle);
  };

  const processStyle = async (id: string, newStyle: CustomStyle) => {
    try {
        // Convert images to base64 if they are URLs (for YouTube)
        // For uploaded images, they are already base64
        const base64Images = await Promise.all(newStyle.images.map(async (img) => {
            if (img.startsWith('http')) {
                // Fetch and convert to base64
                const response = await fetch(img);
                const blob = await response.blob();
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
            return img;
        }));

        const stylePrompt = await analyzeStyleFromImages(base64Images);
        
        const readyStyle = { ...newStyle, status: 'READY' as const, stylePrompt };
        setCustomStyles(prev => prev.map(style => 
          style.id === id ? readyStyle : style
        ));
        if (user) {
            saveCustomStyle(user.uid, readyStyle).catch(console.error);
        }
    } catch (error) {
        console.error("Failed to process style:", error);
        // Fallback to ready without style prompt if it fails
        const readyStyle = { ...newStyle, status: 'READY' as const };
        setCustomStyles(prev => prev.map(style => 
          style.id === id ? readyStyle : style
        ));
        if (user) {
            saveCustomStyle(user.uid, readyStyle).catch(console.error);
        }
    }
  };

  const handleDeleteStyle = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setCustomStyles(prev => prev.filter(s => s.id !== id));
    if (selectedStyle === name) {
      setSelectedStyle(null);
    }
    if (user) {
        deleteCustomStyle(user.uid, id).catch(console.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
          {view === 'MAIN' ? (
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Styles</h2>
            </div>
          ) : (
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {view === 'CREATE_STYLE' ? 'Create Your Style' : 'Select Videos'}
                </h2>
              </div>
            </div>
          )}
          
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors p-2 bg-gray-900 rounded-full absolute right-6 top-6">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* MAIN VIEW */}
          {view === 'MAIN' && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-4 p-1 bg-gray-900 rounded-2xl">
                <button 
                  onClick={() => setMainTab('PUBLIC')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'PUBLIC' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <span className="text-lg">🌐</span> Public
                </button>
                <button 
                  onClick={() => setMainTab('PRIVATE')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${mainTab === 'PRIVATE' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <span className="text-lg">🔒</span> Private
                </button>
              </div>

              {mainTab === 'PUBLIC' ? (
                <div className="space-y-6">
                  {channelCategories.map(cat => (
                    <div key={cat.name} className="space-y-4 bg-[#141414] p-4 rounded-2xl border border-gray-800">
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-800 pb-2">{cat.name}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {cat.channels.map((ch: any) => (
                          <button 
                            key={ch.name}
                            onClick={() => {
                              setSelectedStyle(ch.name);
                              handleClose();
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all border group ${selectedStyle === ch.name ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#1A1A1A] border-gray-800 hover:border-gray-700 hover:bg-[#222]'}`}
                          >
                            <img src={ch.image} alt={ch.name} className="w-10 h-10 rounded-full border border-white/10 object-cover shadow-lg" />
                            <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors text-left leading-tight">{ch.name}</span>
                            {selectedStyle === ch.name && (
                              <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <CheckIcon className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {customStyles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-gray-400 text-lg font-medium mb-8">Create your first style<br/>to get started.</p>
                      <button 
                        onClick={() => setView('CREATE_STYLE')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#222] border border-gray-700 rounded-xl text-white font-bold transition-all"
                      >
                        <PlusIcon className="w-5 h-5" /> Create Style
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {customStyles.map(style => (
                          <button 
                            key={style.id}
                            disabled={style.status === 'PROCESSING'}
                            onClick={() => {
                              if (style.status === 'READY') {
                                setSelectedStyle(style.name);
                                handleClose();
                              }
                            }}
                            className={`flex items-center justify-between p-4 rounded-2xl transition-all border group ${
                              selectedStyle === style.name 
                                ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                                : style.status === 'PROCESSING'
                                  ? 'bg-[#141414] border-gray-800 opacity-70 cursor-not-allowed'
                                  : 'bg-[#1A1A1A] border-gray-800 hover:border-gray-700 hover:bg-[#222]'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10">
                                {style.avatar ? (
                                  <img src={style.avatar} alt={style.name} className={`w-full h-full object-cover ${style.status === 'PROCESSING' ? 'blur-sm' : ''}`} />
                                ) : (
                                  <div className="flex w-full h-full">
                                    {style.images.slice(0, 2).map((img, i) => (
                                      <img key={i} src={img} alt="" className={`w-1/2 h-full object-cover ${style.status === 'PROCESSING' ? 'blur-sm' : ''}`} />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="text-lg font-bold text-white">{style.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {style.status === 'PROCESSING' ? (
                                <div className="px-4 py-1.5 bg-black/50 rounded-full border border-gray-800 flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-400">Processing..</span>
                                  <div className="w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                                </div>
                              ) : (
                                <>
                                  {selectedStyle === style.name && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <CheckIcon className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  <button 
                                    onClick={(e) => handleDeleteStyle(e, style.id, style.name)}
                                    className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <TrashIcon className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-center mt-6">
                        <button 
                          onClick={() => setView('CREATE_STYLE')}
                          className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#222] border border-gray-700 rounded-xl text-white font-bold transition-all"
                        >
                          <PlusIcon className="w-5 h-5" /> Create Style
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CREATE STYLE VIEW */}
          {view === 'CREATE_STYLE' && (
            <div className="space-y-8 mt-4">
              {/* Create Tabs */}
              <div className="flex gap-4 p-1 bg-gray-900 rounded-2xl">
                <button 
                  onClick={() => setCreateTab('YOUTUBE')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${createTab === 'YOUTUBE' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <span className="text-lg text-red-500">▶</span> YouTube Channel
                </button>
                <button 
                  onClick={() => setCreateTab('UPLOAD')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${createTab === 'UPLOAD' ? 'bg-[#1A1A1A] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <span className="text-lg text-blue-400">☁️</span> Upload Thumbnails
                </button>
              </div>

              {createTab === 'YOUTUBE' ? (
                <div className="space-y-6 flex flex-col items-center">
                  <input 
                    type="text" 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="Enter YouTube channel URL or username (e.g. @channel)"
                    className="w-full bg-[#1A1A1A] border border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center"
                  />
                  {channelError && (
                    <p className="text-red-400 text-sm mt-2">{channelError}</p>
                  )}
                  
                  <button 
                    onClick={handleContinueYoutube}
                    disabled={!youtubeUrl || isProcessingChannel}
                    className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center gap-2 ${
                      !youtubeUrl 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : isProcessingChannel
                          ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                          : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                    }`}
                  >
                    {isProcessingChannel ? 'Processing..' : 'Continue →'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <input 
                    type="text" 
                    value={styleName}
                    onChange={(e) => setStyleName(e.target.value)}
                    placeholder="What's your Style's name?"
                    className="w-full bg-[#1A1A1A] border border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-center"
                  />
                  
                  <div className="w-full border-2 border-dashed border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-xl text-blue-400">☁️</span>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">Upload exactly 3 thumbnails</p>
                      <p className="text-gray-500 text-sm mt-1">PNG, JPG, JPEG & WebP formats, up to 4 MB.</p>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-4 mt-4">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-700 group">
                            <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <TrashIcon className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                        ))}
                        {uploadedImages.length < 3 && (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center hover:border-blue-500 transition-colors"
                          >
                            <PlusIcon className="w-6 h-6 text-gray-500" />
                          </button>
                        )}
                      </div>
                    )}
                    
                    {uploadedImages.length === 0 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-sm font-medium transition-colors"
                      >
                        Browse Files
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={!styleName || uploadedImages.length !== 3 || isGenerating}
                    className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center gap-2 ${
                      !styleName || uploadedImages.length !== 3
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : isGenerating
                          ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                          : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <SparklesIcon className="w-5 h-5 animate-pulse" /> Generating..
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" /> Generate
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SELECT VIDEOS VIEW */}
          {view === 'SELECT_VIDEOS' && fetchedChannel && (
            <div className="space-y-6">
              {/* Channel Info */}
              <div className="flex items-center gap-4 mb-8">
                <img src={fetchedChannel.avatar} alt={fetchedChannel.name} className="w-20 h-20 rounded-full border-2 border-white/10 object-cover" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-white">{fetchedChannel.name}</h3>
                    <span className="text-gray-500">✏️</span>
                  </div>
                  <p className="text-gray-400 text-sm">{fetchedChannel.subscribers} subscribers • {fetchedChannel.videosCount} videos</p>
                </div>
              </div>

              {/* Video Tabs */}
              <div className="flex gap-3 mb-6">
                <button 
                  onClick={() => setVideoTab('RECENT')}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${videoTab === 'RECENT' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-[#1A1A1A] text-gray-400 border border-gray-800 hover:text-white'}`}
                >
                  Recent
                </button>
                <button 
                  onClick={() => setVideoTab('POPULAR')}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${videoTab === 'POPULAR' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-[#1A1A1A] text-gray-400 border border-gray-800 hover:text-white'}`}
                >
                  Popular
                </button>
                <button 
                  onClick={() => setVideoTab('SHORTS')}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2 ${videoTab === 'SHORTS' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-[#1A1A1A] text-gray-400 border border-gray-800 hover:text-white'}`}
                >
                  Shorts
                </button>
              </div>

              {/* Video List */}
              <div className="space-y-4">
                {fetchedVideos
                  .filter(v => videoTab === 'SHORTS' ? v.isShort : (videoTab === 'RECENT' || videoTab === 'POPULAR' ? !v.isShort : true))
                  .sort((a, b) => videoTab === 'POPULAR' ? b.rawViews - a.rawViews : 0)
                  .map(video => {
                  const isSelected = selectedVideos.includes(video.id);
                  return (
                    <div 
                      key={video.id}
                      onClick={() => toggleVideoSelection(video.id)}
                      className={`rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="relative aspect-video bg-gray-900">
                        <img src={video.thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                        
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                          {video.duration}
                        </div>
                        
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center border-2 border-cyan-400">
                              <CheckIcon className="w-6 h-6 text-cyan-400" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-[#141414]">
                        <h4 className="text-white font-bold mb-1 line-clamp-1">{video.title}</h4>
                        <p className="text-gray-500 text-sm">{video.views} views</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Action */}
              <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-cyan-400">📄</span>
                  <p className="text-white font-medium">Select exactly 3 videos for your Style.</p>
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={selectedVideos.length !== 3 || isGenerating}
                  className={`px-8 py-3 rounded-full font-bold text-lg transition-all flex items-center gap-2 ${
                    selectedVideos.length !== 3
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : isGenerating
                        ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                        : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <SparklesIcon className="w-5 h-5 animate-pulse" /> Generating..
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" /> Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StylesModal;
