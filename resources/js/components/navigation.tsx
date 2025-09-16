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
import { BarChart3, Calendar, Home, Info, KeyRound, LogOut, Mail, Menu, User, X, Images } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppearanceToggleDropdown from './appearance-dropdown';

// Define route functions since we're rebuilding the navigation
const login = () => '/login';
const register = () => '/register';

// Define consistent container width across the site
const CONTAINER_CLASS = 'container mx-auto px-4';

// Menu items for better organization and maintainability
const menuItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Galleries', href: '/galleries', icon: Images },
    { name: 'Trackers', href: '/trackers', icon: BarChart3 },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
];

export default function Navigation() {
    const { auth } = usePage<SharedData>().props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = window.location.pathname;

    // Handle scroll effect for navbar background
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 right-0 left-0 z-50 border-b transition-all duration-300',
                    scrolled ? 'bg-white/90 shadow-sm dark:bg-slate-900/90' : 'bg-white/80 dark:bg-slate-900/80',
                    'border-slate-200/50 backdrop-blur-md dark:border-slate-700/50',
                )}
            >
                <div className={CONTAINER_CLASS}>
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo and brand */}
                        <div className="flex flex-shrink-0 items-center">
                            <Link href="/" className="flex items-center gap-2" prefetch="hover">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                                    <img src="/logo.svg" alt="DIU ACM Logo" className="rounded-lg object-cover" width={32} height={32} />
                                </div>
                                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-xl font-bold text-transparent dark:from-blue-400 dark:to-cyan-300">
                                    DIU ACM
                                </span>
                            </Link>
                        </div>

                        {/* Desktop navigation */}
                        <nav className="hidden items-center md:flex">
                            <div className="mr-4 flex flex-wrap items-center gap-1">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            prefetch="hover"
                                            className={cn(
                                                'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 lg:text-sm',
                                                isActive
                                                    ? 'bg-blue-50 font-medium text-blue-600 shadow-sm dark:bg-blue-950/40 dark:text-blue-400'
                                                    : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400',
                                            )}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            <item.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-800">
                                <AppearanceToggleDropdown />

                                {auth.user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="ml-1 h-9 w-9 overflow-hidden rounded-full border-2 border-white p-0 transition-colors hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-800"
                                                aria-label="User menu"
                                            >
                                                <Avatar className="h-full w-full">
                                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} className="object-cover" />
                                                    <AvatarFallback className="bg-blue-100 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {auth.user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="mt-1 w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="line-clamp-1 text-sm font-medium">{auth.user.name}</p>
                                                    <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem asChild>
                                                <Link href="/profile/edit" className="flex w-full cursor-pointer items-center">
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Edit Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile/change-password" className="flex w-full cursor-pointer items-center">
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    <span>Change Password</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="w-full cursor-pointer text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/50"
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    <span>Sign out</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Button
                                        asChild
                                        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition-all hover:from-blue-700 hover:to-cyan-600 hover:shadow-xl dark:from-blue-700 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-400"
                                    >
                                        <Link href={register()}>Sign Up</Link>
                                    </Button>
                                )}
                            </div>
                        </nav>

                        {/* Mobile navigation controls */}
                        <div className="flex items-center gap-2 md:hidden">
                            <AppearanceToggleDropdown />

                            {auth.user && (
                                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} className="object-cover" />
                                    <AvatarFallback className="bg-blue-100 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {auth.user.name?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="ml-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMenuOpen}
                            >
                                <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile menu overlay with improved animations */}
            <div
                className={cn(
                    'fixed inset-0 z-50 bg-black/70 transition-all duration-300 md:hidden',
                    isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden={!isMenuOpen}
            >
                <div
                    className={cn(
                        'absolute top-0 right-0 bottom-0 w-4/5 max-w-sm transform bg-white/95 shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900/95',
                        isMenuOpen ? 'translate-x-0' : 'translate-x-full',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex h-full flex-col">
                        {/* Menu header with profile or sign in */}
                        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
                            {auth.user ? (
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} className="object-cover" />
                                        <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {auth.user.name?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="line-clamp-1 font-medium text-slate-900 dark:text-white">{auth.user.name}</span>
                                        <span className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <span className="text-lg font-medium text-slate-900 dark:text-slate-100">Welcome to DIU ACM</span>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={login()}>Log In</Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        >
                                            <Link href={register()}>Sign Up</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-4 right-4 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                            </Button>
                        </div>

                        {/* Navigation menu with improved active state */}
                        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        prefetch="hover"
                                        className={cn(
                                            'flex items-center rounded-md px-4 py-3 text-base transition-all duration-200',
                                            isActive
                                                ? 'bg-blue-50 font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400',
                                        )}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        <item.icon className="mr-3 h-5 w-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Menu footer */}
                        {auth.user && (
                            <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
                                <div className="space-y-1">
                                    <Link
                                        href="/profile/edit"
                                        className="flex items-center rounded-md px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                    >
                                        <User className="mr-3 h-4 w-4" />
                                        Edit Profile
                                    </Link>
                                    <Link
                                        href="/profile/change-password"
                                        className="flex items-center rounded-md px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                                    >
                                        <KeyRound className="mr-3 h-4 w-4" />
                                        Change Password
                                    </Link>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
                                    asChild
                                >
                                    <Link href="/logout" method="post" as="button">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </Link>
                                </Button>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} DIU ACM</span>
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        v1.0
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spacer for fixed header */}
            <div className="h-16"></div>
        </>
    );
}
