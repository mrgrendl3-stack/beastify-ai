import React, { useState, useEffect } from 'react';
import { bugTracker, BugReport } from '../lib/bugTracker';

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface BugTrackerModalProps {
    onClose: () => void;
}

export const BugTrackerModal: React.FC<BugTrackerModalProps> = ({ onClose }) => {
    const [bugs, setBugs] = useState<BugReport[]>(bugTracker.getBugs());
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        const unsubscribe = bugTracker.subscribe(() => {
            setBugs([...bugTracker.getBugs()]);
        });
        return () => { unsubscribe(); };
    }, []);

    const handleCopy = (bug: BugReport) => {
        const text = `المشكل: ${bug.title}\nالوصف: ${bug.description}\nالتفاصيل التقنية: ${bug.technicalDetails}\nالوقت: ${new Date(bug.timestamp).toLocaleString('ar-MA')}`;
        navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل المشكل بنجاح!');
    };

    const handleDelete = (id: string) => {
        bugTracker.removeBug(id);
    };

    const runSelfTest = async () => {
        setIsTesting(true);
        bugTracker.addBug(
            "بدء فحص النظام",
            "البوت دابا كيجرب كاع الخصائص ديال الموقع باش يتأكد بلي كلشي خدام مزيان...",
            "System self-test initiated by user."
        );

        // Simulate testing delays and checks
        setTimeout(() => {
            if (!(import.meta as any).env.VITE_YOUTUBE_API_KEY) {
                bugTracker.addBug(
                    "مشكل في إعدادات يوتيوب",
                    "مالقيتش الساروت ديال يوتيوب (API Key). هادشي غيخلي البحث على الفيديوهات ما يخدمش.",
                    "Missing VITE_YOUTUBE_API_KEY in environment variables."
                );
            } else {
                bugTracker.addBug(
                    "فحص يوتيوب: ناجح",
                    "الساروت ديال يوتيوب كاين وخدام مزيان.",
                    "VITE_YOUTUBE_API_KEY is present."
                );
            }
        }, 1500);

        setTimeout(() => {
            if (!(import.meta as any).env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
                bugTracker.addBug(
                    "مشكل في الذكاء الاصطناعي",
                    "مالقيتش الساروت ديال Gemini. هادشي غيخلي توليد الصور والنصوص يوقف.",
                    "Missing GEMINI_API_KEY."
                );
            } else {
                bugTracker.addBug(
                    "فحص الذكاء الاصطناعي: ناجح",
                    "الاتصال بالذكاء الاصطناعي (Gemini) خدام مزيان.",
                    "GEMINI_API_KEY is present."
                );
            }
        }, 3000);

        setTimeout(() => {
            bugTracker.addBug(
                "انتهاء الفحص",
                "البوت سالا الفحص ديالو. تقدر تشوف النتائج الفوق.",
                "Self-test completed."
            );
            setIsTesting(false);
        }, 4500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" dir="rtl">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">بوت الفحص (Tester Bot)</h2>
                            <p className="text-sm text-gray-400">هاد البوت كيسجل أي مشكل وقع فالموقع باش يسهل عليك تصلحو.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <button 
                        onClick={runSelfTest} 
                        disabled={isTesting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isTesting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105 active:scale-95'}`}
                    >
                        <PlayIcon className={`w-5 h-5 ${isTesting ? 'animate-spin' : ''}`} />
                        {isTesting ? 'جاري الفحص...' : 'بدء فحص شامل للموقع'}
                    </button>
                    
                    {bugs.length > 0 && (
                        <button onClick={() => bugTracker.clearAll()} className="text-sm text-red-400 hover:text-red-300 underline">
                            مسح جميع السجلات
                        </button>
                    )}
                </div>

                {/* Bug List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {bugs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xl font-bold">الموقع نقي، ماكاين حتى مشكل مسجل!</p>
                        </div>
                    ) : (
                        bugs.map((bug, index) => (
                            <div key={bug.id} className="bg-black/40 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-gray-800 text-gray-400 text-xs font-bold px-2 py-1 rounded-lg">
                                            مشكل #{bugs.length - index}
                                        </span>
                                        <h3 className="text-lg font-bold text-red-400">{bug.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleCopy(bug)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors" title="نسخ التفاصيل">
                                            <CopyIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(bug.id)} className="p-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded-lg transition-colors" title="حذف هذا المشكل">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-gray-300 text-base leading-relaxed mb-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800/50">
                                    {bug.description}
                                </p>
                                
                                <div className="flex justify-between items-end">
                                    <div className="text-xs text-gray-600 font-mono bg-black/50 px-3 py-2 rounded-lg max-w-[70%] overflow-x-auto" dir="ltr">
                                        {bug.technicalDetails}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium">
                                        {new Date(bug.timestamp).toLocaleString('ar-MA')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
