"use client"

import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchHeaderProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    showSuggestions: boolean
    suggestions: string[]
    onSuggestionClick: (suggestion: string) => void
}

export function SearchHeader({
    searchTerm,
    onSearchChange,
    showSuggestions,
    suggestions,
    onSuggestionClick
}: SearchHeaderProps) {
    return (
        <div className="relative mb-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#FF7939] transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Busca coaches, rutinas o dietas..."
                    className="w-full bg-[#1A1C1F] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF7939]/20 focus:border-[#FF7939]/30 transition-all shadow-xl"
                />
                {searchTerm && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1C1F] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden divide-y divide-white/5 backdrop-blur-xl bg-opacity-95">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick(suggestion)}
                            className="w-full px-5 py-4 text-left text-gray-300 hover:bg-[#FF7939]/10 hover:text-white transition-all flex items-center gap-3"
                        >
                            <Search className="h-3 w-3 text-[#FF7939]" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
