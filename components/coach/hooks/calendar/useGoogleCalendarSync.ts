import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { toast } from 'sonner'

export function useGoogleCalendarSync(onSyncSuccess: () => Promise<void>) {
    const [googleConnected, setGoogleConnected] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const supabase = createClient()

    const checkGoogleConnection = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: tokens, error } = await supabase
                .from('google_oauth_tokens')
                .select('*')
                .eq('coach_id', user.id)
                .maybeSingle()

            setGoogleConnected(!error && !!tokens)
        } catch (error) {
            console.error('Error checking Google connection:', error)
            setGoogleConnected(false)
        }
    }, [supabase])

    const handleSyncGoogleCalendar = async () => {
        if (!googleConnected) {
            toast.error('Google Calendar no está conectado')
            return
        }

        setSyncing(true)
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 60000)

            const response = await fetch('/api/google/calendar/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
                throw new Error(errorData.error || `Error ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                const errorMsg = result.errors && result.errors.length > 0
                    ? ` (${result.errors.length} errores)`
                    : ''
                toast.success(`Sincronización completada: ${result.synced || 0} eventos sincronizados${errorMsg}`)
                await onSyncSuccess()
            } else {
                toast.error(result.error || 'Error al sincronizar con Google Calendar')
            }
        } catch (error: any) {
            console.error('Error sincronizando:', error)
            if (error.name === 'AbortError') {
                toast.error('La sincronización tardó demasiado. Intenta de nuevo con menos eventos.')
            } else {
                toast.error(error.message || 'Error al sincronizar con Google Calendar')
            }
        } finally {
            setSyncing(false)
        }
    }

    return {
        googleConnected,
        setGoogleConnected,
        syncing,
        checkGoogleConnection,
        handleSyncGoogleCalendar
    }
}
