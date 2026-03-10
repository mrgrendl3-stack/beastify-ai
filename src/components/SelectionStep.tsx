
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { DownloadIcon, DeviceIcon, GridIcon, TrashIcon, LaptopIcon, TabletIcon, TVIcon, CompareIcon, RecycleIcon, EyeIcon } from './IconComponents';
import { getPredictionScore } from '../services/geminiService';

interface CinematicViewerProps {
    images: GeneratedImage[];
    onDelete: () => void;
    onAnalyze: (image: GeneratedImage) => void;
    onRegenerate: (image: GeneratedImage) => void;
    onZoom: (src: string) => void;
}

const CinematicViewer: React.FC<CinematicViewerProps> = ({ images, onDelete, onAnalyze, onRegenerate, onZoom }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showGrid, setShowGrid] = useState(false);
    const [showDevices, setShowDevices] = useState(false);
    const [imgError, setImgError] = useState(false);
    
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
                <div 
                    ref={imageWrapperRef}
                    className="aspect-video relative w-full flex items-center justify-center bg-[#050505] overflow-hidden cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onClick={() => onZoom(activeImage.src)}
                >
                    {!imgError ? (
                        <>
                            <img src={activeImage.src} alt="Generated Thumbnail" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-[2.8rem]" onError={() => setImgError(true)} />
                            
                            {isComparing && activeImage.originalSrc && (
                                <div className="absolute inset-y-0 left-0 overflow-hidden border-r border-cyan-400 z-10 rounded-l-[2.8rem]" style={{ width: `${comparePos}%` }}>
                                    <div className="relative h-full" style={{ width: wrapperWidth ? `${wrapperWidth}px` : '100vw' }}>
                                        <img src={activeImage.originalSrc} alt="Original" className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-l-[2.8rem]" />
                                    </div>
                                </div>
                            )}
                             {isComparing && activeImage.originalSrc && (
                                <div className="absolute inset-y-0 w-0.5 bg-cyan-400 cursor-col-resize z-30 shadow-[0_0_15px_rgba(34,211,238,0.8)] flex items-center justify-center pointer-events-none" style={{ left: `${comparePos}%` }}>
                                    <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-2xl transform -translate-x-1/2">
                                        <CompareIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            )}
                            {isComparing && activeImage.originalSrc && (
                                <>
                                    <div className="absolute bottom-4 left-4 z-40 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded font-bold pointer-events-none border border-white/20">ORIGINAL</div>
                                    <div className="absolute bottom-4 right-4 z-40 bg-cyan-900/80 backdrop-blur text-cyan-400 text-[10px] px-2 py-1 rounded font-bold pointer-events-none border border-cyan-500/30">BEASTIFIED</div>
                                </>
                            )}
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
                        <button className="flex items-center justify-center w-10 h-10 btn-glass text-gray-400 hover:text-white rounded-lg transition" onClick={() => {const link = document.createElement('a'); link.href = activeImage.src; link.download = `beast-thumb-${activeImage.id}.png`; link.click();}} title="Download"><DownloadIcon className="w-5 h-5" /></button>
                        
                        <button onClick={() => setShowGrid(!showGrid)} className={`flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass ${showGrid ? 'btn-glass-active text-cyan-400' : 'text-gray-400'}`} title="Grid"><GridIcon className="w-5 h-5" /></button>
                        
                        <button onClick={() => onRegenerate(activeImage)} className="flex items-center justify-center w-10 h-10 rounded-lg transition btn-glass text-gray-400 hover:text-cyan-400" title="Regenerate"><RecycleIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            {images.length > 1 && (
                <div className="mt-4 flex gap-4 overflow-x-auto pb-4 justify-center">
                    {images.map((img, idx) => (
                         <div key={img.id} onClick={() => { setSelectedIndex(idx); setImgError(false); setIsComparing(false); }} className={`relative h-24 aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition hover:scale-105 ${selectedIndex === idx ? 'border-cyan-500 shadow-lg' : 'border-gray-800 opacity-60'}`}>
                             <img src={img.src} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                             {selectedIndex === idx && (<div className="absolute inset-0 bg-cyan-500/10"></div>)}
                         </div>
                    ))}
                </div>
            )}

            {showDevices && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-8 backdrop-blur-md overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><DeviceIcon className="w-6 h-6" /> Preview Lab</h2>
                        <button className="text-gray-400 hover:text-white text-4xl" onClick={() => setShowDevices(false)}>&times;</button>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-auto pb-8">
                        <div className="flex items-center gap-12 min-w-max px-8">
                            {/* iPhone Mockup */}
                            <div className="flex flex-col items-center">
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
                            {/* Tablet Mockup */}
                            <div className="flex flex-col items-center">
                                <div className="w-[500px] border-8 border-gray-800 rounded-3xl overflow-hidden bg-white shadow-xl">
                                    <div className="bg-white h-[350px] p-4">
                                        <div className="bg-gray-200 aspect-video rounded-2xl mb-2 overflow-hidden"><img src={activeImage.src} className="w-full h-full object-cover" /></div>
                                    </div>
                                </div>
                                <span className="mt-4 text-gray-400 text-sm">Tablet View</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CinematicViewer;
