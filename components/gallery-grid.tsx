"use client"

import { PromptCard } from "./prompt-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef, useCallback } from "react"

interface PromptCardData {
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
  imageUrlsLoaded?: boolean // New property to track if image URLs are loaded
}

interface GalleryGridProps {
  cards: PromptCardData[]
  selectedCards: string[]
  loading: boolean
  deletingCards?: string[]
  onCardSelect: (cardId: string) => void
  onCardDeselect: (cardId: string) => void
  onCardEdit: (card: PromptCardData) => void
  onCardDelete: (card: PromptCardData) => void
  onCardViewDetails: (card: PromptCardData) => void
  onViewOutputImage: (card: PromptCardData) => void
  onFavoriteToggle: (cardId: string) => void
  onAddNew: () => void
  onLoadVisibleImages: (visibleCardIds: string[]) => void
}

const LoadingSkeleton = ({ index }: { index: number }) => (
  <div
    className="animate-fade-in flex justify-center"
    style={{
      animationDelay: `${index * 50}ms`,
    }}
  >
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm w-full h-[480px]">
      <Skeleton className="w-full h-[260px] bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      <div className="p-5 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  </div>
)

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
    <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-8">
      <ImageIcon className="h-10 w-10 text-muted-foreground" />
    </div>

    <h3 className="text-heading-md text-foreground mb-3">No prompt cards found</h3>
    <p className="text-body-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
      Try adjusting your filters or create your first prompt card to get started with your AI library.
    </p>

    <Button onClick={onAddNew} size="lg" className="px-8">
      <Plus className="h-4 w-4 mr-2" />
      Create First Card
    </Button>
  </div>
)

export const GalleryGrid = ({
  cards,
  selectedCards,
  loading,
  deletingCards = [],
  onCardSelect,
  onCardDeselect,
  onCardEdit,
  onCardDelete,
  onCardViewDetails,
  onViewOutputImage,
  onFavoriteToggle,
  onAddNew,
  onLoadVisibleImages,
}: GalleryGridProps) => {
  const hasSelections = selectedCards.length > 0
  const observerRef = useRef<IntersectionObserver | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Intersection Observer callback to detect visible cards
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visibleCardIds: string[] = []
    
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Find the card ID from the element
        const cardElement = entry.target as HTMLDivElement
        const cardId = cardElement.dataset.cardId
        
        if (cardId) {
          // Check if this card needs image URLs loaded
          const card = cards.find(c => c.id === cardId)
          if (card && !card.imageUrlsLoaded) {
            visibleCardIds.push(cardId)
          }
        }
      }
    })

    // Load images for visible cards that need them
    if (visibleCardIds.length > 0) {
      onLoadVisibleImages(visibleCardIds)
    }
  }, [cards, onLoadVisibleImages])

  // Set up intersection observer
  useEffect(() => {
    if (!loading) {
      // Create intersection observer
      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '50px', // Start loading 50px before card becomes visible
        threshold: 0.1 // Trigger when 10% of card is visible
      })

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }
  }, [loading, handleIntersection])

  // Store card element references
  const setCardRef = useCallback((element: HTMLDivElement | null, cardId: string) => {
    if (element) {
      cardRefs.current.set(cardId, element)
      
      // Observe the element immediately when it's added
      if (observerRef.current) {
        observerRef.current.observe(element)
      }
    } else {
      // Unobserve when element is removed
      const existingElement = cardRefs.current.get(cardId)
      if (existingElement && observerRef.current) {
        observerRef.current.unobserve(existingElement)
      }
      cardRefs.current.delete(cardId)
    }
  }, [])



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <LoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    )
  }

  if (cards.length === 0) {
    return <EmptyState onAddNew={onAddNew} />
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Selection Mode Indicator */}
      {hasSelections && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-primary">
                Selection Mode Active - Click cards to add/remove from selection
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedCards.length} card{selectedCards.length !== 1 ? "s" : ""} selected
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={card.id} className="flex justify-center">
            <PromptCard
              card={card}
              isSelected={selectedCards.includes(card.id)}
              onSelect={onCardSelect}
              onDeselect={onCardDeselect}
              onEdit={onCardEdit}
              onDelete={onCardDelete}
              onViewDetails={onCardViewDetails}
              onViewOutputImage={onViewOutputImage}
              onFavoriteToggle={onFavoriteToggle}
              index={index}
              setCardRef={setCardRef}
            />
          </div>
        ))}
      </div>

      {/* Selection Helper Text */}
      {!hasSelections && cards.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Click on any card to start selecting • Use the header controls for bulk operations
          </p>
        </div>
      )}
    </div>
  )
}