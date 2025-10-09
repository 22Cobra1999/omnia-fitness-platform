import { Suspense } from "react"
import MobileApp from "@/app-mobile"

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-white">Cargando...</p>
    </div>}>
      <MobileApp />
    </Suspense>
  )
}
