import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, Image, X } from 'lucide-react';
import { useState } from 'react';

type Gallery = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    images: string[];
    created_at: string;
    updated_at: string;
};

type PageProps = {
    gallery: Gallery;
};

export default function GalleryShow() {
    const { props } = usePage<PageProps>();
    const { gallery } = props;
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setIsLightboxOpen(true);
    };

    const nextImage = () => {
        if (selectedImageIndex !== null && selectedImageIndex < gallery.images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
        }
    };

    const prevImage = () => {
        if (selectedImageIndex !== null && selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
        }
    };

    const downloadImage = (imageUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                {gallery.images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {gallery.images.map((image, index) => (
                            <Card
                                key={index}
                                className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                onClick={() => openLightbox(index)}
                            >
                                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={image}
                                        alt={`${gallery.title} - Image ${index + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <div className="rounded-full bg-white/90 p-2 dark:bg-slate-800/90">
                                            <Image className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
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

                {/* Lightbox Modal */}
                <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                    <DialogContent className="max-w-6xl p-0">
                        {selectedImageIndex !== null && (
                            <div className="relative">
                                {/* Close button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    onClick={() => setIsLightboxOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>

                                {/* Download button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-12 top-2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    onClick={() =>
                                        downloadImage(
                                            gallery.images[selectedImageIndex],
                                            `${gallery.title}-${selectedImageIndex + 1}.jpg`
                                        )
                                    }
                                >
                                    <Download className="h-4 w-4" />
                                </Button>

                                {/* Navigation buttons */}
                                {selectedImageIndex > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                        onClick={prevImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                )}
                                
                                {selectedImageIndex < gallery.images.length - 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                        onClick={nextImage}
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                )}

                                {/* Image */}
                                <div className="relative">
                                    <img
                                        src={gallery.images[selectedImageIndex]}
                                        alt={`${gallery.title} - Image ${selectedImageIndex + 1}`}
                                        className="max-h-[80vh] w-full object-contain"
                                    />
                                    
                                    {/* Image counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                                        {selectedImageIndex + 1} of {gallery.images.length}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}