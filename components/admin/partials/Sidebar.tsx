'use client';

import { useEffect } from 'react';
import { Menu, X, LayoutDashboard, Ticket, Users, Settings, LogOut, ScanLine, CircleDashedIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Cash Ticket', href: '/admin/pos', icon: CircleDashedIcon },
    { name: 'Verify (Scanner)', href: '/admin/verify', icon: ScanLine },
    { name: 'Assign tickt', href: '/admin/agent', icon: ScanLine },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    return (
        <aside className="h-full bg-[#1A1A1A] text-white flex flex-col border-r border-gray-800">
            <div className="h-20 flex items-center justify-between px-6 lg:px-8 border-b border-gray-800">
                <div className="flex flex-col">
                    <span className="font-serif text-xl font-bold tracking-wider">King & Code</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Admin Panel</span>
                </div>
                <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition p-1">
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 px-3 py-6 lg:px-4 lg:py-8 space-y-1 lg:space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                                isActive ? 'bg-[#A81010] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                            <span className="font-medium text-sm lg:text-base">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 lg:p-4 border-t border-gray-800">
                <button 
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex w-full items-center gap-3 px-3 lg:px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium text-sm lg:text-base">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}

export default function Sidebar({ isOpen, onClose, onOpen }: { isOpen?: boolean; onClose?: () => void; onOpen?: () => void }) {
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 1024 && onClose) onClose(); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [onClose]);

    return (
        <>
            {/* Mobile Toggle */}
            <button onClick={onOpen} className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-[#A81010] text-white rounded-xl shadow-lg">
                <Menu size={24} />
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
            )}
            
            {/* Sidebar Container: The width logic is unified here */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
            `}>
                <SidebarContent onClose={onClose} />
            </div>
        </>
    );
}