import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

interface BlankLayoutProps {
    children: ReactNode;
}

export default function BlankLayout({ children }: BlankLayoutProps) {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
    }, [flash]);

    return (
        <>
            {children}
            <Toaster position="top-right" expand={true} richColors closeButton />
        </>
    );
}
