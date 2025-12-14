'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import FloatingWhatsApp from './FloatingWhatsApp';

const navLinks = [
  // { name: 'Home', href: '/' },
  { name: 'Ticket', href: '/ticket' },
  { name: 'About', href: '/about' },
  // { name: 'Gallery', href: '/gallery' },
];

export default function Navbar() {
  const pathname = usePathname();
  // We use this state to immediately update visual feedback on click
  // while the router transitions.
  const [activePath, setActivePath] = useState(pathname || '/');

  // Sync state with actual path (handle browser back/forward buttons)
  useEffect(() => {
    if (pathname) {
      setActivePath(pathname);
    }
  }, [pathname]);

  return (
    <nav className="w-full max-w-7xl px-4 md:px-8 py-8 flex justify-between items-center z-20 relative">
      
      {/* Logo Section */}
      <Link href="/" className="nav-item group">
        <div className="w-20 h-20 md:w-24 md:h-24 border border-gray-400 rounded-full flex items-center justify-center relative bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/20">
          <div className="text-center leading-tight">
            <Image
              src="/images/logo/logo.png"
              alt="logo"
              width={60}
              height={50}
              className="mx-auto mb-1"
            />
          </div>
        </div>
      </Link>

      {/* Navigation Pills */}
      <div className="nav-item bg-black text-white rounded-full px-1.5 py-1.5 md:px-2 md:py-2 flex gap-1 shadow-2xl">
        {navLinks.map((link) => {
          
          // ✅ CORRECTED LOGIC:
          // 1. If link is '/', strict match (prevent it lighting up everywhere)
          // 2. Otherwise, check if current path starts with the link path (Relative detection)
          const isActive = link.href === '/' 
            ? activePath === '/' 
            : activePath.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setActivePath(link.href)}
              className={`
                px-6 md:px-8 py-2 md:py-2.5 rounded-full text-sm transition-all duration-300
                ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md' // Active Style
                    : 'text-white font-medium hover:text-gray-300 hover:bg-white/10' // Inactive Style
                }
              `}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
      <FloatingWhatsApp/>
    </nav>
  );
}