"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { useAuth } from '@/contexts/auth-context'

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

export function useMessagesScreenLogic() {
    const { user } = useAuth()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const isUpdatingUnreadRef = useRef(false)
    const hasLoadedConversationsRef = useRef(false)
    const isLoadingRef = useRef(false)
    const [isCoach, setIsCoach] = useState<boolean | null>(null)

    const supabase = createClient()

    // Determinar si el usuario es coach o cliente
    useEffect(() => {
        const checkUserRole = async () => {
            if (!user) return
            const { data: coachData } = await supabase
                .from('coaches')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()
            setIsCoach(!!coachData)
        }
        checkUserRole()
    }, [user, supabase])

    // Cargar conversaciones
    const loadConversations = useCallback(async (silent = false) => {
        if (!user || isCoach === null) {
            if (!silent) setLoading(false)
            return
        }

        if (isLoadingRef.current && !silent) return

        try {
            if (!silent) {
                isLoadingRef.current = true
                setLoading(true)
            }

            // 1. Fetch real existing conversations
            const { data: conversationsData, error: conversationsError } = await supabase
                .from('conversations')
                .select('*')
                .or(isCoach ? `coach_id.eq.${user.id}` : `client_id.eq.${user.id}`)
                .eq('is_active', true)
                .order('last_message_at', { ascending: false, nullsFirst: true })

            if (conversationsError) throw conversationsError

            // 2. Fetch active relationships (enrollments) to ensure all partners are listed
            let partnerIds: string[] = []
            if (isCoach) {
                // Coach -> Fetch all their clients via activities they own
                const { data: activities } = await supabase.from('activities').select('id').eq('coach_id', user.id)
                const activityIds = (activities || []).map((a: any) => a.id)
                if (activityIds.length > 0) {
                    const { data: enrolls } = await supabase.from('activity_enrollments')
                        .select('client_id')
                        .in('activity_id', activityIds)
                        .in('status', ['activa', 'active', 'pendiente', 'pending'])
                    partnerIds = [...new Set((enrolls || []).map((e: any) => e.client_id))] as string[]
                }
            } else {
                // Client -> Fetch all their coaches via activities they bought
                const { data: enrolls } = await supabase.from('activity_enrollments')
                    .select('activity_id')
                    .eq('client_id', user.id)
                    .in('status', ['activa', 'active', 'pendiente', 'pending'])
                const activityIds = [...new Set((enrolls || []).map((e: any) => e.activity_id))]
                if (activityIds.length > 0) {
                    const { data: activities } = await supabase.from('activities')
                        .select('coach_id')
                        .in('id', activityIds)
                    partnerIds = [...new Set((activities || []).map((a: any) => a.coach_id))] as string[]
                }
            }

            // 3. Identify and create virtual conversations for partners without real chat records
            const existingPartners = new Set(conversationsData?.map((c: any) => isCoach ? c.client_id : c.coach_id) || [])
            const missingPartnerIds = partnerIds.filter(pid => pid !== user.id && !existingPartners.has(pid))

            // Combine all relevant IDs for profile fetching
            const conversationPartnerIds = (conversationsData || []).map((c: any) => isCoach ? c.client_id : c.coach_id)
            const allPartnerIds = [...new Set([...conversationPartnerIds, ...missingPartnerIds])]

            const { data: userProfiles } = await supabase
                .from('user_profiles')
                .select('id, full_name, avatar_url')
                .in('id', allPartnerIds)

            const profilesMap = new Map<string, any>((userProfiles || []).map((profile: any) => [profile.id, profile]))

            // Build list of formatted conversations (Real + Virtual)
            const realFormatted: Conversation[] = (conversationsData || []).map((conv: any) => {
                const coachProfile = profilesMap.get(conv.coach_id)
                const clientProfile = profilesMap.get(conv.client_id)
                return {
                    ...conv,
                    coach_name: coachProfile?.full_name || 'Coach',
                    coach_avatar: coachProfile?.avatar_url || null,
                    client_name: clientProfile?.full_name || 'Cliente',
                    client_avatar: clientProfile?.avatar_url || null,
                }
            })

            const virtualFormatted: Conversation[] = missingPartnerIds.map(pid => {
                const profile = profilesMap.get(pid)
                return {
                    id: `virtual-${pid}`,
                    client_id: isCoach ? pid : user.id,
                    coach_id: isCoach ? user.id : pid,
                    last_message_preview: null,
                    last_message_at: null,
                    client_unread_count: 0,
                    coach_unread_count: 0,
                    coach_name: isCoach ? 'Coach' : (profile?.full_name || 'Coach'),
                    coach_avatar: isCoach ? null : profile?.avatar_url,
                    client_name: isCoach ? (profile?.full_name || 'Cliente') : 'Cliente',
                    client_avatar: isCoach ? profile?.avatar_url : null,
                }
            })

            // Sort: Real chats with messages first, then virtual ones
            const allConversations = [...realFormatted, ...virtualFormatted].sort((a, b) => {
                if (a.last_message_at && b.last_message_at) return b.last_message_at.localeCompare(a.last_message_at)
                if (a.last_message_at) return -1
                if (b.last_message_at) return 1
                const nameA = isCoach ? (a.client_name || '') : (a.coach_name || '')
                const nameB = isCoach ? (b.client_name || '') : (b.coach_name || '')
                return nameA.localeCompare(nameB)
            })

            setConversations(allConversations)
            hasLoadedConversationsRef.current = true
            if (!silent) {
                setLoading(false)
                isLoadingRef.current = false
            }
        } catch (error) {
            console.error('Error cargando conversaciones:', error)
            if (!silent) {
                setLoading(false)
                isLoadingRef.current = false
            }
        }
    }, [user, isCoach, supabase])

    // Cargar mensajes
    const loadMessages = useCallback(async (conversationId: string, silent = false) => {
        if (!user || isCoach === null) return
        try {
            if (!silent) setLoadingMessages(true)
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true })

            if (messagesError) {
                console.error('Error cargando mensajes:', messagesError)
                return
            }

            setMessages(messagesData || [])

            if (isUpdatingUnreadRef.current) return
            const unreadMessages = (messagesData || []).filter(
                (msg: Message) => !msg.is_read && msg.sender_id !== user.id
            )

            if (unreadMessages.length > 0) {
                isUpdatingUnreadRef.current = true
                const messageIds = unreadMessages.map((msg: Message) => msg.id)
                await supabase
                    .from('messages')
                    .update({ is_read: true, read_at: new Date().toISOString() })
                    .in('id', messageIds)

                const updateField = isCoach ? 'coach_unread_count' : 'client_unread_count'
                await supabase
                    .from('conversations')
                    .update({ [updateField]: 0 })
                    .eq('id', conversationId)

                setConversations(prev => prev.map(conv =>
                    conv.id === conversationId ? { ...conv, [updateField]: 0 } : conv
                ))
                isUpdatingUnreadRef.current = false
            }
        } catch (error) {
            console.error('Error cargando mensajes:', error)
        } finally {
            setLoadingMessages(false)
        }
    }, [user, isCoach, supabase])

    // Enviar mensaje
    const sendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedConversationId || !user || isCoach === null || sending) return
        setSending(true)
        try {
            let conversationId = selectedConversationId

            // Handle virtual conversation creation on first message
            if (conversationId.startsWith('virtual-')) {
                const partnerId = conversationId.replace('virtual-', '')
                const { data: newConv, error: newConvError } = await supabase
                    .from('conversations')
                    .insert({
                        client_id: isCoach ? partnerId : user.id,
                        coach_id: isCoach ? user.id : partnerId,
                        is_active: true,
                        client_unread_count: 0,
                        coach_unread_count: 0
                    })
                    .select()
                    .single()
                
                if (newConvError) throw newConvError
                conversationId = newConv.id
                setSelectedConversationId(conversationId)
                // Refresh list so it becomes a "real" conversation object in state
                await loadConversations(true)
            }

            const { data: newMessageData, error: messageError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    sender_type: isCoach ? 'coach' : 'client',
                    content: newMessage.trim(),
                })
                .select()
                .single()

            if (messageError) throw messageError

            setMessages(prev => [...prev, newMessageData])
            const otherUnreadField = isCoach ? 'client_unread_count' : 'coach_unread_count'

            await supabase
                .from('conversations')
                .update({
                    last_message_preview: newMessage.trim().substring(0, 50),
                    last_message_at: new Date().toISOString(),
                    last_message_id: newMessageData.id,
                    [otherUnreadField]: 1 // Atomic increment would be better
                })
                .eq('id', conversationId)

            setConversations(prev => prev.map(conv =>
                conv.id === conversationId || conv.id === `virtual-${isCoach ? newMessageData.client_id : newMessageData.coach_id}`
                    ? {
                        ...conv,
                        id: conversationId,
                        last_message_preview: newMessage.trim().substring(0, 50),
                        last_message_at: new Date().toISOString(),
                    }
                    : conv
            ))
            setNewMessage('')
        } catch (error) {
            console.error('Error enviando mensaje:', error)
        } finally {
            setSending(false)
        }
    }, [newMessage, selectedConversationId, user, isCoach, sending, supabase, loadConversations])

    // Intent handling
    useEffect(() => {
        if (!user || isCoach === null || !hasLoadedConversationsRef.current) return
        const checkChatIntent = async () => {
            const intentRaw = localStorage.getItem('startChatWithCoach')
            if (!intentRaw) return
            try {
                const intent = JSON.parse(intentRaw)
                localStorage.removeItem('startChatWithCoach')
                if (!intent.coachId) return

                const existingConv = conversations.find(c =>
                    (isCoach ? c.client_id : c.coach_id) === intent.coachId
                )
                if (existingConv) {
                    setSelectedConversationId(existingConv.id)
                    return
                }

                setLoading(true)
                const { data: existingDbConv } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('client_id', isCoach ? intent.coachId : user.id)
                    .eq('coach_id', isCoach ? user.id : intent.coachId)
                    .maybeSingle()

                if (existingDbConv) {
                    await loadConversations()
                    setSelectedConversationId(existingDbConv.id)
                } else {
                    const { data: newConv, error } = await supabase
                        .from('conversations')
                        .insert({
                            client_id: isCoach ? intent.coachId : user.id,
                            coach_id: isCoach ? user.id : intent.coachId,
                            is_active: true,
                            client_unread_count: 0,
                            coach_unread_count: 0
                        })
                        .select()
                        .single()
                    if (newConv) {
                        await loadConversations()
                        setSelectedConversationId(newConv.id)
                    }
                }
            } catch (e) {
                console.error('Error procesando intención de chat:', e)
            } finally {
                setLoading(false)
            }
        }
        checkChatIntent()
    }, [user, isCoach, conversations, loadConversations, supabase])

    // Initial load trigger
    useEffect(() => {
        if (!user) {
            setLoading(false)
            hasLoadedConversationsRef.current = false
            return
        }

        if (isCoach !== null && !hasLoadedConversationsRef.current) {
            loadConversations(false)
        }
    }, [user, isCoach, loadConversations])

    // Polling
    useEffect(() => {
        if (!user || isCoach === null || !hasLoadedConversationsRef.current) return
        pollingIntervalRef.current = setInterval(() => {
            if (!isUpdatingUnreadRef.current && !isLoadingRef.current) {
                loadConversations(true)
                if (selectedConversationId) loadMessages(selectedConversationId, true)
            }
        }, 5000)
        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
        }
    }, [user, isCoach, selectedConversationId, loadConversations, loadMessages])

    const selectedConversation = selectedConversationId
        ? conversations.find(c => c.id === selectedConversationId) || null
        : null

    const contactName = selectedConversation
        ? (isCoach ? selectedConversation.client_name : selectedConversation.coach_name) || 'Usuario'
        : null

    const contactAvatar = selectedConversation
        ? (isCoach ? selectedConversation.client_avatar : selectedConversation.coach_avatar)
        : null

    // Daily Message Limit Logic (Disabled for now as per user request to unblock)
    const remainingMessages = 999
    const isLimitReached = false
    const showLimitWarning = false

    return {
        user,
        conversations,
        selectedConversationId,
        setSelectedConversationId,
        messages,
        newMessage,
        setNewMessage,
        loading,
        loadingMessages,
        sending,
        isCoach,
        selectedConversation,
        contactName,
        contactAvatar,
        sendMessage,
        loadConversations,
        loadMessages,
        remainingMessages,
        isLimitReached,
        showLimitWarning
    }
}

export const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
