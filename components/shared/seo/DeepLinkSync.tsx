"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DeepLinkSyncProps {
    id: string
    tab?: string
}

export function DeepLinkSync({ id, tab = 'activity' }: DeepLinkSyncProps) {
    const router = useRouter()

    useEffect(() => {
        if (typeof window === 'undefined') return

        // Create the new URL with the parameters the SPA expects
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('tab', tab)
        newUrl.searchParams.set('id', id)

        // Use replaceState to update the URL without adding a new history entry (or pushState if preferred)
        // We want the MobileApp to see these params on mount/update.
        window.history.replaceState({}, '', newUrl.toString())

        // Dispatch a custom event or popstate to ensure listeners react if needed
        // MobileApp listens to searchParams changes so a router.replace might be cleaner but that triggers a navigation.
        // Direct history manipulation is invisible to Next.js router sometimes.
        // Let's try to trigger a router refresh or just trust that MobileApp is mounting NOW.

        // If MobileApp is already mounted (e.g. client transition), this might need to trigger an update.
        // If this component is rendered server-side first, then on client hydration this runs.

    }, [id, tab, router])

    return null
}
