"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/db/schema";

interface BlogCardProps {
  blog: BlogPost;
}

export function BlogCard({ blog }: BlogCardProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Format the date for better readability
  const formattedDate = blog.publishedAt
    ? format(new Date(blog.publishedAt), "MMM d, yyyy")
    : blog.createdAt
    ? format(new Date(blog.createdAt), "MMM d, yyyy")
    : "Date unknown";

  // Calculate excerpt (first 100 chars)
  const excerpt = blog.content
    ? blog.content.replace(/[#*`]/g, "").substring(0, 100) +
      (blog.content.length > 100 ? "..." : "")
    : "";

  return (
    <Link href={`/blogs/${blog.slug}`} className="block group">
      <Card className="overflow-hidden py-0 gap-0 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1">
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          <AspectRatio
            ratio={16 / 9}
            className="bg-slate-200 dark:bg-slate-700"
          >
            {/* Skeleton placeholder with fixed dimensions */}
            <div
              className={cn(
                "absolute inset-0 bg-slate-200 dark:bg-slate-700 transition-opacity duration-300",
                isLoading ? "opacity-100" : "opacity-0"
              )}
            />
            <Image
              src={blog.featuredImage ?? "/diuacm.jpeg"}
              alt={blog.title}
              fill
              className={cn(
                "object-cover transition-all duration-500 group-hover:scale-105",
                isLoading ? "opacity-0 scale-110" : "opacity-100 scale-100"
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onLoadingComplete={() => setIsLoading(false)}
              priority={false}
              unoptimized
            />
          </AspectRatio>
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {blog.title}
          </h3>
          {excerpt && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2">
              {excerpt}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 py-0 pb-4 pt-0 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </div>

          {blog.author && (
            <Badge variant="outline" className="font-normal">
              <User className="h-3 w-3 mr-1" />
              {blog.author}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
