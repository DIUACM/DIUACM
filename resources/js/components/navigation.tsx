import { Link } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Navigation() {
    const { auth } = usePage<SharedData>().props;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link 
                        href="/" 
                        className="text-xl font-bold text-slate-900 dark:text-white"
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                            DIU ACM
                        </span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/about"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                        >
                            About
                        </Link>

                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-blue-600 bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href={login()}
                                    className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="inline-block rounded-sm border border-blue-600 bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
