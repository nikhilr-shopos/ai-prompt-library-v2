"use client"

import { EnhancedPromptCard } from "./enhanced-prompt-card"
import { Skeleton } from "@/components/ui/skeleton"

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

interface EnhancedGalleryGridProps {
  cards: PromptCard[]
  selectedCards: string[]
  loading: boolean
  onCardSelect: (cardId: string) => void
  onCardDeselect: (cardId: string) => void
  onCardEdit: (card: PromptCard) => void
  onCardDelete: (card: PromptCard) => void
  onCardViewDetails: (card: PromptCard) => void
  onFavoriteToggle: (cardId: string) => void
}

const LoadingSkeleton = ({ index }: { index: number }) => (
  <div
    className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
    style={{
      animationDelay: `${index * 100}ms`,
      width: "300px",
      height: "380px",
    }}
  >
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Skeleton className="w-full h-[220px] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  </div>
)

export const EnhancedGalleryGrid = ({
  cards,
  selectedCards,
  loading,
  onCardSelect,
  onCardDeselect,
  onCardEdit,
  onCardDelete,
  onCardViewDetails,
  onFavoriteToggle,
}: EnhancedGalleryGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 justify-center p-8">
        {Array.from({ length: 12 }).map((_, index) => (
          <LoadingSkeleton key={index} index={index} />
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-in fade-in-0 duration-500">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <div className="text-4xl text-gray-400">📷</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No prompt cards found</h3>
        <p className="text-gray-500 max-w-md">
          Try adjusting your filters or create your first prompt card to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 justify-center p-8">
      {cards.map((card, index) => (
        <EnhancedPromptCard
          key={card.id}
          card={card}
          isSelected={selectedCards.includes(card.id)}
          onSelect={onCardSelect}
          onDeselect={onCardDeselect}
          onEdit={onCardEdit}
          onDelete={onCardDelete}
          onViewDetails={onCardViewDetails}
          onFavoriteToggle={onFavoriteToggle}
          index={index}
        />
      ))}
    </div>
  )
}
