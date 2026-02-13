import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Trash, Edit2, Save, Play, Check } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import type { FolderData, VideoFile } from "../fitness-insights-data"

interface FitnessFoldersProps {
    fitnessFolders: FolderData[]
    isAddFolderDialogOpen: boolean
    setIsAddFolderDialogOpen: (val: boolean) => void
    newFolderTitle: string
    setNewFolderTitle: (val: string) => void
    addNewFolder: () => void
    editingFolder: FolderData | null
    setEditingFolder: (val: FolderData | null) => void
    updateFolderTitle: () => void
    deleteFolder: (id: string) => void
    handlePlayVideo: (url: string, title: string) => void
    myJourneyVideos: VideoFile[]
    setMyJourneyVideos: React.Dispatch<React.SetStateAction<VideoFile[]>>
    addedVideos: Set<string>
    setAddedVideos: React.Dispatch<React.SetStateAction<Set<string>>>
}

export const FitnessFolders = ({
    fitnessFolders,
    isAddFolderDialogOpen,
    setIsAddFolderDialogOpen,
    newFolderTitle,
    setNewFolderTitle,
    addNewFolder,
    editingFolder,
    setEditingFolder,
    updateFolderTitle,
    deleteFolder,
    handlePlayVideo,
    myJourneyVideos,
    setMyJourneyVideos,
    addedVideos,
    setAddedVideos
}: FitnessFoldersProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="col-span-12 mt-6"
        >
            <Card className="bg-[#1E1E1E] text-white shadow-2xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl">Fitness Folders</CardTitle>
                        <Dialog open={isAddFolderDialogOpen} onOpenChange={setIsAddFolderDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#FF7939] hover:bg-[#E66829]">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Folder
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#2A2A2A] text-white">
                                <DialogHeader>
                                    <DialogTitle>Add New Fitness Folder</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={newFolderTitle}
                                            onChange={(e) => setNewFolderTitle(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                </div>
                                <Button onClick={addNewFolder} className="bg-[#FF7939] hover:bg-[#E66829]">
                                    Add Folder
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {fitnessFolders.map((folder) => (
                            <Card key={folder.id} className="bg-[#2A2A2A] border-none">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        {editingFolder && editingFolder.id === folder.id ? (
                                            <Input
                                                value={editingFolder.title}
                                                onChange={(e) => setEditingFolder({ ...editingFolder, title: e.target.value })}
                                                className="mr-2"
                                            />
                                        ) : (
                                            <CardTitle className="text-xl font-semibold">{folder.title}</CardTitle>
                                        )}
                                        <div className="flex space-x-2">
                                            {editingFolder && editingFolder.id === folder.id ? (
                                                <Button variant="ghost" size="sm" onClick={updateFolderTitle}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => setEditingFolder({ ...folder })}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => deleteFolder(folder.id)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {folder.files.map((file) => (
                                            <Card
                                                key={file.id}
                                                className="bg-[#1E1E1E] overflow-hidden border-none hover:shadow-lg transition-shadow"
                                            >
                                                <div className="relative aspect-video">
                                                    <Image
                                                        src={file.thumbnail && file.thumbnail !== "" ? file.thumbnail : "/placeholder.svg"}
                                                        alt={file.title}
                                                        layout="fill"
                                                        objectFit="cover"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null
                                                            e.currentTarget.src = "/placeholder.svg"
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                                        onClick={() => {
                                                            handlePlayVideo(file.videoUrl || "", file.title)
                                                            window.scrollTo({ top: 0, behavior: "smooth" })
                                                        }}
                                                    >
                                                        <Play className="h-8 w-8 text-white" />
                                                    </div>
                                                </div>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-semibold text-white mb-2">{file.title}</h4>
                                                        <Checkbox
                                                            checked={myJourneyVideos.some((v) => v.id === file.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    const newVideo: VideoFile = {
                                                                        id: file.id,
                                                                        time: format(new Date(), "HH:mm"),
                                                                        title: file.title,
                                                                        category: folder.title,
                                                                        duration: "N/A",
                                                                        repsXSeries: "N/A",
                                                                        calories: 0,
                                                                        note: "",
                                                                        videoUrl: file.videoUrl,
                                                                    }
                                                                    setMyJourneyVideos((prev) => [...prev, newVideo])
                                                                    setAddedVideos((prev) => new Set(prev).add(file.id))
                                                                } else {
                                                                    setMyJourneyVideos((prev) => prev.filter((v) => v.id !== file.id))
                                                                    setAddedVideos((prev) => {
                                                                        const newSet = new Set(prev)
                                                                        newSet.delete(file.id)
                                                                        return newSet
                                                                    })
                                                                }
                                                                localStorage.setItem("fitnessJourneyVideos", JSON.stringify(myJourneyVideos))
                                                            }}
                                                        >
                                                            {addedVideos.has(file.id) ? (
                                                                <div className="flex items-center bg-[#FF7939] text-white px-2 py-1 rounded">
                                                                    <Check className="w-4 h-4 mr-1" />
                                                                    Added
                                                                </div>
                                                            ) : (
                                                                "Add to Journey"
                                                            )}
                                                        </Checkbox>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {folder.files.length === 0 && (
                                        <p className="text-center text-gray-400 mt-4">No videos in this folder yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
