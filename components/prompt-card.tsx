"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Star, Eye, Download, MoreHorizontal, Edit, Trash2, Check, Square } from "lucide-react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
  // Added for frontend use
  outputImageUrl?: string
  referenceImageUrl?: string
}

interface PromptCardProps {
  card: PromptCard
  isSelected: boolean
  onSelect: (cardId: string) => void
  onDeselect: (cardId: string) => void
  onEdit: (card: PromptCard) => void
  onDelete: (card: PromptCard) => void
  onViewDetails: (card: PromptCard) => void
  onViewOutputImage: (card: PromptCard) => void
  onFavoriteToggle: (cardId: string) => void
  index: number
}

// Color coding system for clients and models
const getClientColor = (client: string) => {
  const colors = {
    "Creative Agency": "bg-purple-100 text-purple-700 border-purple-200",
    "Corporate Solutions": "bg-blue-100 text-blue-700 border-blue-200",
    "Travel Magazine": "bg-green-100 text-green-700 border-green-200",
    "Tech Startup": "bg-orange-100 text-orange-700 border-orange-200",
    "Fashion House": "bg-pink-100 text-pink-700 border-pink-200",
    "Architecture Firm": "bg-teal-100 text-teal-700 border-teal-200",
    "Gaming Studio": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Interior Design Studio": "bg-amber-100 text-amber-700 border-amber-200",
  }
  return colors[client as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200"
}

const getModelColor = (model: string) => {
  const colors = {
    "DALL-E 3": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Midjourney v6": "bg-violet-100 text-violet-700 border-violet-200",
    "Stable Diffusion XL": "bg-cyan-100 text-cyan-700 border-cyan-200",
  }
  return colors[model as keyof typeof colors] || "bg-slate-100 text-slate-700 border-slate-200"
}

const CardMenu = ({
  card,
  onEdit,
  onDelete,
  onSelect,
  onDeselect,
  isSelected,
}: {
  card: PromptCard
  onEdit: (card: PromptCard) => void
  onDelete: (card: PromptCard) => void
  onSelect: (cardId: string) => void
  onDeselect: (cardId: string) => void
  isSelected: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const menuItems = [
    {
      icon: isSelected ? Square : Check,
      label: isSelected ? "Deselect" : "Select",
      onClick: () => {
        setIsOpen(false)
        if (isSelected) {
          onDeselect(card.id)
        } else {
          onSelect(card.id)
        }
      },
      variant: "default" as const,
    },
    {
      icon: Edit,
      label: "Edit",
      onClick: () => {
        setIsOpen(false)
        onEdit(card)
      },
      variant: "default" as const,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: () => {
        setIsOpen(false)
        onDelete(card)
      },
      variant: "destructive" as const,
    },
  ]

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={handleToggleMenu}
        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-0 mb-2 w-36 bg-popover border rounded-lg shadow-lg z-50 animate-scale-in"
        >
          <div className="py-2">
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick()
                  }}
                  className={cn(
                    "flex items-center w-full px-3 py-2.5 text-body-md transition-colors duration-150 text-left",
                    item.variant === "destructive"
                      ? "text-destructive hover:bg-destructive/10"
                      : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
                {index < menuItems.length - 1 && <div className="h-px bg-border mx-2" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const PromptCard = ({
  card,
  isSelected,
  onSelect,
  onDeselect,
  onEdit,
  onDelete,
  onViewDetails,
  onViewOutputImage,
  onFavoriteToggle,
  index,
}: PromptCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only handle selection if clicking on the selectable card area
    const target = e.target as HTMLElement
    if (target.closest("button") || target.closest(".image-area") || target.closest(".non-selectable")) {
      return
    }

    // Direct toggle selection - no need to check if already selected
    if (isSelected) {
      onDeselect(card.id)
    } else {
      onSelect(card.id)
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDetails(card)
  }

  const handleViewOutput = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewOutputImage(card)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!card.output_image_path) return

    try {
      const response = await fetch(card.output_image_path)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `output-${card.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 cursor-pointer select-none",
        "hover:shadow-lg hover:-translate-y-1",
        "animate-fade-in",
        // Standardized dimensions
        "w-full h-[480px]",
        // Enhanced selection styling with stronger visual feedback
        isSelected
          ? "ring-2 ring-primary bg-primary/10 shadow-lg border-primary/30 transform scale-[1.02]"
          : "hover:shadow-md border-border hover:border-border/60 hover:bg-muted/20",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Enhanced Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 left-4 w-7 h-7 bg-primary rounded-full flex items-center justify-center z-20 animate-scale-in shadow-lg ring-2 ring-primary/20">
          <Check className="h-4 w-4 text-primary-foreground font-bold" />
        </div>
      )}

      {/* Favorite Button */}
      <div className="absolute top-4 right-4 z-20 non-selectable">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(card.id)
          }}
          className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-sm transition-all duration-200"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all duration-200",
              card.is_favorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400",
            )}
          />
        </Button>
      </div>

      {/* Image Container - Standardized Height */}
      <div
        className="relative w-full h-[260px] overflow-hidden bg-muted cursor-pointer image-area"
        onClick={handleImageClick}
      >
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        )}

        {!imageError && (
          <Image
            src={card.outputImageUrl || card.output_image_path || "/placeholder.svg"}
            alt="Output preview"
            fill
            className={cn(
              "object-cover transition-all duration-300",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
              "group-hover:scale-105",
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-body-sm">Failed to load image</p>
            </div>
          </div>
        )}

        {/* Image Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
            Click to view details
          </div>
        </div>
      </div>

      {/* Content Area - Standardized Height */}
      <CardContent className="p-5 h-[220px] flex flex-col justify-between">
        {/* Selection State Overlay */}
        {isSelected && <div className="absolute inset-0 bg-primary/5 pointer-events-none z-10 rounded-lg" />}
        <div className="space-y-4 flex-1">
          {/* Client and Model Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn("text-xs px-2.5 py-1 font-medium border", getClientColor(card.client))}
            >
              {card.client}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs px-2.5 py-1 font-medium border", getModelColor(card.model))}
            >
              {card.model}
            </Badge>
          </div>

          {/* Metadata Information */}
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <div>
              Created{" "}
              {new Date(card.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div>
              Seed: <span className="font-mono text-xs">{card.seed}</span>
            </div>
            {card.llm_used && (
              <div>
                LLM: <span className="font-medium">{card.llm_used}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Standardized Position */}
        <div className="flex items-center gap-2 pt-4 border-t non-selectable">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOutput}
            className="flex-1 h-9 text-xs bg-transparent hover:bg-primary/5 hover:border-primary hover:text-primary transition-all duration-200"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 h-9 text-xs bg-transparent hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </Button>

          <CardMenu
            card={card}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            onDeselect={onDeselect}
            isSelected={isSelected}
          />
        </div>
      </CardContent>
    </Card>
  )
}
