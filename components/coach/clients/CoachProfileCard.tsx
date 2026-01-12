import Image from 'next/image'
import { Star, Award, Calendar, Package, TrendingUp, MapPin, Flame, User, Clock } from 'lucide-react'

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
    available_meets?: number
  }
  onClick?: () => void
  size?: 'small' | 'medium'
  variant?: 'default' | 'meet'
}

export default function CoachProfileCard({ coach, onClick, size = 'small', variant = 'default' }: CoachProfileCardProps) {
  const cardClasses = (() => {
    const base =
      'group relative overflow-hidden cursor-pointer rounded-[22px] border border-[#2A2A2A] bg-[#0F0F0F]/78 backdrop-blur-[10px] transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
    const glow = 'shadow-[0_18px_34px_rgba(255,140,58,0.22),0_0_40px_rgba(255,140,58,0.10)]'
    // const hover = 'hover:shadow-[0_22px_42px_rgba(255,140,58,0.28),0_0_52px_rgba(255,140,58,0.14)]' // Removed luminous effect
    const hover = ''
    const sizing = size === 'medium'
      ? 'w-full h-[124px]'
      : 'w-fit max-w-[85vw] h-[124px]'

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
            'radial-gradient(130% 130% at 50% 10%, rgba(255,140,60,0.06) 0%, rgba(0,0,0,0) 60%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Partial orange light (no full contour) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(80% 60% at 80% 90%, rgba(255,140,58,0.1) 0%, rgba(255,140,58,0.0) 70%)',
          mixBlendMode: 'screen',
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,140,60,0.05), inset 0 -1px 0 rgba(255,140,60,0.05)',
        }}
      />

      {/* Rating */}
      <div className="absolute top-3 left-3 z-10">
        <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(233,178,74,0.16)] px-1.5 py-0.5 text-[10px] font-semibold text-[#E9B24A]">
          <Star className="h-3 w-3 fill-[#E9B24A] text-[#E9B24A]" />
          <span>{showRating ? ratingValue.toFixed(1) : '—'}</span>
          <span className="text-[9px] opacity-80">({coach.total_sessions || 0})</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center gap-4 px-5 py-4">
        <div className="flex-shrink-0 mt-3">
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

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div className="whitespace-nowrap text-[19px] font-medium text-[#F2F2F2]/90">
              {displayName}
            </div>
            <div className="text-[13px] font-normal text-[#E0580C]/70 truncate">Fitness</div>
          </div>

          {variant === 'meet' ? (
            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-[11px] font-medium text-white/90">{coach.available_meets || 0} Meets disponibles</span>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-3 text-[13px] text-[#B0B0B0]">
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-[#FF8C3A]" />
                <span>{coach.total_products || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-[#FF8C3A]" />
                <span>{coach.certifications?.length || 0}</span>
              </div>
              <div className="text-[#E0580C] font-medium">
                <span>{years} años</span>
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mask-linear-gradient w-0 min-w-full">
            {specialization.split(',').map((spec, index) => (
              <div
                key={index}
                className="flex-shrink-0 inline-flex items-center rounded-full border border-[#FF7939]/30 bg-[#FF7939]/20 px-3 py-1 text-[11px] font-medium text-[#FF7939] whitespace-nowrap"
              >
                {spec.trim()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  )
}
