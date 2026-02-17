import { StorageUsageData } from '../hooks/storage/useStorageLogic'

interface StorageProgressBarProps {
    storageData: StorageUsageData | null
    storageLimitGB: number
}

export function StorageProgressBar({ storageData, storageLimitGB }: StorageProgressBarProps) {
    const videoGB = storageData?.breakdown.video || 0
    const imageGB = storageData?.breakdown.image || 0
    const pdfGB = storageData?.breakdown.pdf || 0

    const videoPercent = storageLimitGB > 0 ? (videoGB / storageLimitGB) * 100 : 0
    const imagePercent = storageLimitGB > 0 ? (imageGB / storageLimitGB) * 100 : 0
    const pdfPercent = storageLimitGB > 0 ? (pdfGB / storageLimitGB) * 100 : 0

    return (
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mb-4 flex">
            {videoPercent > 0 && <div className="bg-[#FF6B35] h-full" style={{ width: `${videoPercent}%` }} />}
            {imagePercent > 0 && <div className="bg-[#FF9966] h-full" style={{ width: `${imagePercent}%` }} />}
            {pdfPercent > 0 && <div className="bg-[#FFCCAA] h-full" style={{ width: `${pdfPercent}%` }} />}
        </div>
    )
}
