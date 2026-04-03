"use client"

import { Award, Flame, MapPin, Scale, Star, Zap, User, Utensils } from "lucide-react"

interface CoachPersonalInfoSectionProps {
  coach: {
    full_name?: string
    name?: string
    avatar_url?: string
    location?: string | null
    age_years?: number | null
    bio?: string | null
    specialization?: string | null
    certifications?: string[] | null
    certifications_count?: number
    rating?: number
    total_sales?: number | null
    experience_years?: number | string | null
    category?: 'fitness' | 'nutrition' | 'general' | string | null
  }
  variant?: 'profile' | 'modal'
  showEditButton?: boolean
  onEditClick?: () => void
  showStreak?: boolean
  streakCount?: number
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}

export function CoachPersonalInfoSection({
  coach,
  variant = 'profile',
  showEditButton = false,
  onEditClick,
  showStreak = false,
  streakCount = 0,
  leftAction,
  rightAction
}: CoachPersonalInfoSectionProps) {
  const displayName = coach.full_name || coach.name || "Coach"
  const avatarUrl = coach.avatar_url

  // Parsear especialidades
  const specsRaw = coach.specialization || ""
  const specs = specsRaw
    ? specsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : []

  // Contar certificaciones
  const certificationsCount =
    coach.certifications_count ??
    (Array.isArray(coach.certifications) ? coach.certifications.length : 0)

  if (variant === 'modal') {
    // Variante para modal (más compacta, sin fondo difuminado)
    return (
      <div className="relative p-4 pb-2">
        {/* Rating y Ventas en esquina superior izquierda */}
        <div className="absolute top-3 left-4 z-20">
          <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            <Star className="h-3 w-3 text-[#FF7939] fill-[#FF7939]" />
            <span className="text-[10px] font-black text-white italic">
              {coach.rating?.toFixed(1) || "0.0"} 
              <span className="ml-1 text-white/40 font-bold">({coach.total_sales || 0})</span>
            </span>
          </div>
        </div>

        {/* Contenido del header */}
        <div className="relative z-10 text-center">
          {/* Avatar con acciones laterales */}
          <div className="flex justify-center items-center gap-6 mb-3">
            {leftAction && (
              <div className="shrink-0 flex items-center justify-center">
                {leftAction}
              </div>
            )}

            <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-white/5 shadow-2xl">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-white font-bold">{displayName[0]}</span>
              )}
            </div>

            {rightAction && (
              <div className="shrink-0 flex items-center justify-center">
                {rightAction}
              </div>
            )}
          </div>

          {/* Nombre */}
          <h1 className="text-xl font-black text-white mb-2 tracking-tight italic uppercase">
            {displayName}
          </h1>

          {/* Subtitle: Categoría, Años, Ventas, Ubicación */}
          <div className="flex flex-col items-center gap-2 mb-4">
               {/* Primera fila: Ubicación y Experiencia */}
               <div className="flex items-center justify-center gap-3 text-[10px] uppercase font-black italic tracking-widest text-white/50">
                    {coach.location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FF7939]" />
                            <span>{coach.location}</span>
                        </div>
                    )}
                    {coach.experience_years !== null && coach.experience_years !== undefined && (
                        <div className="flex items-center gap-1.5">
                            <Award className="w-3 h-3 text-[#FF7939]" />
                            <span>{coach.experience_years} {Number(coach.experience_years) === 1 ? 'AÑO' : 'AÑOS'} EXP.</span>
                        </div>
                    )}
               </div>

               {/* Segunda fila: Burbuja de Categoría */}
               <div className="flex items-center gap-2 mt-1">
                   {coach.category && (
                       <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                           <div className="w-4 h-4 rounded-full bg-[#FF7939]/20 flex items-center justify-center">
                               {coach.category === 'fitness' ? (
                                   <Zap className="w-2.5 h-2.5 text-[#FF7939]" fill="currentColor" />
                               ) : coach.category === 'nutrition' ? (
                                   <Utensils className="w-2.5 h-2.5 text-green-500" />
                               ) : (
                                   <Scale className="w-2.5 h-2.5 text-blue-400" />
                               )}
                           </div>
                           <span className="text-[9px] font-black text-white/80 uppercase italic tracking-tighter">Coach {coach.category}</span>
                       </div>
                   )}
               </div>
          </div>

          {/* Bio */}
          {/* Bio - Omit if redundant with specs */}
          {coach.bio && coach.bio !== specsRaw && (
            <div className="text-center mb-4 px-2">
              <p className="text-gray-300/80 text-xs leading-relaxed italic">
                "{coach.bio}"
              </p>
            </div>
          )}

          {/* Especialidades - chips */}
          {specs.length > 0 && (
            <div className="text-center mb-4">
              <div className="flex flex-wrap justify-center gap-1">
                {specs.map((spec, idx) => (
                  <span
                    key={`${spec}-${idx}`}
                    className="bg-[#FF7939]/10 text-[#FF7939] text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-[#FF7939]/20 whitespace-nowrap"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certificaciones */}

        </div>
      </div>
    )
  }

  // Variante para perfil (con fondo difuminado y botón de editar)
  return (
    <div
      className="bg-[#1A1C1F] rounded-2xl p-4 relative overflow-hidden"
      style={{
        backgroundImage: avatarUrl
          ? `linear-gradient(rgba(26, 28, 31, 0.7), rgba(26, 28, 31, 0.8)), url(${avatarUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Fondo difuminado adicional */}
      {avatarUrl && (
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${avatarUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(12px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Contenido del perfil con z-index para estar encima del fondo */}
      <div className="relative z-10">
        {/* Racha en esquina superior izquierda */}
        {showStreak && (
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{streakCount}</span>
            </div>
          </div>
        )}

        {/* Botón de editar en esquina superior derecha */}
        {showEditButton && onEditClick && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onEditClick}
              className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl p-2 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}

        {/* Imagen centrada */}
        <div className="flex justify-center mb-2 pt-2">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-white" />
            )}
          </div>
        </div>

        {/* Nombre centrado */}
        <div className="text-center mb-2">
          <h1 className="text-lg font-semibold">{displayName}</h1>
        </div>

        {/* Rating + Ventas + Certificaciones */}
        <div className="flex items-center justify-center gap-4 mb-2 flex-wrap">
          {coach.rating && coach.rating > 0 ? (
            <div className="flex items-center text-[#FF7939]">
              <Star className="h-4 w-4 fill-current mr-1" />
              <span className="text-sm font-semibold">{coach.rating.toFixed(1)}</span>
            </div>
          ) : null}

          {coach.total_sales !== null && coach.total_sales !== undefined && (
            <div className="flex items-center text-gray-300">
              <span className="text-sm">{coach.total_sales} ventas</span>
            </div>
          )}

          {((coach.experience_years !== null && coach.experience_years !== undefined) || certificationsCount > 0) && (
            <div className="flex items-center text-gray-300">
              <Award className="h-4 w-4 text-[#FF7939] mr-1" />
              <span className="text-sm font-bold tracking-tight">
                {(coach.experience_years !== null && coach.experience_years !== undefined) ? `${coach.experience_years} ${Number(coach.experience_years) === 1 ? 'año' : 'años'}` : ''}
                {certificationsCount > 0 ? ` ${coach.experience_years ? '• ' : ''}${certificationsCount} cert.` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Ubicación + Edad */}
        <div className="flex items-center justify-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">{coach.location || "No especificada"}</span>
          </div>

          {coach.age_years ? (
            <div className="flex items-center">
              <span className="text-sm text-gray-300">{coach.age_years} años</span>
            </div>
          ) : null}
        </div>

        {/* Bio */}
        {coach.bio && (
          <div className="text-center mb-3">
            <p className="text-gray-300 text-sm">{coach.bio}</p>
          </div>
        )}

        {/* Especialidades */}
        {specs.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {specs.map((spec, idx) => (
              <span
                key={`${spec}-${idx}`}
                className="bg-[#FF7939]/10 text-[#FF7939] text-xs px-3 py-1 rounded-full border border-[#FF7939]/20"
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
