"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Heart, MessageSquare, Share2 } from "lucide-react"
import { Navigation } from "@/components/layout/navigation"

interface Post {
  id: number
  user: {
    id: number
    name: string
    avatar?: string
  }
  content: string
  image?: string
  likes: number
  comments: number
  createdAt: string
  liked?: boolean
}

export default function CommunityPage() {
  const { isAuthenticated, showAuthPopup } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    // Fetch community posts
    // This would normally be an API call
    setPosts([
      {
        id: 1,
        user: {
          id: 1,
          name: "Sarah Johnson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        content: "Just completed my first 5K run! So proud of my progress with OMNIA coaching 🏃‍♀️",
        image: "/placeholder.svg?height=300&width=500",
        likes: 24,
        comments: 5,
        createdAt: "2 hours ago",
      },
      {
        id: 2,
        user: {
          id: 2,
          name: "Mike Chen",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        content: "New personal best on bench press today! 225lbs x 5 reps. Thanks to my coach for the programming!",
        likes: 18,
        comments: 3,
        createdAt: "5 hours ago",
      },
      {
        id: 3,
        user: {
          id: 3,
          name: "Emma Wilson",
          avatar: "/placeholder.svg?height=40&width=40",
        },
        content:
          "Meal prep Sunday! Prepped all my meals for the week following my nutrition plan. Feeling organized and ready to crush my goals!",
        image: "/placeholder.svg?height=300&width=500",
        likes: 32,
        comments: 7,
        createdAt: "1 day ago",
      },
    ])
  }, [])

  const handleLike = (postId: number) => {
    if (!isAuthenticated) {
      showAuthPopup("login")
      return
    }

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
            liked: !post.liked,
          }
        }
        return post
      }),
    )
  }

  const handleComment = (postId: number) => {
    if (!isAuthenticated) {
      showAuthPopup("login")
      return
    }

    // Open comment form or modal
    console.log("Comment on post", postId)
  }

  const handleShare = (postId: number) => {
    if (!isAuthenticated) {
      showAuthPopup("login")
      return
    }

    // Open share options
    console.log("Share post", postId)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pl-16">
      <Navigation />

      <main className="container max-w-2xl py-8">
        <h1 className="text-3xl font-bold mb-6">Community</h1>

        {isAuthenticated && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Share your fitness journey..."
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Add Photo</Button>
              <Button>Post</Button>
            </CardFooter>
          </Card>
        )}

        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarImage src={post.user.avatar || "/placeholder.svg"} alt={post.user.name} />
                  <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{post.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{post.createdAt}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content}</p>
                {post.image && (
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt="Post content"
                    className="rounded-md w-full object-cover max-h-[300px]"
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className={post.liked ? "text-red-500" : ""}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className="h-5 w-5 mr-1" />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleComment(post.id)}>
                  <MessageSquare className="h-5 w-5 mr-1" />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleShare(post.id)}>
                  <Share2 className="h-5 w-5 mr-1" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
