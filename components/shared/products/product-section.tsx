"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Flame } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Product {
  id: number
  title: string
  image: string
  price: number
  rating: number
  discount?: number
  originalPrice?: number
  freeShipping?: boolean
}

// Mock data generator function
const generateMockProducts = (category: string, type: "fitness" | "courses"): Product[] => {
  const products: Product[] = []
  const count = 10

  for (let i = 1; i <= count; i++) {
    const hasDiscount = Math.random() > 0.5
    const price =
      type === "courses" ? Math.floor(Math.random() * (300 - 50) + 50) : Math.floor(Math.random() * (1000 - 20) + 20)
    const discount = hasDiscount ? Math.floor(Math.random() * 30) + 10 : undefined
    const originalPrice = discount ? price / (1 - discount / 100) : undefined

    products.push({
      id: i,
      title: type === "courses" ? `${category} Course ${i}` : `${category} Product ${i}`,
      image: "/placeholder.svg?height=200&width=200",
      price,
      rating: 4 + Math.random(),
      discount,
      originalPrice,
      freeShipping: Math.random() > 0.7,
    })
  }

  return products
}

interface ProductSectionProps {
  title: string
  category: string
  type: "fitness" | "courses"
}

export function ProductSection({ title, category, type }: ProductSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const products = generateMockProducts(category, type)

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById(`scroll-container-${category}`)
    if (container) {
      const scrollAmount = direction === "left" ? -400 : 400
      container.scrollBy({ left: scrollAmount, behavior: "smooth" })
      setScrollPosition(container.scrollLeft + scrollAmount)
    }
  }

  return (
    <section className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#2A2A2A] rounded-full"
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-[#2A2A2A] rounded-full"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full" id={`scroll-container-${category}`}>
        <div className="flex space-x-4 pb-4">
          <AnimatePresence>
            {products.map((product) => (
              <motion.div
                key={product.id}
                className="flex-none w-[280px]"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-[#1E1E1E] border-none overflow-hidden h-full">
                  <CardContent className="p-0">
                    <div className="relative">
                      {product.image && product.image.trim() !== '' && !product.image.includes('placeholder') ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={280}
                          height={200}
                          className="w-full h-[200px] object-cover"
                        />
                      ) : (
                        // Logo de Omnia cuando no hay imagen
                        <div className="w-full h-[200px] bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
                          <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                            <Flame className="w-8 h-8 text-black" />
                          </div>
                          <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
                        </div>
                      )}
                      {product.discount && (
                        <Badge className="absolute top-2 right-2 bg-[#FF7939]">{product.discount}% OFF</Badge>
                      )}
                      {product.freeShipping && (
                        <Badge className="absolute top-2 left-2 bg-green-500">Free Shipping</Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2 overflow-hidden" 
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.2em',
                            height: '2.4em'
                          }}>{product.title}</h3>
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-300">{product.rating.toFixed(1)}</span>
                      </div>
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-[#FF7939]">${product.price.toFixed(2)}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.discount && (
                          <div className="text-sm text-gray-400">
                            Save ${(product.originalPrice! - product.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {type === "courses" ? "Enroll Now" : "Add to Cart"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}
