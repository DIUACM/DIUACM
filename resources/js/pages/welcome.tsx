import { register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import MainLayout from '@/layouts/main-layout';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <MainLayout title="Welcome">
            <div className="flex min-h-screen flex-col items-center justify-center p-6">
                <div className="flex w-full items-center justify-center">
                    <main className="flex w-full max-w-[335px] flex-col-reverse lg:max-w-4xl lg:flex-row">
                        <div className="flex-1 rounded-br-lg rounded-bl-lg bg-white p-6 pb-12 lg:rounded-tl-lg lg:rounded-br-none lg:p-20 dark:bg-slate-800 shadow-lg">
                            <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
                                Welcome to{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                                    DIU ACM
                                </span>
                            </h1>
                            <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
                                A community for ICPC enthusiasts at Daffodil International University
                            </p>
                            
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-300">
                                    Join our thriving competitive programming community where passionate 
                                    problem solvers come together to learn, practice, and excel in coding contests.
                                </p>
                                
                                <div className="flex gap-4 pt-4">
                                    <Link
                                        href="/about"
                                        className="inline-block rounded-sm border border-blue-600 bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                                    >
                                        Learn More
                                    </Link>
                                    {!auth.user && (
                                        <Link
                                            href={register()}
                                            className="inline-block rounded-sm border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Join Us
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative -mb-px aspect-[335/376] w-full shrink-0 overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-50 to-cyan-50 lg:mb-0 lg:-ml-px lg:aspect-auto lg:w-[438px] lg:rounded-t-none lg:rounded-r-lg dark:from-blue-900/20 dark:to-cyan-800/20 shadow-lg">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                        Start Coding
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Practice problems, join contests,<br />
                                        and improve your skills
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </MainLayout>
    );
}
