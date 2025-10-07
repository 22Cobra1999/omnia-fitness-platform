"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CoachPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a la página de productos
    router.push("/products")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#252525] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#FF7939] mx-auto mb-4" />
        <p className="text-gray-400">Redirigiendo a la gestión de productos...</p>
      </div>
    </div>
  )
}
