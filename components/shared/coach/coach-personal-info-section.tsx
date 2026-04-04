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
    instagram_username?: string | null
    country?: string | null
    city?: string | null
    neighborhood?: string | null
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
        {/* Rating Badge */}
        <div className="absolute top-3 left-4 z-20">
          <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            <Star className="h-3 w-3 text-[#FF7939] fill-[#FF7939]" />
            <span className="text-[10px] font-black text-white italic">
              {coach.rating?.toFixed(1) || "0.0"} 
            </span>
          </div>
        </div>

        <div className="relative z-10 text-center">
          {/* Instagram clickable above photo */}
          <div className="h-6 mb-2">
            {coach.instagram_username && (
              <a 
                href={`https://instagram.com/${coach.instagram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-black text-white/40 hover:text-[#FF7939] transition-colors uppercase tracking-widest italic"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center scale-90">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                </div>
                @{coach.instagram_username}
              </a>
            )}
          </div>

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
          <h1 className="text-xl font-black text-white mb-2 tracking-tighter italic uppercase scale-y-90">
            {displayName}
          </h1>

          {/* Subtitle Row - COMBINED */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 px-2">
               {/* Categoría Logo ONLY - un poco más grande */}
               {coach.category && (
                    <div className="w-6 h-6 rounded-full bg-[#FF7939]/20 flex items-center justify-center p-1 border border-[#FF7939]/20">
                        {coach.category === 'fitness' ? (
                            <Zap className="w-full h-full text-[#FF7939]" fill="currentColor" />
                        ) : coach.category === 'nutrition' ? (
                            <Utensils className="w-full h-full text-green-500" />
                        ) : (
                            <Scale className="w-full h-full text-blue-400" />
                        )}
                    </div>
               )}

               {/* Ubicación */}
               {coach.location && coach.location !== "No especificada" && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-white/50 uppercase italic tracking-wider">
                        <MapPin className="w-3 h-3 text-[#FF7939]" />
                        <span>{coach.location}</span>
                    </div>
               )}

               {/* Experiencia - Mayor a 0 */}
               {coach.experience_years !== null && Number(coach.experience_years) > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-white/50 uppercase italic tracking-wider">
                        <Award className="w-3 h-3 text-[#FF7939]" />
                        <span>{coach.experience_years} {Number(coach.experience_years) === 1 ? 'AÑO' : 'AÑOS'} EXP.</span>
                    </div>
               )}

               {/* Ventas con $ */}
               {coach.total_sales !== null && (
                   <div className="flex items-center gap-1 text-[10px] font-black text-white/50 uppercase italic tracking-wider">
                       <span className="text-[#FF7939]">$</span>
                       <span>{coach.total_sales} ventas</span>
                   </div>
               )}
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
      className="bg-[#1A1C1F] rounded-3xl p-4 relative overflow-hidden pb-10 shadow-2xl border border-white/5"
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
        {/* DIAGNOSTICO */}
        {(() => { console.log('👤 RENDERING HEADER FOR:', displayName, 'RATING:', coach.rating, 'LOC:', coach.location, 'SPECS:', coach.specialization); return null; })()}
        
        {/* Rating Badge en esquina superior izquierda - Más Prominente */}
        <div className="absolute top-5 left-5 z-20">
          {coach.rating && (
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 group animate-in zoom-in slide-in-from-top-4 duration-700 shadow-[0_0_20px_rgba(255,121,57,0.3)] hover:scale-110 transition-all cursor-default">
              <Star className="h-4 w-4 text-[#FF7939] fill-[#FF7939] drop-shadow-[0_0_5px_rgba(255,121,57,0.5)]" />
              <span className="text-[13px] font-black text-white italic tracking-tighter">
                {typeof coach.rating === 'number' ? coach.rating.toFixed(1) : coach.rating}
              </span>
            </div>
          )}
        </div>

        {/* Botón de editar en esquina superior derecha */}
        {showEditButton && onEditClick && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onEditClick}
              className="text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl p-2 transition-colors group"
            >
              <svg className="h-5 w-5 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}

        {/* Instagram Arriba de la Foto */}
        <div className="flex justify-center mb-1 mt-4">
          {coach.instagram_username && (
            <a 
              href={`https://instagram.com/${coach.instagram_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center scale-90 group-hover:scale-110 transition-transform">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
              </div>
              <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors italic tracking-wider">@{coach.instagram_username}</span>
            </a>
          )}
        </div>

        {/* Imagen centrada */}
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden ring-4 ring-white/5 shadow-2xl transition-transform hover:scale-105 duration-300">
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
          <h1 className="text-xl font-black italic tracking-tighter uppercase scale-y-95">{displayName}</h1>
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

        {/* Especialidades - Ahora arriba de Ubicación para asegurar visibilidad */}
        {specs.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4 px-6">
            {specs.map((spec, idx) => (
              <span
                key={`${spec}-${idx}`}
                className="bg-[#FF7939]/20 text-white text-[10px] uppercase font-black italic tracking-widest px-4 py-1.5 rounded-full border border-[#FF7939]/30 shadow-[0_0_15px_rgba(255,121,57,0.1)]"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Ubicación + Edad */}
        <div className="flex items-center justify-center gap-4 mt-4 mb-3 flex-wrap">
          <div className="flex items-center space-x-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <MapPin className="h-3.5 w-3.5 text-[#FF7939]" />
            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-tight">
              {(() => {
                const parts = [coach.country, coach.city, coach.neighborhood].filter(Boolean).filter(s => s !== 'null')
                if (parts.length > 0) return parts.join(', ')
                return coach.location && coach.location !== 'null' ? coach.location : "No especificada"
              })()}
            </span>
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
      </div>
    </div>
  )
}
