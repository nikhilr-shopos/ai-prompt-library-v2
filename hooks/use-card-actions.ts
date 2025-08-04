"use client"

import { useState } from "react"
import { useDeleteCard } from "./use-delete-card"
import { useToast } from "@/components/toast-system"

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

export const useCardActions = (onRefreshGallery: () => void) => {
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean
    card: PromptCard | null
  }>({ isOpen: false, card: null })

  const { deleteCard, isDeleting } = useDeleteCard()
  const { showToast } = useToast()

  const handleDeleteRequest = (card: PromptCard) => {
    setConfirmDelete({ isOpen: true, card })
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDelete.card) return

    const result = await deleteCard(confirmDelete.card)

    if (result.success) {
      // Show success notification
      showToast({
        type: "success",
        message: "Card deleted successfully",
        duration: 3000,
      })

      // Close confirmation modal
      setConfirmDelete({ isOpen: false, card: null })

      // Refresh gallery to remove deleted card
      onRefreshGallery()
    } else {
      // Show error notification
      showToast({
        type: "error",
        message: result.error || "Failed to delete card",
        duration: 5000,
      })
    }
  }

  const handleDeleteCancel = () => {
    setConfirmDelete({ isOpen: false, card: null })
  }

  return {
    confirmDelete,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    isDeleting,
  }
}
