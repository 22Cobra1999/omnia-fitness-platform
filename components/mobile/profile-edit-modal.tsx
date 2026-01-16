"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  User,
  Camera,
  X,
  Plus
} from "lucide-react"
import { useProfileManagement } from '@/hooks/client/use-profile-management'
import { useToast } from "@/components/ui/use-toast"

const FITNESS_GOALS_OPTIONS = [
  "Subir de peso",
  "Bajar de peso",
  "Quemar grasas",
  "Ganar masa muscular",
  "Mejorar condición física",
  "Tonificar",
  "Mejorar flexibilidad",
  "Reducir estrés",
  "Controlar respiración",
  "Corregir postura",
  "Meditación y Mindfulness",
  "Equilibrio corporal",
  "Aumentar resistencia",
  "Salud articular"
]

const SPORTS_OPTIONS = [
  "Fútbol",
  "Tenis",
  "Padel",
  "Calistenia",
  "Natación",
  "Running",
  "Crossfit",
  "Yoga",
  "Pilates",
  "Ciclismo",
  "Boxeo",
  "Artes Marciales",
  "Gimnasio",
  "Básquet",
  "Vóley",
  "Patinaje",
  "Golf",
  "Escalada",
  "Surf",
  "Otro"
]

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  editingSection?: string | null
}

export function ProfileEditModal({ isOpen, onClose, editingSection }: ProfileEditModalProps) {
  const { profile, updateProfile, loading, loadProfile } = useProfileManagement()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    emergency_contact: "",
    birth_date: "",
    weight: "",
    height: "",
    gender: "",
    level: "Principiante"
  })

  const [goals, setGoals] = useState<string[]>([])
  const [sports, setSports] = useState<string[]>([])
  const [isGoalsPopoverOpen, setIsGoalsPopoverOpen] = useState(false)
  const [isSportsPopoverOpen, setIsSportsPopoverOpen] = useState(false)

  const [errors, setErrors] = useState({
    weight: false,
    height: false,
    emergency_contact: false,
  })

  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const goalsSectionRef = useRef<HTMLDivElement | null>(null)
  const sportsSectionRef = useRef<HTMLDivElement | null>(null)

  // Cargar perfil cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadProfile(false) // Forzar recarga sin caché
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Actualizar datos del formulario cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      // Formatear birth_date para input type="date" (YYYY-MM-DD)
      let formattedBirthDate = ""
      if (profile.birth_date) {
        const date = new Date(profile.birth_date)
        if (!isNaN(date.getTime())) {
          formattedBirthDate = date.toISOString().split('T')[0]
        }
      }

      // Normalizar género para el Select (solo M, F, O)
      const normalizedGender =
        profile.gender === 'M' || profile.gender === 'F' || profile.gender === 'O'
          ? profile.gender
          : ""

      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        emergency_contact: profile.emergency_contact || "",
        birth_date: formattedBirthDate,
        weight: profile.weight?.toString() || "",
        height: profile.height?.toString() || "",
        gender: normalizedGender,
        level: profile.level || "Principiante"
      })
      setPreviewImage(profile.avatar_url || null)

      // Cargar Goals
      if ((profile as any).fitness_goals) {
        setGoals((profile as any).fitness_goals)
      } else {
        setGoals([])
      }

      // Cargar Sports
      if ((profile as any).sports) {
        setSports((profile as any).sports)
      } else {
        setSports([])
      }
    }
  }, [profile])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmergencyContactChange = (value: string) => {
    // Solo permitir caracteres típicos de teléfono
    const sanitized = value.replace(/[^0-9+\s()-]/g, '')
    setProfileData({ ...profileData, emergency_contact: sanitized })
  }

  const handleToggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal))
    } else {
      setGoals([...goals, goal])
    }
  }

  const handleToggleSport = (sport: string) => {
    if (sports.includes(sport)) {
      setSports(sports.filter(s => s !== sport))
    } else {
      setSports([...sports, sport])
    }
  }

  // Obtener opciones disponibles
  const availableGoals = FITNESS_GOALS_OPTIONS.filter(g => !goals.includes(g))
  const availableSports = SPORTS_OPTIONS.filter(s => !sports.includes(s))

  // Scroll logic for popovers
  useEffect(() => {
    if (isGoalsPopoverOpen && goalsSectionRef.current) {
      goalsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isGoalsPopoverOpen])

  useEffect(() => {
    if (isSportsPopoverOpen && sportsSectionRef.current) {
      sportsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isSportsPopoverOpen])

  const handleSaveProfile = async () => {
    try {
      // Validaciones básicas
      const newErrors = {
        weight: false,
        height: false,
        emergency_contact: false,
      }

      const weightNumber = profileData.weight !== "" ? Number(profileData.weight) : NaN
      const heightNumber = profileData.height !== "" ? Number(profileData.height) : NaN
      const emergencyDigits = (profileData.emergency_contact || "").replace(/\D/g, "")

      if (Number.isNaN(weightNumber) || weightNumber <= 0) {
        newErrors.weight = true
      }
      if (Number.isNaN(heightNumber) || heightNumber <= 0) {
        newErrors.height = true
      }
      if (emergencyDigits.length < 7) {
        newErrors.emergency_contact = true
      }

      if (newErrors.weight || newErrors.height || newErrors.emergency_contact) {
        setErrors(newErrors)
        toast({
          title: "Datos inválidos",
          description: "Revisa los campos marcados en rojo.",
          variant: "destructive"
        })
        return
      }

      // Resetear errores si todo está OK
      setErrors({
        weight: false,
        height: false,
        emergency_contact: false,
      })

      // Convertir especialidades a string separado por comas

      // Guardar perfil con imagen y nuevos campos
      const profileDataWithSpecs = {
        ...profileData,
        weight: profileData.weight ? Number(profileData.weight) : 0,
        height: profileData.height ? Number(profileData.height) : 0,
        fitness_goals: goals,
        sports: sports
      }
      // @ts-ignore - Ignoring strict type check for partial updates
      await updateProfile(profileDataWithSpecs, profileImage || undefined)
      onClose()
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[480px] p-0 overflow-hidden bg-black/60 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-3xl">
        {/* Header Compacto con Blur */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <DialogTitle className="text-lg font-medium text-white/90">Editar Perfil</DialogTitle>
          {/* Botón Guardar flotante superior - Más abajo y a la izquierda de la X */}
          <div className="pointer-events-auto mr-10 mt-4">
            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-[#FF7939] hover:bg-[#FF7939]/90 text-black font-medium text-xs rounded-full px-4 h-8 transition-all shadow-lg shadow-orange-900/20"
            >
              {loading ? "..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Contenido con scroll personalizado */}
        <div className="max-h-[85vh] overflow-y-auto px-6 pt-20 pb-8 space-y-8 scrollbar-hide">

          {/* Foto de perfil Minimalista */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-[#FF7939]/50 transition-all duration-300">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <User className="h-10 w-10 text-zinc-600" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white/80" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Foto de Perfil</p>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Seccion Personal */}
            <div className="col-span-2 space-y-4">
              <div className="space-y-4">
                <div className="group">
                  <Label htmlFor="full_name" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Nombre completo</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm"
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="location" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Ubicación</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm"
                    placeholder="Ciudad, País"
                  />
                </div>
              </div>
            </div>

            {/* Datos físicos (2 Columnas) */}
            <div className="group">
              <Label htmlFor="birth_date" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Fecha nacimiento</Label>
              <Input
                id="birth_date"
                type="date"
                value={profileData.birth_date}
                onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] w-full text-sm font-medium"
              />
            </div>

            <div className="group">
              <Label htmlFor="gender" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Género</Label>
              <Select value={profileData.gender} onValueChange={(value) => setProfileData({ ...profileData, gender: value })}>
                <SelectTrigger className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus:ring-0 focus:border-[#FF7939] text-sm">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1C1F] border-white/10 text-white">
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="O">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group">
              <Label htmlFor="weight" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={profileData.weight}
                onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm ${errors.weight ? "border-red-500" : ""}`}
                placeholder="0.0"
              />
            </div>

            <div className="group">
              <Label htmlFor="height" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profileData.height}
                onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm ${errors.height ? "border-red-500" : ""}`}
                placeholder="0"
              />
            </div>

            {/* Contacto adicional */}
            <div className="col-span-2 grid grid-cols-2 gap-6 pt-2">
              <div className="group">
                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Teléfono</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm"
                  placeholder="+00 000 0000"
                />
              </div>
              <div className="group">
                <Label htmlFor="emergency" className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-[#FF7939] transition-colors">Emergencia</Label>
                <Input
                  id="emergency"
                  value={profileData.emergency_contact}
                  onChange={(e) => handleEmergencyContactChange(e.target.value)}
                  className={`bg-transparent border-0 border-b border-white/10 rounded-none px-0 py-2 h-auto text-white focus-visible:ring-0 focus-visible:border-[#FF7939] placeholder:text-gray-700 transition-colors text-sm ${errors.emergency_contact ? "border-red-500" : ""}`}
                  placeholder="+00 000 0000"
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Objetivos & Deportes */}
          <div className="space-y-6">
            <div ref={goalsSectionRef}>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[10px] uppercase tracking-widest text-[#FF7939]">Objetivos</Label>
                <button
                  type="button"
                  onClick={() => setIsGoalsPopoverOpen(!isGoalsPopoverOpen)}
                  className="w-6 h-6 rounded-full bg-[#FF7939]/10 text-[#FF7939] flex items-center justify-center hover:bg-[#FF7939]/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {goals.map((g, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleGoal(g)}
                    className="cursor-pointer flex items-center gap-1.5 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-all hover:scale-105"
                  >
                    <span>{g}</span>
                    <X className="h-3 w-3 opacity-50" />
                  </div>
                ))}
                {goals.length === 0 && !isGoalsPopoverOpen && (
                  <span className="text-sm text-gray-600 italic">Sin objetivos seleccionados</span>
                )}
              </div>

              {isGoalsPopoverOpen && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableGoals.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleToggleGoal(g)}
                        className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/5"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={sportsSectionRef}>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[10px] uppercase tracking-widest text-[#FF7939]">Deportes</Label>
                <button
                  type="button"
                  onClick={() => setIsSportsPopoverOpen(!isSportsPopoverOpen)}
                  className="w-6 h-6 rounded-full bg-[#FF7939]/10 text-[#FF7939] flex items-center justify-center hover:bg-[#FF7939]/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sports.map((s, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleSport(s)}
                    className="cursor-pointer flex items-center gap-1.5 bg-[#FF7939]/10 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-[#FF7939]/20"
                  >
                    <span>{s}</span>
                    <X className="h-3 w-3 opacity-50" />
                  </div>
                ))}
                {sports.length === 0 && !isSportsPopoverOpen && (
                  <span className="text-sm text-gray-600 italic">Sin deportes seleccionados</span>
                )}
              </div>

              {isSportsPopoverOpen && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableSports.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSport(s)}
                        className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-colors border border-white/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloque espaciador final para el scroll */}
          <div className="h-4" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

