import { type NextRequest, NextResponse } from "next/server"
export async function POST(request: NextRequest) {
  console.log("🔥 TEST API ROUTE EJECUTADO")
  try {
    const body = await request.json()
    console.log("📝 Datos recibidos:", body)
    return NextResponse.json({
      success: true,
      message: "Test API funcionando correctamente",
      timestamp: new Date().toISOString(),
      receivedData: body,
    })
  } catch (error) {
    console.error("❌ Error en test API:", error)
    return NextResponse.json(
      {
        error: "Error en test API",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
export async function GET() {
  console.log("🔥 TEST API ROUTE GET EJECUTADO")
  return NextResponse.json({
    success: true,
    message: "Test API GET funcionando",
    timestamp: new Date().toISOString(),
  })
}
