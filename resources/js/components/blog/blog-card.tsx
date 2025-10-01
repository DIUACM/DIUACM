import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Calendar, User } from 'lucide-react';
import { useState } from 'react';

export type BlogListItem = {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    author: {
        name: string;
        username: string;
    };
    published_at: string;
    is_featured: boolean;
    featured_image_url?: string;
    reading_time: number;
};

interface BlogCardProps {
    blog: BlogListItem;
}

export function BlogCard({ blog }: BlogCardProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <Link href={`/blog/${blog.slug}`} className="block group">
            <Card className="overflow-hidden py-0 gap-0 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
                <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-700 relative">
                        {/* Skeleton placeholder */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-slate-200 dark:bg-slate-700 transition-opacity duration-300",
                                isLoading ? "opacity-100" : "opacity-0"
                            )}
                        />
                        <img
                            src={blog.featured_image_url || '/images/fallback-gallery-image.jpeg'}
                            alt={blog.title}
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                                isLoading ? "opacity-0 scale-110" : "opacity-100 scale-100"
                            )}
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                        {blog.is_featured && (
                            <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                                Featured
                            </Badge>
                        )}
                    </div>
                </div>

                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {blog.title}
                    </h3>
                    {blog.excerpt && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
                            {blog.excerpt}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="px-4 py-0 pb-4 pt-0 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{blog.published_at}</span>
                    </div>

                    <Badge variant="outline" className="font-normal">
                        <User className="h-3 w-3 mr-1" />
                        {blog.author.name}
                    </Badge>
                </CardFooter>
            </Card>
        </Link>
    );
}