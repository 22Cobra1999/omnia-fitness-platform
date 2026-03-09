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
            `relative w-full h-[300px] flex-shrink-0 transition-all overflow-hidden`,
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                    sizes="(max-width: 768px) 50vw, 33vw"
                />
            ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center flex-col gap-3">
                    <div className="w-16 h-16 relative opacity-30">
                        <Image
                            src="/omnia-logo-bubbly-exact.svg"
                            alt="OMNIA Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Deeper Gradient for better text separation */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent z-10" />

            {/* Floating Circle Badge - Progress */}
            {typeof progress === 'number' && progress > 0 && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="w-11 h-11 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] font-[900] text-orange-400 leading-none">
                                {progress}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Centered Title and Coach Info Overlay */}
            <div className="absolute inset-x-0 bottom-4 z-20 flex flex-col items-center text-center px-5">
                <h3 className={cn(
                    "text-white font-[900] leading-tight mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-tight",
                    size === "small" ? "text-base" : "text-[20px] md:text-[22px]"
                )}>
                    {title}
                </h3>

                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950/30 backdrop-blur-sm rounded-full border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-[10px] font-black text-zinc-400 capitalize">{coachName?.[0] || 'C'}</span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-200 tracking-tight whitespace-nowrap opacity-90">{coachName || 'Coach'}</span>
                </div>
            </div>
        </div>
    )
}
