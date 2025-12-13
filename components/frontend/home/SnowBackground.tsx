'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function GsapSnowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // 1. Configuration
    const flakeCount = 60; // Adjust for density
    const container = containerRef.current;
    
    // 2. Create DOM elements efficiently
    for (let i = 0; i < flakeCount; i++) {
      const flake = document.createElement('div');
      
      // Tailwind classes for basic styling
      flake.className = 'absolute rounded-full bg-white pointer-events-none select-none';
      container.appendChild(flake);

      // 3. Set Initial Random Properties (Scale = Depth)
      const scale = gsap.utils.random(0.5, 1.5);
      const alpha = gsap.utils.random(0.3, 0.8);
      const isBlurry = scale < 0.8; // Smaller flakes are "far away" and blurry
      
      gsap.set(flake, {
        x: gsap.utils.random(0, window.innerWidth),
        y: gsap.utils.random(-200, -50),
        scale: scale,
        opacity: alpha,
        width: gsap.utils.random(6, 12),
        height: gsap.utils.random(6, 12),
        filter: isBlurry ? 'blur(2px)' : 'none', // Depth of field effect
        zIndex: isBlurry ? 0 : 10,
      });

      // 4. Animation Timeline
      const fallDuration = gsap.utils.random(10, 20);
      const swayDuration = gsap.utils.random(2, 4);

      // Falling Animation (Vertical)
      gsap.to(flake, {
        y: window.innerHeight + 100,
        duration: fallDuration,
        ease: 'none',
        repeat: -1,
        delay: gsap.utils.random(0, 10), // Random start times
      });

      // Swaying Animation (Horizontal) - Makes it feel like air resistance
      gsap.to(flake, {
        x: `+=${gsap.utils.random(-100, 100)}`, // Drift left or right
        rotation: gsap.utils.random(0, 360),
        duration: swayDuration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}