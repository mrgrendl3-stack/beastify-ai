import React, { useState } from 'react';
import { XIcon, LightbulbIcon, EyeIcon, MousePointerClickIcon, SmileIcon, SparklesIcon, HelpCircleIcon, MinimizeIcon, SmartphoneIcon, TypeIcon, TrendingUpIcon } from 'lucide-react';

interface Pillar {
  name: string;
  score: number;
  reasoning: string;
  details?: {
    observation: string;
    impact: string;
    judgement: string;
    fix: string;
  };
}

interface CTRModalProps {
  onClose: () => void;
  imageUrl: string;
  ctrScore: number;
  pillars: Pillar[];
  onViralFix?: () => void;
  visualDescription?: string;
}

const PILLAR_ICONS: Record<string, React.ElementType> = {
  'الوضوح': EyeIcon,
  'المشاعر': SmileIcon,
  'الفضول': HelpCircleIcon,
  'الابتكار': LightbulbIcon,
  'الانتشار': TrendingUpIcon,
  'التباين': SparklesIcon,
  'Clarity': EyeIcon,
  'Emotion': SmileIcon,
  'Curiosity': HelpCircleIcon,
  'Virality': TrendingUpIcon,
  'Novelty': LightbulbIcon,
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

const PillarRow = ({ pillar, expanded, onToggle }: { pillar: Pillar, expanded: boolean, onToggle: () => void }) => {
  const Icon = PILLAR_ICONS[pillar.name] || LightbulbIcon;
  
  return (
    <div 
      className={`flex flex-col w-full rounded-[1.25rem] p-4 transition-all group cursor-pointer ${expanded ? 'bg-gray-800/40 border border-gray-700 shadow-xl' : 'bg-black/40 border border-gray-800/50 hover:bg-gray-800/30'}`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gray-900 border border-gray-800 transition-colors ${expanded ? 'border-gray-600' : 'group-hover:border-gray-700'}`}>
            <Icon className={`w-4 h-4 transition-colors ${expanded ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'}`} />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{pillar.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-24 h-1.5 bg-gray-900 rounded-full overflow-hidden hidden sm:block">
            <div 
              className={`h-full rounded-full ${getScoreBg(pillar.score)}`}
              style={{ width: `${pillar.score}%` }}
            />
          </div>
          <span className={`text-sm font-black w-8 text-right flex-shrink-0 ${getScoreColor(pillar.score)}`}>{pillar.score}%</span>
        </div>
      </div>

      <div className={`flex flex-col gap-2 transition-all duration-300 overflow-hidden ${expanded ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-6 mt-1 opacity-70 pl-14'}`}>
        {pillar.details ? (
          <div className={`text-xs text-gray-300 leading-relaxed w-full flex-1`}>
            {!expanded ? (
              <div className="truncate"><span className="font-bold text-gray-400">Observation:</span> {pillar.details.observation}</div>
            ) : (
              <div className="text-start whitespace-pre-wrap">
                 <span className="text-gray-200">{pillar.details.observation}</span>
                 {' '}
                 <span className="text-gray-400">{pillar.details.impact}</span>
                 {' '}
                 <span className="text-gray-400">{pillar.details.judgement}</span>
                 <div className="mt-3 bg-gradient-to-r from-cyan-950/30 to-transparent p-3 rounded-lg border-l-2 border-cyan-500 text-cyan-200">
                   <span className="font-bold text-cyan-500 uppercase tracking-widest text-[10px] mr-2">Fix</span>
                   {pillar.details.fix}
                 </div>
               </div>
            )}
          </div>
        ) : (
          <p className={`text-xs text-gray-300 leading-relaxed w-full flex-1 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-1'}`}>
            {pillar.reasoning}
          </p>
        )}
      </div>
      
      {!expanded && (
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 group-hover:text-cyan-500 shrink-0 mt-2 transition-colors self-end pr-1">
          More
        </span>
      )}
    </div>
  );
};

export default function CTRModal({ onClose, imageUrl, ctrScore, pillars, onViralFix, visualDescription }: CTRModalProps) {
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center w-full h-full bg-black/95 backdrop-blur-xl p-4 sm:p-6 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl max-h-[100vh] sm:max-h-[90vh] md:rounded-[2.5rem] rounded-3xl overflow-y-auto relative border border-gray-800/60 shadow-2xl bg-[#0a0a0a] custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 hover:text-white text-gray-400 transition-colors shadow-2xl"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 md:p-10 flex flex-col items-center space-y-8">
          
          {/* HEADER */}
          <div className="w-full flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* IMAGE PREVIEW */}
            <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative group">
              <img src={imageUrl} className="w-full object-contain bg-black max-h-[30vh] md:max-h-full transition-transform duration-700 group-hover:scale-105" alt="Thumbnail Preview" />
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
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Optimized Target Met</span>
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
                <PillarRow 
                  key={idx} 
                  pillar={pillar} 
                  expanded={expandedIndex === idx} 
                  onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
                />
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

          {/* FINAL SUMMARY */}
          {visualDescription && visualDescription.includes('FINAL SUMMARY') && (
            <div className="w-full p-5 sm:p-6 bg-black/40 border border-cyan-900/40 rounded-2xl md:rounded-[1.25rem]">
                <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-3">Final Summary</h3>
                <div className="text-xs sm:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {visualDescription.replace('### FINAL SUMMARY\n', '')}
                </div>
            </div>
          )}

          {/* ONEVIRAL FIX BUTTON ALWAYS VISIBLE BUT CONDITIONALLY DISABLED */}
          {onViralFix && (
            <div className="w-full pt-2">
              <button 
                onClick={onViralFix}
                disabled={ctrScore >= 85}
                className={`w-full py-5 rounded-2xl font-black text-sm tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.1)] uppercase flex items-center justify-center gap-3 group
                  ${ctrScore >= 85 
                    ? "bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50 shadow-none" 
                    : "active:scale-95 text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                  }`}
              >
                <SparklesIcon className={`w-5 h-5 ${ctrScore < 85 ? 'group-hover:animate-pulse' : ''}`} /> 
                <span>{ctrScore >= 85 ? 'Maximized' : '1-Viral Fix'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
