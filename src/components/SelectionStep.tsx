
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon, DeviceIcon, GridIcon, TrashIcon, LaptopIcon, TabletIcon, TVIcon, CompareIcon, RecycleIcon, EyeIcon, PenIcon, TextIcon, CopyIcon } from './IconComponents';
import { SparklesIcon } from 'lucide-react';
import { getPredictionScore, generateImageDescription } from '../services/geminiService';
import { AnimatedScore } from './AnimatedScore';

interface CinematicViewerProps {
    images: GeneratedImage[];
    onDelete: () => void;
    onAnalyze: (image: GeneratedImage) => void;
    onRegenerate: (image: GeneratedImage) => void;
    onZoom: (src: string) => void;
    onEdit?: (image: GeneratedImage) => void;
    onShowCTR?: (image: GeneratedImage) => void;
}

const CinematicViewer: React.FC<CinematicViewerProps> = ({ images, onDelete, onAnalyze, onRegenerate, onZoom, onEdit, onShowCTR }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    const [showDevices, setShowDevices] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'phone' | 'tv'>('desktop');
    const [imgError, setImgError] = useState(false);
    
    // Description Logic
    const [description, setDescription] = useState<string | null>(null);
    const [isDescribing, setIsDescribing] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Comparison Logic
    const [isComparing, setIsComparing] = useState(false);
    const [comparePos, setComparePos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageWrapperRef = useRef<HTMLDivElement>(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);

    const activeImage = images[selectedIndex] || images[0];
    
    const getPseudoScore = (id: string) => {
        if (!id) return 55;
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash % 40) + 55;
    }
    
    const score = activeImage ? (activeImage.predictedCtr || getPseudoScore(activeImage.id)) : 55;
    const realistic = getPredictionScore(score);

    const handleDescribe = async () => {
        if (!activeImage || isDescribing) return;
        setIsDescribing(true);
        setDescription(null);
        setCopied(false);
        try {
            // Extract base64 and mime
            let base64 = "";
            let mime = "image/jpeg";
            if (activeImage.src.startsWith('data:')) {
                base64 = activeImage.src.split(',')[1];
                mime = activeImage.src.split(':')[1].split(';')[0];
            } else {
                // If it's a URL, we'd need to fetch it to base64, but assuming it's data URI for now
                // or we can just use a placeholder if it fails
                base64 = activeImage.src; // This might fail if it's a real URL without urlToBase64
            }
            
            const desc = await generateImageDescription(base64, mime);
            setDescription(desc);
        } catch (error) {
            console.error("Failed to describe image", error);
            setDescription("Failed to generate description.");
        } finally {
            setIsDescribing(false);
        }
    };

    const handleCopyDescription = () => {
        if (description) {
            navigator.clipboard.writeText(description);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (!imageWrapperRef.current || !activeImage) return;
        const updateWidth = () => {
             if (imageWrapperRef.current) {
                 setWrapperWidth(imageWrapperRef.current.clientWidth);
             }
        };
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(imageWrapperRef.current);
        return () => observer.disconnect();
    }, [isComparing, activeImage, showDevices]);

    if (!activeImage) return null;

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isComparing || !imageWrapperRef.current) return;
        let clientX;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setComparePos((x / rect.width) * 100);
    };

    return (
        <div className="w-full max-w-6xl mx-auto mt-12 animate-fade-in-up">
            
            <div 
                className="relative glass-panel rounded-[3rem] overflow-hidden shadow-2xl group select-none border-4 border-gray-800/50"
                ref={containerRef}
            >
                {/* FLOATING CTR BADGE */}
                <button 
                    onClick={() => activeImage.predictedCtr !== undefined && onShowCTR && onShowCTR(activeImage)}
                    className="absolute top-4 left-4 z-40 px-4 py-2 rounded-xl transition-all active:scale-95 group flex flex-col items-center justify-center"
                >
                    {activeImage.predictedCtr === undefined ? (
                        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-cyan-400 tracking-wider drop-shadow-md">ANALYZING...</span>
                        </div>
                    ) : (
                        <span className={`text-4xl md:text-5xl font-black leading-none tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${realistic.color}`}>
                            {realistic.score}
                        </span>
                    )}
                </button>

                <div 
                    ref={imageWrapperRef}
                    className="aspect-video relative w-full flex items-center justify-center bg-[#050505] overflow-hidden cursor-zoom-in group"
                    onClick={() => onZoom(activeImage.src)}
                >
                    {!imgError ? (
                        <>
                            <img src={activeImage.src} alt="Generated Thumbnail" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-[2.8rem]" onError={() => setImgError(true)} />
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30 rounded-[2.8rem] pointer-events-none" />
                            <button 
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-gray-900/90 border border-gray-700 rounded-full text-white hover:text-cyan-400 hover:border-cyan-400 hover:scale-110 active:scale-95 transition-all shadow-2xl opacity-0 group-hover:opacity-100 z-40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a'); 
                                    link.href = activeImage.src; 
                                    link.download = `beast-thumb-${activeImage.id}.png`; 
                                    link.click();
                                }}
                                title="Download"
                            >
                                <DownloadIcon className="w-8 h-8 pointer-events-none" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500"><div className="text-4xl mb-2">⚠️</div><p>Image Load Failed</p></div>
                    )}

                    {showGrid && !isComparing && (
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-20">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="border border-white/40 shadow-[inset_0_0_1px_rgba(255,255,255,0.2)]"></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-[#050505] p-4 flex flex-col md:flex-row items-center justify-between border-t border-gray-800 gap-4">
                    <div className="flex items-center space-x-2">
                        <button className="flex items-center justify-center w-10 h-10 btn-glass text-gray-400 hover:text-white rounded-lg transition liquid-glass-icon" onClick={() => {const link = document.createElement('a'); link.href = activeImage.src; link.download = `beast-thumb-${activeImage.id}.png`; link.click();}} title="Download"><DownloadIcon className="w-5 h-5" /></button>
                        
                        {onEdit && (
                            <button onClick={() => onEdit(activeImage)} className="flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass text-gray-400 hover:text-cyan-400 liquid-glass-icon" title="Edit"><PenIcon className="w-5 h-5" /></button>
                        )}
                        
                        <button onClick={() => setShowDevices(true)} className="flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass text-gray-400 hover:text-cyan-400 liquid-glass-icon" title="Device Preview"><DeviceIcon className="w-5 h-5" /></button>

                        <button onClick={handleDescribe} disabled={isDescribing} className={`flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass liquid-glass-icon ${isDescribing ? 'text-cyan-400 animate-pulse' : 'text-gray-400 hover:text-cyan-400'}`} title="Describe Image"><TextIcon className="w-5 h-5" /></button>

                        <button onClick={() => onRegenerate(activeImage)} className="flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass text-gray-400 hover:text-cyan-400 liquid-glass-icon" title="Regenerate"><RecycleIcon className="w-5 h-5" /></button>

                        {onShowCTR && (
                            <button onClick={() => onShowCTR(activeImage)} className="flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass text-gray-400 hover:text-cyan-400 liquid-glass-icon" title="Viral Fix / Metrics"><SparklesIcon className="w-5 h-5" /></button>
                        )}
                    </div>
                </div>
            </div>

            {images.length > 1 && (
                <div className="mt-4 flex gap-4 overflow-x-auto pb-4 justify-center">
                    {images.map((img, idx) => (
                         <div key={img.id} onClick={() => { setSelectedIndex(idx); setImgError(false); setIsComparing(false); }} className={`relative h-24 aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition hover:scale-105 ${selectedIndex === idx ? 'border-cyan-500 shadow-lg' : 'border-gray-800 opacity-60'}`}>
                             <img src={img.src} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                             {selectedIndex === idx && (<div className="absolute inset-0 bg-cyan-500/10"></div>)}
                             {img.predictedCtr === undefined && (
                                 <div className="absolute top-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-cyan-400 flex items-center gap-1 border border-white/10">
                                     <div className="w-2 h-2 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                     ANALYZING
                                 </div>
                             )}
                             {img.predictedCtr !== undefined && (
                                 <div className="absolute top-1 left-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                                     <AnimatedScore targetScore={parseInt(getPredictionScore(img.predictedCtr).score)} />
                                 </div>
                             )}
                         </div>
                    ))}
                </div>
            )}

            {showDevices && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-8 backdrop-blur-md overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <div className="liquid-glass-icon p-2 rounded-xl">
                                    <DeviceIcon className="w-6 h-6" />
                                </div> 
                                Preview Lab
                            </h2>
                            <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                                {['desktop', 'tablet', 'phone', 'tv'].map((device) => (
                                    <button
                                        key={device}
                                        onClick={() => setSelectedDevice(device as any)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm capitalize transition-all ${
                                            selectedDevice === device 
                                                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {device}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button className="text-gray-400 hover:text-white text-4xl" onClick={() => setShowDevices(false)}>&times;</button>
                    </div>
                    <div className="flex-1 overflow-y-auto pb-8 flex items-center justify-center">
                        {selectedDevice === 'phone' && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <div className="w-[300px] border-8 border-gray-800 rounded-[3rem] overflow-hidden bg-white shadow-xl relative">
                                     <div className="bg-white h-[600px] pt-12 px-4">
                                         <div className="bg-gray-200 h-40 rounded-xl mb-4 overflow-hidden relative">
                                            <img src={activeImage.src} className="w-full h-full object-cover" />
                                         </div>
                                         <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded"></div>
                                         <div className="h-4 bg-gray-200 w-1/2 mb-8 rounded"></div>
                                     </div>
                                </div>
                                <span className="mt-4 text-gray-400 text-sm">Mobile Feed</span>
                            </div>
                        )}
                        {selectedDevice === 'tablet' && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <div className="w-[500px] border-8 border-gray-800 rounded-3xl overflow-hidden bg-white shadow-xl">
                                    <div className="bg-white h-[350px] p-4">
                                        <div className="bg-gray-200 aspect-video rounded-2xl mb-2 overflow-hidden"><img src={activeImage.src} className="w-full h-full object-cover" /></div>
                                        <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded"></div>
                                        <div className="h-4 bg-gray-200 w-1/2 mb-8 rounded"></div>
                                    </div>
                                </div>
                                <span className="mt-4 text-gray-400 text-sm">Tablet View</span>
                            </div>
                        )}
                        {selectedDevice === 'desktop' && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <div className="w-[800px] border-8 border-gray-800 rounded-xl overflow-hidden bg-[#0f0f0f] shadow-xl">
                                    <div className="h-8 bg-gray-900 flex items-center px-4 gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="p-6 grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <div className="bg-gray-800 aspect-video rounded-xl mb-4 overflow-hidden"><img src={activeImage.src} className="w-full h-full object-cover" /></div>
                                            <div className="h-6 bg-gray-800 w-3/4 mb-2 rounded"></div>
                                            <div className="h-4 bg-gray-800 w-1/4 rounded"></div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex gap-2">
                                                    <div className="w-40 aspect-video bg-gray-800 rounded-lg"></div>
                                                    <div className="flex-1">
                                                        <div className="h-4 bg-gray-800 w-full mb-2 rounded"></div>
                                                        <div className="h-3 bg-gray-800 w-1/2 rounded"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="mt-4 text-gray-400 text-sm">Desktop View</span>
                            </div>
                        )}
                        {selectedDevice === 'tv' && (
                            <div className="flex flex-col items-center animate-fade-in">
                                <div className="w-[1000px] border-[16px] border-gray-900 rounded-xl overflow-hidden bg-[#0f0f0f] shadow-2xl relative">
                                    <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-40 h-4 bg-gray-800 rounded-b-xl"></div>
                                    <div className="p-12 flex flex-col items-center justify-center h-[562px]">
                                        <div className="w-full max-w-3xl aspect-video bg-gray-800 rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 border-white/10"><img src={activeImage.src} className="w-full h-full object-cover" /></div>
                                        <div className="h-8 bg-gray-800 w-1/2 rounded mb-4"></div>
                                        <div className="h-4 bg-gray-800 w-1/4 rounded"></div>
                                    </div>
                                </div>
                                <span className="mt-4 text-gray-400 text-sm">TV / Big Screen</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {description && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
                        <button 
                            onClick={() => setDescription(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            &times;
                        </button>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <TextIcon className="w-6 h-6 text-cyan-400" /> Image Description
                        </h3>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">
                            {description}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleCopyDescription}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition"
                            >
                                <CopyIcon className="w-5 h-5" />
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CinematicViewer;
