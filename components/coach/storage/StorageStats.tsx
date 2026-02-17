interface StorageStatsProps {
    usedGB: number
    limitGB: number
    collapsed: boolean
    onToggleCollapse: () => void
}

export function StorageStats({ usedGB, limitGB, collapsed, onToggleCollapse }: StorageStatsProps) {
    const formatGB = (gb: number) => {
        if (gb < 0.001) return '0 GB'
        return `${gb.toFixed(2)} GB`
    }

    return (
        <div className="flex justify-between items-end mb-8">
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-light leading-none tracking-tighter">{formatGB(usedGB).split(' ')[0]}</span>
                <span className="text-[10px] text-white/30 font-medium">GB / {limitGB}GB</span>
            </div>
            <button
                onClick={onToggleCollapse}
                className="text-[10px] font-medium text-white/40 hover:text-[#FF7939] transition-colors"
            >
                {collapsed ? 'Ver detalles' : 'Cerrar'}
            </button>
        </div>
    )
}
