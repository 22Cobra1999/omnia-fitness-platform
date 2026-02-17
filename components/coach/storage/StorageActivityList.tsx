import { motion } from 'framer-motion'
import { StorageFile } from '../hooks/storage/useStorageLogic'

interface StorageActivityListProps {
    activityData: Array<{ id: number, name: string, files: StorageFile[], totalGB: number }>
    expanded: boolean
}

export function StorageActivityList({ activityData, expanded }: StorageActivityListProps) {
    const formatMB = (gb: number) => {
        const mb = gb * 1024
        if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
        return `${mb.toFixed(1)} MB`
    }

    return (
        <>
            {activityData.slice(0, expanded ? undefined : 6).map(activity => (
                <motion.div key={activity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white/80 text-[10px] font-medium uppercase tracking-tight">{activity.name}</span>
                        <span className="text-white/20 text-[9px]">{formatMB(activity.totalGB)}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        {activity.files.map((f, i) => (
                            <span key={i} className="text-white/30 text-[9px] whitespace-nowrap">
                                {f.fileName}{i < activity.files.length - 1 ? ' •' : ''}
                            </span>
                        ))}
                    </div>
                </motion.div>
            ))}
        </>
    )
}
