
import React, { useState, useEffect } from 'react';

interface LoaderProps {
  message: string;
}

const MESSAGES = [
    "ANALYZING FACIAL GEOMETRY...",
    "CALCULATING VIRAL VECTORS...",
    "INJECTING MRBEAST DNA...",
    "OPTIMIZING CTR METRICS...",
    "RENDERING FINAL PIXELS..."
];

const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [cycleIndex, setCycleIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  
  const isCycling = message.includes("CRAFTING") || message.includes("MODIFYING") || message.includes("VARIANTS");
  const isOptimizing = message.includes("OPTIMIZING") || message.includes("FIX");

  useEffect(() => {
      let interval: any;
      
      if (isCycling) {
          setTimeout(() => setCycleIndex(0), 0);
          interval = setInterval(() => {
              setCycleIndex(prev => (prev === null ? 0 : (prev + 1) % MESSAGES.length));
          }, 1500);
      } else {
          setTimeout(() => setCycleIndex(null), 0);
      }

      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isCycling]);

  useEffect(() => {
      const progressInterval = setInterval(() => {
          setProgress(p => {
              if (p >= 99) return p;
              return p + 1;
          });
      }, 300);
      return () => clearInterval(progressInterval);
  }, []);

  const displayMessage = (isCycling && cycleIndex !== null) ? MESSAGES[cycleIndex] : message;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      {/* 16:9 Thumbnail Loader */}
      <div className={`relative w-96 md:w-[32rem] aspect-video rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-[#0a0a0a] border border-gray-800 ${isOptimizing ? 'animate-pulse' : ''}`}>
          {/* Animation Effect */}
          {!isOptimizing ? (
              <div className="absolute inset-x-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1)] animate-scan z-0" />
          ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 animate-[pulse_2s_ease-in-out_infinite] z-0" />
          )}
          
          {/* Subtle background pulse */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 animate-pulse" />
          
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
      
      <p className={`mt-8 text-2xl font-black text-white tracking-widest uppercase animate-pulse ${isOptimizing ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`}>
          {displayMessage}
      </p>
    </div>
  );
};

export default Loader;
