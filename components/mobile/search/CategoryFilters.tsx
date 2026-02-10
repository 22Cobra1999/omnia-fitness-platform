"use client"

import React from 'react'
import { Dumbbell, ChefHat, LayoutGrid } from 'lucide-react'

interface CategoryFiltersProps {
    selectedCategory: string
    onCategoryChange: (category: string) => void
}

export function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
    const categories = [
        { id: 'all', label: 'Todo', icon: LayoutGrid },
        { id: 'fitness', label: 'Fitness', icon: Dumbbell },
        { id: 'nutricion', label: 'Nutrición', icon: ChefHat },
    ]

    return (
        <div className="flex gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
            {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.id
                return (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 ${isActive
                                ? 'bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20'
                                : 'bg-[#1A1C1F] text-gray-400 hover:bg-white/5 border border-white/5'
                            }`}
                    >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span className="font-medium">{cat.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
