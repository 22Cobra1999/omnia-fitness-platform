"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, Clock, Award, Play } from "lucide-react"
import Image from "next/image"

interface Course {
  id: number
  title: string
  category: string
  instructor: string
  price: number
  duration: string
  level: string
  rating: number
  image: string
  trending?: boolean
  progress?: number
  videoUrl?: string
  description?: string
}

interface CourseModalProps {
  course: Course
  onClose: () => void
}

export function CourseModal({ course, onClose }: CourseModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E1E1E] text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>{course.description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="relative h-64 mb-4">
            <Image
              src={course.image || "/placeholder.svg"}
              alt={course.title}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
            {course.videoUrl && (
              <Button
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 hover:bg-white/30"
                onClick={() => {
                  /* Implement video playback */
                }}
              >
                <Play className="h-8 w-8 text-white" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400">Instructor</p>
              <p>{course.instructor}</p>
            </div>
            <div>
              <p className="text-gray-400">Category</p>
              <p>{course.category}</p>
            </div>
            <div>
              <p className="text-gray-400">Duration</p>
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-[#FF7939]" />
                {course.duration}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Level</p>
              <p className="flex items-center">
                <Award className="w-4 h-4 mr-1 text-[#FF7939]" />
                {course.level}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Rating</p>
              <p className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                {course.rating}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Price</p>
              <p className="text-[#FF7939] font-semibold">${course.price}</p>
            </div>
          </div>
          <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white">
            {course.progress !== undefined && course.progress > 0 ? "Continue Course" : "Enroll Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
