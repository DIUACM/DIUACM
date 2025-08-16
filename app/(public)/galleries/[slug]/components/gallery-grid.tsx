"use client";

import { useState } from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatFileSize } from "../helpers";
import Masonry from "react-masonry-css";
import type { Media } from "@/db/schema";

// Import the lightbox library
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Slideshow from "yet-another-react-lightbox/plugins/slideshow";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface GalleryGridProps {
  media: Pick<
    Media,
    "id" | "url" | "title" | "width" | "height" | "mimeType" | "fileSize"
  >[];
  galleryTitle: string;
}

export function GalleryGrid({ media, galleryTitle }: GalleryGridProps) {
  const [index, setIndex] = useState(-1);

  // Prepare slides for the lightbox
  const slides = media.map((item) => ({
    src: item.url,
    width: item.width,
    height: item.height,
    alt: item.title || `${galleryTitle} - Image`,
    title: item.title,
    description: item.fileSize
      ? `${item.width} × ${item.height} • ${formatFileSize(item.fileSize)}`
      : `${item.width} × ${item.height}`,
  }));

  // Breakpoints for the masonry grid
  const breakpointColumnsObj = {
    default: 4, // default is 4 columns
    1280: 4, // 1280px and above: 4 columns
    1024: 3, // 1024px and above: 3 columns
    768: 2, // 768px and above: 2 columns
    640: 1, // 640px and below: 1 column
  };

  return (
    <>
      {/* Masonry Grid */}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-full -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {media.map((item, idx) => {
          // Calculate aspect ratio for proper sizing - use exact image ratio
          const aspectRatio = item.width / item.height;

          return (
            <div
              key={item.id}
              className="mb-4 relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:opacity-95 hover:scale-[1.01]"
              onClick={() => setIndex(idx)}
            >
              <AspectRatio ratio={aspectRatio}>
                <Image
                  src={item.url}
                  alt={item.title || `${galleryTitle} - Image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              </AspectRatio>
            </div>
          );
        })}
      </Masonry>

      {/* Enhanced Lightbox */}
      <Lightbox
        index={index}
        slides={slides}
        open={index >= 0}
        close={() => setIndex(-1)}
        plugins={[Captions, Counter, Fullscreen, Slideshow, Thumbnails, Zoom]}
        captions={{ descriptionTextAlign: "center" }}
        counter={{
          container: { style: { top: "unset", bottom: "0", right: "0" } },
        }}
        carousel={{ finite: media.length <= 5 }}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          gap: 12,
          border: 1,
          borderRadius: 4,
        }}
        zoom={{ maxZoomPixelRatio: 5 }}
        render={{
          iconPrev: () => (
            <span
              className="bg-black/20 rounded-full p-2 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
          ),
          iconNext: () => (
            <span
              className="bg-black/20 rounded-full p-2 backdrop-blur-sm"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          ),
        }}
      />
    </>
  );
}
