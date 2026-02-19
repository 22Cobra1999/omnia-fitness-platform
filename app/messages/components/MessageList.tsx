import React from 'react'
import { Message } from '../hooks/useMessagesLogic'

interface MessageListProps {
    messages: Message[]
    userId: string | undefined
    formatTime: (date: string | null) => string
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    userId,
    formatTime,
}) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
                const isOwn = message.sender_id === userId
                return (
                    <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwn
                                    ? 'bg-[#FF7939] text-white'
                                    : 'bg-white/10 text-white'
                                }`}
                        >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                                {formatTime(message.created_at)}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
