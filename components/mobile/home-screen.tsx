"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, Share2, Play, Pause, VolumeX, Volume2 } from "lucide-react"
import Image from "next/image"

interface VideoPost {
  id: string
  username: string
  userAvatar: string
  description: string
  videoUrl: string
  likes: number
  comments: number
  isLiked: boolean
  isSaved: boolean
  category: "fitness" | "nutrition" | "motivation"
}

export function HomeScreen() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [savedVideos, setSavedVideos] = useState<string[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const videos: VideoPost[] = [
    {
      id: "1",
      username: "@fitness_coach",
      userAvatar: "/placeholder.svg?height=50&width=50",
      description: "Quick HIIT workout you can do anywhere! #fitness #workout #hiit",
      videoUrl: "/placeholder.svg?height=800&width=400",
      likes: 1245,
      comments: 89,
      isLiked: false,
      isSaved: false,
      category: "fitness",
    },
    {
      id: "2",
      username: "@nutrition_expert",
      userAvatar: "/placeholder.svg?height=50&width=50",
      description: "Healthy meal prep for the week! #nutrition #mealprep #healthy",
      videoUrl: "/placeholder.svg?height=800&width=400",
      likes: 982,
      comments: 56,
      isLiked: false,
      isSaved: false,
      category: "nutrition",
    },
    {
      id: "3",
      username: "@mindset_coach",
      userAvatar: "/placeholder.svg?height=50&width=50",
      description: "Stay motivated with these simple tips! #motivation #mindset #goals",
      videoUrl: "/placeholder.svg?height=800&width=400",
      likes: 1567,
      comments: 124,
      isLiked: false,
      isSaved: false,
      category: "motivation",
    },
  ]

  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    } else {
      setCurrentVideoIndex(0)
    }
  }

  const togglePlay = () => {
    const video = videoRefs.current[currentVideoIndex]
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    const video = videoRefs.current[currentVideoIndex]
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleLike = (videoId: string) => {
    // In a real app, this would call an API to like the video
    console.log(`Liked video ${videoId}`)
  }

  const handleSaveVideo = (videoId: string) => {
    if (savedVideos.includes(videoId)) {
      setSavedVideos(savedVideos.filter((id) => id !== videoId))
    } else {
      setSavedVideos([...savedVideos, videoId])
    }
  }

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    } else if (e.deltaY < 0 && currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1)
    }
  }

  return (
    <div className="h-full" onWheel={handleScroll}>
      <div className="relative h-full">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
              index === currentVideoIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <div className="relative h-full bg-black">
              {/* Video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={video.videoUrl}
                  className="h-full w-full object-cover"
                  loop
                  autoPlay={index === currentVideoIndex}
                  muted={isMuted}
                  playsInline
                  onEnded={handleVideoEnd}
                  poster="/placeholder.svg?height=800&width=400"
                />
              </div>

              {/* Overlay for controls */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top bar with category */}
                <div className="flex justify-center">
                  <div className="bg-black/50 px-4 py-1 rounded-full">
                    <span className="text-white text-sm font-medium capitalize">{video.category}</span>
                  </div>
                </div>

                {/* Bottom content */}
                <div className="flex justify-between items-end">
                  {/* Video info */}
                  <div className="flex-1 pr-4">
                    <div className="flex items-center mb-2">
                      <Image
                        src={video.userAvatar || "/placeholder.svg"}
                        alt={video.username}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-white"
                      />
                      <span className="ml-2 text-white font-medium">{video.username}</span>
                    </div>
                    <p className="text-white text-sm mb-4">{video.description}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col items-center space-y-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white"
                      onClick={() => handleLike(video.id)}
                    >
                      <Heart className={`h-6 w-6 ${video.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      <span className="text-xs mt-1">{video.likes}</span>
                    </Button>

                    <Button variant="ghost" size="icon" className="rounded-full bg-black/50 text-white">
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-xs mt-1">{video.comments}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-black/50 text-white"
                      onClick={() => handleSaveVideo(video.id)}
                    >
                      <Bookmark
                        className={`h-6 w-6 ${savedVideos.includes(video.id) ? "fill-[#FF7939] text-[#FF7939]" : ""}`}
                      />
                      <span className="text-xs mt-1">Save</span>
                    </Button>

                    <Button variant="ghost" size="icon" className="rounded-full bg-black/50 text-white">
                      <Share2 className="h-6 w-6" />
                      <span className="text-xs mt-1">Share</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Center play/pause button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-black/30 text-white/70 opacity-0 hover:opacity-100 transition-opacity"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12" />}
                </Button>
              </div>

              {/* Mute/unmute button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 rounded-full bg-black/50 text-white"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        ))}

        {/* Pagination dots */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentVideoIndex ? "bg-[#FF7939]" : "bg-white/50"}`}
              onClick={() => setCurrentVideoIndex(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
