import Image from "next/image"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { getImageHeightClass } from "../utils"

interface PurchasedActivityCardHeaderProps {
    imageUrl: string | null
    title: string
    coachName: string
    size: "small" | "medium" | "large"
    isCoachView: boolean
    isExpired?: boolean
    progress?: number
}

export function PurchasedActivityCardHeader({ imageUrl, title, coachName, size, isCoachView, isExpired, progress }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) return null

    return (
        <div className={cn(
            `relative w-full h-[280px] flex-shrink-0 transition-all overflow-hidden`,
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                />
            ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center flex-col gap-3">
                    <div className="w-20 h-20 relative opacity-40">
                        <Image
                            src="/omnia-logo-bubbly-exact.svg"
                            alt="OMNIA Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Subtle Gradient for title overlay */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />

            {/* Progress Badge - Circle in top right */}
            {typeof progress === 'number' && progress > 0 && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="w-11 h-11 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                        <span className="text-[11px] font-black text-orange-400">
                            {progress}%
                        </span>
                    </div>
                </div>
            )}

            {/* Title and Coach Overlay - Centered at bottom of header */}
            <div className="absolute inset-x-0 bottom-4 z-20 flex flex-col items-center text-center px-4">
                <h3 className={cn(
                    "text-white font-black leading-tight mb-2 drop-shadow-lg",
                    size === "small" ? "text-sm" : "text-xl"
                )}>
                    {title}
                </h3>

                <div className="flex items-center gap-2 opacity-80">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                        <span className="text-[9px] font-bold text-zinc-400 capitalize">{coachName?.[0] || 'C'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-300 tracking-tight">{coachName || 'Coach'}</span>
                </div>
            </div>
        </div>
    )
}
