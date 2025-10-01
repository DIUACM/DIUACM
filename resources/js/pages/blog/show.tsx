import { Separator } from '@/components/ui/separator';
import MainLayout from '@/layouts/main-layout';
import { Head } from '@inertiajs/react';
import { Calendar, User } from 'lucide-react';

type BlogPost = {
    id: number;
    title: string;
    slug: string;
    content: string;
    author: {
        name: string;
        username: string;
    };
    published_at: string;
    is_featured: boolean;
    featured_image_url?: string;
    reading_time: number;
};

type BlogShowPageProps = {
    blogPost: BlogPost;
};

export default function BlogShowPage({ blogPost }: BlogShowPageProps) {
    return (
        <MainLayout>
            <Head title={blogPost.title} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div>
                    {/* Blog post header */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden mb-8">
                        <div className="p-6 md:p-8">
                            {/* Blog title */}
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                                {blogPost.title}
                            </h1>

                            {/* Blog meta info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {blogPost.published_at}
                                </div>
                                <div className="flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    {blogPost.author.name}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            {/* Blog content */}
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
                            </div>
                        </div>
                    </div>

                   
                </div>
            </div>
        </MainLayout>
    );
}