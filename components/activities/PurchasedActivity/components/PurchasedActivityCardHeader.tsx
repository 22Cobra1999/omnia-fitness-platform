import Image from "next/image"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { getImageHeightClass } from "../utils"

interface PurchasedActivityCardHeaderProps {
    imageUrl: string | null
    title: string
    size: "small" | "medium" | "large"
    isCoachView: boolean
    isExpired?: boolean
    progress?: number
}

export function PurchasedActivityCardHeader({ imageUrl, title, size, isCoachView, isExpired, progress }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) return null

    return (
        <div className={cn(
            `relative w-full ${getImageHeightClass(size, isCoachView)} flex-shrink-0 transition-all overflow-hidden`,
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-700"
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

            {/* Bottom Gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

            {/* Title Over Image (at bottom) */}
            <div className="absolute bottom-3 left-3 right-3 z-20">
                <h3 className={cn(
                    "text-white font-black leading-tight drop-shadow-lg line-clamp-2",
                    size === "small" ? "text-xs" : "text-sm md:text-base"
                )}>
                    {title}
                </h3>
            </div>

            {/* Progress Badge - Dark Circular */}
            {typeof progress === 'number' && progress > 0 && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/5 rounded-full shadow-2xl">
                        <span className="text-[10px] font-black text-[#FF7939]">
                            {progress}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
