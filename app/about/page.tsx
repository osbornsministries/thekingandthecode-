'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Navbar from '@/components/frontend/header/navbar';
import GsapSnowBackground from '@/components/frontend/home/SnowBackground';
import AboutSection from '@/components/frontend/about';

export default function AboutPage() {
  const mainRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from('.nav-item', { autoAlpha: 0, y: -20, duration: 0.5, stagger: 0.1 });
    tl.fromTo('.title-reveal', 
      { x: -50, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: 0.2 }
    );
    tl.fromTo('.form-reveal', 
      { y: 50, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.2)' },
      "-=0.8"
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
      
      {/* Title */}
      <p className="title-reveal invisible text-xl md:text-4xl tracking-[0.5em] uppercase font-[FelixTilting] mb-6 mt-24 text-gray-800">
        Merry Christmas
      </p>

      {/* GRID CONTAINER: 
         - Changed 'items-center' to 'items-stretch' so both columns try to be same height
         - Ensure w-full and max-w-none or large max-w
      */}
      <div className="flex-1 w-full max-w-[1800px] px-4 md:px-8 z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-stretch mt-4">
        
        {/* LEFT COLUMN: Title */}
<div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
  <h1 className="title-reveal italic invisible font-[FelixTilting] text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-[90px] xl:text-[110px] 2xl:text-[140px] leading-[0.85] md:leading-[0.9] text-black mb-6 md:mb-8 px-4">
    ABOUT <br className="hidden xs:block" /> 
    <span className="inline-block">THE KING & THE CODE</span>
  </h1>
</div>
        {/* RIGHT COLUMN: The About Form */}
        {/* Added h-full to ensure it fills the column height */}
        <div className="form-reveal invisible w-full h-full lg:ml-auto flex flex-col">
          <AboutSection/>
        </div>
      </div>
    </main>
  );
}