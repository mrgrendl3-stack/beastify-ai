import React, { useState } from 'react';
import { XIcon, LightbulbIcon, EyeIcon, MousePointerClickIcon, SmileIcon, SparklesIcon, HelpCircleIcon, MinimizeIcon, SmartphoneIcon, TypeIcon } from 'lucide-react';

interface Pillar {
  name: string;
  score: number;
  reasoning: string;
}

interface CTRModalProps {
  onClose: () => void;
  imageUrl: string;
  ctrScore: number;
  pillars: Pillar[];
  onViralFix?: () => void;
}

const PILLAR_ICONS: Record<string, React.ElementType> = {
  'Clarity': EyeIcon,
  'Emotion': SmileIcon,
  'Curiosity': HelpCircleIcon,
  'Virality': SparklesIcon,
  'Idea': LightbulbIcon,
  'Simplicity': MinimizeIcon,
  'Mobile Readability': SmartphoneIcon,
  'Title Match': TypeIcon,
  'Contrast': SparklesIcon,
  'Relevance': LightbulbIcon,
  'Clickability': MousePointerClickIcon,
};

const getBarColor = (index: number) => {
  if (index < 2) return 'bg-red-500';
  if (index < 4) return 'bg-orange-500';
  if (index < 6) return 'bg-yellow-500';
  if (index < 8) return 'bg-lime-500';
  return 'bg-emerald-500';
};

const PillarRow = ({ pillar }: { pillar: Pillar }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = PILLAR_ICONS[pillar.name] || LightbulbIcon;
  
  // Calculate how many bars to fill (out of 10)
  const filledBars = Math.round(pillar.score / 10);

  return (
    <div 
      className="flex flex-col w-full bg-gray-900/50 rounded-2xl p-4 border border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gray-800 border border-gray-700`}>
            <Icon className="w-5 h-5 text-gray-300" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{pillar.name}</span>
        </div>
        
        {/* 10 Bars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-6 rounded-sm ${i < filledBars ? getBarColor(i) : 'bg-gray-800'}`}
            />
          ))}
          <span className="ml-2 text-xs font-black text-gray-400 w-8 text-right">{pillar.score}%</span>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <p className={`text-xs text-gray-400 leading-relaxed flex-1 ${expanded ? '' : 'line-clamp-1'}`}>
          {pillar.reasoning}
        </p>
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500 shrink-0 mt-0.5">
          {expanded ? 'Less' : 'More'}
        </span>
      </div>
    </div>
  );
};

export default function CTRModal({ onClose, imageUrl, ctrScore, pillars, onViralFix }: CTRModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="glass-panel rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-y-auto relative border border-gray-800 shadow-2xl bg-[#0a0a0a] custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 transition-colors shadow-2xl"
        >
          <XIcon className="w-5 h-5 text-gray-400" />
        </button>

        <div className="p-6 md:p-8 flex flex-col items-center space-y-6">
          {/* PERCENTAGE */}
          <div className="text-center">
            <span className="text-6xl md:text-7xl font-black text-white tracking-tighter">{ctrScore}%</span>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">Predicted CTR</div>
          </div>

          {/* IMAGE PREVIEW */}
          <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-gray-800 shadow-2xl relative">
            <img src={imageUrl} className="w-full h-full object-cover" alt="Thumbnail Preview" />
          </div>

          {/* PILLARS */}
          <div className="w-full space-y-3">
            {pillars && pillars.length > 0 ? (
              pillars.map((pillar, idx) => (
                <PillarRow key={idx} pillar={pillar} />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm font-bold uppercase tracking-widest">
                Analyzing image...
              </div>
            )}
          </div>

          {/* DIVIDER LINE */}
          <div className="w-full h-px bg-gray-800 my-2"></div>

          {/* ONEVIRAL FIX BUTTON */}
          {onViralFix && (
            <button 
              onClick={onViralFix}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-2xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 uppercase mt-4 flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-5 h-5" /> 1-Viral Fix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
