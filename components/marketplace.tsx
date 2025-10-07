"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const categories = [
  {
    title: "Sports Products",
    items: [
      { name: "Premium Yoga Mat", price: "$49.99", image: "/placeholder.svg?height=200&width=200" },
      { name: "Smart Fitness Watch", price: "$199.99", image: "/placeholder.svg?height=200&width=200" },
    ],
  },
  {
    title: "Supplements & Nutrition",
    items: [
      { name: "Whey Protein Powder", price: "$29.99", image: "/placeholder.svg?height=200&width=200" },
      { name: "Healthy Meal Prep Kit", price: "$79.99", image: "/placeholder.svg?height=200&width=200" },
    ],
  },
  {
    title: "Digital Services",
    items: [
      { name: "Personal Training Plan", price: "$99.99/mo", image: "/placeholder.svg?height=200&width=200" },
      { name: "Nutrition Consultation", price: "$59.99", image: "/placeholder.svg?height=200&width=200" },
    ],
  },
  {
    title: "Experiences",
    items: [
      { name: "Virtual HIIT Class", price: "$14.99", image: "/placeholder.svg?height=200&width=200" },
      { name: "Wellness Retreat", price: "$499.99", image: "/placeholder.svg?height=200&width=200" },
    ],
  },
]

export function Marketplace() {
  return (
    <div className="bg-[#121212] min-h-screen pt-32 pb-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">OMNIA Marketplace</h2>
        <div className="grid gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-[#FF7939]">{category.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.items.map((item, itemIndex) => (
                  <Card key={itemIndex} className="bg-[#1E1E1E] border-none shadow-custom-lg overflow-hidden">
                    <CardHeader className="p-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-2 text-white">{item.name}</CardTitle>
                      <p className="text-[#FF7939] font-semibold mb-4">{item.price}</p>
                      <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">Add to Cart</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold mb-4 text-white">Are you a coach looking to expand your skills?</h3>
          <p className="text-gray-300 mb-6">Check out our Coach Academy for professional development courses.</p>
          <Link href="/store/courses">
            <Button className="bg-[#FF7939] hover:bg-[#E66829] text-white px-8 py-3 text-lg">
              Explore Coach Academy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
