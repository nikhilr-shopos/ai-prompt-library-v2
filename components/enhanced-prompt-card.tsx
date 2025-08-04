"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Star, Eye, Download, MoreHorizontal, Edit, Trash2, Check } from "lucide-react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
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
}

interface EnhancedPromptCardProps {
  card: PromptCard
  isSelected: boolean
  onSelect: (cardId: string) => void
  onDeselect: (cardId: string) => void
  onEdit: (card: PromptCard) => void
  onDelete: (card: PromptCard) => void
  onViewDetails: (card: PromptCard) => void
  onFavoriteToggle: (cardId: string) => void
  index: number
}

const EnhancedThreeDotsMenu = ({
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
      icon: Edit,
      label: "Edit",
      onClick: () => {
        setIsOpen(false)
        onEdit(card)
      },
      variant: "default" as const,
    },
    {
      icon: isSelected ? Check : undefined,
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
        size="icon"
        onClick={handleToggleMenu}
        className="h-8 w-8 bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-40 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {menuItems.map((item, index) => (
            <div key={item.label}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick()
                }}
                className={cn(
                  "flex items-center w-full px-3 py-2.5 text-sm transition-all duration-200 text-left",
                  item.variant === "destructive"
                    ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 mr-3" />}
                {item.label}
              </button>
              {index < menuItems.length - 2 && <div className="h-px bg-gray-100" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const EnhancedPromptCard = ({
  card,
  isSelected,
  onSelect,
  onDeselect,
  onEdit,
  onDelete,
  onViewDetails,
  onFavoriteToggle,
  index,
}: EnhancedPromptCardProps) => {
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

  const handleImageClick = () => {
    onViewDetails(card)
  }

  const handleOutputView = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (card.output_image_path) {
      window.open(card.output_image_path, "_blank")
    }
  }

  const handleOutputDownload = async (e: React.MouseEvent) => {
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
        "group relative overflow-hidden transition-all duration-300 cursor-pointer border-2",
        "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]",
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/20"
          : "border-gray-200 hover:border-gray-300",
        isHovered && "shadow-2xl",
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        width: "300px",
        height: "380px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Controls */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(card.id)
          }}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all duration-200",
              card.is_favorited ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-400 hover:text-yellow-400",
            )}
          />
        </Button>

        <EnhancedThreeDotsMenu
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
          onDeselect={onDeselect}
          isSelected={isSelected}
        />
      </div>

      {/* Image Container */}
      <div className="relative w-full h-[220px] overflow-hidden bg-gray-100 cursor-pointer" onClick={handleImageClick}>
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
        )}

        {!imageError && (
          <Image
            src={card.output_image_path || "/placeholder.svg"}
            alt="Output preview"
            fill
            className={cn(
              "object-cover transition-all duration-500",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
              "group-hover:scale-110",
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">📷</div>
              <p className="text-sm">Failed to load</p>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-all duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* Content */}
      <div className="p-4 h-[160px] flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 leading-5 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {card.prompt.length > 80 ? card.prompt.substring(0, 80) + "..." : card.prompt}
          </h3>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {card.client}
            </Badge>
            <span className="opacity-50">•</span>
            <span className="truncate">{card.model}</span>
            <span className="opacity-50">•</span>
            <span className="whitespace-nowrap">
              {new Date(card.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOutputView}
            className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 bg-transparent"
          >
            <Eye className="h-3 w-3 mr-1.5" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOutputDownload}
            className="flex-1 h-8 text-xs hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200 bg-transparent"
          >
            <Download className="h-3 w-3 mr-1.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-in zoom-in-0 duration-200">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </Card>
  )
}
