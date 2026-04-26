import React, { useEffect, useState } from 'react';
import { XMarkIcon } from './IconComponents';
import PricingSection from './PricingSection';

interface PricingModalProps {
  onClose: () => void;
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = (plan: string) => {
    alert(`In a real app, this would redirect to Stripe for the ${plan} plan.`);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-xl transition-opacity duration-300 overflow-y-auto ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className="w-full relative animate-slide-up my-auto z-10 py-12">
            
            <button 
              onClick={onClose}
              className="fixed top-6 right-6 lg:absolute lg:top-4 lg:right-8 p-2.5 bg-gray-900 border border-gray-800 rounded-full hover:bg-gray-800 hover:text-white transition-all z-50 text-gray-400 group focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            
            <PricingSection onSubscribe={handleSubscribe} isModal={true} />
            
        </div>
    </div>
  );
}

