"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ModernHeaderProps {
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

interface DropdownProps {
  label: string
  value: string
  options: string[]
  onSelect: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  className?: string
}

const ModernDropdown = ({ label, value, options, onSelect, isOpen, onToggle, className }: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Don't close immediately, let the parent handle it
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn(
          "h-10 px-4 text-body-medium font-medium bg-surface-primary border-border-primary",
          "hover:bg-surface-secondary hover:border-border-hover transition-all duration-200",
          "focus:ring-2 focus:ring-interactive-primary/20 focus:border-interactive-primary",
          isOpen && "bg-surface-secondary border-border-hover",
        )}
      >
        <span className="truncate max-w-32">{value}</span>
        <ChevronDown
          className={cn("ml-2 h-4 w-4 transition-transform duration-200 text-text-tertiary", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-surface-elevated border border-border-primary rounded-xl shadow-large z-50 overflow-hidden animate-slide-down">
          <div className="py-2">
            {options.map((option, index) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option)
                }}
                className={cn(
                  "block w-full text-left px-4 py-2.5 text-body-medium transition-colors duration-150",
                  value === option
                    ? "bg-interactive-primary/5 text-interactive-primary font-medium"
                    : "text-text-primary hover:bg-surface-secondary",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const ModernHeader = ({
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
}: ModernHeaderProps) => {
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDropdownToggle = (dropdownName: string) => {
    setShowDropdown(showDropdown === dropdownName ? null : dropdownName)
  }

  const closeAllDropdowns = () => {
    setShowDropdown(null)
  }

  return (
    <>
      <header className="bg-surface-primary border-b border-border-primary sticky top-0 z-40 backdrop-blur-sm bg-surface-overlay">
        {/* Main Header */}
        <div className="max-w-[1440px] mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <h1 className="text-display-medium text-text-primary">AI Prompt Library</h1>
              <p className="text-body-large text-text-secondary max-w-2xl">
                Discover, organize, and manage your AI-generated content with powerful tools and insights
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-body-medium text-text-secondary bg-surface-tertiary px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse-soft"></div>
                <span className="font-medium">{displayedCards}</span>
                <span className="text-text-tertiary">of</span>
                <span className="font-medium">{totalCards}</span>
                <span className="text-text-tertiary">items</span>
              </div>

              <Button
                onClick={onAddNew}
                className="bg-interactive-primary hover:bg-interactive-hover text-text-inverse shadow-medium hover:shadow-large transition-all duration-200 hover:-translate-y-0.5 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Bar */}
        <div className="bg-surface-secondary/50 backdrop-blur-sm border-t border-border-primary">
          <div className="max-w-[1440px] mx-auto px-8 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search prompts, clients, or models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-border-primary rounded-lg text-body-medium placeholder-text-tertiary focus:ring-2 focus:ring-interactive-primary/20 focus:border-interactive-primary transition-all duration-200"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-label-medium text-text-secondary">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </div>

                <ModernDropdown
                  label="Client"
                  value={filters.client}
                  options={clients}
                  onSelect={(client) => {
                    onFiltersChange({ ...filters, client, page: 1 })
                    closeAllDropdowns()
                  }}
                  isOpen={showDropdown === "client"}
                  onToggle={() => handleDropdownToggle("client")}
                />

                <ModernDropdown
                  label="Model"
                  value={filters.model}
                  options={models}
                  onSelect={(model) => {
                    onFiltersChange({ ...filters, model, page: 1 })
                    closeAllDropdowns()
                  }}
                  isOpen={showDropdown === "model"}
                  onToggle={() => handleDropdownToggle("model")}
                />

                <ModernDropdown
                  label="Sort"
                  value={filters.sort === "newest" ? "Newest First" : "Oldest First"}
                  options={["Newest First", "Oldest First"]}
                  onSelect={(sort) => {
                    onFiltersChange({
                      ...filters,
                      sort: sort === "Newest First" ? "newest" : "oldest",
                      page: 1,
                    })
                    closeAllDropdowns()
                  }}
                  isOpen={showDropdown === "sort"}
                  onToggle={() => handleDropdownToggle("sort")}
                />

                <Button
                  variant={filters.favoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, favoritesOnly: !filters.favoritesOnly, page: 1 })}
                  className={cn(
                    "h-10 transition-all duration-200",
                    filters.favoritesOnly
                      ? "bg-accent-warning text-text-inverse shadow-medium"
                      : "hover:bg-surface-secondary",
                  )}
                >
                  ⭐ {filters.favoritesOnly ? "Favorites Only" : "Show All"}
                </Button>
              </div>

              <div className="flex-1" />

              {/* Selection Controls */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 text-body-medium text-text-primary cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedCards.length === displayedCards && displayedCards > 0}
                      onChange={onSelectAll}
                      className="w-4 h-4 text-interactive-primary border-border-secondary rounded focus:ring-interactive-primary/20 transition-colors duration-200"
                    />
                  </div>
                  <span className="font-medium group-hover:text-interactive-primary transition-colors duration-200">
                    Select All
                  </span>
                </label>

                {selectedCards.length > 0 && (
                  <div className="flex items-center gap-3 animate-slide-up">
                    <Badge
                      variant="secondary"
                      className="px-3 py-1.5 bg-interactive-primary/10 text-interactive-primary border-interactive-primary/20"
                    >
                      {selectedCards.length} selected
                    </Badge>

                    <div className="relative">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDropdownToggle("export")}
                        className="h-10 bg-accent-secondary hover:bg-accent-secondary/90 text-text-inverse shadow-medium transition-all duration-200"
                      >
                        Export
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>

                      {showDropdown === "export" && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-surface-elevated border border-border-primary rounded-xl shadow-large z-50 overflow-hidden animate-slide-down">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                onExport("json")
                                closeAllDropdowns()
                              }}
                              className="block w-full text-left px-4 py-2.5 text-body-medium text-text-primary hover:bg-surface-secondary transition-colors duration-150"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => {
                                onExport("csv")
                                closeAllDropdowns()
                              }}
                              className="block w-full text-left px-4 py-2.5 text-body-medium text-text-primary hover:bg-surface-secondary transition-colors duration-150"
                            >
                              CSV
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for closing dropdowns */}
      {showDropdown && <div className="fixed inset-0 z-30" onClick={closeAllDropdowns} />}
    </>
  )
}
