import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { 
    BarChart3, 
    Calendar, 
    Home, 
    Info, 
    KeyRound, 
    LogIn, 
    LogOut, 
    Mail, 
    Menu, 
    User, 
    Users, 
    X 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppearanceToggleDropdown from './appearance-dropdown';

// Navigation items
const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Trackers', href: '/trackers', icon: BarChart3 },
    { name: 'Programmers', href: '/programmers', icon: Users },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
];

export default function Navigation() {
    const { auth } = usePage<SharedData>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    // Check if menu item is active
    const isActive = (href: string) => {
        return href === '/' ? currentPath === '/' : currentPath.startsWith(href);
    };

    // Get user initials
    const getInitials = (name?: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    return (
        <>
            <header 
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-lg transition-all duration-300',
                    isScrolled 
                        ? 'bg-white/95 border-gray-200 shadow-lg dark:bg-gray-900/95 dark:border-gray-800' 
                        : 'bg-white/80 border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50'
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2">
                            <img
                                src="/images/diuacm-logo-rounded.webp"
                                alt="DIU ACM"
                                className="h-7 w-7 rounded-lg"
                            />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                                DIU ACM
                            </span>
                        </Link>

                        {/* Right Section with Navigation */}
                        <div className="flex items-center space-x-2">
                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center space-x-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                                                active
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800'
                                            )}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            <span className="hidden lg:inline">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center space-x-2 border-l border-gray-200 pl-2 dark:border-gray-700">
                                <AppearanceToggleDropdown />

                                {auth.user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-7 w-7 rounded-full p-0">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs">
                                                        {getInitials(auth.user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium">{auth.user.name}</p>
                                                    <p className="text-xs text-gray-500">{auth.user.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile/edit" className="flex items-center">
                                                    <User className="mr-2 h-4 w-4" />
                                                    Edit Profile
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile/change-password" className="flex items-center">
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Change Password
                                                </Link>
                                            </DropdownMenuItem>
                                            
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="text-red-600 focus:bg-red-50 dark:text-red-400"
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Sign out
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className="flex items-center space-x-1">
                                        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex h-8 px-3">
                                            <Link href="/login">
                                                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                                                Sign In
                                            </Link>
                                        </Button>
                                        <Button size="sm" asChild className="h-8 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                                            <Link href="/register">Sign Up</Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Mobile Menu Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden h-8 w-8"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl dark:bg-gray-900">
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center space-x-2">
                                    <img src="/images/diuacm-logo-rounded.webp" alt="DIU ACM" className="h-8 w-8 rounded-lg" />
                                    <span className="text-lg font-semibold">DIU ACM</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* User Info */}
                            {auth.user && (
                                <div className="p-4 border-b">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                            <AvatarFallback className="bg-blue-600 text-white">
                                                {getInitials(auth.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{auth.user.name}</p>
                                            <p className="text-sm text-gray-500">{auth.user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <nav className="flex-1 overflow-y-auto p-4">
                                <div className="space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn(
                                                    'flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors',
                                                    active
                                                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-950/50 dark:text-blue-300'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800'
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* User Actions */}
                                {auth.user && (
                                    <div className="mt-6 pt-6 border-t space-y-1">
                                        <Link
                                            href="/profile/edit"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>Edit Profile</span>
                                        </Link>
                                        <Link
                                            href="/profile/change-password"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            <span>Change Password</span>
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center space-x-3 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Sign out</span>
                                        </Link>
                                    </div>
                                )}

                                {/* Guest Actions */}
                                {!auth.user && (
                                    <div className="mt-6 pt-6 border-t space-y-3">
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                                <LogIn className="mr-2 h-4 w-4" />
                                                Sign In
                                            </Link>
                                        </Button>
                                        <Button className="w-full" asChild>
                                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                                Sign Up
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer */}
            <div className="h-14" />
        </>
    );
}
