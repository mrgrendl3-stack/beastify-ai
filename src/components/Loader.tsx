
import React, { useState, useEffect } from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [progress, setProgress] = useState(0);
  
  const isOptimizing = message.includes("OPTIMIZING") || message.includes("FIX");

  useEffect(() => {
      const progressInterval = setInterval(() => {
          setProgress(p => {
              if (p >= 99) return p;
              return p + 1;
          });
      }, 300);
      return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      {/* 16:9 Thumbnail Loader */}
      <div className={`relative w-96 md:w-[32rem] aspect-video rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-[#0a0a0a] border border-gray-800 ${isOptimizing ? 'animate-pulse' : ''}`}>
          
          {/* Progress Bar UI */}
          <div className="relative z-10 w-3/4 flex flex-col items-center gap-3">
              <span className={`${isOptimizing ? 'text-emerald-400' : 'text-cyan-400'} font-black text-3xl tracking-widest`}>{Math.round(progress)}%</span>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                      className={`h-full transition-all duration-300 ease-out ${isOptimizing ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
                      style={{ width: `${progress}%` }}
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

export default Loader;
