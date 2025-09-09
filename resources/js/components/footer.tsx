import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Heart, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8">
                    {/* Logo and description */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center mb-4">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
                                DIU ACM
                            </span>
                        </Link>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            The official ACM website at Daffodil International University. Promoting computing knowledge, skills, and innovation within our community.
                        </p>
                        <div className="flex space-x-4">{/* Socials placeholder */}</div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-and-conditions" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Extra */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Extra
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/galleries" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    Galleries
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Contact Us
                        </h3>
                        <div className="space-y-3">
                            <p className="text-slate-600 dark:text-slate-400 flex items-center">
                                <Mail className="h-4 w-4 mr-2" /> info@diuacm.com
                            </p>
                            <Button
                                asChild
                                size="default"
                                variant="outline"
                                className="w-full rounded-full px-6 bg-white/80 hover:bg-white text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 shadow-md hover:shadow-lg transition-all dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-blue-400 dark:hover:text-blue-300 dark:border-slate-700 dark:hover:border-slate-600 font-medium backdrop-blur-sm"
                            >
                                <Link href="/about">
                                    <span className="inline-flex items-center">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Message
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4 md:mb-0">
                            <p className="mb-2">© {new Date().getFullYear()} DIU ACM. All rights reserved.</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                            Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> by Sourov Biswas
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
