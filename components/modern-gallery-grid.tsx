"use client"

import { ProfessionalPromptCard } from "./professional-prompt-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface ModernGalleryGridProps {
  cards: PromptCard[]
  selectedCards: string[]
  loading: boolean
  onCardSelect: (cardId: string) => void
  onCardDeselect: (cardId: string) => void
  onCardEdit: (card: PromptCard) => void
  onCardDelete: (card: PromptCard) => void
  onCardViewDetails: (card: PromptCard) => void
  onFavoriteToggle: (cardId: string) => void
  onAddNew: () => void
}

const LoadingSkeleton = ({ index }: { index: number }) => (
  <div
    className="animate-fade-in"
    style={{
      animationDelay: `${index * 50}ms`,
      width: "320px",
      height: "420px",
    }}
  >
    <div className="bg-surface-primary border-2 border-border-primary rounded-xl overflow-hidden shadow-soft">
      <Skeleton className="w-full h-[240px] bg-gradient-to-r from-surface-tertiary via-surface-secondary to-surface-tertiary bg-[length:200%_100%] animate-shimmer" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-full bg-surface-tertiary" />
        <Skeleton className="h-5 w-3/4 bg-surface-tertiary" />
        <Skeleton className="h-4 w-1/2 bg-surface-tertiary" />
        <div className="flex gap-2 pt-3">
          <Skeleton className="h-9 flex-1 bg-surface-tertiary" />
          <Skeleton className="h-9 flex-1 bg-surface-tertiary" />
          <Skeleton className="h-9 w-9 bg-surface-tertiary" />
        </div>
      </div>
    </div>
  </div>
)

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
  <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
    <div className="w-32 h-32 bg-gradient-to-br from-surface-tertiary to-surface-secondary rounded-2xl flex items-center justify-center mb-8 shadow-soft">
      <Search className="h-12 w-12 text-text-tertiary" />
    </div>

    <h3 className="text-heading-medium text-text-primary mb-3">No prompt cards found</h3>
    <p className="text-body-large text-text-secondary max-w-md mb-8 leading-relaxed">
      Try adjusting your filters or create your first prompt card to get started with your AI library.
    </p>

    <Button
      onClick={onAddNew}
      className="bg-interactive-primary hover:bg-interactive-hover text-text-inverse shadow-medium hover:shadow-large transition-all duration-200 hover:-translate-y-0.5 px-8"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create First Card
    </Button>
  </div>
)

export const ModernGalleryGrid = ({
  cards,
  selectedCards,
  loading,
  onCardSelect,
  onCardDeselect,
  onCardEdit,
  onCardDelete,
  onCardViewDetails,
  onFavoriteToggle,
  onAddNew,
}: ModernGalleryGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 justify-center p-8 max-w-[1440px] mx-auto">
        {Array.from({ length: 12 }).map((_, index) => (
          <LoadingSkeleton key={index} index={index} />
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return <EmptyState onAddNew={onAddNew} />
  }

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 justify-center">
        {cards.map((card, index) => (
          <ProfessionalPromptCard
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
    </div>
  )
}
