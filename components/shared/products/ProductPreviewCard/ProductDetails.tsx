
interface DetailItem {
    label: string
    value: string
    icon: any
    color: string
}

interface ProductDetailsProps {
    details: DetailItem[]
}

export const ProductDetails = ({ details }: ProductDetailsProps) => {
    if (details.length === 0) return null

    return (
        <div className="bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] mb-4 shadow-lg">
            <div className="grid grid-cols-2 gap-3">
                {details.map((detail, index) => {
                    const IconComponent = detail.icon
                    return (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#1A1A1A]/30 transition-colors">
                            <IconComponent className={`h-4 w-4 ${detail.color}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-gray-400 text-xs font-medium truncate">{detail.label}</div>
                                <div className="text-white font-semibold text-sm truncate">{detail.value}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
