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
}

export function PurchasedActivityCardHeader({ imageUrl, title, size, isCoachView, isExpired }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) return null

    return (
        <div className={cn(
            `relative w-full ${getImageHeightClass(size, isCoachView)} flex-shrink-0 transition-all`,
            isExpired && "grayscale opacity-50"
        )}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover"
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
        </div>
    )
}
