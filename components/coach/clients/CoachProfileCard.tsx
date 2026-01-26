import Image from 'next/image'
import { Star, Award, Calendar, Package, TrendingUp, MapPin, Flame, User, Clock, Video } from 'lucide-react'

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
    bio?: string
    location?: string
    available_meets?: number
  }
  onClick?: () => void
  size?: 'small' | 'medium'
  variant?: 'default' | 'meet' | 'compact'
}

export default function CoachProfileCard({ coach, onClick, size = 'small', variant = 'default' }: CoachProfileCardProps) {
  const cardClasses = (() => {
    const base = 'group relative overflow-hidden cursor-pointer transition-all duration-300'

    if (variant === 'compact') {
      return `${base} w-full h-[70px] rounded-[16px] border border-white/5 bg-white/5 hover:bg-white/10`
    }

    const standardBase = 'rounded-[20px] border border-[#2A2A2A] bg-[#0F0F0F]/85 backdrop-blur-[12px]'
    const sizing = size === 'medium' ? 'w-full h-[95px]' : 'w-[260px] h-[95px]'
    return `${base} ${standardBase} ${sizing}`
  })()

  const ratingValue = typeof coach.rating === 'number' ? coach.rating : 0
  const showRating = ratingValue > 0

  const displayNameRaw = coach.full_name || coach.name
  const displayName = String(displayNameRaw || '').replace(/\s+coach$/i, '').trim()
  const specialization = (coach.specialization || coach.specialties?.[0] || 'Fitness')

  if (variant === 'compact') {
    return (
      <div onClick={onClick} className={cardClasses}>
        <div className="flex h-full items-center gap-3 px-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-[#141414] border border-white/10">
            {coach.avatar_url ? (
              <Image src={coach.avatar_url} alt={displayName} width={40} height={40} className="h-full w-full object-cover" />
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
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-[#E9B24A] text-[#E9B24A]" />
              <span className="text-[10px] font-bold text-white/80">{showRating ? ratingValue.toFixed(1) : '—'}</span>
            </div>
            <div className="text-[9px] text-white/40">{coach.experience_years || 0} años exp.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cardClasses}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 130% at 50% 10%, rgba(255,140,60,0.05) 0%, rgba(0,0,0,0) 60%)',
        }}
      />

      <div className="relative z-10 flex h-full items-center gap-3.5 px-3.5 py-2.5">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          {/* Rating Badge ABOVE the avatar, not overlapping */}
          <div className="inline-flex items-center gap-0.5 rounded-full bg-white/5 px-1.5 py-0.5 border border-white/10">
            <Star className="h-2.5 w-2.5 fill-[#E9B24A] text-[#E9B24A]" />
            <span className="text-[10px] font-bold text-white/80">{showRating ? ratingValue.toFixed(1) : '—'}</span>
            {coach.total_clients && coach.total_clients > 0 && (
              <span className="text-[9px] font-medium text-white/50">({coach.total_clients})</span>
            )}
          </div>

          <div className="h-[54px] w-[54px] rounded-full overflow-hidden bg-[#141414]">
            {coach.avatar_url ? (
              <Image src={coach.avatar_url} alt={displayName} width={54} height={54} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-6 w-6 text-[#B0B0B0]" />
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="truncate text-sm font-bold text-white/95 tracking-tight leading-tight">
              {displayName}
            </div>
            <div className="flex-shrink-0 text-[9px] font-bold text-[#FF7939]/70 uppercase tracking-widest">{specialization.split(',')[0]}</div>
          </div>

          <div className="flex items-center gap-2.5">
            {variant === 'meet' ? (
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <Video className="w-3.5 h-3.5 text-[#FF7939] opacity-80" />
                  {coach.available_meets && coach.available_meets > 0 && (
                    <div className="absolute -top-1.5 -right-2 bg-[#FF7939] text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {coach.available_meets}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/30 tracking-wider uppercase">Meets</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[11px] text-white/40">
                <div className="flex items-center gap-1 font-medium">
                  <Flame className="h-3 w-3 text-[#FF7939]" />
                  <span>{coach.total_products || 0} productos</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <Award className="h-3 w-3 text-[#FF7939]" />
                  <span>{coach.experience_years || 0} años</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[180px]">
            {specialization.split(',').slice(1, 10).map((spec, index) => (
              <div
                key={index}
                className="flex-shrink-0 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] font-bold text-white/40 uppercase tracking-tight whitespace-nowrap"
              >
                {spec.trim()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
