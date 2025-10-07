"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Activity, 
  Calendar, 
  Clock, 
  Star, 
  Users, 
  Play, 
  BookOpen, 
  Trophy,
  Filter,
  Search,
  ChevronRight,
  Eye,
  Download,
  Share2,
  ShoppingBag
} from "lucide-react"
import { createClient } from '@/lib/supabase-browser'

interface Enrollment {
  id: string
  activity_id: number
  client_id: string
  status: string
  created_at: string
  activity: {
    id: number
    title: string
    description: string
    image_url: string
    type: string
    difficulty: string
    duration_minutes: number
    program_duration_weeks_months: string
    coach_name: string
    program_rating: number
    total_program_reviews: number
  }
}

export function MyProductsScreen() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, in-progress, completed
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadUserEnrollments()
    }
  }, [user?.id])

  const loadUserEnrollments = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from("activity_enrollments")
        .select(`
          id,
          activity_id,
          client_id,
          status,
          created_at,
          activity:activities (
            id,
            title,
            description,
            image_url,
            type,
            difficulty,
            duration_minutes,
            program_duration_weeks_months,
            coach_name,
            program_rating,
            total_program_reviews
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "enrolled")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading enrollments:", error)
        return
      }

      setEnrollments(data || [])
    } catch (error) {
      console.error("Error loading enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "workout":
        return <Activity className="h-5 w-5" />
      case "program":
        return <BookOpen className="h-5 w-5" />
      case "challenge":
        return <Trophy className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400"
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400"
      case "advanced":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesFilter = filter === "all" || 
      (filter === "in-progress" && enrollment.status === "enrolled") ||
      (filter === "completed" && enrollment.status === "completed")
    
    const matchesSearch = enrollment.activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const handleStartActivity = (enrollment: Enrollment) => {
    // Aquí puedes implementar la lógica para iniciar la actividad
    console.log("Starting activity:", enrollment.activity.title)
    // Por ejemplo, navegar a la página de la actividad
    window.location.href = `/activities/${enrollment.activity_id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded-lg w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Productos</h1>
        <p className="text-gray-400">Tus actividades y programas adquiridos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{enrollments.length}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-orange-400">
            {enrollments.filter(e => e.status === "enrolled").length}
          </div>
          <div className="text-xs text-gray-400">En Progreso</div>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {enrollments.filter(e => e.status === "completed").length}
          </div>
          <div className="text-xs text-gray-400">Completados</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar en mis productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "all"
                ? 'bg-orange-500 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("in-progress")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "in-progress"
                ? 'bg-orange-500 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            En Progreso
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              filter === "completed"
                ? 'bg-orange-500 text-white'
                : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            Completados
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No tienes productos aún</h3>
              <p className="text-gray-500">Explora y compra actividades para verlas aquí</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/search'}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Explorar Actividades
            </Button>
          </div>
        ) : (
          filteredEnrollments.map((enrollment) => (
            <Card key={enrollment.id} className="bg-gray-900/30 backdrop-blur-xl border border-white/10 hover:border-orange-500/30 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/20 rounded-xl">
                      {getActivityIcon(enrollment.activity.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{enrollment.activity.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getDifficultyColor(enrollment.activity.difficulty)}>
                          {enrollment.activity.difficulty}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {enrollment.activity.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">
                      {enrollment.activity.program_rating || 0}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {enrollment.activity.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{enrollment.activity.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{enrollment.activity.program_duration_weeks_months}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{enrollment.activity.coach_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleStartActivity(enrollment)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 px-4 py-2 rounded-xl"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
