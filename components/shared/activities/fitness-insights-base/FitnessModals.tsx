import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExerciseRoutines } from '@/components/shared/activities/exercise-routines'
import { VideoPlayer } from '@/components/shared/video/video-player'
import type { MealOption, VideoFile } from "../fitness-insights-data"
import { subscribedCoaches } from "../fitness-insights-data"

interface FitnessModalsProps {
    openDialog: string | null
    setOpenDialog: (val: string | null) => void
    isTimeModalOpen: boolean
    setIsTimeModalOpen: (val: boolean) => void
    mealTime: string
    setMealTime: (val: string) => void
    addMealToJourney: () => void
    selectedCategory: string | null
    setSelectedCategory: (val: string | null) => void
    addExerciseToJourney: (exercise: any) => void
    handlePlayVideo: (url: string, title: string) => void
    selectedVideo: { url: string; title: string } | null
    setSelectedVideo: (val: { url: string; title: string } | null) => void
    isAddCategoryDialogOpen: boolean
    setIsAddCategoryDialogOpen: (val: boolean) => void
    newCategoryName: string
    setNewCategoryName: (val: string) => void
    setAvailableCategories: React.Dispatch<React.SetStateAction<string[]>>
    setNewExercise: React.Dispatch<React.SetStateAction<Partial<VideoFile>>>
}

export const FitnessModals = ({
    openDialog,
    setOpenDialog,
    isTimeModalOpen,
    setIsTimeModalOpen,
    mealTime,
    setMealTime,
    addMealToJourney,
    selectedCategory,
    setSelectedCategory,
    addExerciseToJourney,
    handlePlayVideo,
    selectedVideo,
    setSelectedVideo,
    isAddCategoryDialogOpen,
    setIsAddCategoryDialogOpen,
    newCategoryName,
    setNewCategoryName,
    setAvailableCategories,
    setNewExercise
}: FitnessModalsProps) => {
    return (
        <>
            <Dialog open={openDialog === "workout"} onOpenChange={() => setOpenDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log Workout</DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === "coaches"} onOpenChange={() => setOpenDialog(null)}>
                <DialogContent className="bg-[#1E1E1E] text-white">
                    <DialogHeader>
                        <DialogTitle>Your Fitness Coaches</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {subscribedCoaches.map((coach, index) => (
                            <div key={index} className="flex items-center justify-between bg-[#2A2A2A] p-4 rounded-lg">
                                <div>
                                    <h4 className="font-semibold">{coach.name}</h4>
                                    <p className="text-sm text-gray-400">{coach.specialty}</p>
                                </div>
                                <a
                                    href={`https://wa.me/${coach.phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#25D366] text-white px-4 py-2 rounded-lg hover:bg-[#128C7E] transition-colors"
                                >
                                    Go to WhatsApp
                                </a>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog === "calendar"} onOpenChange={() => setOpenDialog(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Workout Planner</DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            {/* Time Modal */}
            <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Workout Time</DialogTitle>
                    </DialogHeader>
                    <Input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} className="mt-2" />
                    <Button onClick={addMealToJourney} className="mt-4">
                        Add to Journey
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Exercise Routines Dialog */}
            <Dialog open={selectedCategory !== null} onOpenChange={() => setSelectedCategory(null)}>
                <DialogContent className="bg-[#1E1E1E] text-white max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedCategory}</DialogTitle>
                    </DialogHeader>
                    {selectedCategory && (
                        <ExerciseRoutines
                            category={selectedCategory}
                            onAddExercise={(exercise) =>
                                addExerciseToJourney({
                                    ...exercise,
                                    videoUrl: exercise.videoUrl || "",
                                })
                            }
                            handlePlayVideo={(url, title) => {
                                handlePlayVideo(url, title)
                                setSelectedCategory(null)
                            }}
                            onClose={() => setSelectedCategory(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
                    {selectedVideo && (
                        <VideoPlayer
                            src={selectedVideo.url}
                            title={selectedVideo.title}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Add New Category Dialog */}
            <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                <DialogContent className="bg-[#1E1E1E] text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="bg-[#2A2A2A] border-gray-700"
                    />
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                if (newCategoryName.trim()) {
                                    setAvailableCategories((prev) => [...prev, newCategoryName.trim()])
                                    setNewExercise((prev) => ({ ...prev, category: newCategoryName.trim() }))
                                    setIsAddCategoryDialogOpen(false)
                                    setNewCategoryName("")
                                }
                            }}
                        >
                            Add Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
