import { Badge } from "@/components/ui/badge"
import { Flame } from "lucide-react"
import Image from "next/image"

interface ProductImageProps {
    title: string
    imageUrl: string | null
    videoUrl: string | null
    typeIcon: React.ReactNode
    typeLabel: string
    typeColor: string
    isPreview?: boolean
}

export const ProductImage = ({
    title,
    imageUrl,
    videoUrl,
    typeIcon,
    typeLabel,
    typeColor,
    isPreview
}: ProductImageProps) => {
    return (
        <div className="relative h-48 w-full overflow-hidden">
            {imageUrl ? (
                <>
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {!videoUrl && <div className="absolute inset-0 bg-black/40" />}
                </>
            ) : (
                <div className="w-full h-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center flex-col gap-3">
                    <div className="w-16 h-16 bg-[#FF7939] rounded-xl flex items-center justify-center">
                        <Flame className="w-8 h-8 text-black" />
                    </div>
                    <h1 className="text-gray-400 text-xl font-bold">OMNIA</h1>
                </div>
            )}

            <Badge className={`absolute top-3 left-3 ${typeColor} text-white font-medium`}>
                {typeLabel}
            </Badge>

            {isPreview && (
                <div className="absolute top-3 right-3 inline-flex items-center px-3 py-1 rounded-full bg-[#FF7939]/80 backdrop-blur-sm text-sm font-medium text-white">
                    <Flame className="h-4 w-4 mr-1" />
                    <span>Preview</span>
                </div>
            )}

            <div className="absolute bottom-3 right-3 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                {typeIcon}
            </div>
        </div>
    )
}
