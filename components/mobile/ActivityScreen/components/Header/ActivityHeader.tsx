"use client"

import { MessagesIcon } from "@/components/shared/ui/messages-icon"
import { SettingsIcon } from "@/components/shared/ui/settings-icon"
import { OmniaLogoText } from "@/components/shared/ui/omnia-logo"

interface ActivityHeaderProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    userName?: string
}

export function ActivityHeader({ searchTerm, onSearchChange, userName = "Atleta" }: ActivityHeaderProps) {
    return (
        <div className="pt-safe-top pb-2 px-6 bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 flex items-center justify-between">
            <OmniaLogoText className="h-6 w-auto" />
            <div className="flex items-center gap-3">
                <div className="text-white/70 hover:text-white shrink-0 cursor-pointer">
                    <MessagesIcon />
                </div>
                <div className="text-white/70 hover:text-white shrink-0 cursor-pointer">
                    <SettingsIcon />
                </div>
            </div>
        </div>
    )
}
