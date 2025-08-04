'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { GalleryGrid } from '@/components/gallery-grid'
import AddPromptModal from '@/components/add-prompt-modal'
import EditCardModal from '@/components/edit-card-modal'
import CardDetailModal from '@/components/card-detail-modal'
import { ImagePopupModal } from '@/components/image-popup-modal'
import { PromptCard } from '@/lib/supabase'
import { getImageUrl } from '@/lib/storage'

export default function Home() {
  const [cards, setCards] = useState<PromptCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentCard, setCurrentCard] = useState<PromptCard | null>(null)
  const [currentImage, setCurrentImage] = useState<{ src: string; alt: string } | null>(null)
  const [currentImageType, setCurrentImageType] = useState<"output" | "reference">("output")
  const [filters, setFilters] = useState({
    client: 'All Clients',
    model: 'All Models',
    sort: 'newest' as 'newest' | 'oldest',
    favoritesOnly: false
  })

  // Fetch cards from API
  const fetchCards = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters.client !== 'All Clients') params.set('client', filters.client)
      if (filters.model !== 'All Models') params.set('model', filters.model)
      if (filters.favoritesOnly) params.set('favorites', 'true')
      params.set('sortBy', filters.sort)

      const response = await fetch(`/api/cards?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch cards')
      }

      const data = await response.json()
      
      // Add signed URLs to cards
      const cardsWithUrls = await Promise.all(
        data.map(async (card: PromptCard) => ({
          ...card,
          outputImageUrl: await getImageUrl(card.output_image_path),
          referenceImageUrl: await getImageUrl(card.reference_image_path)
        }))
      )

      setCards(cardsWithUrls)
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError('Failed to load prompt cards')
    } finally {
      setLoading(false)
    }
  }

  // Load cards on mount and filter changes
  useEffect(() => {
    fetchCards()
  }, [filters])

  // Handle card operations
  const handleCardAdded = () => {
    fetchCards() // Refresh after adding
    setSelectedCards([]) // Clear selection
  }

  const handleCardUpdated = () => {
    fetchCards() // Refresh after editing
    setShowEditModal(false)
    setCurrentCard(null)
  }

  const handleCardDeleted = (deletedId: string) => {
    setCards(prev => prev.filter(card => card.id !== deletedId))
    setSelectedCards(prev => prev.filter(id => id !== deletedId))
  }

  const handleFavoriteToggle = async (cardId: string) => {
    try {
      const card = cards.find(c => c.id === cardId)
      if (!card) return

      const response = await fetch(`/api/cards/${cardId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorited: !card.is_favorited })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      // Update local state
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, is_favorited: !c.is_favorited } : c
      ))
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  const handleCardDeselect = (cardId: string) => {
    setSelectedCards(prev => prev.filter(id => id !== cardId))
  }

  const handleSelectAll = () => {
    if (selectedCards.length === cards.length && cards.length > 0) {
      setSelectedCards([])
    } else {
      setSelectedCards(cards.map(card => card.id))
    }
  }

  const handleClearSelections = () => {
    setSelectedCards([])
  }

  const handleExport = (format: "json" | "csv") => {
    const selectedData = cards.filter(card => selectedCards.includes(card.id))
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompt-cards-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } else {
      // CSV export logic
      const headers = ['id', 'prompt', 'client', 'model', 'seed', 'created_at']
      const csvData = [
        headers.join(','),
        ...selectedData.map(card => headers.map(h => `"${card[h as keyof PromptCard]}"`).join(','))
      ].join('\n')
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompt-cards-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  // Fixed event handlers with proper modal component integration
  const handleCardEdit = (card: PromptCard) => {
    console.log('Edit card:', card.id)
    setCurrentCard(card)
    setShowEditModal(true)
  }

  const handleCardDelete = async (card: PromptCard) => {
    console.log('Delete card:', card.id)
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const response = await fetch(`/api/cards/${card.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete card')
        }

        handleCardDeleted(card.id)
        alert('Card deleted successfully!')
      } catch (err) {
        console.error('Error deleting card:', err)
        alert('Failed to delete card')
      }
    }
  }

  const handleCardViewDetails = (card: PromptCard) => {
    console.log('View details:', card.id)
    setCurrentCard(card)
    setShowDetailModal(true)
  }

  const handleViewOutputImage = (card: PromptCard) => {
    console.log('View output image:', card.id)
    if (card.outputImageUrl) {
      setCurrentImage({
        src: card.outputImageUrl,
        alt: `Output image for ${card.client} - ${card.model}`
      })
      setCurrentCard(card)
      setCurrentImageType("output")
      setShowImageModal(true)
    }
  }

  const handleViewReferenceImage = (card: PromptCard) => {
    console.log('View reference image:', card.id)
    if (card.referenceImageUrl) {
      setCurrentImage({
        src: card.referenceImageUrl,
        alt: `Reference image for ${card.client} - ${card.model}`
      })
      setCurrentCard(card)
      setCurrentImageType("reference")
      setShowImageModal(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          totalCards={0}
          displayedCards={0}
          selectedCards={[]}
          filters={filters}
          onFiltersChange={() => {}}
          onSelectAll={() => {}}
          onClearSelections={() => {}}
          onExport={() => {}}
          onAddNew={() => {}}
          clients={[]}
          models={[]}
        />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500">Loading prompt cards...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          totalCards={0}
          displayedCards={0}
          selectedCards={[]}
          filters={filters}
          onFiltersChange={() => {}}
          onSelectAll={() => {}}
          onClearSelections={() => {}}
          onExport={() => {}}
          onAddNew={() => {}}
          clients={[]}
          models={[]}
        />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-500">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        totalCards={cards.length}
        displayedCards={cards.length}
        selectedCards={selectedCards}
        filters={filters}
        onFiltersChange={setFilters}
        onSelectAll={handleSelectAll}
        onClearSelections={handleClearSelections}
        onExport={handleExport}
        onAddNew={() => setShowAddModal(true)}
        clients={['All Clients', ...Array.from(new Set(cards.map(card => card.client)))]}
        models={['All Models', ...Array.from(new Set(cards.map(card => card.model)))]}
      />
      
      <div className="container mx-auto px-6 py-8">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No prompt cards yet</h3>
            <p className="text-gray-500 mb-4">Start building your AI prompt library</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Card
            </button>
          </div>
        ) : (
          <GalleryGrid
            cards={cards}
            selectedCards={selectedCards}
            loading={loading}
            onCardSelect={handleCardSelect}
            onCardDeselect={handleCardDeselect}
            onCardEdit={handleCardEdit}
            onCardDelete={handleCardDelete}
            onCardViewDetails={handleCardViewDetails}
            onViewOutputImage={handleViewOutputImage}
            onFavoriteToggle={handleFavoriteToggle}
            onAddNew={() => setShowAddModal(true)}
          />
        )}
      </div>

      {/* Add New Card Modal */}
      <AddPromptModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={handleCardAdded} 
      />

      {/* Edit Card Modal */}
      {showEditModal && currentCard && (
        <EditCardModal
          card={currentCard}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleCardUpdated}
        />
      )}

      {/* Card Detail Modal */}
      {showDetailModal && currentCard && (
        <CardDetailModal
          card={currentCard}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onViewReferenceImage={handleViewReferenceImage}
        />
      )}

      {/* Image Popup Modal */}
      {showImageModal && currentImage && currentCard && (
        <ImagePopupModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imagePath={currentImage.src}
          imageTitle={currentImage.alt}
          imageType={currentImageType}
          cardId={currentCard.id}
        />
      )}
    </div>
  )
}