"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Play, BookmarkPlus, PlusCircle, Folder, ShoppingCart } from "lucide-react"
import Image from "next/image"
// import { CoachPublication } from "@/components/coach-publication"
import { TopClientContribution } from '@/components/client/dashboard/top-client-contribution'
import { OmniaPublication } from '@/components/shared/community/omnia-publication'
import { LiveSession } from '@/components/shared/community/live-session'
import { Challenge } from '@/components/shared/community/challenge'
import { QASection } from '@/components/shared/community/qa-section'
import { SuccessStory } from '@/components/shared/community/success-story'
import { PostInteraction } from '@/components/shared/community/post-interaction'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  username: string
  avatar: string
  isCoach: boolean
  isTopClient: boolean
  coachType?: "gym" | "fitness" | "nutrition"
}

interface Post {
  id: string
  user: User
  content: string
  image?: string
  video?: string
  thumbnail?: string
  likes: number
  comments: number
  reposts: number
  timestamp: string
  type:
    | "regular"
    | "coach"
    | "topClient"
    | "omnia"
    | "liveSession"
    | "challenge"
    | "qa"
    | "successStory"
    | "coachVideo"
    | "nutritionCoach"
    | "product"
  product?: {
    name: string
    price: number
    brand: string
    isBrandOmnia: boolean
  }
}

interface FolderData {
  id: string
  title: string
  files: { id: string; title: string; thumbnail: string }[]
}

interface VideoFile {
  id: string
  title: string
  thumbnail: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    username: "janedoe",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: false,
    isTopClient: false,
  },
  {
    id: "2",
    name: "John Smith",
    username: "johnsmith",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: false,
    isTopClient: false,
  },
  {
    id: "3",
    name: "Fitness Coach",
    username: "fitnesscoach",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: true,
    isTopClient: false,
    coachType: "fitness",
  },
  {
    id: "4",
    name: "Gym Coach",
    username: "gymcoach",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: true,
    isTopClient: false,
    coachType: "gym",
  },
  {
    id: "5",
    name: "Top Client",
    username: "topclient",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: false,
    isTopClient: true,
  },
          { id: "6", name: "Omnia Official", username: "omnia", avatar: "/omnia-logo-original.svg", isCoach: false, isTopClient: false },
  {
    id: "7",
    name: "Nutrition Coach",
    username: "nutritioncoach",
    avatar: "/placeholder.svg?height=50&width=50",
    isCoach: true,
    isTopClient: false,
    coachType: "nutrition",
  },
]

const mockPosts: Post[] = [
  {
    id: "1",
    user: mockUsers[0],
    content: "Just finished an amazing workout! 💪 Feeling energized and ready to tackle the day. #FitnessGoals",
    image: "/placeholder.svg?height=400&width=600",
    likes: 120,
    comments: 15,
    reposts: 5,
    timestamp: "2h ago",
    type: "regular",
  },
  {
    id: "2",
    user: mockUsers[1],
    content:
      "New healthy recipe alert! 🥗 Check out this delicious and nutritious salad I made for lunch. #HealthyEating",
    likes: 85,
    comments: 10,
    reposts: 2,
    timestamp: "4h ago",
    type: "regular",
  },
  {
    id: "3",
    user: mockUsers[2],
    content: "Yoga training for beginners 🧘‍♀️ Unlock your flexibility and inner peace with these simple poses!",
    video: "/placeholder.mp4",
    thumbnail: "/placeholder.svg?height=400&width=600",
    likes: 200,
    comments: 30,
    reposts: 15,
    timestamp: "6h ago",
    type: "coachVideo",
  },
  {
    id: "4",
    user: mockUsers[3],
    content: "Build big biceps with this exercise 💪 Watch now to learn the secret to massive arms!",
    video: "/placeholder.mp4",
    thumbnail: "/placeholder.svg?height=400&width=600",
    likes: 180,
    comments: 25,
    reposts: 12,
    timestamp: "8h ago",
    type: "coachVideo",
  },
  {
    id: "5",
    user: mockUsers[4],
    content: "Here's my weekly progress update! Down 2 lbs and feeling stronger than ever. 💪 #FitnessJourney",
    likes: 150,
    comments: 25,
    reposts: 10,
    timestamp: "1d ago",
    type: "topClient",
  },
  {
    id: "6",
    user: mockUsers[5],
    content:
      "Improve your sleep quality by reading before bedtime. This helps relax your mind and prepare your body for rest. 📚💤 #WellnessTip",
    likes: 300,
    comments: 50,
    reposts: 30,
    timestamp: "1d ago",
    type: "omnia",
  },
  {
    id: "7",
    user: mockUsers[6],
    content: "Meal prep tips for a balanced diet 🥑🍗🥦 Learn how to plan your meals for optimal nutrition!",
    video: "/placeholder.mp4",
    thumbnail: "/placeholder.svg?height=400&width=600",
    likes: 250,
    comments: 40,
    reposts: 20,
    timestamp: "3h ago",
    type: "nutritionCoach",
  },
  {
    id: "8",
    user: mockUsers[5],
    content: "Elevate your workouts with our premium resistance bands. Perfect for home or gym use!",
    image: "/placeholder.svg?height=400&width=600",
    likes: 210,
    comments: 35,
    reposts: 18,
    timestamp: "5h ago",
    type: "product",
    product: {
      name: "Premium Resistance Bands Set",
      price: 29.99,
      brand: "OMNIA Fitness",
      isBrandOmnia: true,
    },
  },
  {
    id: "9",
    user: mockUsers[2],
    content: "This protein powder changed my recovery game! I recommend it to all my clients.",
    image: "/placeholder.svg?height=400&width=600",
    likes: 175,
    comments: 42,
    reposts: 15,
    timestamp: "7h ago",
    type: "product",
    product: {
      name: "Whey Protein Isolate",
      price: 39.99,
      brand: "NutriFit",
      isBrandOmnia: false,
    },
  },
  {
    id: "10",
    user: mockUsers[6],
    content: "The perfect meal prep containers for portion control and healthy eating on the go!",
    image: "/placeholder.svg?height=400&width=600",
    likes: 145,
    comments: 28,
    reposts: 12,
    timestamp: "9h ago",
    type: "product",
    product: {
      name: "Meal Prep Container Set",
      price: 24.99,
      brand: "MealMaster",
      isBrandOmnia: false,
    },
  },
]

export function Feed() {
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [newPost, setNewPost] = useState("")
  const [activeTab, setActiveTab] = useState("foryou")
  const [fitnessFolders, setFitnessFolders] = useState<FolderData[]>([])
  const [nutritionFolders, setNutritionFolders] = useState<FolderData[]>([])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedFolder, setSelectedFolder] = useState("")
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderCategory, setNewFolderCategory] = useState<"fitness" | "nutrition" | null>(null)

  useEffect(() => {
    const storedFitnessFolders = localStorage.getItem("fitnessFolders")
    const storedNutritionFolders = localStorage.getItem("nutritionFolders")

    if (storedFitnessFolders) {
      setFitnessFolders(JSON.parse(storedFitnessFolders))
    }

    if (storedNutritionFolders) {
      setNutritionFolders(JSON.parse(storedNutritionFolders))
    }
  }, [])

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        user: mockUsers[0],
        content: newPost,
        likes: 0,
        comments: 0,
        reposts: 0,
        timestamp: "Just now",
        type: "regular",
      }
      setPosts([post, ...posts])
      setNewPost("")
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "foryou") {
      return true
    } else if (activeTab === "following") {
      return post.user.isCoach || post.user.username === "omnia"
    }
    return false
  })

  const handleSaveVideo = (post: Post, folder?: string) => {
    console.log(`Saving video ${post.id} to folder: ${folder}`)
  }

  const handleFolderSelection = (value: string) => {
    setSelectedFolder(value)
    setNewFolderName("")
    setNewFolderCategory(null)
  }

  const saveVideoToFolder = () => {
    if (selectedPost && (selectedFolder === "new_folder" ? newFolderName.trim() : selectedFolder)) {
      const newVideo: VideoFile = {
        id: selectedPost.id,
        title: selectedPost.content,
        thumbnail: selectedPost.thumbnail || "/placeholder.svg",
      }

      let updatedFolders: FolderData[]
      let setFolders: React.Dispatch<React.SetStateAction<FolderData[]>>
      let localStorageKey: string

      if (selectedFolder === "new_folder" && newFolderCategory) {
        const newFolder: FolderData = {
          id: Date.now().toString(),
          title: newFolderName.trim(),
          files: [newVideo],
        }

        if (newFolderCategory === "nutrition") {
          updatedFolders = [...nutritionFolders, newFolder]
          setFolders = setNutritionFolders
          localStorageKey = "nutritionFolders"
        } else {
          updatedFolders = [...fitnessFolders, newFolder]
          setFolders = setFitnessFolders
          localStorageKey = "fitnessFolders"
        }
      } else {
        if (fitnessFolders.some((folder) => folder.id === selectedFolder)) {
          updatedFolders = fitnessFolders.map((folder) =>
            folder.id === selectedFolder ? { ...folder, files: [...folder.files, newVideo] } : folder,
          )
          setFolders = setFitnessFolders
          localStorageKey = "fitnessFolders"
        } else {
          updatedFolders = nutritionFolders.map((folder) =>
            folder.id === selectedFolder ? { ...folder, files: [...folder.files, newVideo] } : folder,
          )
          setFolders = setNutritionFolders
          localStorageKey = "nutritionFolders"
        }
      }

      setFolders(updatedFolders)
      localStorage.setItem(localStorageKey, JSON.stringify(updatedFolders))

      setIsSaveDialogOpen(false)
      setSelectedPost(null)
      setSelectedFolder("")
      setNewFolderName("")
      setNewFolderCategory(null)
      toast({
        title: "Video saved",
        description:
          selectedFolder === "new_folder"
            ? `The video has been saved to the new ${newFolderCategory} folder "${newFolderName}".`
            : "The video has been saved to the selected folder.",
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-[#1E1E1E] border-none mb-4"></Card>

      <Tabs defaultValue="foryou" className="flex flex-col items-center" onValueChange={(value) => {
  setActiveTab(value)
  // Scroll hacia arriba cuando se cambia de tab
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}}>
        <TabsList className="font-mitr border-b border-gray-700 mb-8 text-lg">
          <TabsTrigger
            value="foryou"
            className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#FF7939] data-[state=active]:rounded-md px-6 py-3 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF7939] focus:ring-opacity-50"
          >
            For You
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-[#FF7939] data-[state=active]:rounded-md px-6 py-3 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#FF7939] focus:ring-opacity-50"
          >
            Following
          </TabsTrigger>
        </TabsList>
        <TabsContent value="foryou">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostContent
                key={post.id}
                post={post}
                onSaveVideo={handleSaveVideo}
                setSelectedPost={setSelectedPost}
                setIsSaveDialogOpen={setIsSaveDialogOpen}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="following">
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostContent
                key={post.id}
                post={post}
                onSaveVideo={handleSaveVideo}
                setSelectedPost={setSelectedPost}
                setIsSaveDialogOpen={setIsSaveDialogOpen}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white max-h-[80vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 bg-[#2A2A2A]">
            <DialogTitle className="text-2xl font-bold text-[#FF7939]">Save Video</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <Tabs defaultValue="fitness" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="fitness" className="text-lg font-semibold">
                  Fitness
                </TabsTrigger>
                <TabsTrigger value="nutrition" className="text-lg font-semibold">
                  Nutrition
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fitness">
                <FolderList
                  folders={fitnessFolders}
                  onSelectFolder={handleFolderSelection}
                  onAddNewFolder={() => {
                    setSelectedFolder("new_folder")
                    setNewFolderCategory("fitness")
                    setNewFolderName("")
                  }}
                  selectedFolder={selectedFolder}
                />
              </TabsContent>
              <TabsContent value="nutrition">
                <FolderList
                  folders={nutritionFolders}
                  onSelectFolder={handleFolderSelection}
                  onAddNewFolder={() => {
                    setSelectedFolder("new_folder")
                    setNewFolderCategory("nutrition")
                    setNewFolderName("")
                  }}
                  selectedFolder={selectedFolder}
                />
              </TabsContent>
            </Tabs>
            {selectedFolder === "new_folder" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <label htmlFor="new-folder-name" className="block text-sm font-medium text-gray-300 mb-2">
                  New {newFolderCategory?.charAt(0).toUpperCase() + newFolderCategory?.slice(1)} Folder Name
                </label>
                <Input
                  id="new-folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={`Enter new ${newFolderCategory} folder name`}
                  className="w-full"
                />
              </motion.div>
            )}
          </div>
          <DialogFooter className="p-6 bg-[#2A2A2A]">
            <Button
              onClick={saveVideoToFolder}
              className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white transition-colors duration-200 text-lg py-6"
              disabled={selectedFolder === "new_folder" && !newFolderName.trim()}
            >
              Save Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostContent({
  post,
  onSaveVideo,
  setSelectedPost,
  setIsSaveDialogOpen,
}: {
  post: Post
  onSaveVideo: (post: Post, folder?: string) => void
  setSelectedPost: React.Dispatch<React.SetStateAction<Post | null>>
  setIsSaveDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  switch (post.type) {
    case "coach":
      return <OmniaPublication post={post} />
    case "topClient":
      return <TopClientContribution post={post} />
    case "omnia":
      return <OmniaPublication post={post} />
    case "liveSession":
      return <LiveSession />
    case "challenge":
      return <Challenge />
    case "qa":
      return <QASection />
    case "successStory":
      return <SuccessStory />
    case "coachVideo":
    case "nutritionCoach":
      return (
        <Card className="bg-[#1E1E1E] border-none mb-4">
          <CardHeader className="flex flex-row items-start space-x-4 p-4">
            <Avatar>
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{post.user.name}</p>
                  <p className="text-sm text-gray-400">@{post.user.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedPost(post)
                    setIsSaveDialogOpen(true)
                  }}
                >
                  <BookmarkPlus className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
              <p className="mt-2 text-white">{post.content}</p>
              <div className="mt-2 rounded-lg overflow-hidden relative">
                <Image
                  src={post.thumbnail || "/placeholder.svg"}
                  alt="Video thumbnail"
                  width={600}
                  height={400}
                  className="w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
                    <Play className="h-12 w-12" />
                  </Button>
                </div>
              </div>
              <PostInteraction post={post} />
            </div>
          </CardHeader>
        </Card>
      )
    case "product":
      return (
        <Card className="bg-[#1E1E1E] border-none mb-4">
          <CardHeader className="flex flex-row items-start space-x-4 p-4">
            <Avatar>
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{post.user.name}</p>
                  <p className="text-sm text-gray-400">@{post.user.username}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
              <p className="mt-2 text-white">{post.content}</p>
              {post.image && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt="Product image"
                    width={600}
                    height={400}
                    className="w-full"
                  />
                </div>
              )}

              <div className="mt-4 bg-[#2A2A2A] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">{post.product?.name}</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-300">by</span>
                      <span
                        className={`ml-1 text-sm ${post.product?.isBrandOmnia ? "text-[#FF7939] font-semibold" : "text-gray-300"}`}
                      >
                        {post.product?.brand}
                      </span>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-[#FF7939]">${post.product?.price.toFixed(2)}</span>
                </div>
                <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white mt-2">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Quick Purchase
                </Button>
              </div>

              <PostInteraction post={post} />
            </div>
          </CardHeader>
        </Card>
      )
    default:
      return (
        <Card className="bg-[#1E1E1E] border-none mb-4">
          <CardHeader className="flex flex-row items-start space-x-4 p-4">
            <Avatar>
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{post.user.name}</p>
                  <p className="text-sm text-gray-400">@{post.user.username}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
              <p className="mt-2 text-white">{post.content}</p>
              {post.image && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt="Post image"
                    width={600}
                    height={400}
                    className="w-full"
                  />
                </div>
              )}
              <PostInteraction post={post} />
            </div>
          </CardHeader>
        </Card>
      )
  }
}

function FolderList({
  folders,
  onSelectFolder,
  onAddNewFolder,
  selectedFolder,
}: {
  folders: FolderData[]
  onSelectFolder: (folderId: string) => void
  onAddNewFolder: () => void
  selectedFolder: string
}) {
  return (
    <div className="space-y-4">
      {folders.map((folder) => (
        <motion.div
          key={folder.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="outline"
            className={`w-full justify-start text-left h-auto py-4 px-6 ${
              selectedFolder === folder.id ? "bg-[#FF7939] text-white hover:bg-[#E66829]" : ""
            }`}
            onClick={() => onSelectFolder(folder.id)}
          >
            <Folder className={`mr-4 h-6 w-6 ${selectedFolder === folder.id ? "text-white" : "text-[#FF7939]"}`} />
            <span className="text-lg">{folder.title}</span>
          </Button>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Button
          variant="outline"
          className="w-full justify-start text-left h-auto py-4 px-6 bg-transparent"
          onClick={onAddNewFolder}
        >
          <PlusCircle className="mr-4 h-6 w-6 text-[#FF7939]" />
          <span className="text-lg">Add New Folder</span>
        </Button>
      </motion.div>
    </div>
  )
}
