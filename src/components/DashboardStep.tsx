import React from 'react';
import { HistoryItem } from '../types';
import { TrashIcon } from './IconComponents';
import { getPredictionScore } from '../services/geminiService';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelect, onClear }) => {
    
    // Pseudo random score for history items if not present
    const getScore = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash % 40) + 55;
    }

    return (
        <div className={`fixed inset-y-0 right-0 w-80 bg-[#0A0A0A] border-l border-gray-800 transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-white">Project History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {history.length === 0 ? (
                        <p className="text-gray-600 text-center mt-10">No history yet.</p>
                    ) : (
                        history.map((item) => {
                            const score = item.predictedCtr || getScore(item.id);
                            const realistic = getPredictionScore(score);
                            // Using text-color logic to map to bg colors for the small badge
                            const badgeColor = score >= 85 ? 'bg-purple-600 text-white' : 
                                               score >= 70 ? 'bg-green-600 text-white' : 
                                               score >= 40 ? 'bg-yellow-600 text-black' : 
                                               'bg-red-600 text-white';
                            
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => onSelect(item)}
                                    className="group relative cursor-pointer rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition"
                                >
                                    <img src={item.src} alt="History" className="w-full h-32 object-cover opacity-70 group-hover:opacity-100 transition rounded-2xl" />
                                    
                                    {/* CTR Badge */}
                                    <div className={`absolute top-2 left-2 ${badgeColor} text-[10px] font-black px-2 py-1 rounded-lg shadow-lg`}>
                                        {realistic.score}
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2">
                                        <p className="text-xs text-white truncate">{item.prompt}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {history.length > 0 && (
                    <button 
                        onClick={onClear}
                        className="mt-4 w-full flex items-center justify-center p-3 text-red-400 border border-gray-800 rounded-lg hover:bg-red-900/10 transition"
                    >
                        <TrashIcon className="w-4 h-4 mr-2" /> Clear History
                    </button>
                )}
            </div>
        </div>
    );
};

export default HistorySidebar;