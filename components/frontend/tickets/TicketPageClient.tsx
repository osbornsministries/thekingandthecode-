'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import GsapSnowBackground from '@/components/frontend/home/SnowBackground'; // Ensure path is correct

export default function TicketPageClient({ children }: { children: React.ReactNode }) {
  const mainRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Reveal Navbar items (Assuming they have class .nav-item)
    tl.from('.nav-item', { 
      autoAlpha: 0, 
      y: -20, 
      duration: 0.6, 
      stagger: 0.1,
      ease: 'power2.out'
    });

    // 2. Reveal Titles (Merry Christmas, GET YOUR TICKET)
    tl.fromTo('.title-reveal', 
      { x: -50, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.2 },
      "-=0.4"
    );

    // 3. Reveal the Form Container (Elastic pop up)
    tl.fromTo('.form-reveal', 
      { y: 100, autoAlpha: 0, scale: 0.95 },
      { y: 0, autoAlpha: 1, scale: 1, duration: 1, ease: 'elastic.out(1, 0.8)' },
      "-=0.8"
    );

  }, { scope: mainRef });

  return (
    <main 
      ref={mainRef}
      className="min-h-screen relative flex flex-col items-center overflow-hidden bg-gray-900" // Fallback color
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-[url('/images/background/p.png')] bg-cover bg-center bg-no-repeat opacity-80"
      />
      
      {/* Snow Effect */}
      <GsapSnowBackground />
      
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/20 mix-blend-overlay z-0 pointer-events-none" />

      {/* Main Content (Navbar + Grid) */}
      <div className="relative z-10 w-full flex flex-col items-center min-h-screen">
        {children}
      </div>
    </main>
  );
}