import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
        setSliderPosition(percent);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            handleMove(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;
            handleMove(e.touches[0].clientX);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', () => setIsDragging(false));
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', () => setIsDragging(false));
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', () => setIsDragging(false));
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', () => setIsDragging(false));
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', () => setIsDragging(false));
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', () => setIsDragging(false));
        };
    }, [isDragging, handleMove]);

    return (
        <div 
            ref={containerRef}
            className="relative w-full aspect-video rounded-3xl overflow-hidden select-none cursor-ew-resize border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            onMouseDown={(e) => {
                setIsDragging(true);
                handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
                setIsDragging(true);
                handleMove(e.touches[0].clientX);
            }}
        >
            {/* After Image (Background) */}
            <img 
                src={afterImage} 
                alt="After" 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            
            {/* Before Image (Foreground, clipped) */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img 
                    src={beforeImage} 
                    alt="Before" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `calc(${sliderPosition}% - 2px)` }}
            >
                <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider pointer-events-none">
                Before
            </div>
            <div className="absolute top-4 right-4 bg-emerald-500/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider pointer-events-none">
                After
            </div>
        </div>
    );
};

export default BeforeAfterSlider;
