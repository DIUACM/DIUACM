"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Moon,
  Sun,
  Menu,
  X,
  Home,
  Users,
  Info,
  LogOut,
  User,
  Lock,
  Mail,
  Calendar,
  ListChecks,
  BookOpen,
  Image as ImageIcon,
  // Trophy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";

// Memoized menu items for better performance
const menuItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar },
  // { name: "Contests", href: "/contests", icon: Trophy },
  { name: "Trackers", href: "/trackers", icon: ListChecks },
  { name: "Blog", href: "/blogs", icon: BookOpen },
  { name: "Galleries", href: "/galleries", icon: ImageIcon },
  { name: "Programmers", href: "/programmers", icon: Users },
  { name: "About", href: "/about", icon: Info },
  { name: "Contact", href: "/contact", icon: Mail },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    // Use passive event listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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

  // Handle theme toggle with smooth transition
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-slate-900/90 shadow-sm "
            : "bg-white/80 dark:bg-slate-900/80",
          "border-slate-200 dark:border-slate-800 backdrop-blur"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and brand */}
            {/* Logo and brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image
                    src="/diuacm-logo-rounded.webp"
                    alt="DIU ACM Logo"
                    width={32}
                    height={32}
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center">
              <div className="flex flex-wrap items-center gap-1 mr-4">
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  aria-label="Toggle theme"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                {isLoading ? (
                  <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ) : session ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="rounded-full p-0 h-9 w-9 ml-1 overflow-hidden border-2 border-white dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                        aria-label="User menu"
                      >
                        <Avatar className="h-full w-full">
                          <AvatarImage
                            src={session.user?.image || undefined}
                            alt={session.user?.name || "User"}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {session.user?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {session.user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/edit-profile`}
                          className="cursor-pointer flex w-full items-center"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Edit Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/change-password"
                          className="cursor-pointer flex w-full items-center"
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          <span>Change Password</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                        onClick={() => signOut()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all dark:from-blue-700 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-400 "
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </nav>

            {/* Mobile navigation controls */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                aria-label="Toggle theme"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ) : session ? (
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800">
                  <AvatarImage
                    src={session.user?.image || undefined}
                    alt={session.user?.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : null}

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
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                    <AvatarImage
                      src={session.user?.image || undefined}
                      alt={session.user?.name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-white line-clamp-1">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {session.user?.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    Welcome
                  </span>
                  <Button
                    asChild
                    className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 w-full"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
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
                const isActive =
                  pathname === item.href ||
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
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  © {new Date().getFullYear()}{" "}
                  {process.env.NEXT_PUBLIC_APP_NAME}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  v1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-16"></div>
    </>
  );
}
