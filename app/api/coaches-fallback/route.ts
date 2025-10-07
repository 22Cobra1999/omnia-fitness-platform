import { NextResponse } from "next/server"
// Datos de fallback para coaches (array vacío)
const FALLBACK_COACHES = []
export async function GET() {
  // Simular un pequeño retraso para que parezca una solicitud real
  await new Promise((resolve) => setTimeout(resolve, 300))
  return NextResponse.json(FALLBACK_COACHES)
}
