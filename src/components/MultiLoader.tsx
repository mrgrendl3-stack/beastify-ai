import React, { useState, useEffect } from 'react';

interface MultiLoaderProps {
    count: number;
}

const MultiLoader: React.FC<MultiLoaderProps> = ({ count }) => {
    const [progresses, setProgresses] = useState<number[]>(Array(count).fill(0));

    useEffect(() => {
        const intervals = Array(count).fill(0).map((_, i) => {
            const speed = 100 + Math.random() * 150;
            return setInterval(() => {
                setProgresses(prev => {
                    const newP = [...prev];
                    if (newP[i] < 99) {
                        const increment = newP[i] > 80 ? 0.2 : (newP[i] > 50 ? 0.5 : 1);
                        newP[i] = Math.min(99, newP[i] + increment);
                    }
                    return newP;
                });
            }, speed);
        });

        return () => intervals.forEach(clearInterval);
    }, [count]);

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            {progresses.map((p, i) => (
                <div key={i} className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-[#2a2a2a] @container shadow-2xl">
                    {/* Base layer */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8rem] md:text-[12rem] font-black text-white/20 tracking-tighter leading-none">
                            {Math.floor(p)}%
                        </span>
                    </div>
                    
                    {/* Progress layer */}
                    <div 
                        className="absolute inset-y-0 left-0 bg-[#10b981] overflow-hidden transition-all duration-300 ease-out"
                        style={{ width: `${p}%` }}
                    >
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center w-[100cqw]">
                            <span className="text-[8rem] md:text-[12rem] font-black text-black/20 tracking-tighter leading-none">
                                {Math.floor(p)}%
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MultiLoader;
