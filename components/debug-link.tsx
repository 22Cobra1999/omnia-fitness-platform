"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export function DebugLink() {
  const pathname = usePathname()

  // Solo mostrar en páginas de coach
  if (!pathname.includes("/coach/")) {
    return null
  }

  // Extraer el ID del coach de la URL
  const coachId = pathname.split("/")[2]

  if (!coachId) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link
        href={`/debug/coach-activities/${coachId}`}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Diagnosticar Actividades
      </Link>
    </div>
  )
}
