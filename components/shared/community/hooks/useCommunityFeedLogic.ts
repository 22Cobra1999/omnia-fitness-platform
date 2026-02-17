import { useState, useEffect, useMemo } from "react"
import { Post, User, FolderData, VideoFile, mockPosts, mockUsers } from "../constants/mock-data"
import { toast } from "@/components/ui/use-toast"

export function useCommunityFeedLogic() {
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

    // Persistence
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

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            if (activeTab === "foryou") {
                return true
            } else if (activeTab === "following") {
                return post.user.isCoach || post.user.username === "omnia"
            }
            return false
        })
    }, [posts, activeTab])

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

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
    }

    return {
        posts,
        newPost,
        setNewPost,
        activeTab,
        handleTabChange,
        filteredPosts,
        fitnessFolders,
        nutritionFolders,
        isSaveDialogOpen,
        setIsSaveDialogOpen,
        selectedPost,
        setSelectedPost,
        selectedFolder,
        setSelectedFolder,
        newFolderName,
        setNewFolderName,
        newFolderCategory,
        setNewFolderCategory,
        handlePostSubmit,
        handleFolderSelection,
        saveVideoToFolder
    }
}
