// Removed unused Badge, Button after PhotoSwipe integration
import { Card } from '@/components/ui/card';
// Removed unused Dialog components
import MainLayout from '@/layouts/main-layout';
import { usePage } from '@inertiajs/react';
import { Image } from 'lucide-react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { useState, useEffect, useRef } from 'react';

type Gallery = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    images: string[];
};

type PageProps = {
    gallery: Gallery;
};

export default function GalleryShow() {
    const { props } = usePage<PageProps>();
    const { gallery } = props;
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false); // still used for Dialog fallback and thumbnails strip
    const pswpRef = useRef<PhotoSwipeLightbox | null>(null);
    const [imageDimensions, setImageDimensions] = useState<Array<{ w: number; h: number }>>([]);
    // Detect natural dimensions to avoid stretching in PhotoSwipe
    useEffect(() => {
        let isCancelled = false;
        const dims: Array<{ w: number; h: number }> = [];
        const loaders = gallery.images.map((src, index) => {
            return new Promise<void>((resolve) => {
                const img = document.createElement('img');
                img.onload = () => {
                    if (!isCancelled) {
                        dims[index] = { w: img.naturalWidth, h: img.naturalHeight };
                    }
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = src;
            });
        });
        Promise.all(loaders).then(() => {
            if (!isCancelled) {
                setImageDimensions(dims);
            }
        });
        return () => { isCancelled = true; };
    }, [gallery.images]);

    const hasImages = gallery.images.length > 0;

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        // Initialize (lazy) PhotoSwipe and load
        if (!pswpRef.current) {
            pswpRef.current = new PhotoSwipeLightbox({
                gallery: '#gallery-grid',
                children: 'a[data-pswp-item]',
                pswpModule: () => import('photoswipe'),
                showHideAnimationType: 'zoom',
                padding: { top: 32, bottom: 32, left: 16, right: 16 },
            });
            pswpRef.current.init();
        }
        // Programmatically open
        setTimeout(() => {
            pswpRef.current?.loadAndOpen(index);
        }, 0);
        setIsLightboxOpen(true);
    };

    // Navigation helpers removed; PhotoSwipe provides internal navigation.

    // Cleanup PhotoSwipe on unmount
    useEffect(() => {
        return () => {
            pswpRef.current?.destroy();
            pswpRef.current = null;
        };
    }, []);

    // Preload adjacent images for smoother navigation
    useEffect(() => {
        if (selectedImageIndex === null) { return; }
        const preload = (index: number) => {
            if (index < 0 || index >= gallery.images.length) { return; }
            if (typeof document === 'undefined') { return; }
            const img = document.createElement('img');
            img.src = gallery.images[index];
        };
        preload(selectedImageIndex + 1);
        preload(selectedImageIndex - 1);
    }, [selectedImageIndex, gallery.images]);

    // (Swipe handlers removed; PhotoSwipe supplies gesture navigation)

    return (
        <MainLayout title={gallery.title}>
            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        {gallery.title}
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                    {gallery.description && (
                        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                            {gallery.description}
                        </p>
                    )}
                </div>

                {/* Images Grid */}
                {hasImages ? (
                    <div id="gallery-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list" aria-label="Gallery images">
                        {gallery.images.map((image, index) => (
                            <a
                                key={index}
                                data-pswp-item
                                href={image}
                                data-pswp-width={imageDimensions[index]?.w || 1200}
                                data-pswp-height={imageDimensions[index]?.h || 800}
                                aria-label={`Open image ${index + 1} of ${gallery.images.length}`}
                                onClick={(e) => { e.preventDefault(); openLightbox(index); }}
                                className="group block cursor-zoom-in overflow-hidden rounded outline-none focus-visible:ring focus-visible:ring-blue-500"
                            >
                                <Card
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); } }}
                                    className="overflow-hidden border-0 bg-transparent p-0"
                                >
                                    <div className="relative aspect-square overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={image}
                                            alt={`${gallery.title} - Image ${index + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <div className="rounded-full bg-white/90 p-2 dark:bg-slate-800/90">
                                                <Image className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <Image className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No images available</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            This gallery doesn't contain any images yet.
                        </p>
                    </div>
                )}

                {/* Thumbnail strip (outside PhotoSwipe) */}
                {isLightboxOpen && selectedImageIndex !== null && gallery.images.length > 1 && (
                    <div className="mt-10" aria-label="Selected image thumbnails">
                        <h2 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Quick navigation</h2>
                        <div className="flex max-w-full snap-x gap-2 overflow-x-auto pb-2" aria-label="Image thumbnails">
                            {gallery.images.map((thumb, i) => (
                                <button
                                    key={i}
                                    aria-label={`View image ${i + 1}`}
                                    onClick={() => openLightbox(i)}
                                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border ${i === selectedImageIndex ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-300 dark:border-slate-600'}`}
                                >
                                    <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}