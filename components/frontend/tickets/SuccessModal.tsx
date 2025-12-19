'use client';

import { CheckCircle, ArrowRight, Loader2, ShoppingCart } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  onBuyNext?: () => Promise<void> | void; // Can be async
}

export default function SuccessModal({ onClose, onBuyNext }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isBuyingNext, setIsBuyingNext] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Background Fade In
    tl.fromTo(modalRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3 }
    );

    // 2. Modal Pop Up (Elastic)
    tl.fromTo(contentRef.current,
      { scale: 0.8, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.75)' }
    );

    // 3. Stagger inner elements
    tl.fromTo('.modal-item', 
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
      "-=0.4"
    );

  }, { scope: modalRef });

  const handleBuyNext = async () => {
    if (!onBuyNext) return;
    
    setIsBuyingNext(true);
    try {
      await onBuyNext();
      // You could close the modal after buying next
      // onClose();
    } catch (error) {
      console.error('Error buying next ticket:', error);
    } finally {
      setIsBuyingNext(false);
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div ref={contentRef} className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/40">
        
        {/* Animated Icon Circle */}
        <div className="modal-item w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-200">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Title */}
        <h2 className="modal-item text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-3">
          Payment in process
        </h2>

        {/* Instructions */}
        <div className="modal-item space-y-2 mb-8">
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            please confirm the SMS and enter PIN to complete transaction
          </p>
          {onBuyNext && (
            <p className="text-sm text-gray-500 italic">
              You can buy another ticket while waiting for confirmation
            </p>
          )}
        </div>

        {/* Button Group */}
        <div className="modal-item space-y-4">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group hover:shadow-lg"
          >
            <span>Close</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Buy Next Button */}
          {onBuyNext && (
            <button
              onClick={handleBuyNext}
              disabled={isBuyingNext}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group hover:shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isBuyingNext ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy Next Ticket</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}