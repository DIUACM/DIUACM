import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'DIU ACM';
type LayoutFunction = (page: ReactNode) => ReactNode;
type LayoutComponent = ComponentType<{ children: ReactNode }>;
type ReactPageComponent = ComponentType<any> & {
    layout?: LayoutComponent | LayoutComponent[] | LayoutFunction | ((props: any) => any);
};

const pages = import.meta.glob<ReactPageComponent>('./pages/**/*.tsx', { import: 'default' });

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, pages),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
