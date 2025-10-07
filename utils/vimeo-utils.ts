export function extractVimeoId(url: string): string | null {
  if (!url) return null

  try {
    // Patrones comunes de URLs de Vimeo
    const patterns = [
      /vimeo\.com\/(\d+)/, // vimeo.com/123456789
      /vimeo\.com\/video\/(\d+)/, // vimeo.com/video/123456789
      /player\.vimeo\.com\/video\/(\d+)/, // player.vimeo.com/video/123456789
      /vimeo\.com\/channels\/[^/]+\/(\d+)/, // vimeo.com/channels/staffpicks/123456789
      /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/, // vimeo.com/groups/name/videos/123456789
      /vimeo\.com\/album\/[^/]+\/video\/(\d+)/, // vimeo.com/album/name/video/123456789
      /vimeo\.com\/showcase\/[^/]+\/video\/(\d+)/, // vimeo.com/showcase/name/video/123456789
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    console.warn("No se pudo extraer el ID de Vimeo de la URL:", url)
    return null
  } catch (error) {
    console.error("Error al extraer el ID de Vimeo:", error)
    return null
  }
}

export function getVimeoThumbnailUrl(videoId: string | null | undefined): string | null {
  if (!videoId) return null

  return `https://i.vimeocdn.com/video/${videoId}.jpg`
}

export function isVimeoEmbed(input: string | null | undefined): boolean {
  if (!input) return false
  return input.includes("player.vimeo.com/video/")
}
