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
  Camera
} from "lucide-react"
import { useProfileManagement } from "@/hooks/use-profile-management"
import { useToast } from "@/components/ui/use-toast"

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  editingSection?: string | null
}

export function ProfileEditModal({ isOpen, onClose, editingSection }: ProfileEditModalProps) {
  const { profile, updateProfile, loading } = useProfileManagement()
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
  
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Actualizar datos del formulario cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        emergency_contact: profile.emergency_contact || "",
        birth_date: profile.birth_date || "",
        weight: profile.weight || "",
        height: profile.height || "",
        gender: profile.gender || "",
        level: profile.level || "Principiante"
      })
      setPreviewImage(profile.avatar_url || null)
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

  const handleSaveProfile = async () => {
    try {
      // Guardar perfil con imagen si existe
      await updateProfile(profileData, profileImage || undefined)
      onClose()
    } catch (error) {
      console.error("Error saving profile:", error)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] mx-auto bg-[#1A1C1F] border-gray-700 text-white max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-white">Editar Perfil</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Actualiza tu información personal y configuración de perfil
          </DialogDescription>
        </DialogHeader>

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
                  <Label htmlFor="emergency_contact" className="text-white">Contacto de emergencia</Label>
                  <Input
                    id="emergency_contact"
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData({...profileData, emergency_contact: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Nombre y teléfono"
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
                      onChange={(e) => setProfileData({...profileData, weight: parseFloat(e.target.value) || ""})}
                      className="bg-gray-800 border-gray-600 text-white"
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
                      onChange={(e) => setProfileData({...profileData, height: parseFloat(e.target.value) || ""})}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-white">Género</Label>
                    <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="M" className="text-white">Masculino</SelectItem>
                        <SelectItem value="F" className="text-white">Femenino</SelectItem>
                        <SelectItem value="O" className="text-white">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="level" className="text-white">Nivel de fitness</Label>
                  <Select value={profileData.level} onValueChange={(value) => setProfileData({...profileData, level: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="Principiante" className="text-white">Principiante</SelectItem>
                      <SelectItem value="Intermedio" className="text-white">Intermedio</SelectItem>
                      <SelectItem value="Avanzado" className="text-white">Avanzado</SelectItem>
                      <SelectItem value="Experto" className="text-white">Experto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
        </div>

        {/* Botón fijo en la parte inferior */}
        <div className="flex-shrink-0 pt-4">
          <Button 
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full bg-[#FF6A00] hover:bg-[#FF8C42] text-white"
          >
            {loading ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

