'use client';

import { useEffect, useState } from 'react';
import { Menu, X, LayoutDashboard, Ticket, Users, Settings, LogOut, ScanLine, CircleDashedIcon, ChevronDown, ChevronRight, File } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
   
    { 
        name: 'Tickets', 
        icon: Ticket,
        submenu: true,
        items: [
            { name: 'All Tickets', href: '/admin/tickets' },
            { name: 'Import Tickets', href: '/admin/tickets/import-ticket' },
            { name: 'Assign tickt', href: '/admin/agent' },
            { name: 'Cash Ticket', href: '/admin/pos' },
            { name: 'Verify (Scanner)', href: '/admin/verify' },
            { name: 'Verified ticket', href: '/admin/verified-tickets' },
            
            
        ]
    },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    // Initialize open submenus based on current path
    useEffect(() => {
        const initialOpenState: Record<string, boolean> = {};
        menuItems.forEach(item => {
            if (item.submenu && item.items) {
                // Check if any submenu item matches current path
                const hasActiveChild = item.items.some(subItem => {
                    // Special handling for tickets to avoid false positives
                    if (subItem.href === '/admin/tickets') {
                        // Only mark as active if we're exactly on /admin/tickets
                        // or on a subpath that's not /admin/tickets/import-ticket
                        return pathname === '/admin/tickets' || 
                               (pathname.startsWith('/admin/tickets/') && 
                                !pathname.startsWith('/admin/tickets/import-ticket'));
                    }
                    return pathname === subItem.href || 
                           (subItem.href !== '/admin/tickets' && pathname.startsWith(subItem.href + '/'));
                });
                if (hasActiveChild) {
                    initialOpenState[item.name] = true;
                }
            }
        });
        setOpenSubmenus(initialOpenState);
    }, [pathname]);

    const toggleSubmenu = (name: string) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const isActive = (href: string) => {
        // Special case for /admin/tickets to avoid matching /admin/tickets/import-ticket
        if (href === '/admin/tickets') {
            return pathname === '/admin/tickets' || 
                   (pathname.startsWith('/admin/tickets/') && 
                    !pathname.startsWith('/admin/tickets/import-ticket'));
        }
        
        // For other routes, use exact match or check if it's a subpath
        if (pathname === href) return true;
        
        // Only consider it active if it's a subpath AND not the tickets special case
        if (pathname.startsWith(href + '/')) {
            return true;
        }
        
        return false;
    };

    const isSubItemActive = (subItemHref: string) => {
        // For submenu items, we want more precise matching
        if (subItemHref === '/admin/tickets') {
            // "All Tickets" should only be active on exact /admin/tickets
            // or /admin/tickets/ (but not import-ticket)
            return pathname === '/admin/tickets' || 
                   (pathname.startsWith('/admin/tickets/') && 
                    !pathname.startsWith('/admin/tickets/import-ticket'));
        }
        
        // For other subitems, use exact match
        return pathname === subItemHref || 
               (subItemHref !== '/admin/tickets' && pathname.startsWith(subItemHref + '/'));
    };

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
                    const Icon = item.icon;
                    
                    if (item.submenu && item.items) {
                        const isSubmenuOpen = openSubmenus[item.name];
                        const hasActiveChild = item.items.some(subItem => isSubItemActive(subItem.href));

                        return (
                            <div key={item.name} className="rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleSubmenu(item.name)}
                                    className={`flex items-center justify-between w-full px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                                        hasActiveChild ? 'bg-[#A81010]/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={20} className={hasActiveChild ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                                        <span className="font-medium text-sm lg:text-base">{item.name}</span>
                                    </div>
                                    {isSubmenuOpen ? (
                                        <ChevronDown size={18} className="text-gray-400" />
                                    ) : (
                                        <ChevronRight size={18} className="text-gray-400" />
                                    )}
                                </button>
                                
                                {isSubmenuOpen && (
                                    <div className="ml-8 mt-1 space-y-1 py-2 border-l border-gray-700 pl-4">
                                        {item.items.map((subItem) => {
                                            const isSubItemActiveNow = isSubItemActive(subItem.href);
                                            return (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href}
                                                    onClick={onClose}
                                                    className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                                        isSubItemActiveNow 
                                                            ? 'text-white bg-[#A81010]' 
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isSubItemActiveNow ? 'bg-white' : 'bg-gray-600'}`} />
                                                    <span className="font-medium text-sm lg:text-base">{subItem.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Regular menu item
                    const isItemActive = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                                isItemActive ? 'bg-[#A81010] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Icon size={20} className={isItemActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
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