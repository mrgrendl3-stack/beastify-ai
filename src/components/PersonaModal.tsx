import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PlusIcon, TrashIcon, SparklesIcon } from './IconComponents';
import { User } from 'firebase/auth';
import { saveCustomPersona, deleteCustomPersona, CustomItem } from '../firebase';
import { createPersonaEmbedding } from '../services/VectorEngine';

interface CustomCharacter {
  id: string;
  name: string;
  images?: string[];
  status?: 'PROCESSING' | 'READY';
  embedding?: any;
  preview_url?: string;
  avatar?: string;
}

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersona: string | null;
  setSelectedPersona: (persona: string | null) => void;
  famousYoutubers: { name: string; tag: string; image: string }[];
  customCharacters: CustomCharacter[];
  setCustomCharacters: React.Dispatch<React.SetStateAction<CustomCharacter[]>>;
  user: User | null;
}

type CreationStep = 'TUTORIAL_1' | 'TUTORIAL_2' | 'TUTORIAL_3' | 'FORM';

export default function PersonaModal({
  isOpen,
  onClose,
  selectedPersona,
  setSelectedPersona,
  famousYoutubers,
  customCharacters,
  setCustomCharacters,
  user
}: PersonaModalProps) {
  const [activeTab, setActiveTab] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>('TUTORIAL_1');
  const [newCharName, setNewCharName] = useState('');
  const [newCharImages, setNewCharImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setCreationStep('TUTORIAL_1');
      setNewCharName('');
      setNewCharImages([]);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 3 - newCharImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewCharImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateCharacter = async () => {
    if (newCharName.trim() && newCharImages.length === 3) {
      setIsUploading(true);
      setUploadProgress(10);
      
      const newChar: CustomCharacter = {
        id: Date.now().toString(),
        name: newCharName.trim(),
        images: newCharImages, // Keep images for backward compatibility if needed temporarily
        status: 'PROCESSING'
      };
      
      setCustomCharacters(prevChars => [...prevChars, newChar]);

      try {
          const mimes = newCharImages.map(d => {
              const match = d.match(/^data:(image\/[a-zA-Z]+);base64,/);
              return match ? match[1] : 'image/jpeg';
          });
          
          setUploadProgress(40);
          
          // Call VectorEngine
          const { embedding, preview_url } = await createPersonaEmbedding(newCharName.trim(), newCharImages, mimes);
          
          setUploadProgress(100);
          
          const readyChar: CustomCharacter = { 
              ...newChar, 
              status: 'READY',
              embedding,
              preview_url,
              avatar: preview_url // Use the generated preview as the avatar
          };
          
          setCustomCharacters(prevChars => 
            prevChars.map(c => c.id === newChar.id ? readyChar : c)
          );
          
          if (user) {
              await saveCustomPersona(user.uid, readyChar as any);
          }
      } catch (err) {
          console.error("Failed to create persona embedding:", err);
          // Revert or show error
          setCustomCharacters(prev => prev.filter(c => c.id !== newChar.id));
      } finally {
          setIsCreating(false);
          setNewCharName('');
          setNewCharImages([]);
          setIsUploading(false);
          setUploadProgress(0);
      }
    }
  };

  const handleDeleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomCharacters(prev => prev.filter(c => c.id !== id));
    if (selectedPersona === id) {
      setSelectedPersona(null);
    }
    if (user) {
        deleteCustomPersona(user.uid, id).catch(console.error);
    }
  };

  const renderTutorialStep = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6 border border-cyan-500/30">
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Persona Guidelines</h2>
        
        <div className="flex gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full ${creationStep === 'TUTORIAL_1' ? 'bg-cyan-400 ring-4 ring-cyan-400/20' : 'bg-gray-700'}`} />
          <div className={`w-2 h-2 rounded-full ${creationStep === 'TUTORIAL_2' ? 'bg-cyan-400 ring-4 ring-cyan-400/20' : 'bg-gray-700'}`} />
          <div className={`w-2 h-2 rounded-full ${creationStep === 'TUTORIAL_3' ? 'bg-cyan-400 ring-4 ring-cyan-400/20' : 'bg-gray-700'}`} />
        </div>

        <div className="bg-[#141414] border border-gray-800 rounded-3xl p-8 w-full max-w-md text-center">
          {creationStep === 'TUTORIAL_1' && (
            <>
              <p className="text-lg text-white mb-8">
                Each image should feature <br/>
                <span className="text-cyan-400 font-bold">only one clearly visible person</span> as the main focus.
              </p>
              <div className="flex gap-4 justify-center">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-red-500/50">
                  <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&h=300&fit=crop" alt="Bad example" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-red-500 z-20">
                    <XMarkIcon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50">
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop" alt="Good example" className="w-full h-full object-cover" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-cyan-500 z-20">
                    <CheckIcon className="w-4 h-4 text-cyan-500" />
                  </div>
                </div>
              </div>
            </>
          )}

          {creationStep === 'TUTORIAL_2' && (
            <>
              <p className="text-lg text-white mb-8">
                Faces should be <span className="text-cyan-400 font-bold">clearly visible and unobstructed</span>,<br/>
                avoid sunglasses or masks.
              </p>
              <div className="flex gap-4 justify-center">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-red-500/50">
                  <img src="https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=300&h=300&fit=crop" alt="Bad example" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-red-500 z-20">
                    <XMarkIcon className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50">
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop" alt="Good example" className="w-full h-full object-cover" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-cyan-500 z-20">
                    <CheckIcon className="w-4 h-4 text-cyan-500" />
                  </div>
                </div>
              </div>
            </>
          )}

          {creationStep === 'TUTORIAL_3' && (
            <>
              <p className="text-lg text-white mb-8">
                Include <span className="text-cyan-400 font-bold">different angles, expressions,</span><br/>
                and <span className="text-cyan-400 font-bold">lighting conditions</span>.
              </p>
              <div className="flex gap-4 justify-center">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" alt="Good example 1" className="w-full h-full object-cover" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-cyan-500 z-20">
                    <CheckIcon className="w-4 h-4 text-cyan-500" />
                  </div>
                </div>
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/50">
                  <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop" alt="Good example 2" className="w-full h-full object-cover" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#0A0A0A] rounded-full flex items-center justify-center border-2 border-cyan-500 z-20">
                    <CheckIcon className="w-4 h-4 text-cyan-500" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={() => {
              if (creationStep === 'TUTORIAL_1') setCreationStep('TUTORIAL_2');
              else if (creationStep === 'TUTORIAL_2') setCreationStep('TUTORIAL_3');
              else setCreationStep('FORM');
            }}
            className="px-8 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest rounded-full transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
          >
            {creationStep === 'TUTORIAL_3' ? 'Got it!' : 'Next'}
            {creationStep !== 'TUTORIAL_3' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
          </button>
          
          <label className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition-colors">
            <input type="checkbox" className="rounded border-gray-700 bg-black text-cyan-500 focus:ring-cyan-500 focus:ring-offset-black" />
            Don't show this tutorial again
          </label>
        </div>
      </div>
    );
  };

  const renderCreationForm = () => {
    return (
      <div className="flex flex-col items-center flex-1 h-full max-w-md mx-auto w-full overflow-y-auto no-scrollbar pb-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6 mt-4 border border-cyan-500/30 shrink-0">
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-2 shrink-0">
          Create <span className="text-cyan-400">Your Persona</span>
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </h2>

        <div className="w-full space-y-4 shrink-0">
          <input 
            type="text" 
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            className="w-full bg-[#141414] border border-gray-800 rounded-2xl px-6 py-4 text-white text-center focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
            placeholder="What's your Persona's name?"
          />

          <div className="w-full bg-[#141414] border border-gray-800 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-white font-bold mb-2">Upload exactly 3 images</h3>
            <p className="text-xs text-gray-500 mb-6">PNG, JPG, JPEG & WebP formats, up to 4 MB.</p>
            
            <div className="flex gap-3 justify-center w-full">
              {newCharImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-700 group">
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setNewCharImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-[#0A0A0A] p-1 rounded-full text-gray-400 hover:text-red-500 border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newCharImages.length < 3 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-600 hover:border-cyan-500 hover:text-cyan-500 transition-colors"
                >
                  <PlusIcon className="w-6 h-6" />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <button 
            onClick={handleCreateCharacter}
            disabled={!newCharName.trim() || newCharImages.length !== 3 || isUploading}
            className="px-10 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest rounded-full transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            {isUploading ? `Uploading.. ${uploadProgress}%` : 'Generate'}
          </button>
          {!isUploading && <span className="text-xs text-gray-600 font-medium tracking-widest uppercase">50 Credits</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0A0A0A] border border-gray-800 rounded-[2rem] shadow-2xl p-6 flex flex-col min-h-[600px] max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 shrink-0 relative z-10">
          {!isCreating ? (
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('PUBLIC')}
                className={`text-sm font-black uppercase tracking-widest transition-colors px-4 py-2 rounded-full ${activeTab === 'PUBLIC' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Public
              </button>
              <button 
                onClick={() => setActiveTab('PRIVATE')}
                className={`text-sm font-black uppercase tracking-widest transition-colors px-4 py-2 rounded-full ${activeTab === 'PRIVATE' ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Private
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-800" />
              <div className="w-3 h-3 rounded-full bg-gray-800" />
              <div className="w-3 h-3 rounded-full bg-gray-800" />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {isCreating && creationStep !== 'FORM' && (
              <button 
                onClick={() => setCreationStep('FORM')}
                className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
            )}
            <button onClick={() => {
              if (isCreating) {
                setIsCreating(false);
                setCreationStep('TUTORIAL_1');
              } else {
                onClose();
              }
            }} className="text-gray-500 hover:text-white transition-colors font-bold text-sm">
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isCreating ? (
            creationStep === 'FORM' ? renderCreationForm() : renderTutorialStep()
          ) : (
            activeTab === 'PUBLIC' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 mt-4">
                {famousYoutubers.map(p => (
                  <button 
                    key={p.name}
                    onClick={() => {
                      setSelectedPersona(p.name);
                      onClose();
                    }}
                    className={`flex flex-col items-center p-4 rounded-3xl transition-all border group ${selectedPersona === p.name ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-[#141414] border-gray-800 hover:border-gray-700 hover:bg-[#1A1A1A]'}`}
                  >
                    <div className="relative mb-3">
                      <div className={`absolute inset-0 rounded-full blur-xl transition-opacity opacity-0 group-hover:opacity-40 bg-cyan-500`} />
                      <img src={p.image} alt={p.name} className="w-20 h-20 rounded-full border-2 border-white/10 object-cover shadow-2xl relative z-10" />
                      {selectedPersona === p.name && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-[#0A0A0A] z-20">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-white mb-1 text-center tracking-tight">{p.name}</span>
                    <span className="text-[8px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest border border-cyan-500/20">{p.tag}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customCharacters.map(char => (
                    <div 
                      key={char.id}
                      onClick={() => {
                        if (char.status !== 'PROCESSING') {
                          setSelectedPersona(char.name);
                          onClose();
                        }
                      }}
                      className={`flex items-center p-4 rounded-2xl transition-all border group ${selectedPersona === char.name ? 'bg-cyan-500/10 border-cyan-500' : 'bg-[#141414] border-gray-800 hover:border-gray-700'} ${char.status === 'PROCESSING' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <img src={char.avatar || char.images?.[0] || ""} alt={char.name} className={`w-16 h-16 rounded-full object-cover border-2 border-gray-700 mr-4 ${char.status === 'PROCESSING' ? 'blur-sm' : ''}`} />
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          {char.name}
                          {char.status === 'PROCESSING' && (
                            <span className="text-[10px] bg-black/50 text-gray-400 px-2 py-1 rounded-full font-medium">Processing.. 50%</span>
                          )}
                        </h4>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Custom Character</span>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteCharacter(char.id, e)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6 flex justify-center">
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#141414] border border-gray-800 hover:border-cyan-500 hover:text-cyan-400 text-white font-black uppercase tracking-widest rounded-full transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Create Persona
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

