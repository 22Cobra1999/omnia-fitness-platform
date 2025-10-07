import { DebugCoaches } from "@/components/debug-coaches"

export default function DebugCoachesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico de Coaches</h1>
      <p className="text-muted-foreground mb-6">
        Esta página muestra información de diagnóstico para ayudar a solucionar problemas con la carga de coaches.
      </p>

      <DebugCoaches />
    </div>
  )
}
