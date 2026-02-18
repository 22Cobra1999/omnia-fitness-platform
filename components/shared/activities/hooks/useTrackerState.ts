import { useState } from "react"

export function useTrackerState() {
    const [timeframe, setTimeframe] = useState("week")
    const [openDialog, setOpenDialog] = useState<string | null>(null)

    return {
        timeframe,
        setTimeframe,
        openDialog,
        setOpenDialog
    }
}
