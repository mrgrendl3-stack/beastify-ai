import React, { useState } from 'react';
import { SparklesIcon, XMarkIcon } from './IconComponents';
import PricingSection from './PricingSection';

interface LandingPageProps {
  onSignIn: () => void;
  onOpenPricing: () => void;
}

export default function LandingPage({ onSignIn, onOpenPricing }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // CTA button behavior logic
  const handleCTA = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-[#06060c] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      
      {/* 
        1. HERO SECTION (Above the Fold)
      */}
      <header className="container mx-auto px-4 py-8 relative z-50">
        <nav className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="text-2xl font-black tracking-tighter text-white flex items-center gap-1">
            Beastify<span className="text-cyan-400">.ai</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onOpenPricing}
              className="text-gray-300 hover:text-white transition font-medium hidden sm:block"
            >
              Pricing
            </button>
            <button 
              onClick={handleCTA}
              className="px-6 py-2.5 rounded-full border border-gray-800 bg-gray-900/50 text-white font-bold hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition-all text-sm backdrop-blur-md"
            >
              Start Free Trial
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-16 pb-32 relative z-10 flex flex-col items-center">
        
        {/* Trust Signals */}
        <div className="flex flex-col items-center gap-3 mb-10 animate-fade-in-up">
          <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold tracking-wide uppercase bg-emerald-400/10 px-4 py-1.5 rounded-full border border-emerald-400/20">
            <StarIconOutline className="w-4 h-4 mr-1"/> Excellent on Trustpilot
          </div>
          <p className="text-gray-400 text-sm font-medium">Trusted by 124,946+ Creators</p>
        </div>

        {/* Headline: max 10 words, curiosity-driven */}
        <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black text-center tracking-tighter leading-[1.05] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Stop Guessing.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Break The Algorithm.</span>
        </h1>
        
        {/* Subheadline: clear benefit, no fluff */}
        <p className="text-xl md:text-2xl text-gray-400 text-center max-w-2xl mb-12 font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Instantly generate data-backed, high-CTR YouTube thumbnails. Turn invisible videos into viral hits.
        </p>

        {/* Primary CTA: Text + placement reasoning */}
        {/* Reasoning: Placed directly below the subheadline, highest contrast point on the screen, accompanied by an input-like visual to imply immediate action. */}
        <div className="w-full max-w-3xl rounded-[2rem] bg-gray-900/80 border border-gray-800 backdrop-blur-xl p-3 md:p-4 mb-16 shadow-[0_0_50px_rgba(34,211,238,0.05)] relative animate-fade-in-up group" style={{ animationDelay: '0.3s' }}>
            <div className="bg-black rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-center gap-3 text-gray-400 md:text-xl font-medium border-b border-gray-800/50 pb-6">
                 <span className="animate-pulse w-3 h-3 rounded-full bg-cyan-400"></span>
                 How to survive 100 days in Antarctica
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleCTA}
                  className="w-full md:w-auto px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,211,238,0.3)] text-lg"
                >
                  <SparklesIcon className="w-5 h-5" /> Generate Thumbnail
                </button>
              </div>
            </div>
        </div>

        {/* 
          2. PROBLEM AGITATION
        */}
        <div className="w-full max-w-5xl mt-24 mb-32 relative animate-fade-in-up">
           <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 text-[#ff4b4b]">Nobody Notices Your Thumbnail.</h2>
             <p className="text-xl text-gray-400 max-w-2xl mx-auto">
               You are invisible. Your thumbnail disappears in the feed. You get ignored before your video even gets a chance.
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="bg-gray-900/50 rounded-3xl p-8 border border-gray-800">
                <div className="w-full aspect-video bg-gray-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50 blur-[2px]">
                   <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay"></div>
                   <XMarkIcon className="w-16 h-16 text-red-500 drop-shadow-lg" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">The Flop</h3>
                <p className="text-gray-400 text-sm">Low contrast, cluttered text, confusing visuals. Ignored by the algorithm.</p>
             </div>
             
             <div className="bg-gradient-to-b from-cyan-900/20 to-black rounded-3xl p-8 border border-cyan-500/30 relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/20 blur-2xl rounded-full"></div>
                <div className="w-full aspect-video bg-gray-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center">
                   <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent"></div>
                   <div className="absolute bottom-4 left-4 bg-cyan-400 text-black text-xs font-black px-2 py-1 rounded">12.4% CTR</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">The Winner</h3>
                <p className="text-gray-400 text-sm">High contrast focal point, zero clutter, curiosity gap. Algorithm loves it.</p>
             </div>
           </div>
        </div>

        {/* 
          3. SOLUTION POSITIONING
        */}
        <div className="w-full max-w-6xl mt-16 mb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">Fix Your Packaging<br/>Instantly.</h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Stop relying on gut feelings. Our predictive AI engine scores your thumbnail against billions of data points before you hit publish. 
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-lg font-medium">
                <div className="w-6 h-6 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400">✓</div>
                Data-Backed Prediction Score
              </li>
              <li className="flex items-center gap-3 text-lg font-medium">
                <div className="w-6 h-6 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400">✓</div>
                Heatmap Analysis
              </li>
              <li className="flex items-center gap-3 text-lg font-medium">
                <div className="w-6 h-6 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400">✓</div>
                A/B Testing Simulator
              </li>
            </ul>
            <button 
              onClick={handleCTA}
              className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-bold rounded-full hover:bg-cyan-400 hover:text-black transition-colors"
            >
              Analyze Your Next Video ↗
            </button>
          </div>
          
          <div className="relative">
             <div className="w-full aspect-[4/3] bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden relative">
                {/* Mockup of the score UI */}
                <div className="absolute inset-0 p-8 flex flex-col items-center justify-center">
                   <div className="w-48 h-48 rounded-full border-[12px] border-gray-800 relative flex items-center justify-center mb-6">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                         <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="none" className="text-cyan-400" strokeDasharray="300" strokeDashoffset="45" />
                      </svg>
                      <div className="text-center">
                        <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Score</span>
                        <div className="text-6xl font-black text-white">85</div>
                      </div>
                   </div>
                   <div className="w-full bg-black rounded-xl border border-gray-800 p-4">
                     <div className="h-6 w-3/4 bg-gray-800 rounded animate-pulse mb-3"></div>
                     <div className="h-20 w-full bg-gray-800 rounded animate-pulse"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* 
          5. CORE FEATURES
        */}
        <div className="w-full max-w-6xl mt-16 mb-24">
           <h2 className="text-center text-3xl font-black text-gray-500 uppercase tracking-[0.2em] mb-16">The Conversion Arsenal</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-black border border-gray-800 p-8 rounded-3xl hover:border-cyan-500/50 transition-colors group">
                 <div className="w-14 h-14 bg-cyan-400/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                    <SparklesIcon className="w-7 h-7" />
                 </div>
                 <h3 className="text-2xl font-black text-white mb-3">Idea to Asset</h3>
                 <p className="text-gray-400 leading-relaxed">
                    Type your concept. Our AI engineers the perfect visual hook, colors, and layout instantly without Photoshop.
                 </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-black border border-gray-800 p-8 rounded-3xl hover:border-blue-500/50 transition-colors group">
                 <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <h3 className="text-2xl font-black text-white mb-3">Predictive CTR</h3>
                 <p className="text-gray-400 leading-relaxed">
                    Don't publish and pray. Know exactly how your packaging will perform before you hit upload.
                 </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-black border border-gray-800 p-8 rounded-3xl hover:border-purple-500/50 transition-colors group">
                 <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <h3 className="text-2xl font-black text-white mb-3">1-Click Viral Fix</h3>
                 <p className="text-gray-400 leading-relaxed">
                    Thumbnail flopping? One click analyzes the weak points and generates a new, optimized version instantly.
                 </p>
              </div>
           </div>
        </div>

        {/*
          PRICING BLOCK - ELITE SAAS DESIGN
        */}
        <div id="pricing" className="w-full mt-32 mb-16 relative z-20 scroll-mt-24">
           <PricingSection />
        </div>

        {/* 
          6. FINAL CTA SECTION
        */}
        <div className="w-full max-w-4xl mt-32 bg-gradient-to-br from-cyan-900 to-black border border-cyan-500/30 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.15)]">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
           
           <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 relative z-10">Create The Winners.</h2>
           <p className="text-xl md:text-2xl text-gray-300 font-medium max-w-2xl mx-auto mb-12 relative z-10">
             Join 124,000+ creators packaging their videos in a fast, cheap & reliable way.
           </p>
           
           <button 
             onClick={handleCTA}
             className="w-full md:w-auto px-10 py-5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xl rounded-full transition-all active:scale-95 shadow-[0_0_40px_rgba(34,211,238,0.4)] relative z-10"
           >
             Start Creating Now
           </button>
           <p className="text-gray-400 text-sm mt-6 font-medium relative z-10">Free trial available. No credit card required.</p>
        </div>

      </main>

      {/* 
        AUTH MODAL (Step 3 of Demo Flow)
      */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-[420px] bg-[#0c0c10] border border-gray-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden animate-slide-up">
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800 transition-colors z-20"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="text-center mb-8 relative z-10 mt-4">
                  <div className="text-3xl font-black text-white flex items-center justify-center mb-2">
                    Beastify<span className="text-cyan-400">.ai</span>
                  </div>
                  <p className="text-gray-400 font-medium">Sign up to access the platform.</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <button 
                      onClick={onSignIn}
                      className="w-full py-4 rounded-xl bg-white hover:bg-gray-100 text-black font-black flex items-center justify-center gap-3 transition-colors text-[16px]"
                    >
                      <GoogleIcon className="w-5 h-5"/> Continue with Google
                    </button>
                    
                    <button 
                      onClick={() => alert("Discord login is not configured yet. Please use Google.")}
                      className="w-full py-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-black flex items-center justify-center gap-3 transition-colors text-[16px]"
                    >
                      <DiscordIcon className="w-5 h-5"/> Continue with Discord
                    </button>

                    <button 
                      onClick={() => alert("Apple login is not configured yet. Please use Google.")}
                      className="w-full py-4 rounded-xl bg-black border border-gray-700 hover:bg-gray-900 text-white font-black flex items-center justify-center gap-3 transition-colors text-[16px]"
                    >
                      <AppleIcon className="w-5 h-5"/> Continue with Apple
                    </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-8 font-medium">
                  By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
      )}
      
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
}

function XIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function StarIconOutline({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>;
}

function GoogleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
}

function DiscordIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 127 96"><path d="M107.5 13.5A107.4 107.4 0 0087.6 1.7c-.5 1-1.2 2.3-1.6 3.4a101 101 0 00-45.2 0c-.5-1.1-1.1-2.4-1.6-3.4A107 107 0 0019.2 13.5c-25.2 38-32 74.8-28.5 111A107.8 107.8 0 0041 141.2c2-2.7 3.8-5.6 5.4-8.5-4.2-1.6-8.2-3.5-12-5.7-1-.6-1.3-2-2.1-3 .4-.3.9-.6 1.3-.9 24.3-11.4 50.8-11.4 75 0 .4.3.9.6 1.3.9-.8 1-1 2.3-2 3a91.3 91.3 0 01-12.1 5.7c1.6 2.9 3.4 5.8 5.4 8.5a108 108 0 0030.5-16.7c3.9-40.4-5.3-76.3-24.3-111zm-64 77.5c-6.8 0-12.4-6.3-12.4-13.9 0-7.7 5.5-14 12.5-14 7 0 12.6 6.4 12.5 14 0 7.6-5.5 14-12.6 14zm39.7 0c-6.8 0-12.4-6.3-12.4-13.9 0-7.7 5.5-14 12.5-14 7 0 12.6 6.4 12.5 14 0 7.6-5.5 14-12.6 14z" fill="currentColor"/></svg>;
}

function AppleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.1-44.6-35.9-2.8-74.3 22.7-93.1 22.7-18.9 0-50.6-22-83.6-21.4-44.3.6-85 25.5-108.5 64.9C-20 286.2 24.8 409 69.4 468.9c22.1 29.5 48.9 63.6 81.3 62.4 31.4-1.2 43.1-20.7 82.2-20.7 39 0 49.3 20.7 82.5 20.1 33.6-.6 56.6-31.5 78.4-63.5 25-36 34.6-71 35-72.9-1.1-.3-69.8-26.4-70.1-125.6zM277.5 106C294 85.9 305 58.7 301.9 32c-23.4 1.2-52.9 16.2-69.8 36.3-14.3 16.7-26.8 44.5-23.1 70.8 26.1 1.9 52.3-13.4 68.5-33.1z"/></svg>;
}
