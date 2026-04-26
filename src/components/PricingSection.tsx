import React, { useState } from 'react';

interface PricingSectionProps {
  onSubscribe?: (plan: string) => void;
  isModal?: boolean;
}

export default function PricingSection({ onSubscribe, isModal = false }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);

  const handleCTA = (plan: string) => {
    if (onSubscribe) {
      onSubscribe(plan);
    } else {
      alert(`In a real app, this would redirect to Stripe Checkout for the ${plan} plan.`);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 ${isModal ? '' : 'py-24'}`}>
      {/* HEADER & POSITIONING */}
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Unlock Your Unfair Advantage.
        </h2>
        <p className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl mx-auto">
          Stop guessing what works. Get data-backed thumbnails and viral concepts instantly.
        </p>

        {/* TOGGLE */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-7 rounded-full bg-gray-800 border border-gray-700 relative flex items-center p-1 transition-all hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isAnnual ? 'translate-x-7 bg-cyan-400' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
            Yearly
            <span className="text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* PRICING STRUCTURE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto relative z-10 items-start">
        
        {/* Creator Plan */}
        <div className="bg-[#0a0a0c] border border-gray-800/80 rounded-2xl p-8 flex flex-col hover:border-gray-600 transition-all duration-300 h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Creator</h3>
            <p className="text-gray-400 text-sm h-10">For growing channels finding their edge.</p>
          </div>
          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-white">${isAnnual ? '15' : '19'}</span>
            <span className="text-gray-500 font-medium">/mo</span>
          </div>
          <button
            onClick={() => handleCTA('Creator')}
            className="w-full py-3.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            Start Growing
          </button>
          <ul className="space-y-4 text-sm text-gray-300 flex-1">
            <li className="flex items-start gap-3"><CheckIcon /> 50 Data-Driven Generations</li>
            <li className="flex items-start gap-3"><CheckIcon /> Standard Quality Outputs</li>
            <li className="flex items-start gap-3"><CheckIcon /> Basic Click-Through Analytics</li>
            <li className="flex items-start gap-3 text-gray-600"><MinusIcon /> Predictive Heatmaps</li>
            <li className="flex items-start gap-3 text-gray-600"><MinusIcon /> 1-Click Viral Fix</li>
          </ul>
        </div>

        {/* Pro Plan (Dominant) */}
        <div className="bg-gradient-to-b from-[#111827] to-[#0a0a0c] border-2 border-cyan-500/50 rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(34,211,238,0.1)] hover:shadow-[0_0_60px_rgba(34,211,238,0.15)] transition-all duration-300 h-[calc(100%+2rem)]">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-xl" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-950 text-cyan-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-500/30">
            Best Value
          </div>
          
          <div className="mb-8 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Pro</h3>
            </div>
            <p className="text-gray-400 text-sm h-10">For creators treating YouTube like a business.</p>
          </div>
          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-white">${isAnnual ? '39' : '49'}</span>
            <span className="text-gray-500 font-medium">/mo</span>
          </div>
          <button
            onClick={() => handleCTA('Pro')}
            className="w-full py-3.5 px-4 rounded-lg bg-white hover:bg-gray-100 text-black font-bold transition-all text-sm mb-8 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            Upgrade Your CTR
          </button>
          <ul className="space-y-4 text-sm text-gray-200 flex-1 font-medium">
            <li className="flex items-start gap-3"><CheckIcon className="text-cyan-400" /> Unlimited Viral Generations</li>
            <li className="flex items-start gap-3"><CheckIcon className="text-cyan-400" /> 4K Ultra-Res Upscaling</li>
            <li className="flex items-start gap-3"><CheckIcon className="text-cyan-400" /> Predictive Heatmap Analytics</li>
            <li className="flex items-start gap-3"><CheckIcon className="text-cyan-400" /> 1-Click Viral Fix Engine</li>
            <li className="flex items-start gap-3"><CheckIcon className="text-cyan-400" /> Priority Server Access</li>
          </ul>
        </div>

        {/* Agency Plan */}
        <div className="bg-[#0a0a0c] border border-gray-800/80 rounded-2xl p-8 flex flex-col hover:border-gray-600 transition-all duration-300 h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Agency</h3>
            <p className="text-gray-400 text-sm h-10">For high-volume production & teams.</p>
          </div>
          <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-white">${isAnnual ? '119' : '149'}</span>
            <span className="text-gray-500 font-medium">/mo</span>
          </div>
          <button
            onClick={() => handleCTA('Agency')}
            className="w-full py-3.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all text-sm mb-8 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            Scale Your Agency
          </button>
          <ul className="space-y-4 text-sm text-gray-300 flex-1">
            <li className="flex items-start gap-3"><CheckIcon /> Everything in Pro, plus:</li>
            <li className="flex items-start gap-3"><CheckIcon /> 5 Team Workspaces</li>
            <li className="flex items-start gap-3"><CheckIcon /> Advanced Competitor Tracking</li>
            <li className="flex items-start gap-3"><CheckIcon /> White-label Reporting</li>
            <li className="flex items-start gap-3"><CheckIcon /> Dedicated Success Manager</li>
          </ul>
        </div>

      </div>

      {/* TRUST ELEMENTS */}
      <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400 text-sm relative z-10">
        <div className="flex items-center gap-2">
          <LockIcon />
          <span>Secured by Stripe</span>
        </div>
        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
        <div className="flex items-center gap-2">
          <UndoIcon />
          <span>Cancel Anytime</span>
        </div>
        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-700" />
        <div className="flex items-center gap-2">
          <ShieldIcon />
          <span>14-Day Money-Back Guarantee</span>
        </div>
      </div>
    </div>
  );
}

// Icons optimized for the elite SaaS look
function CheckIcon({ className = "text-gray-400" }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
