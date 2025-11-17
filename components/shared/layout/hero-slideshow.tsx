"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from '@/lib/utils/utils'

interface Slide {
  id: number
  title: string
  subtitle: string
  image: string
  cta: {
    text: string
    link: string
  }
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Transform Your Fitness Journey",
    subtitle: "Get 30% off on all premium equipment",
    image: "/placeholder.svg?height=600&width=1600",
    cta: {
      text: "Shop Now",
      link: "/store",
    },
  },
  {
    id: 2,
    title: "New Course: Advanced Nutrition",
    subtitle: "Master the science of nutrition with our expert-led program",
    image: "/placeholder.svg?height=600&width=1600",
    cta: {
      text: "Enroll Now",
      link: "/courses",
    },
  },
  {
    id: 3,
    title: "Join Our Coach Community",
    subtitle: "Start your journey as a certified fitness professional",
    image: "/placeholder.svg?height=600&width=1600",
    cta: {
      text: "Learn More",
      link: "/coaches",
    },
  },
]

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 3000) // Change this from 5000 to 3000

    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const handlePrevSlide = () => {
    setIsAutoPlaying(false)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNextSlide = () => {
    setIsAutoPlaying(false)
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentSlide(index)
  }

  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {slides.map(
          (slide, index) =>
            index === currentSlide && (
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.7 }}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                </div>

                {/* Content */}
                <motion.div
                  className="relative h-full flex items-center px-8 md:px-16 lg:px-24"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{slide.title}</h1>
                    <p className="text-xl md:text-2xl text-gray-200 mb-8">{slide.subtitle}</p>
                    <Button
                      size="lg"
                      className="bg-[#FF7939] hover:bg-[#E66829] text-white text-lg px-8 py-6 rounded-full"
                    >
                      {slide.cta.text}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            ),
        )}
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white"
          onClick={handlePrevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white"
          onClick={handleNextSlide}
          aria-label="Next slide"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentSlide ? "bg-[#FF7939] w-12" : "bg-white/50 hover:bg-white/75",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
