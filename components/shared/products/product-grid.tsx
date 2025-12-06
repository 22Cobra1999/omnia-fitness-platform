"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { motion } from "framer-motion"
import { Star, ShoppingCart, Flame } from "lucide-react"

interface Product {
  id: number
  title: string
  image: string
  price: number
  rating: number
  category: string
}

const products: Product[] = [
  {
    id: 1,
    title: "Resistance Bands Set",
    image: "/placeholder.svg?height=200&width=200",
    price: 29.99,
    rating: 4.5,
    category: "fitness",
  },
  {
    id: 2,
    title: "Foam Roller",
    image: "/placeholder.svg?height=200&width=200",
    price: 19.99,
    rating: 4.2,
    category: "fitness",
  },
  {
    id: 3,
    title: "Protein Powder (2lbs)",
    image: "/placeholder.svg?height=200&width=200",
    price: 39.99,
    rating: 4.7,
    category: "fitness",
  },
  {
    id: 4,
    title: "Nutrition Fundamentals",
    image: "/placeholder.svg?height=200&width=200",
    price: 79.99,
    rating: 4.8,
    category: "courses",
  },
  {
    id: 5,
    title: "HIIT Training Mastery",
    image: "/placeholder.svg?height=200&width=200",
    price: 99.99,
    rating: 4.6,
    category: "courses",
  },
  {
    id: 6,
    title: "Mindfulness for Athletes",
    image: "/placeholder.svg?height=200&width=200",
    price: 59.99,
    rating: 4.4,
    category: "courses",
  },
]

export function ProductGrid({ category }: { category: "fitness" | "courses" }) {
  const filteredProducts = products.filter((product) => product.category === category)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <motion.div key={product.id} whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
          <Card className="bg-[#1E1E1E] border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {product.image && product.image.trim() !== '' && !product.image.includes('placeholder') ? (
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  // Logo de Omnia cuando no hay imagen
                  <div className="w-full h-48 bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
                    <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                      <Flame className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-[#FF7939]">
                  {category === "courses" ? "Course" : "Product"}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{product.title}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-[#FF7939]">${product.price.toFixed(2)}</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-300">{product.rating}</span>
                  </div>
                </div>
                <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {category === "courses" ? "Enroll Now" : "Add to Cart"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
