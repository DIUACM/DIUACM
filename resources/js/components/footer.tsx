import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Heart, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8 py-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Logo and description */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <Link href="/" className="mb-4 inline-flex items-center">
                            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-cyan-300">
                                DIU ACM
                            </span>
                        </Link>
                        <p className="mb-4 text-slate-600 dark:text-slate-400">
                            The official ACM website at Daffodil International University. Promoting computing knowledge, skills, and innovation
                            within our community.
                        </p>
                        <div className="flex space-x-4">{/* Socials placeholder */}</div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-900 uppercase dark:text-white">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy-policy"
                                    className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms-and-conditions"
                                    className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Extra */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-900 uppercase dark:text-white">Extra</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/galleries"
                                    className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    Galleries
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blog"
                                    className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                >
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-900 uppercase dark:text-white">Contact Us</h3>
                        <div className="space-y-3">
                            <p className="flex items-center text-slate-600 dark:text-slate-400">
                                <Mail className="mr-2 h-4 w-4" /> info@diuacm.com
                            </p>
                            <Button
                                asChild
                                size="default"
                                variant="outline"
                                className="w-full rounded-full border border-slate-200 bg-white/80 px-6 font-medium text-blue-600 shadow-md backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white hover:text-blue-700 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/80 dark:text-blue-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-blue-300"
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

                <div className="border-t border-slate-200 py-6 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-between md:flex-row">
                        <div className="mb-4 text-sm text-slate-600 md:mb-0 dark:text-slate-400">
                            <p className="mb-2">© {new Date().getFullYear()} DIU ACM. All rights reserved.</p>
                        </div>
                        <p className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            Made with <Heart className="mx-1 h-4 w-4 text-red-500" /> by Sourov Biswas
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
