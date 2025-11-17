"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { motion } from "framer-motion"

interface FeaturedItem {
  id: number
  title: string
  image: string
  price: number
  discount?: number
}

const fitnessItems: FeaturedItem[] = [
  { id: 1, title: "Premium Yoga Mat", image: "/placeholder.svg?height=200&width=200", price: 49.99, discount: 20 },
  { id: 2, title: "Smart Fitness Watch", image: "/placeholder.svg?height=200&width=200", price: 199.99 },
  {
    id: 3,
    title: "Adjustable Dumbbell Set",
    image: "/placeholder.svg?height=200&width=200",
    price: 299.99,
    discount: 15,
  },
]

const courseItems: FeaturedItem[] = [
  { id: 1, title: "Nutrition Mastery", image: "/placeholder.svg?height=200&width=200", price: 129.99, discount: 30 },
  { id: 2, title: "Advanced Personal Training", image: "/placeholder.svg?height=200&width=200", price: 199.99 },
  {
    id: 3,
    title: "Yoga Instructor Certification",
    image: "/placeholder.svg?height=200&width=200",
    price: 249.99,
    discount: 10,
  },
]

export function FeaturedItems({ type = "fitness" }: { type?: "fitness" | "courses" }) {
  const items = type === "courses" ? courseItems : fitnessItems

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Featured {type === "courses" ? "Courses" : "Products"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <motion.div key={item.id} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Card className="bg-[#1E1E1E] border-none overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  {item.discount && <Badge className="absolute top-2 right-2 bg-[#FF7939]">{item.discount}% OFF</Badge>}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-[#FF7939]">${item.price.toFixed(2)}</span>
                    {item.discount && (
                      <span className="text-sm text-gray-400 line-through">
                        ${(item.price / (1 - item.discount / 100)).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
