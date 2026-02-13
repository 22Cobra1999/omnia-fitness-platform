
import React from 'react'
import { X } from 'lucide-react'

interface MeetDetailHeaderProps {
    title: string
    timingStatusLabel: { label: string; color: string }
    isWorkshop: boolean
    onClose: () => void
}

export const MeetDetailHeader: React.FC<MeetDetailHeaderProps> = ({
    title,
    timingStatusLabel,
    isWorkshop,
    onClose
}) => {
    return (
        <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col gap-2.5">
                <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
                    {title || 'Reunión'}
                </h2>
                <div className="flex items-center gap-2">
                    <span className={timingStatusLabel.color + " text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border shadow-sm"}>
                        {timingStatusLabel.label}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/40">
                        {isWorkshop ? 'Workshop' : 'Meet'}
                    </span>
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/5 text-white/30 hover:text-white flex items-center justify-center transition-all -mr-2"
            >
                <X size={20} />
            </button>
        </div>
    )
}
