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

// Lista predefinida de especialidades (máximo 25)
const PREDEFINED_SPECIALIZATIONS = [
  // Fitness y entrenamiento
  "Fitness General",
  "Entrenamiento Funcional",
  "CrossFit",
  "Calistenia",
  "Pilates",
  "Yoga",
  "Spinning",
  "HIIT",
  "Bodybuilding",
  "Powerlifting",
  "Running",
  "Ciclismo",
  "Natación",
  "Boxeo",
  "MMA",
  // Deportes
  "Fútbol",
  "Básquet",
  "Tenis",
  "Vóley",
  "Rugby",
  // Nutrición
  "Nutrición Deportiva",
  "Nutrición Clínica",
  "Nutrición Vegana",
  "Nutrición Vegetariana",
  "Pérdida de Peso",
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
  
  const [specializations, setSpecializations] = useState<string[]>([])
  const [isSpecializationPopoverOpen, setIsSpecializationPopoverOpen] = useState(false)
  const [errors, setErrors] = useState({
    weight: false,
    height: false,
    emergency_contact: false,
  })
  
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const specializationsSectionRef = useRef<HTMLDivElement | null>(null)

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
      
      // Cargar especialidades desde el perfil (si existe specialization)
      if ((profile as any).specialization) {
        const specs = (profile as any).specialization
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
        setSpecializations(specs)
      } else {
        setSpecializations([])
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

  const handleAddSpecialization = (spec: string) => {
    // Máximo 5 especialidades
    if (specializations.length >= 5) {
      toast({
        title: "Límite de especialidades",
        description: "Solo puedes seleccionar hasta 5 especialidades.",
        variant: "destructive"
      })
      return
    }

    if (!specializations.includes(spec)) {
      setSpecializations([...specializations, spec])
    }
  }

  const handleRemoveSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec))
  }

  // Obtener especialidades disponibles (las que no están ya seleccionadas)
  const availableSpecializations = PREDEFINED_SPECIALIZATIONS.filter(
    spec => !specializations.includes(spec)
  )

  // Cuando abrimos la lista de especialidades, hacer scroll para que quede visible
  useEffect(() => {
    if (isSpecializationPopoverOpen && specializationsSectionRef.current) {
      specializationsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }
  }, [isSpecializationPopoverOpen])

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
      const specializationString = specializations.join(', ')
      
      // Guardar perfil con imagen si existe y especialidades
      const profileDataWithSpecs = {
        ...profileData,
        specialization: specializationString
      }
      await updateProfile(profileDataWithSpecs, profileImage || undefined)
      onClose()
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[520px] mx-auto bg-[#1A1C1F] border-gray-700 text-white max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white pr-20">Editar Perfil</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Actualiza tu información personal y configuración de perfil
          </DialogDescription>
        </DialogHeader>
        
        {/* Botón Guardar Perfil a la altura de la X de cerrar (top-6 = 1.5rem = 24px) */}
        <Button 
          onClick={handleSaveProfile}
          disabled={loading}
          className="absolute top-6 right-14 bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1.5 text-xs hover:bg-[#FF7939]/30 transition-colors h-auto z-10"
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center hover:bg-[#FF8C42] transition-colors"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-400 text-center">
                  Toca la cámara para cambiar tu foto
                </p>
              </div>

              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-white">Nombre completo</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-white">Ubicación</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Ciudad, País"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact" className="text-white">Contacto de emergencia (teléfono)</Label>
                  <Input
                    id="emergency_contact"
                    value={profileData.emergency_contact}
                    type="tel"
                    inputMode="tel"
                    onChange={(e) => handleEmergencyContactChange(e.target.value)}
                    className={`bg-gray-800 text-white ${errors.emergency_contact ? "border-red-500 focus-visible:ring-red-500" : "border-gray-600"}`}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>

              {/* Información física */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Información física</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birth_date" className="text-white">Fecha de nacimiento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={profileData.birth_date}
                      onChange={(e) => setProfileData({...profileData, birth_date: e.target.value})}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                  <Label htmlFor="weight" className="text-white">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={profileData.weight}
                    onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
                    className={`bg-gray-800 text-white ${errors.weight ? "border-red-500 focus-visible:ring-red-500" : "border-gray-600"}`}
                      placeholder="70.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height" className="text-white">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileData.height}
                    onChange={(e) => setProfileData({...profileData, height: e.target.value})}
                    className={`bg-gray-800 text-white ${errors.height ? "border-red-500 focus-visible:ring-red-500" : "border-gray-600"}`}
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-white">Género</Label>
                    <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
                      <SelectTrigger className="relative z-20 bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="z-[70] bg-gray-800 border-gray-600">
                        <SelectItem value="M" className="text-white">Masculino</SelectItem>
                        <SelectItem value="F" className="text-white">Femenino</SelectItem>
                        <SelectItem value="O" className="text-white">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div ref={specializationsSectionRef}>
                  <Label htmlFor="specializations" className="text-white">Especialidades</Label>
                  <div className="space-y-2">
                    {/* Chips de especialidades con scroll horizontal */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
                      {specializations.map((spec, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialization(spec)}
                            className="ml-1 hover:bg-[#FF7939]/30 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}

                      {/* Botón + para agregar especialidades */}
                      <button
                        type="button"
                        onClick={() => setIsSpecializationPopoverOpen(!isSpecializationPopoverOpen)}
                        className="flex items-center justify-center bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 rounded-full px-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 hover:bg-[#FF7939]/30 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Lista de especialidades disponibles (aparece debajo cuando se presiona +).
                        Diseño más minimalista, usando solo el fondo base y menos marco. */}
                    {isSpecializationPopoverOpen && (
                      <div className="mt-1 space-y-2">
                        <p className="text-xs font-medium text-gray-300">Selecciona especialidades</p>
                        <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                          {availableSpecializations.map((spec) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => handleAddSpecialization(spec)}
                              className="text-left px-3 py-2 rounded-lg bg-gray-800/70 hover:bg-gray-700 text-white text-sm transition-colors border border-gray-700/70"
                            >
                              {spec}
                            </button>
                          ))}
                          {availableSpecializations.length === 0 && (
                            <div className="col-span-2 text-center text-gray-400 text-xs py-2">
                              Todas las especialidades han sido agregadas
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

