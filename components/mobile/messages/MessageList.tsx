"use client"

import React from 'react'

import { Message, formatTime } from '@/hooks/mobile/useMessagesScreenLogic'

interface MessageItemProps {
    message: Message
    isOwnMessage: boolean
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[75%] rounded-lg px-4 py-2 ${isOwnMessage ? 'bg-[#FF7939] text-white' : 'bg-[#2A2A2A] text-white'
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
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
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
