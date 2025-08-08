'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import React from 'react'
import { Header } from '@/components/header'
import { GalleryGrid } from '@/components/gallery-grid'
import { ModernPagination } from '@/components/modern-pagination'
import AddPromptModal from '@/components/add-prompt-modal'
import EditCardModal from '@/components/edit-card-modal'
import CardDetailModal from '@/components/card-detail-modal'
import { ImagePopupModal } from '@/components/image-popup-modal'
import { PromptCard } from '@/lib/supabase'
import { getImageUrl } from '@/lib/storage'
import { getPromptCardsByIds } from '@/lib/database-client'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Enhanced PromptCard type with lazy-loaded URLs
interface PromptCardWithUrls extends PromptCard {
  outputImageUrl?: string
  referenceImageUrl?: string
  imageUrlsLoaded?: boolean
}

// ✅ NEW: Pagination state interface
interface PaginationState {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Copy functionality
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const result = document.execCommand('copy')
      textArea.remove()
      return result
    } catch (fallbackErr) {
      console.error('Copy failed:', fallbackErr)
      return false
    }
  }
}

const formatCardData = (card: PromptCard): string => {
  const sections = [
    `📝 PROMPT:\n${card.prompt}`,
    `🎨 METADATA:\n${card.metadata}`,
    `👤 CLIENT: ${card.client}`,
    `🤖 MODEL: ${card.model}`,
    `🎲 SEED: ${card.seed}`,
  ]

  // Add optional fields if they exist
  if (card.llm_used) {
    sections.push(`🧠 LLM: ${card.llm_used}`)
  }
  
  if (card.notes) {
    sections.push(`📄 NOTES:\n${card.notes}`)
  }

  // Add metadata
  const createdDate = new Date(card.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  sections.push(`📅 CREATED: ${createdDate}`)
  sections.push(`⭐ FAVORITED: ${card.is_favorited ? 'Yes' : 'No'}`)

  return sections.join('\n\n')
}

const formatMultipleCards = (cards: PromptCard[]): string => {
  const header = `🗂️ AI PROMPT LIBRARY EXPORT\n📊 ${cards.length} Card${cards.length !== 1 ? 's' : ''} Selected\n📅 Exported: ${new Date().toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}\n\n${'='.repeat(50)}\n\n`

  const cardData = cards.map((card, index) => {
    const cardNumber = `📋 CARD ${index + 1}/${cards.length}`
    const separator = '-'.repeat(30)
    return `${cardNumber}\n${separator}\n${formatCardData(card)}\n\n`
  }).join('')

  return header + cardData + `${'='.repeat(50)}\n\n✨ End of Export`
}

export default function Home() {
  const [cards, setCards] = useState<PromptCardWithUrls[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentCard, setCurrentCard] = useState<PromptCardWithUrls | null>(null)
  const [currentImage, setCurrentImage] = useState<{ src: string; alt: string } | null>(null)
  const [currentImageType, setCurrentImageType] = useState<"output" | "reference">("output")
  const [deletingCards, setDeletingCards] = useState<string[]>([])
  const [filters, setFilters] = useState({
    client: 'All Clients',
    model: 'All Models',
    sort: 'newest' as 'newest' | 'oldest',
    favoritesOnly: false
  })

  // ✅ NEW: Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 50,
    hasNextPage: false,
    hasPrevPage: false
  })

  // ✅ NEW: Page loading state
  const [pageLoading, setPageLoading] = useState(false)

  // Memoized filter options for performance
  const filterOptions = useMemo(() => ({
    clients: ['All Clients', ...Array.from(new Set(cards.map(card => card.client)))],
    models: ['All Models', ...Array.from(new Set(cards.map(card => card.model)))]
  }), [cards])

  // Enhanced lazy load image URLs with proper state management
  const loadImageUrls = async (cardIds: string[]) => {
    const cardsToUpdate = cards.filter(card => 
      cardIds.includes(card.id) && !card.imageUrlsLoaded
    )

    if (cardsToUpdate.length === 0) {
      return
    }

    try {
      const updatedCards = await Promise.all(
        cardsToUpdate.map(async (card) => {
          try {
            const [outputUrl, referenceUrl] = await Promise.all([
              getImageUrl(card.output_image_path),
              getImageUrl(card.reference_image_path)
            ])
            
            return {
              ...card,
              outputImageUrl: outputUrl,
              referenceImageUrl: referenceUrl,
              imageUrlsLoaded: true
            }
          } catch (error) {
            console.error(`Failed to load URLs for card ${card.id}:`, error)
            return {
              ...card,
              outputImageUrl: undefined,
              referenceImageUrl: undefined,
              imageUrlsLoaded: true
            }
          }
        })
      )
      
      setCards(prev => {
        const newCards = prev.map(card => {
          const updated = updatedCards.find(u => u.id === card.id)
          return updated || card
        })
        
        return newCards
      })
      
    } catch (error) {
      console.error('Error loading image URLs:', error)
    }
  }

  // ✅ UPDATED: Fetch cards with pagination support
  const fetchCards = useCallback(async (page: number = 1) => {
    try {
      setLoading(page === 1)
      setPageLoading(page > 1)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters.client !== 'All Clients') params.set('client', filters.client)
      if (filters.model !== 'All Models') params.set('model', filters.model)
      if (filters.favoritesOnly) params.set('favorites', 'true')
      params.set('sortBy', filters.sort)
      params.set('page', page.toString())
      params.set('pageSize', '50')

      const response = await fetch(`/api/cards?${params}`)
      
      // Better error handling for invalid pages
      if (response.status === 404) {
        if (pagination.totalCount > 0) {
          const lastPage = Math.ceil(pagination.totalCount / 50)
          if (lastPage > 0 && page > lastPage) {
            fetchCards(lastPage)
            return
          }
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}`)
      }

      // ✅ Handle new paginated response structure
      const data: {
        cards: PromptCard[]
        pagination: PaginationState
      } = await response.json()
      
      // Set cards WITHOUT signed URLs initially (for fast loading)
      const cardsWithoutUrls: PromptCardWithUrls[] = data.cards.map(card => ({
        ...card,
        outputImageUrl: undefined,
        referenceImageUrl: undefined,
        imageUrlsLoaded: false
      }))

      // Use React.startTransition for better performance
      React.startTransition(() => {
        setCards(cardsWithoutUrls)
        setPagination(data.pagination)
      })
    } catch (err) {
      console.error('Error fetching cards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load prompt cards')
    } finally {
      setLoading(false)
      setPageLoading(false)
    }
  }, [filters, pagination.totalCount])

  // Page change handler
  const handlePageChange = useCallback((newPage: number) => {
    // Clear selected cards when changing pages
    setSelectedCards([])
    
    // Fetch new page
    fetchCards(newPage)
  }, [fetchCards, pagination.currentPage])

  // Filter change handler (resets to page 1)
  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setSelectedCards([]) // Clear selections when filters change
    
    // Reset pagination state for new filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0
    }))
    
    fetchCards(1) // Always reset to page 1
  }, [])

  // Load cards on mount and filter changes
  useEffect(() => {
    fetchCards(1)
  }, [fetchCards])



  // Handle card operations
  const handleCardAdded = () => {
    fetchCards(1) // Refresh from page 1 after adding
    setSelectedCards([]) // Clear selection
  }

  const handleCardUpdated = () => {
    fetchCards(pagination.currentPage) // Refresh current page after editing
    setShowEditModal(false)
    setCurrentCard(null)
  }

  const handleCardDeleted = (deletedId: string) => {
    const remainingCards = cards.length - 1
    const totalPages = Math.ceil((pagination.totalCount - 1) / pagination.pageSize)
    
    if (remainingCards === 0 && pagination.currentPage > 1) {
      fetchCards(pagination.currentPage - 1)
    } else if (pagination.currentPage > totalPages && totalPages > 0) {
      fetchCards(totalPages)
    } else {
      fetchCards(pagination.currentPage)
    }
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

  // ✅ UPDATED: Select all for current page only
  const handleSelectAll = () => {
    const currentPageCardIds = cards.map(card => card.id)
    
    // Check if all current page cards are selected
    const allCurrentPageSelected = currentPageCardIds.every(id => selectedCards.includes(id))
    
    if (allCurrentPageSelected) {
      // Deselect all cards on current page
      setSelectedCards(prev => prev.filter(id => !currentPageCardIds.includes(id)))
    } else {
      // Select all cards on current page (add to existing selection)
      setSelectedCards(prev => {
        const newSelection = [...prev]
        currentPageCardIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handleClearSelections = () => {
    setSelectedCards([])
  }

  // ✅ UPDATED: Enhanced copy functionality for cross-page selections
  const handleCopySelected = async (cardIds: string[]) => {
    try {
      // If selected cards are from current page, use current cards
      const currentPageCards = cards.filter(card => cardIds.includes(card.id))
      
      // If we need cards from other pages, fetch them
      const missingCardIds = cardIds.filter(id => !currentPageCards.find(c => c.id === id))
      
      let allSelectedCards = [...currentPageCards]
      
      if (missingCardIds.length > 0) {
        const additionalCards = await getPromptCardsByIds(missingCardIds)
        allSelectedCards = [...allSelectedCards, ...additionalCards]
      }
      
      const formattedData = formatMultipleCards(allSelectedCards)
      const success = await copyToClipboard(formattedData)
      
      if (!success) {
        throw new Error('Failed to copy to clipboard')
      }
    } catch (error) {
      console.error('Copy failed:', error)
      // Could show error toast here
    }
  }

  // Enhanced export functionality for cross-page selections
  const handleExport = async (format: "json" | "csv") => {
    if (selectedCards.length === 0) {
      return
    }

    try {
      
      // Get cards from current page
      const currentPageCards = cards.filter(card => selectedCards.includes(card.id))
      
      // Get cards from other pages if needed
      const missingCardIds = selectedCards.filter(id => !currentPageCards.find(c => c.id === id))
      
      let allSelectedCards = [...currentPageCards]
      
      if (missingCardIds.length > 0) {
        const additionalCards = await getPromptCardsByIds(missingCardIds)
        allSelectedCards = [...allSelectedCards, ...additionalCards]
      }
      
      const timestamp = new Date().toISOString().split('T')[0]
      
      if (format === 'json') {
        const exportData = allSelectedCards.map(({ imageUrlsLoaded, ...card }) => card)
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prompt-cards-${timestamp}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        // Improved CSV export
        const headers = ['id', 'prompt', 'metadata', 'client', 'model', 'seed', 'llm_used', 'notes', 'is_favorited', 'created_at']
        const csvData = [
          headers.join(','),
          ...allSelectedCards.map(card => 
            headers.map(h => {
              const value = card[h as keyof PromptCard]
              return `"${String(value || '').replace(/"/g, '""')}"`
            }).join(',')
          )
        ].join('\n')
        
        const blob = new Blob([csvData], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prompt-cards-${timestamp}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
      // Could show error toast here
    }
  }

  // Enhanced event handlers with lazy loading
  const handleCardEdit = async (card: PromptCardWithUrls) => {
    // Load image URLs if not already loaded
    if (!card.imageUrlsLoaded) {
      await loadImageUrls([card.id])
      // Get the updated card with URLs
      const updatedCard = cards.find(c => c.id === card.id)
      if (updatedCard) {
        setCurrentCard(updatedCard)
      }
    } else {
      setCurrentCard(card)
    }
    setShowEditModal(true)
  }

  const handleCardDelete = async (card: PromptCardWithUrls) => {
    // Create a custom confirmation dialog instead of browser's confirm()
    const confirmDelete = () => {
      return new Promise<boolean>((resolve) => {
        const modal = document.createElement('div')
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4 text-gray-900">Delete Card</h3>
            <p class="text-gray-600 mb-6">
              Are you sure you want to delete this card? This will permanently remove the card and its images. This action cannot be undone.
            </p>
            <div class="flex gap-3 justify-end">
              <button id="cancel-delete" class="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button id="confirm-delete" class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors">
                Delete Card
              </button>
            </div>
          </div>
        `
        
        document.body.appendChild(modal)
        
        const handleConfirm = () => {
          document.body.removeChild(modal)
          resolve(true)
        }
        
        const handleCancel = () => {
          document.body.removeChild(modal)
          resolve(false)
        }
        
        modal.querySelector('#confirm-delete')?.addEventListener('click', handleConfirm)
        modal.querySelector('#cancel-delete')?.addEventListener('click', handleCancel)
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) handleCancel()
        })
      })
    }

    const confirmed = await confirmDelete()
    
    if (confirmed) {
      try {
        // Add loading state
        setDeletingCards(prev => [...prev, card.id])
        
        const response = await fetch(`/api/cards/${card.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to delete card')
        }

        handleCardDeleted(card.id)
        
      } catch (err) {
        console.error('Error deleting card:', err)
        
        // Create custom error alert
        const errorModal = document.createElement('div')
        errorModal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
        errorModal.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-semibold mb-4 text-red-600">Delete Failed</h3>
            <p class="text-gray-600 mb-6">
              Failed to delete card. Please try again.
            </p>
            <div class="flex justify-end">
              <button id="close-error" class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                OK
              </button>
            </div>
          </div>
        `
        
        document.body.appendChild(errorModal)
        
        errorModal.querySelector('#close-error')?.addEventListener('click', () => {
          document.body.removeChild(errorModal)
        })
        
      } finally {
        // Remove loading state
        setDeletingCards(prev => prev.filter(id => id !== card.id))
      }
    }
  }

  const handleCardViewDetails = async (card: PromptCardWithUrls) => {
    // Load image URLs if not already loaded
    if (!card.imageUrlsLoaded) {
      await loadImageUrls([card.id])
      // Get the updated card with URLs
      const updatedCard = cards.find(c => c.id === card.id)
      if (updatedCard) {
        setCurrentCard(updatedCard)
      }
    } else {
      setCurrentCard(card)
    }
    setShowDetailModal(true)
  }

  const handleViewOutputImage = async (card: PromptCardWithUrls) => {
    // Load image URLs if not already loaded
    if (!card.imageUrlsLoaded) {
      await loadImageUrls([card.id])
      const updatedCard = cards.find(c => c.id === card.id)
      if (updatedCard?.outputImageUrl) {
        setCurrentImage({
          src: updatedCard.outputImageUrl,
          alt: `Output image for ${card.client} - ${card.model}`
        })
        setCurrentCard(updatedCard)
        setCurrentImageType("output")
        setShowImageModal(true)
      }
    } else if (card.outputImageUrl) {
      setCurrentImage({
        src: card.outputImageUrl,
        alt: `Output image for ${card.client} - ${card.model}`
      })
      setCurrentCard(card)
      setCurrentImageType("output")
      setShowImageModal(true)
    }
  }

  const handleViewReferenceImage = async (card: PromptCardWithUrls) => {
    // Load image URLs if not already loaded
    if (!card.imageUrlsLoaded) {
      await loadImageUrls([card.id])
      const updatedCard = cards.find(c => c.id === card.id)
      if (updatedCard?.referenceImageUrl) {
        setCurrentImage({
          src: updatedCard.referenceImageUrl,
          alt: `Reference image for ${card.client} - ${card.model}`
        })
        setCurrentCard(updatedCard)
        setCurrentImageType("reference")
        setShowImageModal(true)
      }
    } else if (card.referenceImageUrl) {
      setCurrentImage({
        src: card.referenceImageUrl,
        alt: `Reference image for ${card.client} - ${card.model}`
      })
      setCurrentCard(card)
      setCurrentImageType("reference")
      setShowImageModal(true)
    }
  }

  // Function to load images for visible cards (can be called by GalleryGrid)
  const handleLoadVisibleImages = (visibleCardIds: string[]) => {
    loadImageUrls(visibleCardIds)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header 
            totalCards={pagination.totalCount}
            displayedCards={0}
            selectedCards={[]}
            filters={filters}
            onFiltersChange={() => {}}
            onSelectAll={() => {}}
            onClearSelections={() => {}}
            onExport={() => {}}
            onCopySelected={() => {}}
            onAddNew={() => {}}
            clients={[]}
            models={[]}
          />
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="text-lg text-gray-500">Loading prompt cards...</div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header 
            totalCards={pagination.totalCount}
            displayedCards={0}
            selectedCards={[]}
            filters={filters}
            onFiltersChange={() => {}}
            onSelectAll={() => {}}
            onClearSelections={() => {}}
            onExport={() => {}}
            onCopySelected={() => {}}
            onAddNew={() => {}}
            clients={[]}
            models={[]}
          />
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-lg text-red-600 mb-4">{error}</div>
              <button 
                onClick={() => {
                  setError(null)
                  fetchCards(1)
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header
          totalCards={pagination.totalCount}
          displayedCards={cards.length}
          selectedCards={selectedCards}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSelectAll={handleSelectAll}
          onClearSelections={handleClearSelections}
          onExport={handleExport}
          onCopySelected={handleCopySelected}
          onAddNew={() => setShowAddModal(true)}
          clients={filterOptions.clients}
          models={filterOptions.models}
        />
        
        <div className="container mx-auto px-6 py-8">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No prompt cards found</h3>
              <p className="text-gray-500 mb-4">
                {pagination.totalCount > 0 
                  ? 'Try adjusting your filters' 
                  : 'Start building your AI prompt library'
                }
              </p>
              {pagination.totalCount === 0 && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Card
                </button>
              )}
            </div>
          ) : (
            <>
              <GalleryGrid
                cards={cards}
                selectedCards={selectedCards}
                loading={loading}
                deletingCards={deletingCards}
                onCardSelect={handleCardSelect}
                onCardDeselect={handleCardDeselect}
                onCardEdit={handleCardEdit}
                onCardDelete={handleCardDelete}
                onCardViewDetails={handleCardViewDetails}
                onViewOutputImage={handleViewOutputImage}
                onFavoriteToggle={handleFavoriteToggle}
                onAddNew={() => setShowAddModal(true)}
                onLoadVisibleImages={handleLoadVisibleImages}
              />
              
              {/* ✅ NEW: Pagination controls */}
              {pagination.totalPages > 1 && !pageLoading && (
                <div className="mt-8 flex flex-col items-center space-y-4">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} cards
                    {selectedCards.length > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        • {selectedCards.length} selected
                      </span>
                    )}
                  </div>
                  <ModernPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    className="mt-4"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <AddPromptModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handleCardAdded} 
        />

        {showEditModal && currentCard && (
          <EditCardModal
            card={currentCard}
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleCardUpdated}
          />
        )}

        {showDetailModal && currentCard && (
          <CardDetailModal
            card={currentCard}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onViewReferenceImage={handleViewReferenceImage}
          />
        )}

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
    </ProtectedRoute>
  )
}