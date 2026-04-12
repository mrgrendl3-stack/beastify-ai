import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon } from './IconComponents';

interface TitleGenerateModalProps {
    title: string;
    onClose: () => void;
    onGenerate: (title: string, count: number) => void;
}

const TitleGenerateModal: React.FC<TitleGenerateModalProps> = ({ title, onClose, onGenerate }) => {
    const [count, setCount] = useState(1);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-800">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        Close
                    </button>
                </div>
                
                <div className="p-6 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                        <SparklesIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Generate Thumbnails</h2>
                    <p className="text-gray-400 text-sm mb-6">Generate a thumbnail using your title.</p>
                    
                    <div className="w-full aspect-video bg-gray-800 rounded-xl mb-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 blur-xl scale-110"></div>
                    </div>
                    
                    <div className="w-full bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 mb-6 text-white text-sm">
                        {title}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                            <span className="text-xs">...</span>
                        </div>
                        <span className="text-gray-400 text-sm">Options</span>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                        <button className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </button>
                        <button className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </button>
                        <div className="relative">
                            <button className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition font-bold">
                                {count}x
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onGenerate(title, count)}
                        className="w-full py-4 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-lg flex items-center justify-center gap-2 transition"
                    >
                        <SparklesIcon className="w-5 h-5" /> Generate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TitleGenerateModal;
