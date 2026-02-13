import { useState, useEffect } from "react"

export function useBunnyVideoTitles() {
    const [bunnyVideoTitles, setBunnyVideoTitles] = useState<Record<string, string>>({})

    useEffect(() => {
        const loadBunnyTitles = async () => {
            try {
                const res = await fetch("/api/coach/storage-files", { credentials: "include" })
                const data = await res.json()
                if (!res.ok || !data?.success) return

                const next: Record<string, string> = {}
                const files = Array.isArray(data.files) ? data.files : []
                for (const f of files) {
                    if (!f || f.concept !== "video") continue
                    if (typeof f.fileId !== "string" || typeof f.fileName !== "string") continue
                    next[f.fileId] = f.fileName
                }
                setBunnyVideoTitles(next)
            } catch {
                // ignore
            }
        }

        loadBunnyTitles()
    }, [])

    return { bunnyVideoTitles }
}
