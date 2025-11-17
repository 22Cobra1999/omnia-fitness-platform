"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface Video {
  id: string
  title: string
  thumbnail: string
  duration: string
  description: string
  videoUrl: string // Add video URL for playing
}

interface VideoGalleryProps {
  videos: Video[]
}

export function VideoGallery({ videos }: VideoGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center bg-orange-500">
      {videos.map((video, index) => {
        const isHovered = hoveredIndex === index
        const isClicked = clickedIndex === index

        return (
          <motion.div
            key={video.id}
            className={`absolute top-0 left-0 w-[240px] h-[160px] rounded-lg overflow-hidden ${
              isHovered || isClicked ? "z-50" : ""
            }`}
            initial={{ scale: 1, opacity: 1 }}
            animate={
              isClicked
                ? { width: "50%", height: "100%", left: "25%", top: 0 }
                : isHovered
                  ? { scale: 1.2, opacity: 1 }
                  : { scale: 1, opacity: 0.9 }
            }
            transition={{ duration: 0.3 }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => setClickedIndex(index)}
          >
            {isClicked ? (
              <div className="relative w-full h-full flex">
                {/* Video Player */}
                <div className="w-1/2 h-full">
                  <video src={video.videoUrl} className="w-full h-full" autoPlay muted loop />
                </div>

                {/* Recipe List */}
                <div className="w-1/2 h-full bg-white p-4 overflow-auto">
                  <h3 className="text-lg font-bold">{video.title}</h3>
                  <p className="text-sm text-gray-600">{video.description}</p>
                  {/* Add recipe details here */}
                </div>
              </div>
            ) : (
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
