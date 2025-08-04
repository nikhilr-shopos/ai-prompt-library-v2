"use client"

import { useState } from "react"
import { ChevronDown, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EnhancedHeaderProps {
  totalCards: number
  displayedCards: number
  selectedCards: string[]
  filters: {
    client: string
    model: string
    sort: "newest" | "oldest"
    favoritesOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  onSelectAll: () => void
  onExport: (format: "json" | "csv") => void
  onAddNew: () => void
  clients: string[]
  models: string[]
}

export const EnhancedHeader = ({
  totalCards,
  displayedCards,
  selectedCards,
  filters,
  onFiltersChange,
  onSelectAll,
  onExport,
  onAddNew,
  clients,
  models,
}: EnhancedHeaderProps) => {
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const FilterDropdown = ({
    label,
    value,
    options,
    onSelect,
    isOpen,
    onToggle,
  }: {
    label: string
    value: string
    options: string[]
    onSelect: (value: string) => void
    isOpen: boolean
    onToggle: () => void
  }) => (
    <div className="relative">
      <Button
        variant="outline"
        onClick={onToggle}
        className="h-9 px-3 text-sm font-medium hover:bg-gray-50 transition-all duration-200 bg-transparent"
      >
        {value}
        <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onSelect(option)
                setShowDropdown(null)
              }}
              className={cn(
                "block w-full text-left px-4 py-2.5 text-sm transition-colors duration-150",
                value === option ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Prompt Library</h1>
            <p className="text-gray-600 text-base">
              Browse and explore AI-generated images with their prompts and metadata
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
              {displayedCards} of {totalCards} images
            </div>
            <Button
              onClick={onAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-[1440px] mx-auto px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters:</span>
              </div>

              <FilterDropdown
                label="Client"
                value={filters.client}
                options={clients}
                onSelect={(client) => onFiltersChange({ ...filters, client, page: 1 })}
                isOpen={showDropdown === "client"}
                onToggle={() => setShowDropdown(showDropdown === "client" ? null : "client")}
              />

              <FilterDropdown
                label="Model"
                value={filters.model}
                options={models}
                onSelect={(model) => onFiltersChange({ ...filters, model, page: 1 })}
                isOpen={showDropdown === "model"}
                onToggle={() => setShowDropdown(showDropdown === "model" ? null : "model")}
              />

              <FilterDropdown
                label="Sort"
                value={filters.sort === "newest" ? "Newest First" : "Oldest First"}
                options={["Newest First", "Oldest First"]}
                onSelect={(sort) =>
                  onFiltersChange({
                    ...filters,
                    sort: sort === "Newest First" ? "newest" : "oldest",
                    page: 1,
                  })
                }
                isOpen={showDropdown === "sort"}
                onToggle={() => setShowDropdown(showDropdown === "sort" ? null : "sort")}
              />

              <Button
                variant={filters.favoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly, page: 1 })}
                className="h-9 transition-all duration-200"
              >
                {filters.favoritesOnly ? "Favorites Only" : "Show All"}
              </Button>
            </div>

            <div className="flex-1" />

            {/* Selection Controls */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCards.length === displayedCards && displayedCards > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors duration-200"
                />
                <span className="font-medium">Select All</span>
              </label>

              {selectedCards.length > 0 && (
                <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedCards.length} selected
                  </Badge>
                  <div className="relative">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowDropdown(showDropdown === "export" ? null : "export")}
                      className="h-9 bg-green-600 hover:bg-green-700 transition-all duration-200"
                    >
                      Export
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                    {showDropdown === "export" && (
                      <div className="absolute top-full right-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            onExport("json")
                            setShowDropdown(null)
                          }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => {
                            onExport("csv")
                            setShowDropdown(null)
                          }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          CSV
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(null)} />}
    </div>
  )
}
