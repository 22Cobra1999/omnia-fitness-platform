
interface DetailItem {
    label: string
    value: string
    icon: any
    color: string
}

interface ProductDetailsProps {
    details: DetailItem[]
}

const renderValue = (val: string) => {
    if (!val) return '-'
    
    // Regex para detectar número y unidad (d, m, min)
    const match = val.match(/^(\d+)\s*([a-zA-Z]+)?$/)
    
    if (match) {
        const [_, num, unit] = match
        return (
            <div className="flex items-baseline gap-1 text-[#FF7939]/80 font-black">
                <span className="text-sm">{num}</span>
                {unit && (
                    <span className="text-[10px] lowercase tracking-tighter opacity-70">
                        {unit}
                    </span>
                )}
            </div>
        )
    }

    return <div className="text-[#FF7939]/80 font-black text-sm">{val}</div>
}

export const ProductDetails = ({ details }: ProductDetailsProps) => {
    if (details.length === 0) return null

    return (
        <div className="bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A] rounded-xl p-4 border border-[#2A2A2A] mb-4 shadow-lg shadow-black/40">
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                {details.map((detail, index) => {
                    const IconComponent = detail.icon
                    return (
                        <div key={index} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.02] transition-colors group">
                            <IconComponent className={`h-3.5 w-3.5 ${detail.color} transition-transform group-hover:scale-110`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest truncate mb-0.5 leading-none">
                                    {detail.label}
                                </div>
                                <div className="leading-none pt-0.5">
                                    {renderValue(detail.value)}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
