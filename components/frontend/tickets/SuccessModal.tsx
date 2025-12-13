'use client';

import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

interface Props {
  onClose: () => void;
}

export default function SuccessModal({ onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

    // 3. Stagger inner elements (Icon, Title, Text, Button)
    tl.fromTo('.modal-item', 
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
      "-=0.4"
    );

  }, { scope: modalRef });

  return (
    <div ref={modalRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div ref={contentRef} className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/40">
        
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
            please confirm  the SMS and enter PIN to complete transaction
          </p>
         
        </div>

        {/* Action Button */}
        {/* <button 
          onClick={onClose}
          className="modal-item group w-full bg-gradient-to-r from-gray-900 to-black text-white font-bold py-4 rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <span>View Ticket Status</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button> */}

      </div>
    </div>
  );
}