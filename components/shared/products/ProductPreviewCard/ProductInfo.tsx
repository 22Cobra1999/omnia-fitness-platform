import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

interface ProductInfoProps {
    title: string
    description: string
    onExpand?: () => void
}

export const ProductInfo = ({ title, description, onExpand }: ProductInfoProps) => {
    return (
        <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text">
                {title || 'Nombre del producto'}
            </h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed bg-[#1A1A1A]/30 p-3 rounded-lg border border-[#2A2A2A]/30">
                {description || 'Descripción del producto'}
            </p>
        </div>
    )
}
