import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AppearanceToggleDropdown from './appearance-dropdown';

// Define route functions since we're rebuilding the navigation
const dashboard = () => '/dashboard';
const login = () => '/login';
const register = () => '/register';

// Define consistent container width across the site
const CONTAINER_CLASS = "container mx-auto px-4";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    Menu, 
    X, 
    Home, 
    Users, 
    Info, 
    LogOut, 
    User, 
    Mail, 
    Calendar, 
    BookOpen 
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Menu items for better organization and maintainability
const menuItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Community", href: "/community", icon: Users },
    { name: "Resources", href: "/resources", icon: BookOpen },
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

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrolled]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen]);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
                    scrolled
                        ? "bg-white/90 dark:bg-slate-900/90 shadow-sm"
                        : "bg-white/80 dark:bg-slate-900/80",
                    "border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md"
                )}
            >
                <div className={CONTAINER_CLASS}>
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and brand */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                    <img
                                        src="/logo.svg"
                                        alt="DIU ACM Logo"
                                        className="object-cover rounded-lg"
                                        width={32}
                                        height={32}
                                    />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                                    DIU ACM
                                </span>
                            </Link>
                        </div>

                        {/* Desktop navigation */}
                        <nav className="hidden md:flex items-center">
                            <div className="flex flex-wrap items-center gap-1 mr-4">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== "/" && pathname?.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "px-2.5 py-1.5 text-xs lg:text-sm rounded-md flex items-center gap-1 transition-all duration-200",
                                                isActive
                                                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-medium shadow-sm"
                                                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            <item.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <AppearanceToggleDropdown />

                                {auth.user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="rounded-full p-0 h-9 w-9 ml-1 overflow-hidden border-2 border-white dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                                                aria-label="User menu"
                                            >
                                                <Avatar className="h-full w-full">
                                                    <AvatarImage
                                                        src={auth.user.avatar}
                                                        alt={auth.user.name}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {auth.user.name?.charAt(0).toUpperCase() || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 mt-1">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium line-clamp-1">
                                                        {auth.user.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                                        {auth.user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={dashboard()}
                                                    className="cursor-pointer flex w-full items-center"
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Dashboard</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href="/profile/edit"
                                                    className="cursor-pointer flex w-full items-center"
                                                >
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Edit Profile</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer w-full"
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
                                        className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all dark:from-blue-700 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-400"
                                    >
                                        <Link href={register()}>Sign Up</Link>
                                    </Button>
                                )}
                            </div>
                        </nav>

                        {/* Mobile navigation controls */}
                        <div className="flex md:hidden items-center gap-2">
                            <AppearanceToggleDropdown />

                            {auth.user && (
                                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {auth.user.name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 ml-1"
                                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
                    "fixed inset-0 z-50 bg-black/70 md:hidden transition-all duration-300",
                    isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden={!isMenuOpen}
            >
                <div
                    className={cn(
                        "absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white/95 dark:bg-slate-900/95 shadow-xl transition-transform duration-300 ease-in-out transform",
                        isMenuOpen ? "translate-x-0" : "translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col h-full">
                        {/* Menu header with profile or sign in */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            {auth.user ? (
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {auth.user.name?.charAt(0).toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                            {auth.user.name}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                            {auth.user.email}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <span className="text-lg font-medium text-slate-900 dark:text-slate-100">
                                        Welcome to DIU ACM
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full"
                                        >
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
                        <nav className="py-4 px-2 space-y-1 flex-1 overflow-y-auto">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== "/" && pathname?.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "px-4 py-3 text-base rounded-md flex items-center transition-all duration-200",
                                            isActive
                                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 font-medium"
                                                : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <item.icon className="h-5 w-5 mr-3" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Menu footer */}
                        {auth.user && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
                                    asChild
                                >
                                    <Link href="/logout" method="post" as="button">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sign out
                                    </Link>
                                </Button>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        © {new Date().getFullYear()} DIU ACM
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
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
