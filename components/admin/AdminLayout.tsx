'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Sidebar from '@/components/admin/partials/Sidebar';
import Header from '@/components/admin/partials/Header';
import Footer from '@/components/admin/partials/Footer';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Handle Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A81010] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // 2. Handle Unauthenticated State (FORCE HARD NAVIGATION)
  if (status === 'unauthenticated' || !session) {
    // Check if we are ALREADY on the login page to prevent an infinite loop
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
      // Use window.location.href to force a full browser refresh (hard navigation)
      window.location.href = '/admin/login';
    }
    
    // Return null while the hard navigation occurs
    return null;
  }

  // 3. Handle Authenticated State (status === 'authenticated')
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex font-sans">
      {/* The Sidebar component with controlled state */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      /> 
      
      {/* Main Content Wrapper */}
      <div 
        className={`
          flex-1 min-h-screen flex flex-col 
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
        `}
      >
        <Header onMenuToggle={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}