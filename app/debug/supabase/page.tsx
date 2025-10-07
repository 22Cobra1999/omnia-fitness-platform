import { DebugSupabase } from "@/components/debug-supabase"

export default function DebugSupabasePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Supabase</h1>
      <DebugSupabase />
    </div>
  )
}
