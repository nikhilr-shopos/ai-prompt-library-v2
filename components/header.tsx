"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/auth/user-menu"

interface HeaderProps {
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
  onClearSelections: () => void
  onExport: (format: "json" | "csv") => void
  onCopySelected: (cardIds: string[]) => void
  onAddNew: () => void
  clients: string[]
  models: string[]
}

interface FilterDropdownProps {
  label: string
  value: string
  options: string[]
  onSelect: (value: string) => void
  isOpen: boolean
  onToggle: () => void
}

const FilterDropdown = ({ label, value, options, onSelect, isOpen, onToggle }: FilterDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Parent will handle closing
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
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn(
          "h-10 px-4 text-body-md font-medium justify-between min-w-[140px]",
          "hover:bg-muted/50 transition-colors duration-200",
          isOpen && "bg-muted/50",
        )}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-popover border rounded-lg shadow-lg z-50 animate-slide-down">
          <div className="py-2">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className={cn(
                  "block w-full text-left px-4 py-2.5 text-body-md transition-colors duration-150",
                  value === option ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50",
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

export const Header = ({
  totalCards,
  displayedCards,
  selectedCards,
  filters,
  onFiltersChange,
  onSelectAll,
  onClearSelections,
  onExport,
  onCopySelected,
  onAddNew,
  clients,
  models,
}: HeaderProps) => {
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  const handleDropdownToggle = (dropdownName: string) => {
    setShowDropdown(showDropdown === dropdownName ? null : dropdownName)
  }

  const closeAllDropdowns = () => {
    setShowDropdown(null)
  }

  return (
    <>
      <header className="bg-background border-b sticky top-0 z-40">
        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <h1 className="text-display-md text-foreground">AI Prompt Library</h1>
              <p className="text-body-xl text-muted-foreground max-w-2xl">
                Organize and manage your AI-generated content with powerful filtering and organization tools
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-body-lg text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="font-semibold text-foreground">{displayedCards}</span>
                <span>of</span>
                <span className="font-semibold text-foreground">{totalCards}</span>
                <span>items</span>
              </div>

              <Button onClick={onAddNew} size="lg" className="px-6">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-muted/20 border-t">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Label */}
              <div className="flex items-center gap-2 text-label-lg text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-3">
                <FilterDropdown
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

                <FilterDropdown
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

                <FilterDropdown
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
                  className="h-10"
                >
                  ⭐ {filters.favoritesOnly ? "Favorites Only" : "Show All"}
                </Button>
              </div>

              <div className="flex-1" />

              {/* Selection Controls */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 text-body-md text-foreground cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedCards.length === displayedCards && displayedCards > 0}
                      onChange={onSelectAll}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20 transition-colors duration-200"
                    />
                    {selectedCards.length > 0 && selectedCards.length < displayedCards && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 bg-primary rounded-sm"></div>
                      </div>
                    )}
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors duration-200">
                    {selectedCards.length === displayedCards && displayedCards > 0
                      ? "Deselect All"
                      : selectedCards.length > 0
                        ? `Select All (${selectedCards.length} selected)`
                        : "Select All"}
                  </span>
                </label>

                {selectedCards.length > 0 && (
                  <div className="flex items-center gap-3 animate-slide-up">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary">
                        {selectedCards.length} of {displayedCards} selected
                      </span>
                    </div>

                    <div className="relative">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDropdownToggle("export")}
                        className="h-10 bg-primary hover:bg-primary/90 transition-all duration-200"
                      >
                        Export Selection
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>

                      {showDropdown === "export" && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-popover border rounded-lg shadow-lg z-50 animate-slide-down">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                onExport("json")
                                closeAllDropdowns()
                              }}
                              className="block w-full text-left px-4 py-2.5 text-body-md text-foreground hover:bg-muted/50 transition-colors duration-150"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => {
                                onExport("csv")
                                closeAllDropdowns()
                              }}
                              className="block w-full text-left px-4 py-2.5 text-body-md text-foreground hover:bg-muted/50 transition-colors duration-150"
                            >
                              CSV
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clear Selection Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onClearSelections}
                      className="h-10 text-muted-foreground hover:text-foreground bg-transparent"
                    >
                      Clear
                    </Button>
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