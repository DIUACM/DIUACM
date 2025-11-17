import { GalleryFilters } from '@/components/gallery/gallery-filters';
import { CustomPagination } from '@/components/ui/custom-pagination';
import MainLayout from '@/layouts/main-layout';
import type { Gallery, PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { show } from '@/routes/galleries';
import { Images } from 'lucide-react';

type GalleryPageProps = {
    galleries: PaginatedData<Gallery>;
    filters: {
        search?: string;
    };
};

export default function GalleryPage({ galleries, filters }: GalleryPageProps) {
    return (
        <MainLayout>
            <Head title="Gallery" />

            <section className="container mx-auto px-4 py-16">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                        Explore our collection of photos and memories from events and activities.
                    </p>
                </div>

                <div className="mb-6">
                    <GalleryFilters filters={filters} />
                </div>

                {galleries.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="mb-4 text-6xl">📸</div>
                        <p className="mb-2 text-lg text-slate-500">No galleries found</p>
                        <p className="text-sm text-slate-400">
                            {filters.search
                                ? 'Try adjusting your search to see more galleries.'
                                : 'There are no galleries available at the moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {galleries.data.map((gallery) => (
                            <Link
                                key={gallery.slug}
                                href={show.url(gallery.slug)}
                                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900">
                                    {gallery.thumbnail ? (
                                        <img
                                            src={gallery.thumbnail}
                                            alt={gallery.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Images className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                                        {gallery.images_count} {gallery.images_count === 1 ? 'image' : 'images'}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                                        {gallery.title}
                                    </h3>
                                    {gallery.description && (
                                        <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                            {gallery.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{gallery.created_at}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {galleries.data.length > 0 && galleries.last_page > 1 && (
                    <div className="mt-8 flex justify-center">
                        <CustomPagination currentPage={galleries.current_page} totalPages={galleries.last_page} />
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
