"use client"

import React from 'react'

import { MessageCircle } from 'lucide-react'
import { Conversation, formatTime } from '@/hooks/mobile/useMessagesScreenLogic'

interface ChatListProps {
    conversations: Conversation[]
    isCoach: boolean | null
    onSelectConversation: (id: string) => void
}

export function ChatList({ conversations, isCoach, onSelectConversation }: ChatListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes conversaciones aún</p>
                </div>
            </div>
        )
    }

    return (
        <div className="divide-y divide-gray-800">
            {conversations.map((conversation) => {
                const unreadCount = isCoach
                    ? conversation.coach_unread_count
                    : conversation.client_unread_count

                const contactName = isCoach
                    ? conversation.client_name
                    : conversation.coach_name

                const contactAvatar = isCoach
                    ? conversation.client_avatar
                    : conversation.coach_avatar

                return (
                    <button
                        key={conversation.id}
                        onClick={() => onSelectConversation(conversation.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#1E1E1E] transition-colors"
                    >
                        {contactAvatar ? (
                            <img
                                src={contactAvatar}
                                alt={contactName || 'Usuario'}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#FF7939] flex items-center justify-center">
                                <span className="text-white font-semibold">
                                    {(contactName || 'U')[0].toUpperCase()}
                                </span>
                            </div>
                        )}

                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-white font-medium truncate">{contactName || 'Usuario'}</h3>
                                {conversation.last_message_at && (
                                    <span className="text-xs text-gray-400 ml-2">
                                        {formatTime(conversation.last_message_at)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400 truncate">
                                    {conversation.last_message_preview || 'Sin mensajes'}
                                </p>
                                {unreadCount > 0 && (
                                    <span className="ml-2 bg-[#FF7939] text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
