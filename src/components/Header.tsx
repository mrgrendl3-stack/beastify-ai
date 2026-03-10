
import React, { useState, useRef, useEffect } from 'react';
import { TargetIcon, KeyIcon, HistoryIcon, BellIcon, MenuIcon } from './IconComponents';

interface HeaderProps {
    onOpenHistory: () => void;
    onOpenAnalyze: () => void;
    notificationPermission: string;
    onRequestNotification: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenAnalyze, notificationPermission, onRequestNotification }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyClick = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
    }
    setIsMenuOpen(false);
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
      <div className="flex items-center gap-3">
        <div className="relative" ref={menuRef}>
          <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group p-2.5 rounded-xl transition-all duration-300 shadow-lg active:scale-95 liquid-glass-icon border border-cyan-500/30 bg-cyan-500/5"
              title="Menu"
          >
              <MenuIcon className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </button>

          {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-fade-in-up origin-top-right">
                  
                  {/* History */}
                  <button 
                      onClick={() => { onOpenHistory(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <HistoryIcon className="w-4 h-4 mr-3 text-purple-500" />
                      <span>Project History</span>
                  </button>

                  {/* Notifications */}
                  <button 
                      onClick={() => { onRequestNotification(); setIsMenuOpen(false); }}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <BellIcon className={`w-4 h-4 mr-3 ${notificationPermission === 'granted' ? 'text-green-500' : 'text-red-500'}`} />
                      <span>
                          {notificationPermission === 'granted' ? 'Notifications On' : 'Enable Alerts'}
                      </span>
                  </button>

                  <div className="h-px bg-gray-800 my-1 mx-2"></div>

                  <button 
                      onClick={handleKeyClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-900 hover:text-white transition-colors"
                  >
                      <KeyIcon className="w-4 h-4 mr-3 text-yellow-500" />
                      <span>API Key Settings</span>
                  </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
