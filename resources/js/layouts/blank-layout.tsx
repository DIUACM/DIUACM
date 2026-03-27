import { router } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

import type { FlashData, ToastType } from '@/types';

interface BlankLayoutProps {
    children: ReactNode;
}

function showToast(data: NonNullable<FlashData['toast']>) {
    const toastFn: Record<ToastType, typeof toast.success> = {
        success: toast.success,
        error: toast.error,
        warning: toast.warning,
        info: toast.info,
    };

    toastFn[data.type](data.message, {
        description: data.description,
    });
}

function useFlashToast() {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = event.detail.flash as FlashData;

            if (flash.toast) {
                showToast(flash.toast);
            }
        });
    }, []);
}

export default function BlankLayout({ children }: BlankLayoutProps) {
    useFlashToast();

    return (
        <>
            {children}
            <Toaster position="top-right" expand={true} richColors closeButton />
        </>
    );
}
