
import React, { useState, useEffect } from 'react';
import { BeastModeResult, BeastConcept } from '../types';
import { SparklesIcon, TargetIcon, BrainIcon, EyeIcon, WandIcon, CheckIcon, ZapIcon, TerminalIcon } from './IconComponents';
import { motion, AnimatePresence } from 'motion/react';

interface BeastModeUIProps {
    result: BeastModeResult;
    stage: number;
    onSelectConcept: (concept: BeastConcept) => void;
}

const stageLogs: Record<number, string[]> = {
    1: [
        "Initializing Beast Mode Orchestrator...",
        "Parsing core conflict...",
        "Analyzing biological triggers...",
        "Mapping curiosity gaps...",
        "Generating 5 viral concepts..."
    ],
    3: [
        "Analyzing selected concept...",
        "Simulating eye-tracking heatmaps...",
        "Optimizing color psychology...",
        "Calculating face-to-background ratio...",
        "Applying Rule of Thirds grid..."
    ],
    4: [
        "Running A/B simulation vs. top creators...",
        "Predicting mobile click-through rate...",
        "Verifying emotional resonance...",
        "Finalizing psychological blueprint..."
    ],
    5: [
        "Synthesizing final visual assets...",
        "Applying 8K texture overlays...",
        "Fine-tuning cinematic lighting...",
        "Beast Mode implementation complete."
    ]
};

const LiveLog: React.FC<{ stage: number }> = ({ stage }) => {
    const [logs, setLogs] = useState<string[]>([]);
    
    useEffect(() => {
        if (stageLogs[stage]) {
            setLogs([]);
            let i = 0;
            const interval = setInterval(() => {
                if (i < stageLogs[stage].length) {
                    setLogs(prev => [...prev, stageLogs[stage][i]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 400); // Lightning speed
            return () => clearInterval(interval);
        }
    }, [stage]);

    return (
        <div className="bg-black/80 border border-orange-500/30 rounded-xl p-4 font-mono text-[10px] text-orange-400 h-32 overflow-hidden flex flex-col-reverse">
            <div className="space-y-1">
                {logs.map((log, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <span className="text-orange-600">&gt;&gt;</span>
                        {log}
                    </motion.div>
                ))}
                {logs.length < (stageLogs[stage]?.length || 0) && (
                    <div className="flex items-center gap-2 animate-pulse">
                        <span className="text-orange-600">&gt;&gt;</span>
                        <span className="w-2 h-4 bg-orange-500" />
                    </div>
                )}
            </div>
        </div>
    );
};

const BeastModeUI: React.FC<BeastModeUIProps> = ({ result, stage, onSelectConcept }) => {
    const { concepts, selectedConceptId, engineering, simulation, finalImage } = result;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-12 py-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] liquid-glass border-orange-500/20"
                >
                    <div className="liquid-glass-icon p-2 rounded-full">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    Beast Mode Orchestrator
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-black text-white tracking-tighter"
                >
                    THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 uppercase">Thumbnail Architect</span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-500 font-medium max-w-2xl mx-auto"
                >
                    Automating the exact psychological workflow used by top creators to engineer high-CTR thumbnails.
                </motion.p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-4 max-w-3xl mx-auto">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 liquid-glass-icon ${stage >= s ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-gray-900 text-gray-700 border border-gray-800'}`}>
                            {stage > s ? <CheckIcon className="w-5 h-5" /> : s}
                        </div>
                        {s < 5 && <div className={`h-1 w-8 md:w-16 rounded-full transition-all duration-500 ${stage > s ? 'bg-orange-500' : 'bg-gray-900'}`} />}
                    </div>
                ))}
            </div>

            {/* Live Implementation Log Overlay for Loading States */}
            {(stage === 1 || stage === 3 || stage === 4) && (
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                        <div className="liquid-glass-icon p-1.5 rounded-lg">
                            <TerminalIcon className="w-3 h-3" />
                        </div>
                        Live Implementation Log
                    </div>
                    <LiveLog stage={stage} />
                </div>
            )}

            {/* Stage 1 & 2: Concepts */}
            {concepts && !selectedConceptId && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <div className="liquid-glass-icon p-2 rounded-xl">
                                <ZapIcon className="w-6 h-6 text-orange-500" />
                            </div>
                            Choose Your Viral Concept
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">5 Strategies Generated</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {concepts.map((concept, idx) => (
                            <motion.div 
                                key={concept.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => onSelectConcept(concept)}
                                className="group relative bg-[#0a0a0a] border border-gray-800 rounded-[2rem] p-6 hover:border-orange-500/50 transition-all duration-500 cursor-pointer overflow-hidden"
                            >
                                {idx === 0 && (
                                    <div className="absolute top-0 left-0 p-4 z-10">
                                        <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest shadow-lg">
                                            AI Recommended
                                        </div>
                                    </div>
                                )}
                                
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black">
                                        {concept.estimated_ctr}% CTR
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-full aspect-video bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 group-hover:border-orange-500/30 transition-colors overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-center p-4 relative z-10">
                                            <div className="liquid-glass-icon p-3 rounded-2xl mx-auto mb-2 inline-block">
                                                <BrainIcon className="w-8 h-8 text-gray-700 group-hover:text-orange-500 transition-colors" />
                                            </div>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-tight">
                                                {concept.sketch_description}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight mb-2 group-hover:text-orange-400 transition-colors">
                                            {concept.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {concept.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 rounded-xl bg-gray-900/50 border border-gray-800">
                                            <span className="block text-[8px] font-black text-gray-600 uppercase mb-1">Conflict</span>
                                            <span className="text-[10px] font-bold text-red-400 truncate block">{concept.conflict}</span>
                                        </div>
                                        <div className="p-2 rounded-xl bg-gray-900/50 border border-gray-800">
                                            <span className="block text-[8px] font-black text-gray-600 uppercase mb-1">Emotion</span>
                                            <span className="text-[10px] font-bold text-yellow-400 truncate block">{concept.emotion}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Why this works:</div>
                                        <p className="text-[10px] text-gray-400 italic">"{concept.result}"</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stage 3 & 4: Engineering & Simulation */}
            {selectedConceptId && !finalImage && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Engineering Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="liquid-glass-icon p-2 rounded-xl">
                                <WandIcon className="w-6 h-6 text-orange-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Psychological Optimization</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {engineering ? (
                                Object.entries(engineering).map(([key, value], idx) => (
                                    <motion.div 
                                        key={key} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-4 rounded-2xl bg-[#0a0a0a] border border-gray-800 space-y-1 hover:border-orange-500/30 transition-colors"
                                    >
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{key.replace('_', ' ')}</span>
                                        <p className="text-sm text-gray-300 font-medium">{value}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center bg-[#0a0a0a] border border-gray-800 border-dashed rounded-2xl space-y-4">
                                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden flex items-center justify-center">
                                        <div className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_270deg,#f97316_360deg)] animate-[spin_2s_linear_infinite]" />
                                        <div className="absolute inset-[2px] bg-[#0a0a0a] rounded-[6px] flex flex-col p-2 justify-between overflow-hidden">
                                            <div className="flex justify-between items-start">
                                                <div className="w-4 h-4 rounded-full bg-gray-800/80 animate-pulse" />
                                                <div className="w-6 h-2 rounded-sm bg-gray-800/80 animate-pulse" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="w-full h-2 rounded-sm bg-gray-800/80 animate-pulse" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2/3 h-2 rounded-sm bg-gray-800/80 animate-pulse" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-gray-600 font-black text-xs tracking-widest uppercase">Optimizing Visual Psychology...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Simulation Details */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="liquid-glass-icon p-2 rounded-xl">
                                <TargetIcon className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">CTR Simulation</h3>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-gray-900 to-black border border-gray-800 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            
                            {simulation ? (
                                <>
                                    <div className="relative z-10">
                                        <svg className="w-32 h-32 transform -rotate-90">
                                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-800" />
                                            <motion.circle 
                                                cx="64" cy="64" r="58" 
                                                stroke="currentColor" strokeWidth="12" 
                                                fill="transparent" 
                                                strokeDasharray={364.4} 
                                                initial={{ strokeDashoffset: 364.4 }}
                                                animate={{ strokeDashoffset: 364.4 - (364.4 * simulation.ctr_score) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="text-orange-500" 
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-white">{simulation.ctr_score}%</span>
                                            <span className="text-[8px] font-black text-gray-500 uppercase">Predicted</span>
                                        </div>
                                    </div>
                                    <div className={`relative z-10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${simulation.confidence === 'High' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        Confidence: {simulation.confidence}
                                    </div>
                                    <ul className="relative z-10 text-left space-y-2 w-full">
                                        {simulation.reasoning.map((r, i) => (
                                            <motion.li 
                                                key={i} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="text-xs text-gray-400 flex items-start gap-2"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
                                                {r}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="relative w-48 aspect-video rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                                        <div className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_270deg,#f97316_360deg)] animate-[spin_2s_linear_infinite]" />
                                        <div className="absolute inset-[3px] bg-[#0a0a0a] rounded-[9px] flex flex-col p-3 justify-between overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-red-500/5 animate-pulse" />
                                            <div className="relative z-10 flex justify-between items-start">
                                                <div className="w-6 h-6 rounded-full bg-gray-800/80 animate-pulse" />
                                                <div className="w-10 h-3 rounded-md bg-gray-800/80 animate-pulse" />
                                            </div>
                                            <div className="relative z-10 space-y-1.5">
                                                <div className="w-full h-3 rounded-md bg-gray-800/80 animate-pulse" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2/3 h-3 rounded-md bg-gray-800/80 animate-pulse" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Running A/B Simulation...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stage 5: Final Result */}
            {finalImage && (
                <div className="max-w-5xl mx-auto space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group rounded-[2.5rem] overflow-hidden border-4 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.3)]"
                    >
                        <img src={finalImage} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">BEAST MODE COMPLETE</h3>
                                <p className="text-gray-300 font-medium">This thumbnail has been engineered for maximum biological response.</p>
                            </div>
                        </div>
                    </motion.div>
                    
                    <div className="flex justify-center gap-6">
                        <button 
                            onClick={() => window.open(finalImage, '_blank')}
                            className="px-10 py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
                        >
                            <div className="liquid-glass-icon p-2 rounded-xl">
                                <EyeIcon className="w-6 h-6" />
                            </div>
                            DOWNLOAD 4K
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-10 py-5 text-white font-black rounded-2xl transition-all liquid-glass active:scale-95"
                        >
                            NEW EXPERIMENT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BeastModeUI;

