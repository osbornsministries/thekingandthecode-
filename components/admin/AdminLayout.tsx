'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Sidebar from '@/components/admin/partials/Sidebar';
import Header from '@/components/admin/partials/Header';
import Footer from '@/components/admin/partials/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A81010]"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex font-sans overflow-x-hidden">
      {/* Sidebar - Occupies its own space on desktop (lg:relative) */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
      /> 
      
      {/* Main Content - flex-1 ensures it takes all remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}