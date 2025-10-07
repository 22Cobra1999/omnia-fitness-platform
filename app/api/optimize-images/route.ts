import { NextResponse } from "next/server"
export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()
    if (!imageUrl) {
      return NextResponse.json({ error: "URL de imagen no proporcionada" }, { status: 400 })
    }
    // Aquí simplemente validamos la URL y la devolvemos
    // En una implementación real, podrías optimizar la imagen
    // o almacenarla en un servicio como Cloudinary o Supabase Storage
    const isValidUrl = (url: string) => {
      try {
        new URL(url)
        return true
      } catch (e) {
        return false
      }
    }
    if (!isValidUrl(imageUrl)) {
      return NextResponse.json({ error: "URL de imagen inválida" }, { status: 400 })
    }
    // Simular un pequeño retraso para mostrar que se está procesando
    await new Promise((resolve) => setTimeout(resolve, 100))
    return NextResponse.json({
      optimizedUrl: imageUrl,
      message: "URL de imagen validada correctamente",
    })
  } catch (error) {
    console.error("Error al procesar la imagen:", error)
    return NextResponse.json({ error: "Error al procesar la imagen" }, { status: 500 })
  }
}
