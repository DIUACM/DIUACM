import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
type LayoutFunction = (page: ReactNode) => ReactNode;
type LayoutComponent = ComponentType<{ children: ReactNode }>;
type ReactPageComponent = ComponentType<any> & {
    layout?: LayoutComponent | LayoutComponent[] | LayoutFunction | ((props: any) => any);
};

const pages = import.meta.glob<ReactPageComponent>('./pages/**/*.tsx', { import: 'default' });

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, pages),
        setup: ({ App, props }) => <App {...props} />,
    }),
);
