'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CalendarClock, Ticket } from "lucide-react";
import Link from 'next/link';

// Component Imports
import GsapSnowBackground from '@/components/frontend/home/SnowBackground';
import CountdownTimer from '@/components/frontend/home/CountdownTimer';
import Navbar from '@/components/frontend/header/navbar';
import Image from 'next/image';

export default function Home() {
  const mainRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Navigation Entrance
    tl.from('.nav-item', { 
      y: -50, 
      autoAlpha: 0, 
      duration: 0.8, 
      stagger: 0.1, 
      ease: 'power3.out' 
    })
    
    // 2. Top Tagline (Merry Christmas) - Was missing in your original timeline
    .fromTo('.title-reveal',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' },
      "-=0.4"
    )

    // 3. Main Hero Text Entrance
    .fromTo('.hero-reveal', 
      { y: 60, autoAlpha: 0 },
      { 
        y: 0, 
        autoAlpha: 1, 
        duration: 1.1, 
        stagger: 0.1, 
        ease: 'back.out(1.2)', // Slightly smoother bounce
        clearProps: 'transform' // Critical for hover effects on button
      }, 
      "-=0.6"
    )
    
    // 4. Background Decorations Fade In
    .fromTo('.fade-in', 
      { autoAlpha: 0, scale: 0.95 }, 
      { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'power2.out' }, 
      "-=0.8"
    );
      
  }, { scope: mainRef });

  return (
    <main 
      ref={mainRef} 
    className="min-h-screen relative flex flex-col items-center overflow-hidden bg-[url('/images/background/p.png')] bg-cover bg-center bg-no-repeat"
    >
      {/* Background Overlay: Improves text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none z-0"></div>
      
      {/* 1. Animated Snow */}
      <GsapSnowBackground />

      {/* 2. Navigation */}
        <div className="absolute inset-0 bg-white/30 mix-blend-overlay z-0 pointer-events-none" />
    
          <Navbar />

      {/* 3. Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-7xl mx-auto px-4 text-center py-10 md:py-0">
        
        {/* Top Tagline */}
        <p className="title-reveal invisible text-lg md:text-3xl tracking-[0.4em] uppercase font-[FelixTilting] mb-8 text-gray-900 drop-shadow-sm">
          Merry Christmas
        </p>

        {/* --- Main Title Block --- */}
        <div className="relative mb-10 md:mb-12 select-none">
          <h1 className="leading-[0.8] flex flex-col items-center justify-center">

           <Image width={500} height={100} alt='logo' src='/images/logo/logo.png' />
          </h1>
        </div>

        {/* Edition Subtitle */}
        <div className="hero-reveal invisible flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-14 relative group">
          <span className="font-[Bellarina] text-5xl md:text-7xl text-gray-900 tracking-wide drop-shadow-sm">
            Christmas Edition
          </span>
          <span className="font-[Bellarina] text-4xl md:text-5xl text-[#8a1f1f]">
            2025
          </span>
          {/* Animated Underline */}
          <span className="absolute -bottom-2 w-0 h-[1px] bg-gray-500 transition-all duration-700 group-hover:w-3/4 opacity-40"></span>
        </div>

        {/* Info & Timer Section */}
        <div className="hero-reveal invisible w-full flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 mb-16  p-6 ">
          
          {/* Date Info */}
          <div className="flex items-center gap-5 text-left lg:border-r border-gray-400/50 lg:pr-12 pb-6 lg:pb-0 border-b lg:border-b-0 w-full lg:w-auto justify-center lg:justify-start">
            <div className="p-3 bg-white/40 rounded-full shadow-inner">
               <CalendarClock className="w-8 h-8 md:w-10 md:h-10 text-[#8a1f1f]" strokeWidth={1.5} />
            </div>
            <div className="font-[FelixTilting] text-gray-900">
              <p className="text-2xl md:text-3xl leading-none tracking-wide font-bold">
                19TH – 21ST
              </p>
              <p className="text-lg md:text-xl font-medium leading-none tracking-[0.2em] mt-1 opacity-80">
                DECEMBER
              </p>
            </div>
          </div>

          {/* Countdown Component */}
          <div className="scale-90 md:scale-100">
         
         <CountdownTimer targetDate="2025-12-19T00:00:00" />
          </div>
        </div>

        {/* CTA Button - Corrected: Link wraps the logic, not inside a button */}
        <Link 
          href="/tickets"
          className="hero-reveal invisible group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#602324] to-[#cf635f] text-white font-serif text-lg md:text-xl px-12 py-4 rounded-full shadow-2xl hover:shadow-[0_15px_40px_rgba(138,31,31,0.5)] transition-all duration-300 hover:-translate-y-1 border border-white/20 overflow-hidden"
        >
          <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="relative z-10 tracking-widest font-semibold">
            BUY TICKETS
          </span>
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-white/25 translate-x-[-100%] skew-x-[-15deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
        </Link>

      </div>

    

      {/* Decorative Gradient Glow (Bottom Left) */}
       <div className="fade-in invisible absolute bottom-0 left-0 w-full md:w-1/2 h-64 bg-gradient-to-t from-[#8a1f1f]/10 to-transparent z-0 pointer-events-none"></div>

    </main>
  );
}


