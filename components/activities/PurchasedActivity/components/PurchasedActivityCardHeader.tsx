import Image from "next/image"
import { Flame } from "lucide-react"
import { getImageHeightClass } from "../utils"

interface PurchasedActivityCardHeaderProps {
    imageUrl: string | null
    title: string
    size: "small" | "medium" | "large"
    isCoachView: boolean
}

export function PurchasedActivityCardHeader({ imageUrl, title, size, isCoachView }: PurchasedActivityCardHeaderProps) {
    if (isCoachView) return null

    return (
        <div className={`relative w-full ${getImageHeightClass(size, isCoachView)} flex-shrink-0`}>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title || 'Actividad'}
                    fill
                    className="object-cover"
                />
            ) : (
                <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
                    <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                        <Flame className="w-8 h-8 text-black" />
                    </div>
                </div>
            )}
        </div>
    )
}
