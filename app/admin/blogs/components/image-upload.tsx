"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generatePresignedUrl } from "../actions";

// 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Function to handle image upload
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Check file size (limit to 5MB) before making server request
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setIsUploading(true);
      try {
        // Get presigned URL only after validating file size
        const response = await generatePresignedUrl(file.type, file.size);

        if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to generate upload URL");
        }

        // Upload to presigned URL
        const uploadResponse = await fetch(response.data.presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // Set the file URL as the value
        onChange(response.data.fileUrl);
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
        // Clear the input
        e.target.value = "";
      }
    },
    [onChange]
  );

  // Function to remove the image
  const handleRemove = useCallback(() => {
    onChange("");
    toast.success("Image removed");
  }, [onChange]);

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          asChild
        >
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            {value ? "Change Image" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        </Button>
        {value && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}

      {value && (
        <Card className="overflow-hidden">
          <CardContent className="p-0 ">
            <div className="relative aspect-video">
              <Image
                src={value}
                alt="Featured image"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
