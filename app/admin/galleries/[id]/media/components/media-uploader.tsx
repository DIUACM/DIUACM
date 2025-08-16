"use client";

import { useState, useCallback, useMemo } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generatePresignedUrl, saveMediaData } from "../../../actions";

interface MediaUploaderProps {
  galleryId: number;
}

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  uploading: boolean;
  error: string | null;
  url?: string;
  width?: number;
  height?: number;
}

export function MediaUploader({ galleryId }: MediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = useMemo(
    () => ["image/jpeg", "image/png", "image/webp", "image/gif"],
    []
  );

  // Get image dimensions using the browser's native Image constructor
  const getImageDimensions = (
    file: File
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      // Create a URL for the file
      const objectUrl = URL.createObjectURL(file);

      // Use the native browser Image constructor (not Next.js Image)
      const img = new window.Image();

      img.onload = () => {
        // Get dimensions
        const dimensions = {
          width: img.width,
          height: img.height,
        };

        // Clean up object URL to prevent memory leaks
        URL.revokeObjectURL(objectUrl);

        // Return the dimensions
        resolve(dimensions);
      };

      // Set the source to load the image
      img.src = objectUrl;
    });
  };

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsUploading(true);

      // Track which files have errors to avoid duplicate error toasts
      const filesWithErrors = new Set<string>();

      // Filter valid files
      const validFiles = Array.from(files).filter((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name} is not a supported image type.`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds the 5MB size limit.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Add files to state with initial progress
      const newFiles = validFiles.map((file) => ({
        file,
        id: Math.random().toString(36).slice(2),
        progress: 0,
        uploading: true,
        error: null,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Process each file
      const uploadPromises = newFiles.map(async (fileObj) => {
        try {
          // Get image dimensions first
          const dimensions = await getImageDimensions(fileObj.file);

          // Update file object with dimensions
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === fileObj.id ? { ...f, ...dimensions } : f))
          );

          // Step 1: Get presigned URL
          const presignedUrlResponse = await generatePresignedUrl(
            galleryId,
            fileObj.file.type,
            fileObj.file.size
          );

          if (!presignedUrlResponse.success || !presignedUrlResponse.data) {
            throw new Error(
              presignedUrlResponse.error || "Failed to generate upload URL"
            );
          }

          const { presignedUrl, key } = presignedUrlResponse.data;
          const fileUrl = `${process.env.NEXT_PUBLIC_S3_DOMAIN}/${key}`;

          // Step 2: Upload to S3
          const response = await fetch(presignedUrl, {
            method: "PUT",
            body: fileObj.file,
            headers: {
              "Content-Type": fileObj.file.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
          }

          // Update progress to 80% after S3 upload
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === fileObj.id ? { ...f, progress: 80 } : f))
          );

          // Step 3: Save to database
          const saveResponse = await saveMediaData(galleryId, {
            title: fileObj.file.name.split(".")[0], // Using filename as title
            url: fileUrl,
            key,
            mimeType: fileObj.file.type,
            fileSize: fileObj.file.size,
            width: dimensions.width,
            height: dimensions.height,
          });

          if (!saveResponse.success) {
            throw new Error(
              saveResponse.error || "Failed to save media information"
            );
          }

          // Update state with complete
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id
                ? { ...f, progress: 100, uploading: false, url: fileUrl }
                : f
            )
          );
        } catch (error) {
          console.error("Upload error:", error);
          // Track this file as having an error
          filesWithErrors.add(fileObj.id);

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id
                ? {
                    ...f,
                    uploading: false,
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          );
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // After all uploads are complete, show a single success or error toast
      const successfulUploads = newFiles.filter(
        (file) => !filesWithErrors.has(file.id)
      ).length;

      if (successfulUploads > 0) {
        toast.success(
          `Successfully uploaded ${successfulUploads} image${
            successfulUploads !== 1 ? "s" : ""
          }`
        );
      } else if (filesWithErrors.size > 0 && successfulUploads === 0) {
        // Only show this general error if all files failed and there are no individual error messages
        toast.error("Failed to upload files. Please try again.");
      }

      setIsUploading(false);
    },
    [galleryId, MAX_FILE_SIZE, ALLOWED_TYPES]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      handleFiles(Array.from(files));
    },
    [handleFiles]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
        // Reset input value to allow selecting the same files again
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 ${
          dragOver
            ? "bg-primary/10 border-primary"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } transition-all duration-150 cursor-pointer`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById("fileUpload")?.click()}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload
            className={`h-10 w-10 ${
              dragOver ? "text-primary" : "text-muted-foreground/80"
            }`}
          />
          <h3 className="text-lg font-semibold">Drag & drop images here</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Drag images here or click to browse. Supports JPG, PNG, WebP and GIF
            up to 5MB each.
          </p>
          <input
            id="fileUpload"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFileChange}
          />
          <Button disabled={isUploading} type="button" className="mt-2">
            Select Images
          </Button>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="border rounded-md divide-y">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                {file.url ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={file.url}
                      alt={file.file.name}
                      className="rounded object-cover"
                      fill
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{(file.file.size / 1024).toFixed(0)} KB</span>
                  {file.width && file.height && (
                    <span>
                      • {file.width} × {file.height}
                    </span>
                  )}
                </div>
                {!file.error && !file.url && (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
                {file.error && (
                  <p className="text-xs text-destructive mt-1">{file.error}</p>
                )}
              </div>
              <div>
                {file.uploading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
