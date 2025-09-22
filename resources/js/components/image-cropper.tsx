"use client"

import React, { useState, useCallback } from "react"
import Cropper from 'react-easy-crop'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ImageCropperProps {
    onComplete: (croppedImage: string) => Promise<void>
    onCancel: () => void
}

interface CropArea {
    x: number
    y: number
    width: number
    height: number
}

// Add this new interface
interface Area {
    x: number
    y: number
    width: number
    height: number
}

export function ImageCropper({ onComplete, onCancel }: ImageCropperProps) {
    const [image, setImage] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = () => {
                setImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader()
            reader.onload = () => {
                setImage(reader.result as string)
            }
            reader.readAsDataURL(e.target.files[0])
        }
    }

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: CropArea) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const compressImage = async (dataUrl: string, maxSizeMB: number): Promise<string> => {
        const image = new Image();
        image.src = dataUrl;

        return new Promise((resolve) => {
            image.onload = () => {
                let quality = 0.9;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                // Start with original dimensions
                let width = image.width;
                let height = image.height;

                // Scale down if dimensions are too large
                const MAX_DIMENSION = 1200;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(image, 0, 0, width, height);

                // Compress with reducing quality until size is under maxSizeMB
                let compressedDataUrl;
                do {
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    quality -= 0.1;
                } while (
                    quality > 0.1 &&
                    (compressedDataUrl.length * 3 / 4) / (1024 * 1024) > maxSizeMB
                );

                resolve(compressedDataUrl);
            };
        });
    };

    const getCroppedImage = async (imageSrc: string, pixelCrop: CropArea): Promise<string> => {
        const image = new Image();
        image.src = imageSrc;

        return new Promise((resolve) => {
            image.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('No 2d context');

                canvas.width = pixelCrop.width;
                canvas.height = pixelCrop.height;

                ctx.drawImage(
                    image,
                    pixelCrop.x,
                    pixelCrop.y,
                    pixelCrop.width,
                    pixelCrop.height,
                    0,
                    0,
                    pixelCrop.width,
                    pixelCrop.height
                );

                const croppedDataUrl = canvas.toDataURL('image/jpeg');
                const compressedDataUrl = await compressImage(croppedDataUrl, 1); // 1MB limit
                resolve(compressedDataUrl);
            };
        });
    }

    const handleSave = async () => {
        if (image && croppedAreaPixels && !isProcessing) {
            try {
                setIsProcessing(true)
                const croppedImage = await getCroppedImage(image, croppedAreaPixels)
                await onComplete(croppedImage)
            } catch (error) {
                console.error('Error saving image:', error)
            } finally {
                setIsProcessing(false)
            }
        }
    }

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Profile Picture</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {!image ? (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                            className={cn(
                                "flex flex-col items-center justify-center gap-4 p-8",
                                "border-2 border-dashed rounded-lg transition-colors",
                                "hover:border-gray-400 dark:hover:border-gray-500",
                                isDragging
                                    ? "border-primary bg-muted/50"
                                    : "border-gray-200 dark:border-gray-700",
                                "cursor-pointer"
                            )}
                        >
                            <p className="text-sm text-muted-foreground text-center">
                                Drag and drop your image here, or click to select
                            </p>
                            <Button asChild variant="secondary">
                                <label>
                                    Choose Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </Button>
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
                                <label className="text-sm font-medium">
                                    Zoom
                                </label>
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={(value) => setZoom(value[0])}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setImage(null)
                                        setZoom(1)
                                    }}
                                    disabled={isProcessing}
                                >
                                    Change Image
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}