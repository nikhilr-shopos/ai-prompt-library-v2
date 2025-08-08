"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

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

interface DeleteOperationResult {
  success: boolean
  error?: string
}

export const useDeleteCard = () => {
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteCard = async (card: PromptCard): Promise<DeleteOperationResult> => {
    setIsDeleting(true)

    try {
      // Step 1: Delete images from Supabase Storage
      const imagesToDelete = [
        card.output_image_path,
        card.reference_image_path
      ].filter(Boolean) // Remove any null/undefined paths

      if (imagesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('prompt-library')
          .remove(imagesToDelete)

        if (storageError) {
          console.error('Storage deletion error:', storageError)
          // Continue with database deletion even if storage fails
          // This prevents orphaned database records
        }
      }

      // Step 2: Delete database record
      const { error: dbError } = await supabase
        .from('prompt_cards')
        .delete()
        .eq('id', card.id)

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`)
      }


      return { success: true }
    } catch (error) {
      console.error("Delete operation failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return { deleteCard, isDeleting }
}
