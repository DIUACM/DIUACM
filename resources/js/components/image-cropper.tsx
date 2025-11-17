'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';

interface ImageCropperProps {
    onComplete: (croppedImageFile: File) => Promise<void>;
    onCancel: () => void;
}

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Add this new interface
interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageCropper({ onComplete, onCancel }: ImageCropperProps) {
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-trigger file picker when modal opens
    useEffect(() => {
        const timer = setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: CropArea) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImage = async (imageSrc: string, pixelCrop: CropArea): Promise<File> => {
        const image = new Image();
        image.src = imageSrc;

        return new Promise((resolve) => {
            image.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('No 2d context');

                // Maximum resolution for the final image
                const MAX_DIMENSION = 800;

                // Calculate scaled dimensions while maintaining aspect ratio
                let finalWidth = pixelCrop.width;
                let finalHeight = pixelCrop.height;

                if (finalWidth > MAX_DIMENSION || finalHeight > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / finalWidth, MAX_DIMENSION / finalHeight);
                    finalWidth = Math.round(finalWidth * ratio);
                    finalHeight = Math.round(finalHeight * ratio);
                }

                canvas.width = finalWidth;
                canvas.height = finalHeight;

                // Draw the cropped portion, scaled to final dimensions
                ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, finalWidth, finalHeight);

                // Convert canvas to blob with compression
                canvas.toBlob(
                    async (blob) => {
                        if (!blob) throw new Error('Failed to create blob');

                        // Create a File object from the blob
                        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                        resolve(file);
                    },
                    'image/jpeg',
                    0.9, // Quality setting (0.9 = 90% quality)
                );
            };
        });
    };

    const handleSave = async () => {
        if (image && croppedAreaPixels && !isProcessing) {
            try {
                setIsProcessing(true);
                const croppedImageFile = await getCroppedImage(image, croppedAreaPixels);
                await onComplete(croppedImageFile);
            } catch (error) {
                console.error('Error saving image:', error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {!image ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                            }}
                            className={cn(
                                'flex flex-col items-center justify-center gap-4 p-8',
                                'rounded-lg border-2 border-dashed transition-colors',
                                'hover:border-gray-400 dark:hover:border-gray-500',
                                isDragging ? 'border-primary bg-muted/50' : 'border-gray-200 dark:border-gray-700',
                                'cursor-pointer',
                            )}
                        >
                            <svg
                                className="h-12 w-12 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <div className="text-center">
                                <p className="mb-1 text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative h-[300px]">
                                <Cropper
                                    image={image}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Zoom</label>
                                <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(value) => setZoom(value[0])} />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setImage(null);
                                        setZoom(1);
                                        // Trigger file picker again after clearing
                                        setTimeout(() => fileInputRef.current?.click(), 100);
                                    }}
                                    disabled={isProcessing}
                                >
                                    Change Image
                                </Button>
                                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isProcessing}>
                                    {isProcessing ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
