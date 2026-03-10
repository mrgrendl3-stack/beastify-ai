
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
  
  const isCycling = message.includes("CRAFTING") || message.includes("MODIFYING") || message.includes("VARIANTS");

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

  const displayMessage = (isCycling && cycleIndex !== null) ? MESSAGES[cycleIndex] : message;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
          <div className="absolute inset-2 border-4 border-transparent border-l-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
          
          {/* Pulsing Core */}
          <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
      </div>
      
      <p className="mt-8 text-2xl font-black text-white tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
          {displayMessage}
      </p>
      
      <div className="mt-3 flex gap-1">
          <div className="w-16 h-1 bg-cyan-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 animate-loading-bar"></div>
          </div>
          <div className="w-4 h-1 bg-purple-900 rounded-full overflow-hidden">
               <div className="h-full bg-purple-400 animate-loading-bar" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="w-2 h-1 bg-pink-900 rounded-full overflow-hidden">
               <div className="h-full bg-pink-400 animate-loading-bar" style={{ animationDelay: '0.4s' }}></div>
          </div>
      </div>

      <style>{`
        @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
            animation: loading-bar 1s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default Loader;
