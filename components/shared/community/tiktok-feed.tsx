"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Bookmark, Share2, MoreVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const feedItems = [
  {
    id: 1,
    user: {
      name: "FitnessGuru",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
    },
    video: "/placeholder.svg?height=800&width=400",
    caption: "Quick 5-minute ab workout you can do anywhere! 💪 #fitness #workout",
    likes: "120.5K",
    comments: "1.2K",
    shares: "850",
  },
  {
    id: 2,
    user: {
      name: "HealthyEating",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
    },
    video: "/placeholder.svg?height=800&width=400",
    caption: "Healthy meal prep ideas for the week 🥗 #nutrition #mealprep",
    likes: "95.2K",
    comments: "932",
    shares: "645",
  },
  // Add more items as needed
]

export function TikTokFeed() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollPosition = containerRef.current.scrollTop
      const itemHeight = window.innerHeight
      const newIndex = Math.round(scrollPosition / itemHeight)
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory"
      onScroll={handleScroll}
    >
      <AnimatePresence>
        {feedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100vh-4rem)] snap-start"
          >
            <div className="relative h-full bg-black">
              {/* Video/Image Container */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20">
                <img src={item.video} alt="Post content" className="w-full h-full object-cover" />
              </div>

              {/* Overlay Content */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src={item.user.avatar} />
                      <AvatarFallback>{item.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-white font-semibold">{item.user.name}</h3>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreVertical className="h-6 w-6" />
                  </Button>
                </div>

                {/* Bottom Section */}
                <div className="space-y-4">
                  <p className="text-white text-sm max-w-[80%]">{item.caption}</p>

                  {/* Interaction Buttons */}
                  <div className="flex flex-col items-center gap-4 absolute right-4 bottom-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <Heart className="h-6 w-6" />
                      <span className="text-xs mt-1">{item.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-xs mt-1">{item.comments}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <Bookmark className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <Share2 className="h-6 w-6" />
                      <span className="text-xs mt-1">{item.shares}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
