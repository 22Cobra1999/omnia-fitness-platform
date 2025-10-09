"use client"

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CoachesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirigir a la página principal con tab de búsqueda
    router.push('/?tab=search')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-white">Redirigiendo...</p>
    </div>
  )
}
