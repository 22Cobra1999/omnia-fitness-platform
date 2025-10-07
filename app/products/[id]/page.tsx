"use client"
import TodayScreen from "@/components/TodayScreen"
import { StartActivityButton } from "@/components/start-activity-button"
import { useEffect, useState } from "react"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) {
    return <div>Cargando...</div>
  }

  return (
    <div className="product-content">
      <TodayScreen activityId={resolvedParams.id} />
      <div className="fixed bottom-4 left-4 right-4 p-4 bg-card rounded-lg shadow-lg flex justify-center z-50">
        <StartActivityButton
          activityId={Number.parseInt(resolvedParams.id)}
        />
      </div>
    </div>
  )
}
