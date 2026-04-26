
import React, { useState, useRef, useEffect } from 'react';
import { TargetIcon, KeyIcon, HistoryIcon, BellIcon, MenuIcon, CoinsIcon, ShareIcon, UserIcon, SparklesIcon } from './IconComponents';
import { User } from 'firebase/auth';
import { UserProfile } from '../firebase';

interface HeaderProps {
    onOpenHistory: () => void;
    onOpenAnalyze: () => void;
    onOpenBugTracker: () => void;
    onOpenGame: () => void;
    onOpenPricing: () => void;
    notificationPermission: string;
    onRequestNotification: () => void;
    user: User | null;
    profile: UserProfile | null;
    onSignIn: () => void;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenAnalyze, onOpenBugTracker, onOpenGame, onOpenPricing, notificationPermission, onRequestNotification, user, profile, onSignIn, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showId, setShowId] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyClick = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
    }
    setIsMenuOpen(false);
  };

  const copyReferralLink = () => {
      if (profile) {
          const link = `${window.location.origin}?ref=${profile.referralCode}`;
          navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="py-3 px-6 flex items-center justify-between border-b border-gray-800 bg-[#050505] bg-opacity-95 backdrop-blur-md sticky top-0 z-50">
      {/* Logo & Slogan */}
      <div className="flex flex-col cursor-pointer group" onClick={() => window.location.reload()}>
        <div className="flex items-center px-4 py-2 border border-cyan-500/30 rounded-xl bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              BEASTIFY.AI
            </h1>
        </div>
      </div>

      {/* Right Controls: Menu Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group p-2.5 rounded-xl transition-all duration-300 shadow-lg active:scale-95 liquid-glass-icon border border-cyan-500/30 bg-cyan-500/5 flex items-center gap-2"
              title="Menu"
          >
              {user ? (
                  <img src={user.photoURL || ''} className="w-6 h-6 rounded-full border border-white/20" alt="User" />
              ) : (
                  <MenuIcon className="w-6 h-6 text-gray-400 group-hover:text-white" />
              )}
          </button>

          {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top-right">
                  
                  {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-800">
                            <div className="flex items-center justify-between min-w-0 pr-1">
                                <p className="text-sm font-black text-white truncate max-w-[120px]">{user.displayName}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider whitespace-nowrap shrink-0">
                                  {profile?.plan || 'Starter'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500 uppercase tracking-widest">
                               <span>ID: {showId ? (profile?.userId || '..........') : '**********'}</span>
                               <button onClick={(e) => { e.stopPropagation(); setShowId(!showId); }} className="hover:text-cyan-400 transition-colors p-1 -mr-1">
                                  {showId ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  )}
                               </button>
                            </div>
                        </div>

                        <button 
                            onClick={onOpenPricing}
                            className="w-full flex items-center px-4 py-3 text-sm text-white hover:bg-cyan-900/40 hover:text-cyan-300 transition-colors font-bold group border-b border-gray-800"
                        >
                            <SparklesIcon className="w-4 h-4 mr-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <span className="flex-1 text-left">Upgrade Plan</span>
                            <span className="text-[10px] uppercase tracking-widest bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">Pro</span>
                        </button>
                        
                        <button 
                            onClick={copyReferralLink}
                            className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                        >
                            <ShareIcon className="w-4 h-4 mr-3 text-cyan-500" />
                            <span>{copied ? 'Copied!' : 'Copy Referral Link'}</span>
                        </button>

                        <div className="h-px bg-gray-800 my-1 mx-2"></div>
                      </>
                  ) : (
                      <button 
                          onClick={() => { onSignIn(); setIsMenuOpen(false); }}
                          className="w-full flex items-center px-4 py-3 text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-colors font-bold"
                      >
                          <UserIcon className="w-4 h-4 mr-3" />
                          <span>Sign In with Google</span>
                      </button>
                  )}

                  {/* History */}
                  <button 
                      onClick={() => { onOpenGame(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <svg className="w-4 h-4 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Play Game</span>
                  </button>

                  <button 
                      onClick={() => { onOpenBugTracker(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <svg className="w-4 h-4 mr-3 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span>Tester Bot</span>
                  </button>

                  <button 
                      onClick={() => { onOpenHistory(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <HistoryIcon className="w-4 h-4 mr-3 text-purple-500" />
                      <span>Project History</span>
                  </button>

                  <div className="h-px bg-gray-800 my-1 mx-2"></div>

                  <button 
                      onClick={handleKeyClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <KeyIcon className="w-4 h-4 mr-3 text-yellow-500" />
                      <span>API Key Settings</span>
                  </button>

                  {user && (
                      <>
                        <div className="h-px bg-gray-800 my-1 mx-2"></div>
                        <button 
                            onClick={() => { onSignOut(); setIsMenuOpen(false); }}
                            className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <span>Sign Out</span>
                        </button>
                      </>
                  )}
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
