"use client"

import { useState } from "react"
import { X, Eye, Download, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface PromptCard {
  id: string
  output_image_path: string
  reference_image_path: string
  prompt: string
  metadata: string
  client: string
  model: string
  llm_used?: string
  seed: string
  notes?: string
  is_favorited: boolean
  created_at: string
  // Added for signed URLs
  outputImageUrl?: string
  referenceImageUrl?: string
}

interface CardDetailModalProps {
  card: PromptCard | null
  isOpen: boolean
  onClose: () => void
  onViewReferenceImage: (card: PromptCard) => void
}

const ReferenceImageView = ({
  card,
  onViewReferenceImage,
}: {
  card: PromptCard
  onViewReferenceImage: (card: PromptCard) => void
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
    console.error('Failed to load reference image:', card.referenceImageUrl)
  }

  const handleViewImage = () => {
    onViewReferenceImage(card)
  }

  const handleDownload = async () => {
    // ✅ FIXED - Use signed URL instead of database path
    if (!card.referenceImageUrl) return

    try {
      const response = await fetch(card.referenceImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `reference-${card.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  if (imageError) {
    return (
      <div className="space-y-4">
        <div className="relative w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm font-medium">Failed to load reference image</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">
              URL: {card.referenceImageUrl || 'No URL available'}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Button disabled variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button disabled variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse" />
        )}

        <Image
          // ✅ FIXED - Use signed URL instead of database path
          src={card.referenceImageUrl || "/placeholder.svg"}
          alt="Reference image"
          fill
          className="object-contain transition-opacity duration-300"
          style={{ opacity: imageLoaded ? 1 : 0 }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button onClick={handleViewImage} variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}

const CopyableField = ({ 
  label, 
  value, 
  expandable = false 
}: { 
  label: string
  value: string
  expandable?: boolean 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shouldTruncate = expandable && value.length > 100

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{label}:</h3>
        <div className="flex items-center gap-2">
          {expandable && shouldTruncate && (
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="h-6 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          )}
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="h-6 px-2"
          >
            <Copy className="w-3 h-3" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
      <p className={`text-gray-700 text-sm leading-relaxed ${
        shouldTruncate && !isExpanded ? 'line-clamp-3' : ''
      }`}>
        {value}
      </p>
    </div>
  )
}

export default function CardDetailModal({
  card,
  isOpen,
  onClose,
  onViewReferenceImage,
}: CardDetailModalProps) {
  if (!isOpen || !card) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Card Details</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Reference Image */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reference Image</h3>
              <ReferenceImageView
                card={card}
                onViewReferenceImage={onViewReferenceImage}
              />
            </div>

            {/* Right Column - Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Information</h3>
                <div className="space-y-4">
                  <CopyableField 
                    label="Prompt" 
                    value={card.prompt} 
                    expandable={true}
                  />
                  
                  <CopyableField 
                    label="Metadata" 
                    value={card.metadata} 
                    expandable={true}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CopyableField 
                      label="Client" 
                      value={card.client} 
                    />
                    
                    <CopyableField 
                      label="Model" 
                      value={card.model} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CopyableField 
                      label="Seed" 
                      value={card.seed} 
                    />
                    
                    {card.llm_used && (
                      <CopyableField 
                        label="LLM Used" 
                        value={card.llm_used} 
                      />
                    )}
                  </div>
                  
                  {card.notes && (
                    <CopyableField 
                      label="Notes" 
                      value={card.notes} 
                      expandable={true}
                    />
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Created:</h3>
                    <p className="text-gray-700 text-sm">
                      {new Date(card.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}