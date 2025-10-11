import Image from 'next/image'

interface CoachCardProps {
  coach: {
    id: string
    name: string
    avatar_url?: string
    specialties?: string[]
    rating?: number
  }
  onClick?: () => void
}

export default function CoachCard({ coach, onClick }: CoachCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:scale-102 transition-transform"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-[#FF7939] flex items-center justify-center text-white font-bold">
          {coach.avatar_url ? (
            <Image src={coach.avatar_url} alt={coach.name} width={48} height={48} className="rounded-full" />
          ) : (
            coach.name[0]
          )}
        </div>
        <div>
          <h3 className="text-white font-semibold">{coach.name}</h3>
          {coach.rating && (
            <div className="text-[#FF7939] text-sm">⭐ {coach.rating.toFixed(1)}</div>
          )}
        </div>
      </div>
      {coach.specialties && (
        <div className="flex flex-wrap gap-2">
          {coach.specialties.slice(0, 3).map((spec, i) => (
            <span key={i} className="text-xs text-gray-400 bg-[#374151] px-2 py-1 rounded">
              {spec}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

