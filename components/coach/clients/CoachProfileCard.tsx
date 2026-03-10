import { useState } from 'react'
import Image from 'next/image'
import { Star, Award, Calendar, Package, TrendingUp, MapPin, Flame, User, Clock, Video, CheckCircle2, BadgeCheck, ShoppingCart, ChevronDown, Users, DollarSign } from 'lucide-react'

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
    total_clients?: number
    available_meets?: number
    total_sales?: number
  }
  onClick?: () => void
  size?: 'small' | 'medium'
  variant?: 'default' | 'meet' | 'compact'
  priority?: boolean
}

export default function CoachProfileCard({ coach, onClick, size = 'small', variant = 'default', priority = false }: CoachProfileCardProps) {
  const cardClasses = (() => {
    const base = 'group relative overflow-hidden cursor-pointer transition-all duration-500'

    if (variant === 'compact') {
      return `${base} w-full h-[70px] rounded-[16px] border border-white/5 bg-white/5 hover:bg-white/10`
    }

    if (variant === 'meet') {
      const heightClass = size === 'medium' ? 'w-[200px] h-[280px]' : 'w-[160px] h-[230px]'
      return `${base} ${heightClass} rounded-[2rem]`
    }

    const heightClass = size === 'medium' ? 'w-[240px] h-[340px]' : 'w-[200px] h-[280px]'
    return `${base} ${heightClass} rounded-[2.5rem]`
  })()

  // Debug logging - Removed for performance in production


  const ratingValue = typeof coach.rating === 'number' ? coach.rating : 0
  const showRating = ratingValue > 0

  const displayNameRaw = coach.full_name || coach.name
  const displayName = String(displayNameRaw || '').replace(/\s+coach$/i, '').trim()
  const specialization = (coach.specialization || coach.specialties?.[0] || 'GENERAL')

  if (variant === 'compact') {
    return (
      <div onClick={onClick} className={cardClasses}>
        <div className="flex h-full items-center gap-3 px-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[#141414] border border-white/10">
            {coach.avatar_url ? (
              <Image src={coach.avatar_url} alt={displayName} width={40} height={40} className="h-full w-full object-cover" priority={priority} />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-4 w-4 text-[#B0B0B0]" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{displayName}</div>
            <div className="text-[10px] text-[#FF7939] font-medium uppercase tracking-wider">{specialization.split(',')[0]}</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {(Number(coach.available_meets) || 0) > 0 && (
              <div className="flex items-center gap-1 bg-[#FF7939]/10 px-1.5 py-0.5 rounded-full border border-[#FF7939]/20 mb-1">
                <Video className="h-2.5 w-2.5 text-[#FF7939]" />
                <span className="text-[9px] font-bold text-[#FF7939]">{coach.available_meets}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-[#E9B24A] text-[#E9B24A]" />
              <span className="text-[10px] font-bold text-white/80">{showRating ? ratingValue.toFixed(1) : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [isStatsOpen, setIsStatsOpen] = useState(false)

  // ... (existing code)

  // Determine specialties styles - "tono mucho más claro de naranja"
  const specialtyClass = "flex-shrink-0 rounded-full border border-[#FF7939]/20 bg-[#FF7939]/10 px-2 py-0.5 text-[8px] font-bold text-[#FF7939] uppercase tracking-tight whitespace-nowrap"

  return (
    <div
      onClick={onClick}
      className={cardClasses}
    >
      <div className="relative h-full w-full bg-[#121212] rounded-[2rem] overflow-hidden border border-white/10 flex flex-col">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {coach.avatar_url ? (
            <Image
              src={coach.avatar_url}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
              sizes="200px"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              <User className="w-10 h-10 text-white/10" />
            </div>
          )}
          {/* Defined Shading Gradient: Less intense but ensures legibility */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.4) 65%, transparent 100%)'
            }}
          />
        </div>

        {/* Rating Badge - Top Left */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
            <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
            <span className="text-[9px] font-black text-white">{showRating ? ratingValue.toFixed(1) : '—'}</span>
          </div>
        </div>

        {/* Content Section - Defined Layout Sections */}
        <div className="relative z-20 mt-auto p-2 pb-1 flex flex-col items-center text-center">
          {/* Section 1: Name & Specialization (Fixed Height) */}
          <div className="flex flex-col items-center justify-center h-[36px] w-full mb-1">
            <h3 className="text-[12.5px] md:text-[13.5px] font-black text-white tracking-tight leading-none truncate w-[90%] drop-shadow-md">
              {displayName}
            </h3>
            <span className="text-[10px] font-black text-[#FF7939] uppercase tracking-[0.15em] leading-none mt-1 opacity-90">
              {specialization.split(',')[0]}
            </span>
          </div>

          {/* Section 2: Stats Row / Meet Row */}
          {variant === 'meet' ? (
            <div className="flex items-center justify-center gap-2 w-full h-[40px] mb-2">
              <div className="flex items-center gap-1.5 bg-[#FF7939]/10 px-3 py-1.5 rounded-full border border-[#FF7939]/20">
                <Video className="w-3.5 h-3.5 text-[#FF7939]" />
                <span className="text-xs font-black text-white">{coach.available_meets || 0} MEETS</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6 w-full h-[50px] mb-3">
              <div className="flex flex-col items-center justify-center">
                <Flame className="w-4 h-4 text-[#FF7939] mb-1" />
                <div className="flex flex-col items-center">
                  <span className="text-[15.5px] md:text-[16.5px] font-black text-white leading-none">{coach.total_products || 0}</span>
                  <span className="text-[10px] md:text-[10.5px] uppercase font-bold text-white/40 tracking-tighter leading-none mt-1">Prod</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#FF7939] mb-1" />
                <div className="flex flex-col items-center">
                  <span className="text-[15.5px] md:text-[16.5px] font-black text-white leading-none">
                    {coach.total_sales ?? coach.total_clients ?? coach.total_sessions ?? 0}
                  </span>
                  <span className="text-[10px] md:text-[10.5px] uppercase font-bold text-white/40 tracking-tighter leading-none mt-1">Vtas</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Award className="w-4 h-4 text-[#FF7939] mb-1" />
                <div className="flex flex-col items-center">
                  <span className="text-[15.5px] md:text-[16.5px] font-black text-white leading-none">{coach.experience_years || 0}</span>
                  <span className="text-[10px] md:text-[10.5px] uppercase font-bold text-white/40 tracking-tighter leading-none mt-1">Años</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Specialties Horizontal Scroll (Reserved Space) */}
          <div className="w-full h-[36px] flex items-center justify-center mb-2">
            <div className="w-full overflow-x-auto no-scrollbar hide-scrollbar flex gap-2 justify-start px-4">
              {(specialization.split(',').slice(1, 6).filter(s => s.trim().length > 0).length > 0) ? (
                specialization.split(',').slice(1, 6).map((spec, index) => (
                  <div
                    key={index}
                    className="shrink-0 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-[10.5px] font-black text-white/60 uppercase tracking-tight whitespace-nowrap"
                  >
                    {spec.trim()}
                  </div>
                ))
              ) : (
                <div className="h-[1px] w-4 opacity-0" />
              )}
            </div>
          </div>

          {/* Section 4: Down Indicator "v" - Stable */}
          <div className="flex justify-center h-[12px] opacity-40">
            <ChevronDown className="w-3 h-3 text-[#FF7939]" />
          </div>
        </div>
      </div>
    </div>
  )
}
