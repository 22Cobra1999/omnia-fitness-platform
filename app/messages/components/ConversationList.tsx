import React from 'react'
import { MessageCircle } from 'lucide-react'
import { Conversation } from '../hooks/useMessagesLogic'

interface ConversationListProps {
    conversations: Conversation[]
    userId: string | undefined
    onSelectConversation: (id: string) => void
    formatTime: (date: string | null) => string
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    userId,
    onSelectConversation,
    formatTime,
}) => {
    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tienes conversaciones aún</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-white/10">
                {conversations.map((conversation) => {
                    const unreadCount = userId === conversation.client_id
                        ? conversation.client_unread_count
                        : conversation.coach_unread_count
                    const otherName = userId === conversation.client_id
                        ? conversation.coach_name
                        : conversation.client_name
                    const otherAvatar = userId === conversation.client_id
                        ? conversation.coach_avatar
                        : conversation.client_avatar

                    return (
                        <button
                            key={conversation.id}
                            onClick={() => onSelectConversation(conversation.id)}
                            className="w-full p-4 hover:bg-white/5 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#FF7939]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {otherAvatar ? (
                                        <img
                                            src={otherAvatar}
                                            alt={otherName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <MessageCircle className="w-6 h-6 text-[#FF7939]" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-white truncate">{otherName}</h3>
                                        {conversation.last_message_at && (
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                {formatTime(conversation.last_message_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-400 truncate">
                                            {conversation.last_message_preview || 'Sin mensajes'}
                                        </p>
                                        {unreadCount > 0 && (
                                            <span className="bg-[#FF7939] text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0 ml-2">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
