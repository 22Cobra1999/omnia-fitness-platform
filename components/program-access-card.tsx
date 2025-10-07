"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dumbbell, Utensils, Calendar, Clock, Users, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ProgramAccessCardProps {
  activity: {
    id: string
    title: string
    description: string
    type: string
    image_url?: string
    duration?: number
    difficulty?: string
    coach?: {
      full_name: string
    }
  }
  enrollment: {
    enrolled_at: string
    progress?: number
  }
  stats?: {
    completedActivities: number
    totalActivities: number
  }
}

export function ProgramAccessCard({ activity, enrollment, stats }: ProgramAccessCardProps) {
  const progressPercentage = stats ? Math.round((stats.completedActivities / stats.totalActivities) * 100) : 0

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "fitness":
      case "workout":
        return <Dumbbell className="h-4 w-4" />
      case "nutrition":
      case "meal":
        return <Utensils className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "fitness":
      case "workout":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      case "nutrition":
      case "meal":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
      case "principiante":
      case "fácil":
        return "bg-green-500/20 text-green-400"
      case "intermediate":
      case "intermedio":
      case "moderado":
        return "bg-yellow-500/20 text-yellow-400"
      case "advanced":
      case "avanzado":
      case "difícil":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200 overflow-hidden">
      <div className="relative">
        {activity.image_url && (
          <div className="relative h-48 overflow-hidden">
            <Image src={activity.image_url || "/placeholder.svg"} alt={activity.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          </div>
        )}

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getTypeColor(activity.type)}>
                    {getTypeIcon(activity.type)}
                    <span className="ml-1 capitalize">{activity.type}</span>
                  </Badge>
                  {activity.difficulty && (
                    <Badge variant="outline" className={getDifficultyColor(activity.difficulty)}>
                      {activity.difficulty}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white">{activity.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{activity.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{activity.duration ? `${activity.duration} días` : "Duración variable"}</span>
              </div>
              {activity.coach && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{activity.coach.full_name}</span>
                </div>
              )}
            </div>

            {/* Progress */}
            {stats && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progreso</span>
                  <span className="text-white font-medium">
                    {stats.completedActivities}/{stats.totalActivities} ({progressPercentage}%)
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-gray-800" />
              </div>
            )}

            {/* Enrollment info */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Inscrito el{" "}
                {new Date(enrollment.enrolled_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm">Activo</span>
              </div>
            </div>

            {/* Action Button */}
            <Link href={`/program-tracker/${activity.id}`} className="block">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Continuar Programa</Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
