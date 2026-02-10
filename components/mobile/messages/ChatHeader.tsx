"use client"

import React from 'react'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
    contactName: string | null
    contactAvatar: string | null | undefined
    onBack: () => void
}

export function ChatHeader({ contactName, contactAvatar, onBack }: ChatHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-[#1E1E1E] border-b border-gray-800 px-4 py-3 flex items-center gap-3">
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 text-white hover:bg-gray-800"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>

            {contactAvatar && (
                <img
                    src={contactAvatar}
                    alt={contactName || 'Usuario'}
                    className="w-8 h-8 rounded-full object-cover"
                />
            )}

            <h1 className="text-lg font-semibold text-white flex-1">
                {contactName || 'Usuario'}
            </h1>
        </div>
    )
}
