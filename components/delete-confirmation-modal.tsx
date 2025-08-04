"use client"

import type React from "react"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface DeleteConfirmationProps {
  isOpen: boolean
  cardTitle: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export const DeleteConfirmationModal = ({
  isOpen,
  cardTitle,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationProps) => {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "auto"
    }
  }, [isOpen, onCancel, isDeleting])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel()
    }
  }

  const truncatedTitle = cardTitle.length > 50 ? cardTitle.substring(0, 50) + "..." : cardTitle

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-0">
          <h3 className="text-[18px] font-semibold text-[#1F1F1F] m-0">Delete Prompt Card</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-[14px] text-[#787774] mb-3 leading-relaxed">
            Are you sure you want to delete <strong>"{truncatedTitle}"</strong>?
          </p>
          <p className="text-[13px] text-[#9B9A97] leading-relaxed">
            This action cannot be undone and will permanently remove the card and its images.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-[#E8E8E8] rounded-md text-[14px] text-[#787774] bg-transparent hover:bg-[#F1F1EF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#DC2626] text-white rounded-md text-[14px] hover:bg-[#B91C1C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
