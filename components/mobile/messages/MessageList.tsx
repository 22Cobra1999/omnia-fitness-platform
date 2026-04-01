"use client"

import React from 'react'

import { MessageCircle } from 'lucide-react'
import { Message, formatTime } from '@/hooks/mobile/useMessagesScreenLogic'

interface MessageItemProps {
    message: Message
    isOwnMessage: boolean
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwnMessage ? 'bg-[#FF7939] text-white' : 'bg-white/10 text-white'
                    }`}
            >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-400'}`}>
                    {formatTime(message.created_at)}
                </p>
            </div>
        </div>
    )
}

interface MessageListProps {
    messages: Message[]
    currentUserId: string | undefined
    isCoach: boolean
}

export function MessageList({ messages, currentUserId, isCoach }: MessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                    <MessageCircle className="h-8 w-8 text-[#FF7939] opacity-40" />
                </div>
                <p className="text-zinc-400 text-[11px] font-medium leading-relaxed italic uppercase tracking-wider opacity-60">
                    {isCoach 
                        ? "Comunícate con tu cliente para mejorar tu relación. Un mensaje puede marcar la diferencia en su progreso."
                        : "Comienza la conversación con tu coach. ¡Aprovecha su experiencia para alcanzar tus metas!"}
                </p>
                <div className="mt-4 w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender_id === currentUserId}
                />
            ))}
        </div>
    )
}
