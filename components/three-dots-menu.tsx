"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Edit, Trash2 } from "lucide-react"

interface ThreeDotsMenuProps {
  cardId: string
  onEdit: () => void
  onDelete: () => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  isOpen: boolean
  onClose: () => void
}

export const ThreeDotsMenu = ({ cardId, onEdit, onDelete, triggerRef, isOpen, onClose }: ThreeDotsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, triggerRef, onClose])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleEdit = () => {
    onClose()
    onEdit()
  }

  const handleDelete = () => {
    onClose()
    onDelete()
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="absolute top-full right-0 mt-1 bg-white border border-[#E8E8E8] rounded-md shadow-lg min-w-[120px] z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
    >
      <button
        onClick={handleEdit}
        className="flex items-center w-full px-3 py-2 text-[14px] text-[#1F1F1F] hover:bg-[#F6F6F6] transition-colors"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </button>

      <div className="h-px bg-[#EBEBEB]" />

      <button
        onClick={handleDelete}
        className="flex items-center w-full px-3 py-2 text-[14px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  )
}

interface ThreeDotsButtonProps {
  cardId: string
  onEdit: () => void
  onDelete: () => void
}

export const ThreeDotsButton = ({ cardId, onEdit, onDelete }: ThreeDotsButtonProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click events
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="p-1 text-[#9B9A97] hover:bg-[#F1F1EF] rounded transition-colors"
        aria-label="More options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <ThreeDotsMenu
        cardId={cardId}
        onEdit={onEdit}
        onDelete={onDelete}
        triggerRef={buttonRef}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </div>
  )
}
