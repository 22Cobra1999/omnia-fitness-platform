"use client"

import React from 'react'

import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    disabled: boolean
    sending: boolean
    remainingMessages: number
    isLimitReached: boolean
    showLimitWarning: boolean
}

export function ChatInput({
    value,
    onChange,
    onSend,
    disabled,
    sending,
    remainingMessages,
    isLimitReached,
    showLimitWarning
}: ChatInputProps) {
    return (
        <div className="sticky bottom-0 bg-black border-t border-white/5">
            {/* Limit Warning Banner */}
            {(showLimitWarning || isLimitReached) && (
                <div className={`
          px-4 py-2 text-xs font-semibold text-center border-b border-gray-800
          ${isLimitReached ? 'bg-red-900/10 text-red-500' : 'bg-[#FF7939]/10 text-[#FF7939]'}
        `}>
                    {isLimitReached
                        ? "Límite diario alcanzado"
                        : `Te quedan ${remainingMessages} mensajes hoy.`
                    }
                </div>
            )}

            <div className="px-4 py-3 flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (!isLimitReached) onSend()
                        }
                    }}
                    placeholder={isLimitReached ? "Límite diario alcanzado" : "Escribe un mensaje..."}
                    disabled={isLimitReached || disabled}
                    className={`
            flex-1 bg-white/5 text-white border border-white/10 rounded-xl px-4 py-2 focus:outline-none 
            ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'focus:ring-[#FF7939]'}
          `}
                />
                <Button
                    onClick={onSend}
                    disabled={!value.trim() || disabled || sending || isLimitReached}
                    className={`
            px-4 text-white
            ${isLimitReached ? 'bg-gray-700 cursor-not-allowed' : 'bg-[#FF7939] hover:bg-[#FF6B35]'}
          `}
                >
                    {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>
        </div>
    )
}
