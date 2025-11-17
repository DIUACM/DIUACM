import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main-layout';
import type { GalleryDetails } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, Images } from 'lucide-react';
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

type GalleryShowPageProps = {
    gallery: GalleryDetails;
};

export default function GalleryShowPage({ gallery }: GalleryShowPageProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const slides = gallery.images.map((image) => ({
        src: image.url,
        alt: image.name,
    }));

    return (
        <MainLayout>
            <Head title={gallery.title} />

            <div className="container mx-auto px-4 py-8">
                <div>
                    {/* Gallery header */}
                    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
                        <div className="p-6 md:p-8">
                            {/* Gallery title */}
                            <h1 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">{gallery.title}</h1>

                            {/* Gallery meta info */}
                            <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {gallery.created_at}
                                </div>
                                <div className="flex items-center">
                                    <Images className="mr-2 h-4 w-4" />
                                    {gallery.images.length} {gallery.images.length === 1 ? 'image' : 'images'}
                                </div>
                            </div>

                            {gallery.description && (
                                <>
                                    <Separator className="my-6" />
                                    <p className="text-slate-600 dark:text-slate-300">{gallery.description}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Gallery images grid */}
                    {gallery.images.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {gallery.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setLightboxIndex(index);
                                        setLightboxOpen(true);
                                    }}
                                    className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                                >
                                    <img
                                        src={image.thumbnail}
                                        alt={image.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-12 dark:border-slate-700 dark:bg-slate-900">
                            <Images className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-500 dark:text-slate-400">No images in this gallery yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={lightboxIndex} />
        </MainLayout>
    );
}
