"use client"

import { useState } from "react"
import { Heart, MessageCircle, Bookmark, Share2, Play, MoreHorizontal } from "lucide-react"
import Image from "next/image"

interface Post {
  id: string
  user: {
    id: string
    name: string
    username: string
    avatar: string
    isCoach: boolean
  }
  content: string
  image?: string
  video?: string
  thumbnail?: string
  likes: number
  comments: number
  timestamp: string
  type: "regular" | "coach" | "video"
}

export function CommunityScreen() {
  const [activeTab, setActiveTab] = useState("foryou")
  const [savedPosts, setSavedPosts] = useState<string[]>([])

  const mockUsers = [
    {
      id: "1",
      name: "Jane Doe",
      username: "janedoe",
      avatar: "/placeholder.svg?height=50&width=50",
      isCoach: false,
    },
    {
      id: "2",
      name: "Fitness Coach",
      username: "fitnesscoach",
      avatar: "/placeholder.svg?height=50&width=50",
      isCoach: true,
    },
    {
      id: "3",
      name: "Nutrition Expert",
      username: "nutritionexpert",
      avatar: "/placeholder.svg?height=50&width=50",
      isCoach: true,
    },
  ]

  const posts: Post[] = [
    {
      id: "1",
      user: mockUsers[0],
      content: "Just finished an amazing workout! 💪 Feeling energized and ready to tackle the day. #FitnessGoals",
      image: "/placeholder.svg?height=400&width=600",
      likes: 120,
      comments: 15,
      timestamp: "2h ago",
      type: "regular",
    },
    {
      id: "2",
      user: mockUsers[1],
      content: "Build big biceps with this exercise 💪 Watch now to learn the secret to massive arms!",
      video: "/placeholder.mp4",
      thumbnail: "/placeholder.svg?height=400&width=600",
      likes: 180,
      comments: 25,
      timestamp: "8h ago",
      type: "video",
    },
    {
      id: "3",
      user: mockUsers[2],
      content: "Meal prep tips for a balanced diet 🥑🍗🥦 Learn how to plan your meals for optimal nutrition!",
      video: "/placeholder.mp4",
      thumbnail: "/placeholder.svg?height=400&width=600",
      likes: 250,
      comments: 40,
      timestamp: "3h ago",
      type: "video",
    },
  ]

  const handleSavePost = (postId: string) => {
    if (savedPosts.includes(postId)) {
      setSavedPosts(savedPosts.filter((id) => id !== postId))
    } else {
      setSavedPosts([...savedPosts, postId])
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Community</h1>
        </div>

        {/* Tabs simples */}
        <div className="w-full mb-4">
          <div className="grid grid-cols-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("foryou")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "foryou"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "following"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="space-y-4">
          {activeTab === "foryou" && (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isSaved={savedPosts.includes(post.id)}
                  onSave={() => handleSavePost(post.id)}
                />
              ))}
            </>
          )}

          {activeTab === "following" && (
            <>
              {posts
                .filter((post) => post.user.isCoach)
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isSaved={savedPosts.includes(post.id)}
                    onSave={() => handleSavePost(post.id)}
                  />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface PostCardProps {
  post: Post
  isSaved: boolean
  onSave: () => void
}

function PostCard({ post, isSaved, onSave }: PostCardProps) {
  return (
    <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg p-4">
      <div className="flex items-start space-x-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-white font-semibold">{post.user.name[0]}</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold text-white">{post.user.name}</p>
              <p className="text-xs text-gray-400">
                @{post.user.username} • {post.timestamp}
              </p>
            </div>
            <button className="text-gray-400 hover:text-white p-1">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

        <p className="text-white mb-3">{post.content}</p>

        {post.image && (
          <div className="rounded-lg overflow-hidden mb-3">
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post image"
              width={600}
              height={400}
              className="w-full"
              priority={true}
            />
          </div>
        )}

        {post.type === "video" && post.thumbnail && (
          <div className="relative rounded-lg overflow-hidden mb-3">
            <Image
              src={post.thumbnail || "/placeholder.svg"}
              alt="Video thumbnail"
              width={600}
              height={400}
              className="w-full"
              priority={true}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <button className="rounded-full bg-white/20 hover:bg-white/30 text-white p-3 transition-colors">
                <Play className="h-8 w-8" />
              </button>
            </div>
          </div>
        )}

      <div className="flex justify-between items-center">
        <button className="flex items-center text-gray-400 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors">
          <Heart className="h-5 w-5 mr-1" />
          {post.likes}
        </button>
        <button className="flex items-center text-gray-400 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors">
          <MessageCircle className="h-5 w-5 mr-1" />
          {post.comments}
        </button>
        <button 
          onClick={onSave}
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isSaved 
              ? "text-[#FF7939] hover:bg-orange-900/20" 
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Bookmark className={`h-5 w-5 mr-1 ${isSaved ? "fill-[#FF7939]" : ""}`} />
          Save
        </button>
        <button className="flex items-center text-gray-400 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors">
          <Share2 className="h-5 w-5 mr-1" />
          Share
        </button>
      </div>
    </div>
  )
}
