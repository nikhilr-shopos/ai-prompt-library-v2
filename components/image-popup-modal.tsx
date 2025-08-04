"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImagePopupModalProps {
  isOpen: boolean
  onClose: () => void
  imagePath: string
  imageTitle: string
  imageType: "output" | "reference"
  cardId: string
}

export const ImagePopupModal = ({
  isOpen,
  onClose,
  imagePath,
  imageTitle,
  imageType,
  cardId,
}: ImagePopupModalProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [zoom, setZoom] = useState(1)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false)
      setImageError(false)
      setZoom(1)
    }
  }, [isOpen])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  const handleDownload = async () => {
    if (!imagePath || isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `${imageType}-${cardId}-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-background rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {imageType === "output" ? "Output Image" : "Reference Image"}
            </h2>
            <p className="text-sm text-muted-foreground">{imageTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3} className="h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || imageError}
              className="h-8 px-3 bg-transparent"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              {isDownloading ? "Downloading..." : "Download"}
            </Button>

            {/* Close Button */}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative overflow-auto max-h-[calc(90vh-80px)] bg-muted/20">
          <div className="flex items-center justify-center min-h-[400px] p-4">
            {!imageLoaded && !imageError && (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading image...</span>
              </div>
            )}

            {imageError && (
              <div className="text-center text-muted-foreground">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-lg font-medium mb-2">Failed to load image</h3>
                <p className="text-sm">The image could not be displayed.</p>
              </div>
            )}

            {!imageError && (
              <div
                className="relative transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={imagePath || "/placeholder.svg"}
                  alt={imageTitle}
                  width={800}
                  height={600}
                  className={cn(
                    "max-w-full h-auto rounded-lg shadow-lg transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0",
                  )}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-3 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            {imageType === "output"
              ? "Click and drag to pan • Use zoom controls to resize"
              : "Reference image for comparison"}
          </p>
        </div>
      </div>
    </div>
  )
}
