"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useState } from "react"

interface CategoryMenuProps {
  categories: string[]
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0])

  return (
    <div className="mb-8 bg-[#1E1E1E] rounded-lg p-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeCategory === category
                  ? "bg-[#FF7939] text-white hover:bg-[#E66829]"
                  : "text-white hover:bg-[#2A2A2A]"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
