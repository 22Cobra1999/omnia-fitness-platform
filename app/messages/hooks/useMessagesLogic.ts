import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/supabase-client'

export interface Conversation {
    id: string
    client_id: string
    coach_id: string
    last_message_preview: string | null
    last_message_at: string | null
    client_unread_count: number
    coach_unread_count: number
    coach_name?: string
    coach_avatar?: string
    client_name?: string
    client_avatar?: string
}

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    sender_type: 'client' | 'coach'
    content: string
    created_at: string
    is_read: boolean
}

export function useMessagesLogic() {
    const router = useRouter()
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isUpdatingUnreadRef = useRef(false)

    const selectedConversation = selectedConversationId
        ? conversations.find(c => c.id === selectedConversationId) || null
        : null

    const loadConversations = useCallback(async () => {
        if (!user) return

        try {
            setLoading(true)
            const supabase = createClient()

            const { data: coachData } = await supabase
                .from('coaches')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            const isClient = !coachData

            let query = supabase
                .from('conversations')
                .select('*')
                .eq('is_active', true)
                .order('last_message_at', { ascending: false, nullsFirst: false })

            if (isClient) {
                query = query.eq('client_id', user.id)
            } else {
                query = query.eq('coach_id', user.id)
            }

            const { data: conversationsData, error } = await query

            if (error) {
                console.error('Error cargando conversaciones:', error)
                setConversations([])
                return
            }

            if (!conversationsData || conversationsData.length === 0) {
                setConversations([])
                return
            }

            const clientIds = [...new Set(conversationsData.map((c: any) => c.client_id))]
            const coachIds = [...new Set(conversationsData.map((c: any) => c.coach_id))]

            const { data: userProfiles } = await supabase
                .from('user_profiles')
                .select('id, full_name, avatar_url')
                .in('id', [...clientIds, ...coachIds])

            const profilesMap = new Map()
            if (userProfiles) {
                userProfiles.forEach((profile: any) => {
                    profilesMap.set(profile.id, {
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url
                    })
                })
            }

            const formattedConversations = conversationsData.map((conv: any) => {
                const coachProfile = profilesMap.get(conv.coach_id)
                const clientProfile = profilesMap.get(conv.client_id)

                return {
                    id: conv.id,
                    client_id: conv.client_id,
                    coach_id: conv.coach_id,
                    last_message_preview: conv.last_message_preview,
                    last_message_at: conv.last_message_at,
                    client_unread_count: conv.client_unread_count || 0,
                    coach_unread_count: conv.coach_unread_count || 0,
                    coach_name: coachProfile?.full_name || 'Coach',
                    coach_avatar: coachProfile?.avatar_url,
                    client_name: clientProfile?.full_name || 'Cliente',
                    client_avatar: clientProfile?.avatar_url,
                }
            })

            setConversations(formattedConversations)
        } catch (error) {
            console.error('Error cargando conversaciones:', error)
            setConversations([])
        } finally {
            setLoading(false)
        }
    }, [user])

    const loadMessages = useCallback(async (conversationId: string, updateUnreadCounters: boolean = true) => {
        if (!user) return

        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error cargando mensajes:', error)
            } else {
                setMessages(data || [])

                if (updateUnreadCounters && data && data.length > 0) {
                    const unreadMessages = data.filter((msg: Message) => !msg.is_read && msg.sender_id !== user.id)
                    if (unreadMessages.length > 0) {
                        isUpdatingUnreadRef.current = true
                        try {
                            const messageIds = unreadMessages.map((msg: Message) => msg.id)
                            await supabase
                                .from('messages')
                                .update({ is_read: true, read_at: new Date().toISOString() })
                                .in('id', messageIds)

                            const { data: coachData } = await supabase
                                .from('coaches')
                                .select('id')
                                .eq('id', user.id)
                                .maybeSingle()

                            const isClientValue = !coachData

                            await supabase
                                .from('conversations')
                                .update({
                                    [isClientValue ? 'client_unread_count' : 'coach_unread_count']: 0
                                })
                                .eq('id', conversationId)

                            setConversations(prev => prev.map(conv =>
                                conv.id === conversationId
                                    ? { ...conv, [isClientValue ? 'client_unread_count' : 'coach_unread_count']: 0 }
                                    : conv
                            ))
                        } finally {
                            isUpdatingUnreadRef.current = false
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error)
        }
    }, [user])

    useEffect(() => {
        if (user === undefined) return
        if (user === null) {
            router.push('/')
            return
        }
        loadConversations()
    }, [user, loadConversations, router])

    useEffect(() => {
        if (!selectedConversationId || !user) return

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }

        loadMessages(selectedConversationId)

        pollingIntervalRef.current = setInterval(() => {
            if (!isUpdatingUnreadRef.current && selectedConversationId) {
                loadMessages(selectedConversationId, false)
            }
        }, 5000)

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
            }
        }
    }, [selectedConversationId, user, loadMessages])

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user || sending) return

        try {
            setSending(true)
            const supabase = createClient()

            const { data: coachData } = await supabase
                .from('coaches')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            const senderType = coachData ? 'coach' : 'client'

            const { data: message, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: selectedConversation.id,
                    sender_id: user.id,
                    sender_type: senderType,
                    content: newMessage.trim(),
                    message_type: 'text'
                })
                .select()
                .single()

            if (error) {
                console.error('Error enviando mensaje:', error)
                alert('Error al enviar el mensaje')
            } else {
                setNewMessage('')
                if (selectedConversationId) {
                    loadMessages(selectedConversationId, false)
                }
                setConversations(prev => prev.map(conv =>
                    conv.id === selectedConversation.id
                        ? {
                            ...conv,
                            last_message_preview: newMessage.trim().substring(0, 100),
                            last_message_at: new Date().toISOString()
                        }
                        : conv
                ))
            }
        } catch (error) {
            console.error('Error enviando mensaje:', error)
            alert('Error al enviar el mensaje')
        } finally {
            setSending(false)
        }
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return 'Ahora'
        if (minutes < 60) return `Hace ${minutes}m`
        if (hours < 24) return `Hace ${hours}h`
        if (days < 7) return `Hace ${days}d`
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

    return {
        user,
        conversations,
        selectedConversationId,
        setSelectedConversationId,
        selectedConversation,
        messages,
        newMessage,
        setNewMessage,
        loading,
        sending,
        sendMessage,
        formatTime,
        router
    }
}
