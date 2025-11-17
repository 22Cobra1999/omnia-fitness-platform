"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Check } from "lucide-react"
import Image from "next/image"

interface Exercise {
  id: string
  title: string
  duration: string
  calories: number
  image: string
  videoUrl: string
  category: string
}

const exerciseData: Record<string, Exercise[]> = {
  "Cardio & Conditioning": [
    {
      id: "c1",
      title: "High-Intensity Interval Training (HIIT)",
      duration: "20 min",
      calories: 200,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/hiit.mp4",
      category: "Cardio & Conditioning",
    },
    {
      id: "c2",
      title: "Steady State Cardio",
      duration: "30 min",
      calories: 250,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/steady-state-cardio.mp4",
      category: "Cardio & Conditioning",
    },
    {
      id: "c3",
      title: "Jump Rope Workout",
      duration: "15 min",
      calories: 180,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/jump-rope.mp4",
      category: "Cardio & Conditioning",
    },
  ],
  "Mobility & Recovery": [
    {
      id: "m1",
      title: "Full Body Stretch Routine",
      duration: "20 min",
      calories: 80,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/full-body-stretch.mp4",
      category: "Mobility & Recovery",
    },
    {
      id: "m2",
      title: "Foam Rolling Session",
      duration: "15 min",
      calories: 50,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/foam-rolling.mp4",
      category: "Mobility & Recovery",
    },
    {
      id: "m3",
      title: "Yoga for Recovery",
      duration: "30 min",
      calories: 120,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/yoga-recovery.mp4",
      category: "Mobility & Recovery",
    },
  ],
  "Upper Body Strength (Push & Pull)": [
    {
      id: "u1",
      title: "Push-Up Variations",
      duration: "15 min",
      calories: 150,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/push-up-variations.mp4",
      category: "Upper Body Strength (Push & Pull)",
    },
    {
      id: "u2",
      title: "Dumbbell Upper Body Workout",
      duration: "25 min",
      calories: 200,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/dumbbell-upper-body.mp4",
      category: "Upper Body Strength (Push & Pull)",
    },
    {
      id: "u3",
      title: "Pull-Up Progression",
      duration: "20 min",
      calories: 180,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/pull-up-progression.mp4",
      category: "Upper Body Strength (Push & Pull)",
    },
  ],
  "Lower Body Power & Stability": [
    {
      id: "l1",
      title: "Bodyweight Leg Workout",
      duration: "20 min",
      calories: 180,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/bodyweight-leg-workout.mp4",
      category: "Lower Body Power & Stability",
    },
    {
      id: "l2",
      title: "Squat Variations",
      duration: "25 min",
      calories: 220,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/squat-variations.mp4",
      category: "Lower Body Power & Stability",
    },
    {
      id: "l3",
      title: "Plyometric Lower Body Routine",
      duration: "15 min",
      calories: 200,
      image: "/placeholder.svg?height=200&width=300",
      videoUrl: "/videos/plyometric-lower-body.mp4",
      category: "Lower Body Power & Stability",
    },
  ],
}

interface ExerciseRoutinesProps {
  category: string | null
  onAddExercise: (exercise: {
    id: string
    time: string
    duration: string
    title: string
    category: string
    repsXSeries: string
    calories: number
    note: string
    videoUrl?: string
  }) => void
  handlePlayVideo: (url: string, title: string) => void
  onClose: () => void
}

export function ExerciseRoutines({ category, onAddExercise, handlePlayVideo, onClose }: ExerciseRoutinesProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [addedExercises, setAddedExercises] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(true)

  const handleAddExercise = (exercise: Exercise) => {
    onAddExercise({
      ...exercise,
      videoUrl: exercise.videoUrl || "",
    })
    setAddedExercises((prev) => [...prev, exercise.id])
  }

  const handlePlayAndClose = (url: string, title: string) => {
    handlePlayVideo(url, title)
    onClose()
    // Scroll to center the video player
    setTimeout(() => {
      const videoPlayer = document.querySelector(".aspect-video")
      if (videoPlayer) {
        const rect = videoPlayer.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const centerPosition = rect.top + scrollTop - (window.innerHeight - rect.height) / 2
        window.scrollTo({ top: centerPosition, behavior: "smooth" })
      }
    }, 100)
  }

  if (!category || !exerciseData[category]) {
    return <div>No exercises found for this category.</div>
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exerciseData[category].map((exercise) => (
          <Card
            key={exercise.id}
            className="bg-[#2A2A2A] overflow-hidden border-none hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-video">
              <Image src={exercise.image || "/placeholder.svg"} alt={exercise.title} layout="fill" objectFit="cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/20 hover:bg-white/30 text-white"
                  onClick={() => handlePlayAndClose(exercise.videoUrl, exercise.title)}
                >
                  <Play className="h-8 w-8" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold text-white mb-2">{exercise.title}</h4>
              <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                <span>{exercise.duration}</span>
                <span>{exercise.calories} cal</span>
              </div>
              <div className="flex justify-between">
                <Button
                  variant={addedExercises.includes(exercise.id) ? "default" : "outline"}
                  size="sm"
                  className={addedExercises.includes(exercise.id) ? "bg-orange-500 hover:bg-orange-600" : ""}
                  onClick={() => handleAddExercise(exercise)}
                >
                  {addedExercises.includes(exercise.id) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Added
                    </>
                  ) : (
                    "Add to Journey"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
