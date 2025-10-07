"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function ProductsScreen() {
  const [activeCategory, setActiveCategory] = useState("all")

  const products = [
    {
      id: 1,
      name: "Fitness Essentials Program",
      image: "/placeholder.svg?height=120&width=200",
      category: "program",
      price: 49.99,
      rating: 4.8,
      featured: true,
    },
    {
      id: 2,
      name: "Premium Resistance Bands",
      image: "/placeholder.svg?height=120&width=200",
      category: "equipment",
      price: 29.99,
      rating: 4.5,
      featured: false,
    },
    {
      id: 3,
      name: "Nutrition Masterclass",
      image: "/placeholder.svg?height=120&width=200",
      category: "course",
      price: 79.99,
      rating: 4.9,
      featured: true,
    },
    {
      id: 4,
      name: "Advanced Strength Training",
      image: "/placeholder.svg?height=120&width=200",
      category: "program",
      price: 59.99,
      rating: 4.7,
      featured: false,
    },
    {
      id: 5,
      name: "Yoga Essentials Bundle",
      image: "/placeholder.svg?height=120&width=200",
      category: "equipment",
      price: 39.99,
      rating: 4.6,
      featured: false,
    },
  ]

  const filteredProducts =
    activeCategory === "all" ? products : products.filter((product) => product.category === activeCategory)

  const featuredProducts = products.filter((product) => product.featured)

  return (
    <div className="p-4 bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-white">OMNIA Store</h1>

      {/* Featured Products */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-white">Featured</h2>
        <div className="overflow-x-auto flex space-x-4 pb-2">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="flex-shrink-0 w-64 bg-zinc-900 border-zinc-800 overflow-hidden">
              <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <h3 className="font-medium text-white">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-purple-400 font-bold">${product.price}</span>
                  <Badge variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700">
                    Featured
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Product Categories */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all" onClick={() => setActiveCategory("all")}>
            All
          </TabsTrigger>
          <TabsTrigger value="program" onClick={() => setActiveCategory("program")}>
            Programs
          </TabsTrigger>
          <TabsTrigger value="course" onClick={() => setActiveCategory("course")}>
            Courses
          </TabsTrigger>
          <TabsTrigger value="equipment" onClick={() => setActiveCategory("equipment")}>
            Equipment
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-24 object-cover" />
            <div className="p-3">
              <h3 className="font-medium text-white text-sm">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-purple-400 font-bold">${product.price}</span>
                <div className="text-yellow-400 text-xs">★ {product.rating}</div>
              </div>
              <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
