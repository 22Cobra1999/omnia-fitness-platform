"use client"

import { Award, Flame, MapPin, Star, User } from "lucide-react"

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
      <div className="relative p-6 pb-4">
        {/* Racha en esquina superior izquierda */}
        {showStreak && (
          <div className="absolute top-4 left-4 z-20">
            <div className="flex items-center space-x-2 bg-orange-500/20 px-3 py-1 rounded-full">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{streakCount}</span>
            </div>
          </div>
        )}

        {/* Contenido del header */}
        <div className="relative z-10 text-center">
          {/* Avatar con acciones laterales */}
          <div className="flex justify-center items-center gap-6 mb-4">
            {leftAction && (
              <div className="shrink-0 flex items-center justify-center">
                {leftAction}
              </div>
            )}

            <div className="w-24 h-24 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-black/20">
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
          <h1 className="text-2xl font-bold text-white mb-2">
            {displayName}
          </h1>

          {/* Rating, Ventas, Ubicación y edad en la misma línea */}
          <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
            {/* Rating */}
            {coach.rating && coach.rating > 0 ? (
              <div className="flex items-center text-[#FF7939]">
                <Star className="w-4 h-4 fill-current mr-1" />
                <span className="text-sm font-semibold">{coach.rating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-400">
                <Star className="w-4 h-4 mr-1" />
                <span className="text-xs">Sin reseñas</span>
              </div>
            )}

            {/* Ventas totales */}
            {coach.total_sales !== null && coach.total_sales !== undefined && (
              <div className="flex items-center text-gray-300">
                <span className="text-sm">
                  {coach.total_sales} ventas
                </span>
              </div>
            )}

            {/* Ubicación */}
            {coach.location && (
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 text-[#FF7939] mr-1" />
                <span className="text-sm">{coach.location}</span>
              </div>
            )}

            {/* Edad */}
            {coach.age_years && (
              <div className="flex items-center text-gray-300">
                <span className="text-sm">{coach.age_years} años</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {coach.bio && (
            <div className="text-center mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {coach.bio}
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

          <div className="flex items-center text-gray-300">
            <Award className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm">{certificationsCount} cert.</span>
          </div>
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
