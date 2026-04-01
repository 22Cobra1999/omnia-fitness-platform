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
    streak?: number
}

export function PurchasedActivityCardHeader({ imageUrl, title, coachName, coachAvatarUrl, coachRating, size, isCoachView, isExpired, progress, isFinished, isFuture, streak }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) {
        return (
            <div className="pt-6 px-6 text-center h-[7.5rem] flex flex-col items-center justify-start relative">
                {/* Racha / Streak above title */}
                <div className="h-6 mb-1 flex items-center justify-center gap-1">
                    {streak && streak > 0 ? (
                        <>
                            <span className="text-white font-[1000] text-sm leading-none tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {streak}
                            </span>
                            <Flame className="h-4 w-4 text-[#FF7939] fill-[#FF7939]" strokeWidth={2.5} />
                        </>
                    ) : null}
                </div>

                <h3 className="text-white leading-[1.1] tracking-tighter opacity-95 w-full px-0">
                    {(() => {
                        const words = (title || 'Sin título').split(' ');
                        const row1 = words.slice(0, 2).join(' ');
                        const row2 = words.slice(2, 5).join(' ');
                        const row3 = words.slice(5).join(' ');

                        return (
                            <div className="flex flex-col items-center w-full">
                                <span className="text-[0.9rem] font-[1000] block leading-none uppercase tracking-tight truncate w-full">{row1}</span>
                                {row2 ? (
                                    <span className="text-[0.75rem] font-bold opacity-70 block leading-none uppercase mt-1.5 truncate w-full">{row2}</span>
                                ) : (
                                    <div className="h-[0.75rem] mt-1.5" />
                                )}
                                {row3 ? (
                                    <span className="text-[0.55rem] font-medium opacity-40 block leading-tight uppercase mt-1 truncate w-full">{row3}</span>
                                ) : (
                                    <div className="h-[0.55rem] mt-1" />
                                )}
                            </div>
                        );
                    })()}
                </h3>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative w-full flex-shrink-0 transition-all overflow-hidden bg-black rounded-t-[2.8rem]",
            getImageHeightClass(size, !!isCoachView),
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl && imageUrl.startsWith('http') ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-103 z-0"
                    priority={size === 'large'}
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
                <div className="absolute top-2 right-2 z-20">
                    <div className="w-10 h-10 flex items-center justify-center gap-0.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl">
                        <span className="text-[12px] font-black text-orange-400 italic leading-none">
                            {Math.round(progress)}
                        </span>
                        <span className="text-[7.5px] font-black text-orange-500 italic leading-none">%</span>
                    </div>
                </div>
            )}

            {/* Streak Badge - Removed from top left */}

            {/* Centered Title and Coach Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center text-center px-4 pb-0">
                <div className="min-h-[4rem] flex items-center justify-center mb-2 w-full px-1">
                    <h3 className={cn(
                        "text-white leading-[1.1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-tighter opacity-95 w-full px-0",
                        size === "small" ? "text-xs" : "text-sm md:text-base"
                    )}>
                        {(() => {
                            const words = (title || 'Sin título').split(' ');
                            const row1 = words.slice(0, 2).join(' ');
                            const row2 = words.slice(2, 5).join(' ');
                            const row3 = words.slice(5).join(' ');

                            return (
                                <div className="flex flex-col items-center w-full overflow-visible">
                                    <span className="text-[0.8rem] font-black block leading-none opacity-90 w-full uppercase tracking-tight break-words">{row1}</span>
                                    {row2 && <span className="text-[0.65rem] font-medium opacity-70 block leading-none w-full uppercase mt-1 break-words">{row2}</span>}
                                    {row3 && <span className="text-[0.45rem] font-light opacity-50 block leading-tight w-full uppercase mt-1 break-words">{row3}</span>}
                                </div>
                            );
                        })()}
                    </h3>
                </div>

                {/* Streak (Centered between Title and Coach) */}
                {streak && streak > 0 ? (
                    <div className="flex items-center gap-1.5 mb-2 scale-[0.9]">
                        <Flame className="h-4 w-4 text-[#FF7939] fill-[#FF7939]" />
                        <span className="text-white font-[1000] text-sm leading-none tracking-tighter italic">
                            {streak}
                        </span>
                    </div>
                ) : (
                    <div className="h-6 mb-1" />
                )}

                <div className="flex items-center gap-2 pl-1 pr-6 h-8 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-2xl relative w-fit max-w-[98%]">
                    <div className="w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] rounded-full bg-zinc-800/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {coachAvatarUrl ? (
                            <Image
                                src={coachAvatarUrl}
                                alt={coachName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-[clamp(8px,1.5vw,10px)] font-black text-zinc-400 capitalize">{coachName?.[0] || 'C'}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[9px] font-bold text-zinc-200 tracking-tight whitespace-nowrap opacity-90">
                            {(coachName || 'Coach').substring(0, 11)}
                        </span>
                        {coachRating && coachRating > 0 && (
                            <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
                                <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                                <span className="text-[9px] font-black text-zinc-400">{coachRating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
