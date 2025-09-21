import Footer from '@/components/footer';
import Navigation from '@/components/navigation';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <>
            {/* Background elements */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950" />
                <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-blue-200/40 dark:bg-blue-900/20" />
                <div className="absolute top-10 right-20 h-32 w-32 rounded-full bg-cyan-200/50 dark:bg-cyan-800/20" />
                <div className="absolute right-0 bottom-0 h-40 w-52 rounded-full bg-violet-200/40 dark:bg-violet-900/20" />
            </div>
            <Navigation />

            {children}
            <Footer />

            <Toaster position="top-right" expand={true} richColors closeButton />
        </>
    );
}
