'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import Navbar from '@/components/frontend/header/navbar';
import GsapSnowBackground from '@/components/frontend/home/SnowBackground';

export default function NotFound() {
  const mainRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    // Navbar reveal
    tl.from('.nav-item', { autoAlpha: 0, y: -20, duration: 0.5, stagger: 0.1 });
    
    // 404 Big Text reveal
    tl.fromTo('.title-reveal', 
      { scale: 0.8, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power4.out' }
    );
    
    // Subtext and Button reveal
    tl.fromTo('.content-reveal', 
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.2 },
      "-=0.5"
    );
  }, { scope: mainRef });

  return (
    <main 
      ref={mainRef}
      className="min-h-screen relative flex flex-col items-center overflow-x-hidden bg-[url('/images/background/p.png')] bg-cover bg-center bg-no-repeat pb-10"
    >
      <GsapSnowBackground />
      <div className="absolute inset-0 bg-white/30 mix-blend-overlay z-0 pointer-events-none" />

      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-4 mt-20">
        {/* Error Code */}
        <h1 className="title-reveal invisible font-[FelixTilting] text-[120px] md:text-[200px] lg:text-[250px] leading-none text-black/10 select-none">
          404
        </h1>

        {/* Message */}
        <div className="absolute flex flex-col items-center">
            <h2 className="content-reveal invisible font-[FelixTilting] text-2xl md:text-5xl uppercase tracking-widest text-gray-900 mb-4">
              Lost in the Drama?
            </h2>
            <p className="content-reveal invisible text-lg md:text-xl text-gray-700 max-w-md mb-8 italic">
              The page you are looking for has taken a final bow and exited stage left.
            </p>
            
            <Link 
              href="/"
              className="content-reveal invisible px-8 py-3 bg-black text-white uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors duration-300 rounded-sm"
            >
              Back to Center Stage
            </Link>
        </div>
      </div>

      {/* Footer Decoration */}
      <p className="title-reveal invisible text-sm md:text-base tracking-[0.5em] uppercase font-[FelixTilting] mt-12 text-gray-600">
        The King & The Code
      </p>
    </main>
  );
}