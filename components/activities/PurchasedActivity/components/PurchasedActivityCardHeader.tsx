import Image from "next/image"
import { Flame, Star } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { getImageHeightClass } from "../utils"

interface PurchasedActivityCardHeaderProps {
    imageUrl: string | null
    title: string
    coachName: string
    coachAvatarUrl?: string | null
    coachRating?: number | null
    size: "small" | "medium" | "large"
    isCoachView: boolean
    isExpired?: boolean
    progress?: number
    isFinished?: boolean
    isFuture?: boolean
}

export function PurchasedActivityCardHeader({ imageUrl, title, coachName, coachAvatarUrl, coachRating, size, isCoachView, isExpired, progress, isFinished, isFuture }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) return null

    return (
        <div className={cn(
            `relative w-full h-[280px] flex-shrink-0 transition-all overflow-hidden bg-black rounded-t-[2.8rem]`,
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-103 z-0"
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

            {/* Hardcoded Multi-Stop Gradient Overlay: Fades photo into the black sections (Adjusted intensity) */}
            <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                    background: 'linear-gradient(to top, #000000 0%, #000000 10%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%)'
                }}
            />

            {/* Floating Circle Badge - Progress - Only for "En curso" */}
            {(!isFinished && !isFuture) && typeof progress === 'number' && progress > 0 && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
                        <span className="text-[10px] font-[900] text-orange-400 leading-none">
                            {progress}%
                        </span>
                    </div>
                </div>
            )}

            {/* Centered Title and Coach Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center text-center px-4 pb-0">
                <div className="h-16 flex items-start justify-center mb-10">
                    <h3 className={cn(
                        "text-white font-bold leading-[1.2] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-tight opacity-95",
                        size === "small" ? "text-xs" : "text-sm md:text-base px-2"
                    )}>
                        {title || 'Sin título'}
                    </h3>
                </div>

                <div className="flex items-center gap-2 pl-1.5 pr-4 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 shadow-2xl relative w-fit max-w-[90%]">
                    <div className="w-6 h-6 rounded-full bg-zinc-800/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {coachAvatarUrl ? (
                            <Image
                                src={coachAvatarUrl}
                                alt={coachName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-[10px] font-black text-zinc-400 capitalize">{coachName?.[0] || 'C'}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-200 tracking-tight whitespace-nowrap opacity-90">
                            {(coachName || 'Coach').substring(0, 13)}
                        </span>
                        {coachRating && coachRating > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
                                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-[10px] font-black text-zinc-400">{coachRating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
