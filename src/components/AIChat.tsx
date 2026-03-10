
import React, { useState, useRef, useEffect } from 'react';
import { MessageIcon, SendIcon, XMarkIcon, PaperClipIcon, TrashIcon, BrainIcon, SparklesIcon, RefreshIcon, TargetIcon } from './IconComponents';
import { ChatMessage, GeneratedImage } from '../types';
import { getChatResponse, fileToBase64 } from '../services/geminiService';

interface AIChatProps {
    currentProjectImages?: GeneratedImage[];
}

const AIChat: React.FC<AIChatProps> = ({ currentProjectImages = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            if (selectedImages.length + files.length > 5) {
                alert("You can only upload a maximum of 5 images.");
                return;
            }

            const base64Promises = files.map(file => fileToBase64(file));
            const base64Results = await Promise.all(base64Promises);
            setSelectedImages(prev => [...prev, ...base64Results]);
        }
    };

    const attachCurrentWork = () => {
        if (currentProjectImages.length === 0) return;
        
        if (selectedImages.length >= 5) {
            alert("Maximum 5 images allowed.");
            return;
        }

        // Get the most recent image from the project
        const currentImg = currentProjectImages[0];
        
        // Handle Data URI format (data:image/png;base64,....)
        let base64 = currentImg.src;
        if (base64.includes(',')) {
            base64 = base64.split(',')[1];
        }

        setSelectedImages(prev => [...prev, base64]);
    };

    const handleSend = async (text: string = input, images: string[] = selectedImages) => {
        // If empty text & no images, do nothing
        if ((!text.trim() && images.length === 0) || isTyping) return;

        // Construct User Message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: text,
            images: images,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        
        // Clear inputs immediately
        if (text === input) setInput('');
        if (images === selectedImages) setSelectedImages([]);
        
        setIsTyping(true);

        try {
            // Pass the selected model ID to the service
            const responseText = await getChatResponse(userMessage.text, images);
            
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat Error", error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Communication Severed. Retrying uplink...",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    // NEW: Regenerate logic
    const handleRegenerate = async () => {
        if (isTyping || messages.length === 0) return;
        
        // Find the last user message
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;

        // Trigger send with previous content
        await handleSend(lastUserMessage.text, lastUserMessage.images || []);
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // Helper to render text with Basic Bolding (**) and Line Breaks
    const renderFormattedText = (text: string) => {
        // Split by lines first
        return text.split('\n').map((line, i) => {
            // Check for bold syntax: **text**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <div key={i} className="min-h-[1.2em]">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-red-400 font-bold">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </div>
            );
        });
    };

    const getLastMessage = () => messages[messages.length - 1];



    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-50 p-5 rounded-3xl bg-gradient-to-br from-red-600 to-black text-white shadow-[0_10px_40px_rgba(220,38,38,0.3)] hover:scale-110 transition-all duration-500 group border border-red-500/40 liquid-glass"
                >
                    <TargetIcon className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white/20"></span>
                    </span>
                    {/* Tooltip */}
                    <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/95 text-[10px] font-black tracking-[0.2em] rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-red-900/50 shadow-2xl">
                        AI STRATEGIST
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-[#0A0A0A] border border-red-900/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                    
                    {/* Header */}
                    <div className="p-4 bg-[#111] border-b border-red-900/20 flex justify-between items-center">
                        <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                                <div className="p-1.5 bg-red-900/20 rounded-lg border border-red-900/50">
                                    <TargetIcon className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm uppercase tracking-widest">AI STRATEGIST</h3>
                                    <div className="flex items-center space-x-1">
                                        <span className="text-[10px] text-gray-400">System Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505] scrollbar-thin scrollbar-thumb-gray-800 relative">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <TargetIcon className="w-12 h-12 text-red-900 mb-2" />
                                <p className="text-gray-400 text-sm">Ready to optimize your viral strategy.<br/>What is your next move?</p>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                            ? 'bg-gray-800 text-white rounded-tr-none' 
                                            : 'bg-red-900/10 text-gray-200 rounded-tl-none border border-red-900/30'
                                    }`}
                                >
                                    {/* Images if any */}
                                    {msg.images && msg.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.images.map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={`data:image/png;base64,${img}`} 
                                                    alt="User upload" 
                                                    className="w-16 h-16 object-cover rounded-2xl border border-white/20" 
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="whitespace-pre-wrap">
                                        {msg.role === 'model' ? renderFormattedText(msg.text) : msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                             <div className="flex justify-start">
                                <div className="bg-red-900/10 p-3 rounded-2xl rounded-tl-none border border-red-900/30 flex space-x-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        )}
                        
                        {/* REGENERATE BUTTON: Appears only if last message is from Model and not typing */}
                        {!isTyping && messages.length > 0 && getLastMessage()?.role === 'model' && (
                            <div className="flex justify-center mt-2 pb-2">
                                <button
                                    onClick={handleRegenerate}
                                    className="flex items-center space-x-2 px-4 py-2 bg-black border border-gray-800 rounded-full text-xs text-gray-500 hover:text-white hover:border-red-500 transition shadow-lg group"
                                >
                                    <RefreshIcon className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                                    <span>Rethink Strategy</span>
                                </button>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#111] border-t border-gray-800/50">
                        
                        {/* Selected Images Preview */}
                        {selectedImages.length > 0 && (
                            <div className="flex gap-3 mb-3 overflow-x-auto py-1 no-scrollbar">
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className="relative group flex-shrink-0">
                                        <img src={`data:image/png;base64,${img}`} className="w-14 h-14 object-cover rounded-xl border border-gray-700 shadow-lg" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-xl hover:bg-red-500 transition-colors"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-2xl transition-all liquid-glass-icon"
                                title="Upload File"
                            >
                                <PaperClipIcon className="w-6 h-6" />
                            </button>

                            {/* Attach Current Work Button */}
                            {currentProjectImages.length > 0 && (
                                <button 
                                    onClick={attachCurrentWork}
                                    className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-2xl transition-all border border-red-500/30 liquid-glass-icon"
                                    title="Analyze Current Asset"
                                >
                                    <TargetIcon className="w-6 h-6" />
                                </button>
                            )}

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImageUpload}
                            />
                            
                            <input
                                type="text"
                                value={input || ''}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Consult the Strategist..."
                                className="flex-1 bg-black/60 border border-gray-800 text-white text-sm rounded-2xl px-5 py-3.5 focus:outline-none focus:border-red-500/50 transition-all placeholder:text-gray-700"
                            />
                            
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() && selectedImages.length === 0}
                                className="p-3.5 bg-red-700 text-white rounded-2xl hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/20 active:scale-90"
                            >
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </>
    );
};

export default AIChat;
