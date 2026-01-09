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
  const cardClasses = (() => {
    const base =
      'group relative overflow-hidden cursor-pointer rounded-[22px] border border-[#2A2A2A] bg-[#0F0F0F]/78 backdrop-blur-[10px] transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
    const glow = 'shadow-[0_18px_34px_rgba(255,140,58,0.22),0_0_40px_rgba(255,140,58,0.10)]'
    const hover = 'hover:shadow-[0_22px_42px_rgba(255,140,58,0.28),0_0_52px_rgba(255,140,58,0.14)]'
    const sizing = size === 'medium'
      ? 'w-full h-[124px]'
      : 'min-w-[260px] h-[124px]'

    return `${base} ${glow} ${hover} ${sizing}`
  })()

  const ratingValue = typeof coach.rating === 'number' ? coach.rating : 0
  const showRating = ratingValue > 0

  const displayNameRaw = coach.full_name || coach.name
  const displayName = String(displayNameRaw || '').replace(/\s+coach$/i, '').trim()
  const location = coach.location || '—'
  const years = typeof coach.experience_years === 'number' ? coach.experience_years : 0

  const specialization = (coach.specialization || coach.specialties?.[0] || 'Fitness')
  const categoryTag = String(specialization).toUpperCase()

  return (
    <div 
      onClick={onClick}
      className={cardClasses}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 55% 45%, rgba(255,140,60,0.10) 0%, rgba(0,0,0,0) 60%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Partial orange light (no full contour) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(90% 70% at 86% 92%, rgba(255,140,58,0.22) 0%, rgba(255,140,58,0.0) 65%)',
          mixBlendMode: 'screen',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,140,60,0.08), inset 0 -2px 0 rgba(255,140,60,0.18)',
        }}
      />

      {/* Rating */}
      <div className="absolute top-3 left-3 z-10">
        <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(233,178,74,0.16)] px-2 py-0.5 text-[11px] font-semibold text-[#E9B24A] border border-[rgba(233,178,74,0.32)]">
          <Star className="h-3.5 w-3.5 fill-[#E9B24A] text-[#E9B24A]" />
          <span>{showRating ? ratingValue.toFixed(1) : '—'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center gap-4 px-5 py-4">
        <div className="flex-shrink-0">
          <div className="rounded-full bg-[rgba(255,140,58,0.10)] border border-[rgba(255,140,58,0.22)] backdrop-blur-[6px] p-[2px]">
            <div className="h-[56px] w-[56px] rounded-full overflow-hidden bg-[#141414]">
              {coach.avatar_url ? (
                <Image src={coach.avatar_url} alt={displayName} width={56} height={56} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-5 w-5 text-[#B0B0B0]" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div className="truncate text-[19px] font-medium text-[#F2F2F2]/90">
              {displayName}
            </div>
            <div className="text-[13px] font-normal text-[#9A9A9A]/80 truncate">coach</div>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[14px] text-[#B0B0B0]">
            <MapPin className="h-4 w-4 text-[#FF8C3A]" />
            <span className="truncate">{location} • {years} años</span>
          </div>

          <div className="mt-3 inline-flex items-center rounded-full border border-[#FF7939]/30 bg-[#FF7939]/20 px-3 py-1 text-[11px] font-medium text-[#FF7939]">
            {categoryTag}
          </div>
        </div>
      </div>
    </div>
  )
}
