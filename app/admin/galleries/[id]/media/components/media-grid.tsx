"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { type Media, type Gallery } from "@/db/schema";
import { Pencil, Trash2, MoreVertical, Maximize } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMedia, updateMediaTitle } from "../../../actions";

interface MediaGridProps {
  gallery: Gallery & {
    media: Media[];
  };
}

interface MediaCardProps {
  media: Media;
  onEdit: (media: Media) => void;
  onDelete: (media: Media) => void;
  onPreview: (media: Media) => void;
}

function MediaCard({ media, onEdit, onDelete, onPreview }: MediaCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="group overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <Image
              src={media.url}
              alt={media.title || "Gallery image"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </AspectRatio>

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onPreview(media)}
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(media)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(media)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-medium text-sm truncate">
            {media.title || "Untitled"}
          </h4>
          <div className="text-xs text-muted-foreground mt-1">
            {media.width} × {media.height} • {formatFileSize(media.fileSize)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Order: {media.order}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MediaGrid({ gallery }: MediaGridProps) {
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [selectedImage, setSelectedImage] = useState<Media | null>(null);
  const [mediaItems, setMediaItems] = useState<Media[]>(
    gallery.media.sort((a, b) => a.order - b.order)
  );

  const handleEditSubmit = async () => {
    if (!editingMedia) return;

    setIsLoading(true);
    try {
      const response = await updateMediaTitle(editingMedia.id, newTitle);

      if (response.success) {
        toast.success("Media title updated successfully");
        setEditingMedia(null);
        // Update local state
        setMediaItems((prev) =>
          prev.map((item) =>
            item.id === editingMedia.id ? { ...item, title: newTitle } : item
          )
        );
      } else {
        toast.error(response.error || "Failed to update media");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (mediaItem: Media) => {
    setIsLoading(true);
    try {
      const response = await deleteMedia(mediaItem.id);

      if (response.success) {
        toast.success("Image deleted successfully");
        setDeleteTarget(null);
        // Remove from local state
        setMediaItems((prev) =>
          prev.filter((item) => item.id !== mediaItem.id)
        );
      } else {
        toast.error(response.error || "Failed to delete image");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (media: Media) => {
    setEditingMedia(media);
    setNewTitle(media.title || "");
  };

  const handlePreview = (media: Media) => {
    setSelectedImage(media);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mediaItems.map((mediaItem) => (
          <MediaCard
            key={mediaItem.id}
            media={mediaItem}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingMedia}
        onOpenChange={(open) => !open && setEditingMedia(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Update the title for this image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter image title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingMedia(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title || "Image Preview"}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <AspectRatio ratio={selectedImage.width / selectedImage.height}>
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title || "Gallery image"}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  unoptimized
                />
              </AspectRatio>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
