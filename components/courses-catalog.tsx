"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Clock, Award, TrendingUp, Play, BookOpen } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { CourseModal } from "@/components/course-modal"
import { AchievementBadge } from "@/components/achievement-badge"

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

const courses: Course[] = [
  {
    id: 1,
    title: "Nutrition for Fat Loss",
    category: "Specializations",
    instructor: "Dr. Emily Chen",
    price: 129.99,
    duration: "6 weeks",
    level: "Intermediate",
    rating: 4.8,
    image: "/placeholder.svg?height=200&width=400",
    trending: true,
    progress: 65,
    videoUrl: "https://example.com/nutrition-video",
    description:
      "Learn the science behind effective fat loss through proper nutrition. This course covers meal planning, macronutrient balance, and sustainable eating habits.",
  },
  {
    id: 2,
    title: "Strength Programming 101",
    category: "Specializations",
    instructor: "Mike Johnson",
    price: 99.99,
    duration: "4 weeks",
    level: "Beginner",
    rating: 4.6,
    image: "/placeholder.svg?height=200&width=400",
    progress: 30,
    videoUrl: "https://example.com/strength-video",
    description:
      "Master the fundamentals of strength training program design. Learn how to create effective workout plans for various fitness goals and experience levels.",
  },
  {
    id: 3,
    title: "Social Media for Fitness Coaches",
    category: "Skill Development",
    instructor: "Sarah Davis",
    price: 79.99,
    duration: "3 weeks",
    level: "Beginner",
    rating: 4.9,
    image: "/placeholder.svg?height=200&width=400",
    trending: true,
    progress: 0,
    videoUrl: "https://example.com/social-media-video",
    description:
      "Boost your online presence and grow your fitness coaching business with effective social media strategies tailored for the fitness industry.",
  },
  {
    id: 4,
    title: "Advanced Yoga Techniques",
    category: "Specializations",
    instructor: "Yogi Patel",
    price: 149.99,
    duration: "8 weeks",
    level: "Advanced",
    rating: 4.7,
    image: "/placeholder.svg?height=200&width=400",
    progress: 90,
    videoUrl: "https://example.com/yoga-video",
    description:
      "Take your yoga practice to the next level with advanced postures, breathing techniques, and meditation practices. Suitable for experienced yogis and instructors.",
  },
]

export function CoursesCatalog() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || selectedCategory === "" || course.category === selectedCategory),
  )

  return (
    <div className="bg-[#121212] min-h-screen pt-16 pb-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-8 text-gradient">Coach Academy</h2>
        <p className="text-xl text-center mb-12 text-gray-300 max-w-3xl mx-auto">
          Elevate your coaching skills with our curated selection of professional development courses.
        </p>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Specializations">Specializations</SelectItem>
              <SelectItem value="Skill Development">Skill Development</SelectItem>
              <SelectItem value="Certifications">Certifications</SelectItem>
              <SelectItem value="Technology Integration">Technology Integration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="bg-[#1E1E1E] border-none shadow-custom-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="relative h-48">
                    <Image
                      src={course.image || "/placeholder.svg"}
                      alt={course.title}
                      layout="fill"
                      objectFit="cover"
                    />
                    {course.trending && (
                      <Badge className="absolute top-2 right-2 bg-[#FF7939]">
                        <TrendingUp className="w-4 h-4 mr-1" /> Trending
                      </Badge>
                    )}
                    {course.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-2">{course.title}</h4>
                    <p className="text-gray-400 mb-2">By {course.instructor}</p>
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-gray-300">{course.rating}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-[#FF7939] mr-1" />
                      <span className="text-gray-300">{course.duration}</span>
                    </div>
                    <div className="flex items-center mb-4">
                      <Award className="w-4 h-4 text-[#FF7939] mr-1" />
                      <span className="text-gray-300">{course.level}</span>
                    </div>
                    {course.progress !== undefined && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[#FF7939] font-semibold">${course.price}</span>
                      <Button className="bg-[#FF7939] hover:bg-[#E66829] text-white">
                        {course.progress !== undefined && course.progress > 0 ? "Continue" : "Enroll Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="container mx-auto px-4 mt-16">
        <h3 className="text-2xl font-bold text-center mb-8 text-white">Your Achievements</h3>
        <div className="flex justify-center space-x-4">
          <AchievementBadge title="Course Completions" count={2} icon={BookOpen} />
          <AchievementBadge title="Perfect Scores" count={1} icon={Award} />
          <AchievementBadge title="Study Streak" count={7} icon={TrendingUp} />
        </div>
      </div>

      {/* Course Modal */}
      {selectedCourse && <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />}
    </div>
  )
}
