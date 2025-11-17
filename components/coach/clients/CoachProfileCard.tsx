import Image from 'next/image'
import { Star, Award, Calendar, Package, TrendingUp, MapPin, Flame, User } from 'lucide-react'

interface CoachProfileCardProps {
  coach: {
    id: string
    name: string
    full_name?: string
    avatar_url?: string
    specialization?: string
    specialties?: string[]
    rating?: number
    experience_years?: number
    certifications?: string[]
    total_products?: number
    total_sessions?: number
    bio?: string
    location?: string
  }
  onClick?: () => void
  size?: 'small' | 'medium'
}

export default function CoachProfileCard({ coach, onClick, size = 'small' }: CoachProfileCardProps) {
  const getCardClasses = () => {
    if (size === 'medium') {
      return 'relative bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-[#FF7939]/20 border border-[#2A2A2A] hover:border-[#FF7939]/30 w-full h-[160px] overflow-hidden'
    }
    return 'relative bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-[#FF7939]/20 border border-[#2A2A2A] hover:border-[#FF7939]/30 min-w-[240px] h-[140px] overflow-hidden'
  }

  return (
    <div 
      onClick={onClick}
      className={getCardClasses()}
    >
      {/* Imagen de fondo difuminada */}
      {coach.avatar_url && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <Image 
            src={coach.avatar_url} 
            alt={coach.name} 
            fill
            className="object-cover blur-sm scale-110" 
          />
          {/* Overlay oscuro para contraste */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Contenido encima de la imagen */}
      <div className="relative z-10 flex flex-col h-full p-3">
        {/* Rating en esquina superior izquierda (donde estaba el fuego) */}
        <div className="absolute top-2 left-2">
          {coach.rating && coach.rating > 0 ? (
            <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">{coach.rating.toFixed(1)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-gray-500/20 px-2 py-1 rounded-full">
              <Star className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">N/A</span>
            </div>
          )}
        </div>

        {/* Imagen centrada - más pequeña */}
        <div className="flex justify-center mb-1 pt-1">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
            {coach.avatar_url ? (
              <img 
                src={coach.avatar_url} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

               {/* Nombre centrado - más arriba */}
               <div className="text-center mb-1">
                 <h1 className="text-base font-semibold text-white truncate">
                   {coach.full_name || coach.name}
                 </h1>
               </div>

               {/* Información organizada - más compacta */}
               <div className="space-y-1">
                 {/* Ubicación y experiencia */}
                 <div className="flex items-center justify-center space-x-3">
                   <div className="flex items-center space-x-1">
                     <MapPin className="h-4 w-4 text-[#FF7939]" />
                     <span className="text-sm text-gray-300">{coach.location || "No especificada"}</span>
                   </div>
                   <div className="flex items-center space-x-1">
                     <span className="text-sm text-gray-300">{coach.experience_years || 0} años</span>
                   </div>
                 </div>

                 {/* Especialidades - frames separados */}
                 <div className="text-center">
                   {(() => {
                     const specializations = coach.specialization || coach.specialties?.slice(0, 2).join(", ") || "Sin especialidades"
                     if (specializations === "Sin especialidades") {
                       return <span className="text-sm text-gray-300">Sin especialidades</span>
                     }
                     
                     // Separar por coma y crear frames individuales
                     const specs = specializations.split(",").map(s => s.trim()).filter(s => s.length > 0)
                     return (
                       <div className="flex flex-wrap justify-center gap-1">
                         {specs.map((spec, index) => (
                           <span 
                             key={`${spec}-${index}`}
                             className="text-xs text-[#FF7939] bg-[#FF7939]/10 backdrop-blur-sm px-2 py-1 rounded-full font-medium border border-[#FF7939]/20"
                           >
                             {spec}
                           </span>
                         ))}
                       </div>
                     )
                   })()}
                 </div>
               </div>
      </div>
    </div>
  )
}
