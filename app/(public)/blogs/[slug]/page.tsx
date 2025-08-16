import { notFound } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import { getBlogBySlug } from "../actions";
import { Separator } from "@/components/ui/separator";

// Import KaTeX CSS for math rendering
import "katex/dist/katex.min.css";

// Custom Image component for ReactMarkdown
interface MarkdownImageProps {
  src?: string | Blob;
  alt?: string;
  title?: string;
  width?: string | number;
  height?: string | number;
}

const MarkdownImage = ({ src, alt, title }: MarkdownImageProps) => {
  if (!src || typeof src !== "string") return null;

  // Handle relative URLs by making them absolute
  const imageSrc = src.startsWith("http") ? src : `/${src.replace(/^\//, "")}`;

  return (
    <span className="block my-6 rounded-lg overflow-hidden relative w-full">
      <Image
        src={imageSrc}
        alt={alt || "Blog image"}
        title={title}
        width={0}
        height={0}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        className="w-full h-auto object-cover"
        style={{ width: "100%", height: "auto" }}
        unoptimized
      />
    </span>
  );
};

export async function generateStaticParams() {
  return [];
}

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: blog } = await getBlogBySlug(resolvedParams.slug);

  if (!blog) {
    return {
      title: "Blog Post Not Found - DIU ACM",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: `${blog.title} - DIU ACM Blog`,
    description:
      blog.content?.substring(0, 160) || "Read this article on DIU ACM Blog",
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  // Await params to get the actual values
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Fetch the blog post
  const { data: blog } = await getBlogBySlug(slug);

  // If blog post not found, show 404
  if (!blog) {
    notFound();
  }

  // Format the published date
  const formattedDate = blog.publishedAt
    ? format(new Date(blog.publishedAt), "MMMM d, yyyy")
    : blog.createdAt
    ? format(new Date(blog.createdAt), "MMMM d, yyyy")
    : "Date unknown";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div>
        {/* Blog post header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            {/* Blog title */}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              {blog.title}
            </h1>

            {/* Blog meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-6">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {formattedDate}
              </div>
              {blog.author && (
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  {blog.author}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Blog content with math formula support */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                  [rehypeKatex, { throwOnError: false, strict: false }],
                ]}
                components={{
                  img: MarkdownImage,
                }}
              >
                {blog.content || "No content available."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
