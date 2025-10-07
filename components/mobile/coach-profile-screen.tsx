
"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Edit, 
  Star, 
  Users, 
  TrendingUp, 
  Award, 
  GraduationCap,
  Instagram,
  MessageCircle,
  X,
  Save,
  Hash,
  DollarSign,
  Package,
  FileText,
  ChevronRight,
  Linkedin,
  Plus,
  CheckCircle,
  AlertCircle,
  Trash2,
  Clock,
  Settings
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from '@/lib/supabase-browser'
import { motion, AnimatePresence } from "framer-motion"
import { SocialVerificationModal } from "./social-verification-modal"
import { CertificationUploadModal } from "./certification-upload-modal"

type Certification = {
  id: string
  name: string
  issuer: string
  year: string
  verified?: boolean
  file_url?: string
}

type CoachProfile = {
  id: string
  user_id?: string
  full_name: string
  avatar_url?: string | null
  bio: string
  specialization: string
  experience_years: number
  certifications: Certification[]
  hourly_rate: number
  rating: number
  total_reviews: number
  total_clients: number
  total_sessions: number
  total_products: number
  total_earnings: number
  instagram?: string | null
  instagram_verified?: boolean
  whatsapp?: string | null
  whatsapp_verified?: boolean
  linkedin_url?: string | null
  linkedin_verified?: boolean
  created_at: string
  updated_at: string
}

type EditFormData = {
  full_name: string
  bio: string
  avatar_url?: string
  location: string
  gender: string
  birthDate: string
}

type SpecializationData = {
  specializations: string[]
}

type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  status: "completed" | "pending" | "failed"
  paymentMethod?: string
  clientName?: string
  productName?: string
}

type FinancialData = {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  pendingPayments: number
  transactions: Transaction[]
}

type TabType = "overview" | "publications" | "finances"

export function CoachProfileScreen() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [editFormData, setEditFormData] = useState<EditFormData>({
    full_name: "",
    bio: "",
    avatar_url: "",
    location: "",
    gender: "",
    birthDate: ""
  })
  const [specializationData, setSpecializationData] = useState<SpecializationData>({
    specializations: []
  })
  const [newCertification, setNewCertification] = useState("")
  const [newSpecialization, setNewSpecialization] = useState("")
  const [isSpecializationModalOpen, setIsSpecializationModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Función para calcular la edad desde la fecha de nacimiento
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Función para manejar la selección de archivo de avatar
  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive",
        })
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 5MB",
          variant: "destructive",
        })
        return
      }
      
      setAvatarFile(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Datos financieros simulados
  const [financialData] = useState<FinancialData>({
    totalIncome: 15420,
    totalExpenses: 3240,
    netBalance: 12180,
    monthlyIncome: 3850,
    monthlyExpenses: 810,
    pendingPayments: 1250,
    transactions: [
      {
        id: "1",
        type: "income",
        amount: 500,
        description: "Sesión de entrenamiento personal",
        category: "Sesiones",
        date: "2024-01-15",
        status: "completed",
        paymentMethod: "Mercado Pago",
        clientName: "Carlos Rodríguez",
        productName: "Entrenamiento Personal"
      },
      {
        id: "2",
        type: "income",
        amount: 350,
        description: "Evaluación física",
        category: "Evaluaciones",
        date: "2024-01-14",
        status: "completed",
        paymentMethod: "Mercado Pago",
        clientName: "María López",
        productName: "Evaluación Completa"
      },
      {
        id: "3",
        type: "income",
        amount: 1200,
        description: "Programa de 8 semanas",
        category: "Programas",
        date: "2024-01-13",
        status: "completed",
        paymentMethod: "Mercado Pago",
        clientName: "Juan Pérez",
        productName: "Programa Fitness Pro"
      },
      {
        id: "4",
        type: "expense",
        amount: 150,
        description: "Suscripción a plataforma de ejercicios",
        category: "Herramientas",
        date: "2024-01-12",
        status: "completed",
        paymentMethod: "Tarjeta de crédito"
      },
      {
        id: "5",
        type: "income",
        amount: 400,
        description: "Consulta nutricional",
        category: "Consultas",
        date: "2024-01-11",
        status: "pending",
        paymentMethod: "Mercado Pago",
        clientName: "Ana García",
        productName: "Consulta Nutricional"
      },
      {
        id: "6",
        type: "expense",
        amount: 80,
        description: "Material de entrenamiento",
        category: "Equipamiento",
        date: "2024-01-10",
        status: "completed",
        paymentMethod: "Efectivo"
      },
      {
        id: "7",
        type: "income",
        amount: 750,
        description: "Taller de yoga grupal",
        category: "Talleres",
        date: "2024-01-09",
        status: "completed",
        paymentMethod: "Mercado Pago",
        clientName: "Grupo A",
        productName: "Taller de Yoga"
      },
      {
        id: "8",
        type: "expense",
        amount: 200,
        description: "Certificación profesional",
        category: "Educación",
        date: "2024-01-08",
        status: "completed",
        paymentMethod: "Transferencia bancaria"
      }
    ]
  })
  
  // Estados para modales de verificación
  const [socialModalOpen, setSocialModalOpen] = useState(false)
  const [socialPlatform, setSocialPlatform] = useState<"instagram" | "whatsapp" | "linkedin">("instagram")
  const [certificationModalOpen, setCertificationModalOpen] = useState(false)
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null)

  // Certificaciones de ejemplo
  const defaultCertifications: Certification[] = [
    { id: "1", name: "Certificado en Entrenamiento Personal", issuer: "NSCA", year: "2018" },
    { id: "2", name: "Especialista en Nutrición Deportiva", issuer: "ISSN", year: "2019" },
    { id: "3", name: "Instructor de Yoga", issuer: "Yoga Alliance", year: "2020" },
  ]

  // Asegurar que el componente está montado antes de ejecutar los hooks useEffect
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Cargar el perfil del coach
  useEffect(() => {
    async function loadCoachProfile() {
      if (!user?.id) return

      try {
        setIsLoading(true)
        setError(null)

        // Obtener el perfil del coach desde Supabase
        const { data, error } = await supabase.from("coaches").select("*").eq("id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw new Error(error.message)
        }

        // Obtener datos de user_profiles para el avatar_url
        const { data: userProfile, error: userProfileError } = await supabase
          .from("user_profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single()

        if (userProfileError && userProfileError.code !== "PGRST116") {
          console.log("No se pudo cargar user_profiles:", userProfileError)
        }

        // Cargar certificaciones desde la tabla coach_certifications
        let certifications = defaultCertifications
        try {
          const { data: certData, error: certError } = await supabase
            .from("coach_certifications")
            .select("*")
            .eq("coach_id", user.id)
            .order("created_at", { ascending: false })

          if (!certError && certData) {
            certifications = certData.map(cert => ({
              id: cert.id,
              name: cert.name,
              issuer: cert.issuer,
              year: cert.year.toString(),
              verified: cert.verified,
              file_url: cert.file_url
            }))
          } else {
            console.log("No se pudieron cargar certificaciones:", certError)
          }
        } catch (certError) {
          console.log("Error cargando certificaciones:", certError)
        }

        if (data) {
          // Formatear los datos para que coincidan con nuestro tipo CoachProfile
          const formattedProfile: CoachProfile = {
            id: data.id,
            full_name: data.full_name || user.name || "Coach",
            avatar_url: userProfile?.avatar_url || null,
            bio: data.bio || "Hola, soy un coach apasionado por el fitness!",
            specialization: data.specialization || "Entrenamiento general",
            experience_years: data.experience_years || 5,
            certifications: certifications,
            hourly_rate: data.hourly_rate || 50,
            rating: data.rating || 4.8,
            total_reviews: data.total_reviews || 25,
            total_clients: 35, // Datos de ejemplo
            total_sessions: 350, // Datos de ejemplo
            total_products: 8, // Datos de ejemplo
            total_earnings: 12500, // Datos de ejemplo
            instagram: data.instagram || null,
            instagram_verified: data.instagram_verified || false,
            whatsapp: data.whatsapp || null,
            whatsapp_verified: data.whatsapp_verified || false,
            linkedin_url: data.linkedin_url || null,
            linkedin_verified: data.linkedin_verified || false,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }

          setProfile(formattedProfile)
        } else {
          // Crear un perfil predeterminado si no existe
          const defaultProfile: CoachProfile = {
            id: user.id,
            full_name: user.name || "Coach",
            avatar_url: userProfile?.avatar_url || null,
            bio: "Hola, soy un coach apasionado por el fitness!",
            specialization: "Entrenamiento general",
            experience_years: 5,
            certifications: certifications,
            hourly_rate: 50,
            rating: 4.8,
            total_reviews: 25,
            total_clients: 35,
            total_sessions: 350,
            total_products: 8,
            total_earnings: 12500,
            instagram: null,
            instagram_verified: false,
            whatsapp: null,
            whatsapp_verified: false,
            linkedin_url: null,
            linkedin_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Intentar crear el perfil en la base de datos
          const { error: insertError } = await supabase.from("coaches").insert([
            {
              id: user.id,
              full_name: defaultProfile.full_name,
              bio: defaultProfile.bio,
              specialization: defaultProfile.specialization,
              experience_years: defaultProfile.experience_years,
              hourly_rate: defaultProfile.hourly_rate,
              rating: defaultProfile.rating,
              total_reviews: defaultProfile.total_reviews,
            },
          ])

          if (insertError) {
            console.error("Error al crear el perfil:", insertError)
          }

          setProfile(defaultProfile)
        }
      } catch (error) {
        console.error("Error loading coach profile:", error)
        setError("No se pudo cargar el perfil del coach")
      } finally {
        setIsLoading(false)
      }
    }

    if (isMounted && user?.id) {
      loadCoachProfile()
    }
  }, [isMounted, user?.id, supabase])

  // Función para abrir el modal de edición
  const handleEditProfile = () => {
    if (!profile) return

    setEditFormData({
      full_name: profile.full_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url || "",
      location: profile.location || "", // Valor por defecto
      gender: profile.gender || "", // Valor por defecto
      birthDate: profile.birth_date || "" // Valor por defecto
    })
    setIsEditModalOpen(true)
  }

  // Función para guardar los cambios
  const handleSaveProfile = async () => {
    if (!profile || !user?.id) return

    setIsSaving(true)
    try {
      let avatarUrl = editFormData.avatar_url
      
      // Si hay un archivo de avatar seleccionado, subirlo
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`
        
        // Subir archivo a Supabase Storage usando FormData
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('path', filePath)
        
        // Llamar al endpoint API para subir el archivo
        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData
        })
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Error subiendo archivo')
        }
        
        const { publicUrl } = await uploadResponse.json()
        avatarUrl = publicUrl
      }
      
      // Preparar datos para coaches (sin avatar_url)
      const coachesUpdateData = {
        full_name: editFormData.full_name,
        bio: editFormData.bio,
        location: editFormData.location,
        gender: editFormData.gender,
        birth_date: editFormData.birthDate,
        updated_at: new Date().toISOString(),
      }

      // Preparar datos para user_profiles (solo avatar_url)
      const userProfileUpdateData = {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

      // Actualizar coaches
      const { error: coachesError } = await supabase
        .from("coaches")
        .update(coachesUpdateData)
        .eq("id", user.id)

      if (coachesError) {
        console.error("Error updating coaches:", coachesError)
        throw coachesError
      }

      // Actualizar user_profiles (avatar_url)
      const { error: userProfileError } = await supabase
        .from("user_profiles")
        .update(userProfileUpdateData)
        .eq("id", user.id)

      if (userProfileError) {
        console.error("Error updating user_profiles:", userProfileError)
        throw userProfileError
      }

      // Actualizar el estado local
      setProfile({
        ...profile,
        ...coachesUpdateData,
        avatar_url: avatarUrl
      })

      // Limpiar estados de archivo
      setAvatarFile(null)
      setAvatarPreview(null)

      handleCloseEditModal()
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil ha sido guardado correctamente.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Función para agregar especialización
  const handleAddSpecialization = () => {
    if (newSpecialization.trim()) {
      setSpecializationData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }))
      setNewSpecialization("")
    }
  }

  // Función para remover especialización
  const handleRemoveSpecialization = (index: number) => {
    setSpecializationData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i: number) => i !== index)
    }))
  }

  // Función para guardar especialidades
  const handleSaveSpecializations = async () => {
    if (!profile || !user?.id) return

    try {
      const { error } = await supabase
        .from("coaches")
        .update({
          specialization: specializationData.specializations.join(", "),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile({
        ...profile,
        specialization: specializationData.specializations.join(", ")
      })

      setIsSpecializationModalOpen(false)
      toast({
        title: "Especialidades actualizadas",
        description: "Tus especialidades han sido guardadas correctamente.",
      })
    } catch (error) {
      console.error("Error saving specializations:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las especialidades. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  // Función para limpiar el estado del modal
  const handleCloseEditModal = () => {
    setNewCertification("")
    setNewSpecialization("")
    setIsEditModalOpen(false)
  }

  // Funciones para cálculos financieros
  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed": return "text-green-500"
      case "pending": return "text-yellow-500"
      case "failed": return "text-red-500"
      default: return "text-gray-500"
    }
  }

  const getStatusText = (status: Transaction["status"]) => {
    switch (status) {
      case "completed": return "Completado"
      case "pending": return "Pendiente"
      case "failed": return "Fallido"
      default: return "Desconocido"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Sesiones": return "bg-blue-500/20 text-blue-400"
      case "Evaluaciones": return "bg-purple-500/20 text-purple-400"
      case "Programas": return "bg-green-500/20 text-green-400"
      case "Consultas": return "bg-orange-500/20 text-orange-400"
      case "Talleres": return "bg-pink-500/20 text-pink-400"
      case "Herramientas": return "bg-gray-500/20 text-gray-400"
      case "Equipamiento": return "bg-indigo-500/20 text-indigo-400"
      case "Educación": return "bg-teal-500/20 text-teal-400"
      default: return "bg-gray-500/20 text-gray-400"
    }
  }

  // Calcular distribución por categorías
  const getCategoryDistribution = () => {
    const distribution: { [key: string]: number } = {}
    financialData.transactions
      .filter(t => t.type === "income" && t.status === "completed")
      .forEach(t => {
        distribution[t.category] = (distribution[t.category] || 0) + t.amount
      })
    return distribution
  }

  // Calcular tendencia de ingresos (últimos 6 meses)
  const getIncomeTrend = () => {
    return [
      { month: "Ago", income: 3200 },
      { month: "Sep", income: 3500 },
      { month: "Oct", income: 3800 },
      { month: "Nov", income: 3600 },
      { month: "Dic", income: 4200 },
      { month: "Ene", income: 3850 }
    ]
  }

  // Función para abrir modal de verificación social
  const handleOpenSocialModal = (platform: "instagram" | "whatsapp" | "linkedin") => {
    setSocialPlatform(platform)
    setSocialModalOpen(true)
  }

  // Función para manejar éxito de verificación social
  const handleSocialVerificationSuccess = (platform: "instagram" | "whatsapp" | "linkedin", value: string) => {
    if (profile) {
      setProfile({
        ...profile,
        [platform === "instagram" ? "instagram" : platform === "whatsapp" ? "whatsapp" : "linkedin_url"]: value,
        [`${platform}_verified`]: true
      })
    }
  }

  // Función para manejar éxito de subida de certificación
  const handleCertificationUploadSuccess = (certification: any) => {
    if (profile) {
      if (editingCertification) {
        // Actualizar certificación existente
        setProfile({
          ...profile,
          certifications: profile.certifications.map(cert => 
            cert.id === certification.id ? certification : cert
          )
        })
      } else {
        // Agregar nueva certificación
        setProfile({
          ...profile,
          certifications: [...profile.certifications, certification]
        })
      }
    }
    setCertificationModalOpen(false)
    setEditingCertification(null)
    toast({
      title: "Éxito",
      description: editingCertification ? "Certificación actualizada correctamente" : "Certificación subida correctamente",
    })
  }

  const handleEditCertification = (certification: Certification) => {
    // Abrir modal de edición con los datos de la certificación
    setEditingCertification(certification)
    setCertificationModalOpen(true)
  }

  const handleDeleteCertification = async (certificationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta certificación?')) {
      return
    }

    try {
      const response = await fetch('/api/coach/upload-certification', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certification_id: certificationId })
      })

      const data = await response.json()

      if (response.ok) {
        // Actualizar la lista de certificaciones
        if (profile) {
          setProfile({
            ...profile,
            certifications: profile.certifications.filter(cert => cert.id !== certificationId)
          })
        }
        
        toast({
          title: "Éxito",
          description: "Certificación eliminada correctamente",
        })
      } else {
        throw new Error(data.error || 'Error al eliminar la certificación')
      }
    } catch (error) {
      console.error('Error eliminando certificación:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la certificación",
        variant: "destructive",
      })
    }
  }



  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Manejar parámetros de URL para Instagram OAuth callback
  useEffect(() => {
    const instagramSuccess = searchParams.get('instagram_success')
    const instagramError = searchParams.get('instagram_error')
    const username = searchParams.get('username')

    if (instagramSuccess === 'true' && username && profile) {
      toast({
        title: "¡Instagram conectado!",
        description: `Tu cuenta @${username} ha sido conectada exitosamente`,
      })
      
      setProfile({
        ...profile,
        instagram: username,
        instagram_verified: true
      })

      // Limpiar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('instagram_success')
      url.searchParams.delete('instagram_error')
      url.searchParams.delete('username')
      window.history.replaceState({}, '', url.toString())
    }

    if (instagramError && profile) {
      toast({
        title: "Error al conectar Instagram",
        description: instagramError,
        variant: "destructive",
      })

      // Limpiar URL
      const url = new URL(window.location.href)
      url.searchParams.delete('instagram_success')
      url.searchParams.delete('instagram_error')
      url.searchParams.delete('username')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, profile, toast])

  if (!isMounted) return null

  if (isLoading) {
              return (
      <div className="min-h-screen bg-[#0A0A0A] p-4">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-800 rounded-2xl mb-6"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                </div>
          </div>
        </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Error al cargar el perfil</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header con imagen de fondo - EXTREMADAMENTE REDUCIDO */}
      <div className="relative h-32 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Botón de editar - LÁPIZ MÁS PEQUEÑO */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            onClick={handleEditProfile}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 p-0 shadow-lg"
            size="sm"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Información del perfil - EXTREMADAMENTE ARRIBA */}
        <div className="absolute top-6 left-0 right-0 p-2">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-white/20 shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-white/20 text-white text-base font-bold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
            </div>

            {/* Información básica */}
            <div className="flex-1 text-white">
              <h1 className="text-lg font-bold mb-0">{profile.full_name}</h1>
              <p className="text-white/80 text-xs mb-0">
                {profile.specialization}
                {profile.birth_date && (
                  <span className="ml-2 text-white/60">
                    • {calculateAge(profile.birth_date)} años
                  </span>
                )}
              </p>
              <p className="text-white/70 text-xs">{profile.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-0.5 border-b border-gray-800">
        <div className="flex space-x-8">
            <button
            onClick={() => setActiveTab("overview")}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Overview
            </button>
            <button
            onClick={() => setActiveTab("publications")}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "publications"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Publications
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "finances"
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Finances
            </button>
          </div>
        </div>

      {/* Contenido de tabs */}
      <div className="p-6">
        {activeTab === "overview" ? (
          <div className="space-y-6">
            {/* Rating y Calificaciones */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Rating & Reviews</h3>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-white">{profile.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{profile.total_reviews} reviews</span>
                <span className="text-orange-500 font-medium">Ver todas</span>
              </div>
          </div>

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-2 gap-4">
              {/* Ingresos */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">+12%</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(profile.total_earnings)}
            </div>
                <div className="text-gray-400 text-sm">Total Ingresos</div>
          </div>

              {/* Clientes */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-6 w-6 text-blue-500" />
                  <span className="text-blue-500 text-sm font-medium">+5</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {profile.total_clients}
                </div>
                <div className="text-gray-400 text-sm">Total Clientes</div>
          </div>

              {/* Productos */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Package className="h-6 w-6 text-purple-500" />
                  <span className="text-purple-500 text-sm font-medium">+2</span>
              </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {profile.total_products}
          </div>
                <div className="text-gray-400 text-sm">Productos</div>
        </div>

              {/* Sesiones */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                  <span className="text-orange-500 text-sm font-medium">+28</span>
          </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {profile.total_sessions}
          </div>
                <div className="text-gray-400 text-sm">Sesiones</div>
        </div>
      </div>

            {/* Especialidades */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Especialidades</h3>
                <Button
                  onClick={() => {
                    setSpecializationData({
                      specializations: profile.specialization ? profile.specialization.split(", ") : []
                    })
                    setIsSpecializationModalOpen(true)
                  }}
                  size="sm"
                  className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
        </div>
              <div className="flex flex-wrap gap-3">
                {profile.specialization ? (
                  profile.specialization.split(", ").map((spec, index) => (
                    <span key={index} className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm border border-orange-500/30">
                      #{spec.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No hay especialidades definidas</span>
                )}
              </div>
            </div>

            {/* Certificaciones */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Award className="h-6 w-6 mr-2 text-orange-500" />
                  Certificaciones
                </h3>
                <Button
                  onClick={() => setCertificationModalOpen(true)}
                  size="sm"
                  className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Subir
                </Button>
              </div>
      <div className="space-y-3">
                {profile.certifications.length > 0 ? (
                  profile.certifications.map((cert, index) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg hover:bg-[#3A3A3A] transition-colors cursor-pointer" onClick={() => handleEditCertification(cert)}>
                      <div className="flex items-center">
                        <GraduationCap className="h-5 w-5 text-white/70 mr-3" />
              <div>
                          <h4 className="text-sm font-semibold text-white">{cert.name}</h4>
                          <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs text-white/60 bg-black/30 px-2 py-0.5 rounded-full">{cert.issuer}</span>
                            <span className="text-xs text-white/40">{cert.year}</span>
                            {cert.verified && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                </div>
              </div>
            </div>
                      <div className="flex items-center space-x-2">
                        {cert.file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(cert.file_url, '_blank')
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCertification(cert.id)
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
          </div>
      </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">No hay certificaciones</p>
                    <p className="text-sm text-gray-500">Sube tus certificaciones para aumentar tu credibilidad</p>
                  </div>
                )}
              </div>
            </div>

            {/* Redes sociales */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Contacto</h3>
                <Button
                  onClick={() => handleOpenSocialModal("instagram")}
                  size="sm"
                  className="bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Instagram */}
                <div className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <div>
                      <p className="text-white font-medium">Instagram</p>
                      <p className="text-sm text-gray-400">
                        {profile.instagram ? `@${profile.instagram}` : "No conectado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.instagram_verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {profile.instagram ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("instagram")}
                        className="text-pink-400 hover:text-pink-300"
                      >
                        Editar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("instagram")}
                        className="text-pink-400 hover:text-pink-300"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-white font-medium">WhatsApp</p>
                      <p className="text-sm text-gray-400">
                        {profile.whatsapp || "No conectado"}
                      </p>
        </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.whatsapp_verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {profile.whatsapp ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("whatsapp")}
                        className="text-green-400 hover:text-green-300"
                      >
                        Editar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("whatsapp")}
                        className="text-green-400 hover:text-green-300"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Linkedin className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-white font-medium">LinkedIn</p>
                      <p className="text-sm text-gray-400">
                        {profile.linkedin_url ? "Perfil conectado" : "No conectado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.linkedin_verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {profile.linkedin_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("linkedin")}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Editar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSocialModal("linkedin")}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "publications" ? (
          <div className="space-y-6">
            {/* Tab de Publicaciones */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Mis Publicaciones</h3>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <FileText className="h-4 w-4 mr-2" />
                  Nueva Publicación
                </Button>
              </div>
              
              {/* Grid de publicaciones */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-[#2A2A2A] rounded-xl p-4 border border-gray-700">
                    <div className="w-full h-32 bg-gray-700 rounded-lg mb-3"></div>
                    <h4 className="text-white font-semibold mb-1">Publicación {item}</h4>
                    <p className="text-gray-400 text-sm mb-2">Descripción breve de la publicación...</p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 text-sm font-medium">Ver más</span>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
          </div>
        ))}
      </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab de Finanzas */}
            
            {/* KPIs Principales */}
            <div className="grid grid-cols-2 gap-4">
              {/* Balance Neto */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="h-6 w-6 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">+15%</span>
      </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(financialData.netBalance)}
                </div>
                <div className="text-gray-400 text-sm">Balance Neto</div>
              </div>

              {/* Ingresos del Mes */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  <span className="text-blue-500 text-sm font-medium">+8%</span>
      </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(financialData.monthlyIncome)}
                </div>
                <div className="text-gray-400 text-sm">Ingresos del Mes</div>
              </div>

              {/* Gastos del Mes */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-500 text-sm font-medium">-5%</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(financialData.monthlyExpenses)}
                </div>
                <div className="text-gray-400 text-sm">Gastos del Mes</div>
              </div>

              {/* Pagos Pendientes */}
              <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <span className="text-yellow-500 text-sm font-medium">3</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(financialData.pendingPayments)}
                </div>
                <div className="text-gray-400 text-sm">Pendientes</div>
              </div>
            </div>

            {/* Gráfico de Tendencia de Ingresos */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Tendencia de Ingresos</h3>
              <div className="flex items-end justify-between h-32 space-x-2">
                {getIncomeTrend().map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-gradient-to-t from-orange-500 to-orange-600 rounded-t w-full"
                      style={{ height: `${(item.income / 5000) * 100}%` }}
          ></div>
                    <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-400">
                <span>Agosto 2023</span>
                <span>Enero 2024</span>
                </div>
              </div>

            {/* Distribución por Categorías */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold text-white mb-4">Distribución por Categorías</h3>
              <div className="space-y-3">
                {Object.entries(getCategoryDistribution()).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(category).replace('bg-', 'bg-').replace('/20', '')}`}></div>
                      <span className="text-white">{category}</span>
                  </div>
                    <span className="text-white font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
                </div>

            {/* Conexión Mercado Pago */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Mercado Pago</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 text-sm">Conectado</span>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2A2A2A] rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Cuenta</div>
                  <div className="text-white font-medium">franco.pomati@usal.edu.ar</div>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Estado</div>
                  <div className="text-green-500 font-medium">Verificado</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Retirar Fondos
                </Button>
                <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
                  </div>
                </div>

            {/* Transacciones Recientes */}
            <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Transacciones Recientes</h3>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Ver todas
                </Button>
                      </div>
              <div className="space-y-3">
                {financialData.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-[#2A2A2A] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "income" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {transaction.type === "income" ? (
                          <DollarSign className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        </div>
                      <div>
                        <div className="text-white font-medium">{transaction.description}</div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(transaction.category)}`}>
                            {transaction.category}
                          </span>
                          <span className="text-gray-400">{transaction.date}</span>
                          {transaction.paymentMethod && (
                            <span className="text-gray-400">• {transaction.paymentMethod}</span>
                    )}
                  </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === "income" ? "text-green-500" : "text-red-500"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </div>
                      <div className={`text-xs ${getStatusColor(transaction.status)}`}>
                        {getStatusText(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
        )}
          </div>

      {/* Modales de verificación */}
      <SocialVerificationModal
        isOpen={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
        platform={socialPlatform}
        currentValue={
          socialPlatform === "instagram" ? profile?.instagram || "" :
          socialPlatform === "whatsapp" ? profile?.whatsapp || "" :
          profile?.linkedin_url || ""
        }
        onSuccess={handleSocialVerificationSuccess}
      />

                    <CertificationUploadModal
                isOpen={certificationModalOpen}
                onClose={() => {
                  setCertificationModalOpen(false)
                  setEditingCertification(null)
                }}
                onSuccess={handleCertificationUploadSuccess}
                editingCertification={editingCertification}
              />

      {/* Modal de edición */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={handleCloseEditModal}
          >
            <motion.div
              key="edit-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-[#2A2A2A] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
        </div>

              {/* Formulario */}
              <div className="p-6 space-y-6">
                {/* Foto de perfil - MOVIDO ARRIBA */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Foto de perfil</label>
                  <div className="space-y-3">
                    {/* Preview de la imagen */}
                    {(avatarPreview || editFormData.avatar_url) && (
                      <div className="flex justify-center">
                        <div className="relative">
                          <img
                            src={avatarPreview || editFormData.avatar_url}
                            alt="Preview"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                          />
                          {avatarFile && (
                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Input de archivo */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-3 py-2 text-white cursor-pointer hover:bg-[#3A3A3A] transition-colors flex items-center justify-center space-x-2"
                      >
                        <span>📷</span>
                        <span>{avatarFile ? 'Cambiar imagen' : 'Seleccionar imagen'}</span>
                      </label>
                    </div>
                    
                    {/* Información adicional */}
                    <p className="text-xs text-gray-400 text-center">
                      Formatos: JPG, PNG, GIF. Máximo 5MB
                    </p>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nombre completo</label>
                  <Input
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="bg-[#2A2A2A] border-gray-600 text-white"
                    placeholder="Tu nombre completo"
                  />
          </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Descripción</label>
                  <Textarea
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="bg-[#2A2A2A] border-gray-600 text-white"
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                  />
              </div>



                {/* Localidad */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Localidad</label>
                  <Input
                    value={editFormData.location}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-[#2A2A2A] border-gray-600 text-white"
                    placeholder="Buenos Aires, Argentina"
                  />
            </div>

                {/* Género */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Género</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-[#2A2A2A] border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccionar género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="no-binario">No binario</option>
                    <option value="prefiero-no-decir">Prefiero no decir</option>
                  </select>
        </div>

                {/* Fecha de nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Fecha de nacimiento</label>
                  <Input
                    type="date"
                    value={editFormData.birthDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="bg-[#2A2A2A] border-gray-600 text-white"
                  />
          </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseEditModal}
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
          </div>
        </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal de Especialidades */}
        <AnimatePresence>
          {isSpecializationModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsSpecializationModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Editar Especialidades</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSpecializationModalOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
          </div>

                <div className="p-6 space-y-4">
                  {/* Especialidades actuales */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Tus especialidades</label>
                    <div className="space-y-2">
                      {specializationData.specializations.map((spec, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="bg-blue-500/20 px-3 py-2 rounded-lg flex-1">
                            <span className="text-blue-400">#{spec}</span>
        </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSpecialization(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
          </div>
                      ))}
                    </div>
        </div>

                  {/* Agregar nueva especialidad */}
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newSpecialization}
                      onChange={(e) => setNewSpecialization(e.target.value)}
                      className="bg-[#2A2A2A] border-gray-600 text-white flex-1"
                      placeholder="Agregar especialidad (ej: fitness, nutrición)"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddSpecialization}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Hash className="h-4 w-4" />
                    </Button>
          </div>

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsSpecializationModalOpen(false)}
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveSpecializations}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
        </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
      </div>
  )
}