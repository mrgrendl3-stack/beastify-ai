import React, { useState } from 'react';
import { XIcon, LightbulbIcon, EyeIcon, MousePointerClickIcon, SmileIcon, SparklesIcon, HelpCircleIcon, MinimizeIcon, SmartphoneIcon, TypeIcon, TrendingUpIcon } from 'lucide-react';

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

const getScoreColor = (score: number) => {
  if (score < 40) return 'text-red-500';
  if (score < 70) return 'text-yellow-500';
  if (score < 85) return 'text-lime-500';
  return 'text-emerald-500';
};

const getScoreBg = (score: number) => {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-yellow-500';
  if (score < 85) return 'bg-lime-500';
  return 'bg-emerald-500';
};

const PillarRow = ({ pillar }: { pillar: Pillar }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = PILLAR_ICONS[pillar.name] || LightbulbIcon;
  
  return (
    <div 
      className="flex flex-col w-full bg-black/40 rounded-2xl p-4 border border-gray-800/50 cursor-pointer hover:bg-gray-800/40 hover:border-gray-700 transition-all group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gray-900 border border-gray-800 group-hover:border-gray-700 transition-colors`}>
            <Icon className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{pillar.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-gray-900 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getScoreBg(pillar.score)}`}
              style={{ width: `${pillar.score}%` }}
            />
          </div>
          <span className={`text-sm font-black w-8 text-right ${getScoreColor(pillar.score)}`}>{pillar.score}%</span>
        </div>
      </div>

      <div className="flex items-start gap-2 pl-14">
        <p className={`text-xs text-gray-400 leading-relaxed flex-1 ${expanded ? '' : 'line-clamp-1'}`}>
          {pillar.reasoning}
        </p>
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-cyan-500 shrink-0 mt-0.5 transition-colors">
          {expanded ? 'Less' : 'More'}
        </span>
      </div>
    </div>
  );
};

export default function CTRModal({ onClose, imageUrl, ctrScore, pillars, onViralFix }: CTRModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="glass-panel rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-gray-800/60 shadow-2xl bg-[#0a0a0a] custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2.5 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 hover:text-white text-gray-400 transition-colors shadow-2xl"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10 flex flex-col items-center space-y-8">
          
          {/* HEADER */}
          <div className="w-full flex flex-col md:flex-row items-center gap-8">
            {/* IMAGE PREVIEW */}
            <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative group">
              <img src={imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Thumbnail Preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* PERCENTAGE */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-black/20 rounded-3xl p-6 border border-gray-800/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUpIcon className={`w-5 h-5 ${getScoreColor(ctrScore)}`} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Predicted CTR</span>
              </div>
              <span className={`text-7xl md:text-8xl font-black tracking-tighter ${getScoreColor(ctrScore)} drop-shadow-lg`}>
                {ctrScore}%
              </span>
              {ctrScore >= 85 && (
                <div className="mt-4 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Viral Potential</span>
                </div>
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="w-full flex items-center gap-4 opacity-50">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent flex-1" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Diagnostic Breakdown</span>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent flex-1" />
          </div>

          {/* PILLARS */}
          <div className="w-full space-y-3">
            {pillars && pillars.length > 0 ? (
              pillars.map((pillar, idx) => (
                <PillarRow key={idx} pillar={pillar} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                  Analyzing visual elements...
                </div>
              </div>
            )}
          </div>

          {/* ONEVIRAL FIX BUTTON */}
          {onViralFix && ctrScore < 85 && (
            <div className="w-full pt-4">
              <button 
                onClick={onViralFix}
                className="w-full py-5 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 uppercase flex items-center justify-center gap-3 group"
              >
                <SparklesIcon className="w-5 h-5 group-hover:animate-pulse" /> 
                <span>1-Viral Fix</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
