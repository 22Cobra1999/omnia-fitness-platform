import React, { memo } from 'react'
import { StorageUsageWidget } from '@/components/coach/storage-usage-widget'

export const StorageTab: React.FC = memo(() => {
    return (
        <div className="bg-[#0F0F0F] rounded-2xl border border-[#1A1A1A] overflow-hidden p-2">
            <StorageUsageWidget />
        </div>
    )
})

StorageTab.displayName = 'StorageTab'
