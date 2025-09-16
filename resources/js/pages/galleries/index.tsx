import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/layouts/main-layout';
import { Link, usePage } from '@inertiajs/react';
import { Camera, Calendar, Image } from 'lucide-react';

type GalleryItem = {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    images_count: number;
    cover_image: string | null;
};

type PageProps = {
    galleries: GalleryItem[];
};

export default function GalleryIndex() {
    const { props } = usePage<PageProps>();
    const galleries = props.galleries || [];

    // Date removed from backend payload; if reintroduced, re-add formatting helper.

    return (
        <MainLayout title="Gallery">
            <div className="container mx-auto px-4 py-16">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
                        Photo{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                            Gallery
                        </span>
                    </h1>
                    <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" />
                    <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-300">
                        Explore moments captured from DIU ACM events, contests, and community activities
                    </p>
                </div>

                {galleries.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {galleries.map((gallery) => (
                            <Link key={gallery.id} href={`/galleries/${gallery.slug}`}>
                                <Card className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {gallery.cover_image ? (
                                            <img
                                                src={gallery.cover_image}
                                                alt={gallery.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <Camera className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                {gallery.title}
                                            </h3>
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Image className="h-3 w-3" />
                                                {gallery.images_count}
                                            </Badge>
                                        </div>
                                        
                                        {gallery.description && (
                                            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                {gallery.description}
                                            </p>
                                        )}
                                        
                                        {/* Date removed from payload; placeholder reserved for potential future meta info */}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 md:p-16 dark:border-slate-700 dark:bg-slate-800">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <Camera className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No galleries found</h3>
                        <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
                            There are no photo galleries available yet. Check back soon for event photos and memories!
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}