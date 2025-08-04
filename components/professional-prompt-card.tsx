"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Star, Eye, Download, MoreHorizontal, Edit, Trash2, Check, Square } from "lucide-react"
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

interface ProfessionalPromptCardProps {
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

const ActionMenu = ({
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
        className="h-8 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-0 mb-2 w-36 bg-surface-elevated border border-border-primary rounded-xl shadow-large z-50 overflow-hidden animate-scale-in"
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
                    "flex items-center w-full px-3 py-2.5 text-body-medium transition-all duration-200 text-left",
                    item.variant === "destructive"
                      ? "text-accent-danger hover:bg-accent-danger/5"
                      : "text-text-primary hover:bg-surface-secondary",
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
                {index < menuItems.length - 1 && <div className="h-px bg-border-primary mx-2" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const ProfessionalPromptCard = ({
  card,
  isSelected,
  onSelect,
  onDeselect,
  onEdit,
  onDelete,
  onViewDetails,
  onFavoriteToggle,
  index,
}: ProfessionalPromptCardProps) => {
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
        "group relative overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:shadow-elevated hover:-translate-y-1 hover:scale-[1.01]",
        "animate-fade-in border-2",
        isSelected
          ? "border-interactive-primary bg-interactive-primary/5 shadow-interactive"
          : "border-border-primary hover:border-border-hover",
        isHovered && "shadow-elevated",
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        width: "320px",
        height: "420px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Indicator - Top Left */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-6 h-6 bg-interactive-primary rounded-full flex items-center justify-center z-20 animate-scale-in shadow-medium">
          <Check className="h-3 w-3 text-text-inverse" />
        </div>
      )}

      {/* Favorite Button - Top Right */}
      <div className="absolute top-3 right-3 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(card.id)
          }}
          className="h-8 w-8 p-0 bg-surface-overlay backdrop-blur-sm border border-border-primary/50 rounded-full hover:bg-surface-primary transition-all duration-200 shadow-soft"
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all duration-200",
              card.is_favorited
                ? "fill-accent-warning text-accent-warning scale-110"
                : "text-text-tertiary hover:text-accent-warning",
            )}
          />
        </Button>
      </div>

      {/* Image Container */}
      <div
        className="relative w-full h-[240px] overflow-hidden bg-surface-tertiary cursor-pointer"
        onClick={handleImageClick}
      >
        {!imageLoaded && !imageError && (
          <Skeleton className="absolute inset-0 bg-gradient-to-r from-surface-tertiary via-surface-secondary to-surface-tertiary bg-[length:200%_100%] animate-shimmer" />
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
          <div className="absolute inset-0 flex items-center justify-center bg-surface-tertiary text-text-tertiary">
            <div className="text-center">
              <div className="text-3xl mb-2">📷</div>
              <p className="text-body-small">Failed to load</p>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-all duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* Content */}
      <div className="p-5 h-[180px] flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-body-large font-medium text-text-primary leading-6 line-clamp-2 group-hover:text-interactive-primary transition-colors duration-200">
            {card.prompt.length > 85 ? card.prompt.substring(0, 85) + "..." : card.prompt}
          </h3>

          <div className="flex items-center gap-2 text-body-small text-text-secondary">
            <Badge
              variant="secondary"
              className="text-body-small px-2.5 py-1 bg-surface-tertiary text-text-secondary border-border-primary"
            >
              {card.client}
            </Badge>
            <span className="opacity-50">•</span>
            <span className="truncate font-medium">{card.model}</span>
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
        <div className="flex items-center gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOutputView}
            className="flex-1 h-9 text-body-small bg-surface-primary hover:bg-interactive-primary/5 hover:border-interactive-primary hover:text-interactive-primary transition-all duration-200"
          >
            <Eye className="h-3.5 w-3.5 mr-2" />
            View
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOutputDownload}
            className="flex-1 h-9 text-body-small bg-surface-primary hover:bg-accent-secondary/5 hover:border-accent-secondary hover:text-accent-secondary transition-all duration-200"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Download
          </Button>

          <ActionMenu
            card={card}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            onDeselect={onDeselect}
            isSelected={isSelected}
          />
        </div>
      </div>
    </Card>
  )
}
