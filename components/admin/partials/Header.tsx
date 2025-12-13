'use client';

import { Bell, Search, ChevronDown, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileMenuItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { data: session } = useSession(); 
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside profile dropdown and search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close profile dropdown
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      
      // Close expanded search on mobile when clicking outside
      if (isSearchExpanded && searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchExpanded]);

  // Handle escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchExpanded(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Real Search Logic
  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/admin/tickets?search=${encodeURIComponent(searchQuery)}`);
    setIsSearchExpanded(false);
  };

  const profileMenuItems: ProfileMenuItem[] = [
    { 
      label: 'View Profile', 
      icon: User,
      onClick: () => router.push('/admin/users/profile') 
    },
    { 
      label: 'Settings', 
      icon: Settings,
      onClick: () => router.push('/admin/settings') 
    },
  ];

  // Helper to get initials from name (e.g. "John Doe" -> "J")
  const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A';
  const userRole = session?.user?.role || 'User';
  const userEmail = session?.user?.email || 'user@example.com';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-between transition-all">
      
      {/* Left Section: Menu Toggle & Logo/Brand */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuToggle} 
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Brand/Logo - Hidden on very small screens, visible on mobile and up */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#A81010] to-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Event Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: Search Bar - Responsive behavior */}
      <div 
        ref={searchRef}
        className={`
          ${isSearchExpanded ? 'fixed inset-0 z-50 bg-white px-4 flex items-center lg:relative lg:inset-auto lg:bg-transparent' : 'flex-1 max-w-xs lg:max-w-xl xl:max-w-2xl'}
          ${!isSearchExpanded ? 'hidden lg:block' : ''}
        `}
      >
        <div className="w-full">
          {/* Mobile Search Header */}
          {isSearchExpanded && (
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="text-lg font-bold text-gray-900">Search</h2>
              <button
                onClick={() => setIsSearchExpanded(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Close search"
              >
                <X size={24} />
              </button>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative">
            <div className={`
              flex items-center bg-gray-50 rounded-xl border border-gray-200 
              focus-within:border-[#A81010] focus-within:bg-white focus-within:shadow-md 
              transition-all duration-200 w-full
              ${isSearchExpanded ? 'px-4 py-3' : 'px-2 md:px-4 py-2 lg:py-2.5'}
            `}>
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSearchExpanded ? "Search tickets, users, reports..." : "Search..."}
                className="bg-transparent border-none outline-none text-sm ml-3 w-full placeholder:text-gray-400 text-gray-800"
                aria-label="Search"
                autoFocus={isSearchExpanded}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        
        {/* Mobile Search Toggle Button */}
        <button 
          onClick={() => setIsSearchExpanded(true)}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Open search"
        >
          <Search size={20} />
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button 
            className="p-2 text-gray-500 hover:text-[#A81010] hover:bg-gray-100 rounded-xl transition-colors duration-200 relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#A81010] rounded-full border border-white"></span>
          </button>
          
          {/* Notification Count Badge - Mobile only */}
          <div className="lg:hidden absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
            3
          </div>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          {/* Mobile Profile Button - Compact */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="lg:hidden p-1.5 rounded-xl hover:bg-gray-50 transition-colors duration-200"
            aria-label="User menu"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A81010] to-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {userInitial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </button>

          {/* Desktop Profile Button */}
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="hidden lg:flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
            aria-label="User menu"
          >
            {/* User Name & Role */}
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 text-left truncate max-w-[120px]">
                {session?.user?.name || 'Loading...'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider text-right">
                {userRole}
              </p>
            </div>
            
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A81010] to-black text-white flex items-center justify-center font-serif font-bold text-base shadow-sm border-2 border-transparent group-hover:border-gray-200 transition-all">
                {userInitial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Profile Info */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A81010] to-black text-white flex items-center justify-center font-bold text-lg">
                      {userInitial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-700 rounded-full uppercase">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="py-2">
                {profileMenuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#A81010] transition-colors duration-150 flex items-center gap-3 font-medium"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-gray-100 pt-2 px-3 pb-3">
                <button
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await signOut({ callbackUrl: '/admin/login' });
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-white bg-black rounded-xl hover:bg-gray-800 transition-colors duration-150 flex items-center justify-center gap-2 font-bold shadow-md"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay (Alternative approach if needed) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-in slide-in-from-right duration-300">
            {/* Mobile menu content */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}