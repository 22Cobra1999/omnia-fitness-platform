"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Bookmark } from "lucide-react"
import Image from "next/image"

interface VideoFile {
  id: string
  title: string
  thumbnail: string
}

interface FolderData {
  id: string
  title: string
  files: VideoFile[]
}

interface VideoFeedProps {
  fitnessFolders: FolderData[]
  setFitnessFolders: React.Dispatch<React.SetStateAction<FolderData[]>>
  gymFolders: FolderData[]
  setGymFolders: React.Dispatch<React.SetStateAction<FolderData[]>>
}

export function VideoFeed({ fitnessFolders, setFitnessFolders, gymFolders, setGymFolders }: VideoFeedProps) {
  const [feedVideos, setFeedVideos] = useState<VideoFile[]>([
    { id: "feed1", title: "Full Body Workout", thumbnail: "/placeholder.svg?height=100&width=100" },
    { id: "feed2", title: "10-Minute Ab Routine", thumbnail: "/placeholder.svg?height=100&width=100" },
    { id: "feed3", title: "Proper Squat Technique", thumbnail: "/placeholder.svg?height=100&width=100" },
  ])
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)

  const openAddVideoDialog = (video: VideoFile) => {
    setSelectedVideo(video)
    setIsAddVideoDialogOpen(true)
  }

  const addVideoToFolder = (folderId: string, folderType: "fitness" | "gym") => {
    if (selectedVideo) {
      if (folderType === "fitness") {
        setFitnessFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, files: [...folder.files, selectedVideo] } : folder,
          ),
        )
      } else {
        setGymFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, files: [...folder.files, selectedVideo] } : folder,
          ),
        )
      }
      setIsAddVideoDialogOpen(false)
      setSelectedVideo(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Video Feed</h2>
      {feedVideos.map((video) => (
        <Card key={video.id} className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow">
          <div className="relative aspect-video">
            <Image src={video.thumbnail || "/placeholder.svg"} alt={video.title} layout="fill" objectFit="cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
                <Play className="h-8 w-8" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-white mb-2">{video.title}</h4>
              <Button variant="ghost" size="sm" onClick={() => openAddVideoDialog(video)}>
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isAddVideoDialogOpen} onOpenChange={setIsAddVideoDialogOpen}>
        <DialogContent className="bg-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>Save Video to Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <h3 className="text-lg font-semibold">Fitness Folders</h3>
            {fitnessFolders.map((folder) => (
              <Button
                key={folder.id}
                onClick={() => addVideoToFolder(folder.id, "fitness")}
                className="bg-[#FF7939] hover:bg-[#E66829]"
              >
                {folder.title}
              </Button>
            ))}
            <h3 className="text-lg font-semibold mt-4">Gym Folders</h3>
            {gymFolders.map((folder) => (
              <Button
                key={folder.id}
                onClick={() => addVideoToFolder(folder.id, "gym")}
                className="bg-[#FF7939] hover:bg-[#E66829]"
              >
                {folder.title}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
