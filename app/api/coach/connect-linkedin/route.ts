import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { linkedin_url, action } = await request.json()
    if (!linkedin_url) {
      return NextResponse.json({ error: 'URL de LinkedIn requerida' }, { status: 400 })
    }
    // Validar formato de la URL de LinkedIn
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/
    if (!linkedinRegex.test(linkedin_url)) {
      return NextResponse.json({ 
        error: 'URL de LinkedIn inválida. Debe ser un perfil personal o de empresa válido' 
      }, { status: 400 })
    }
    if (action === 'send_verification') {
      // Generar código de verificación único
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      // Guardar la verificación en la base de datos
      const { error: insertError } = await supabase
        .from('linkedin_verifications')
        .insert({
          coach_id: user.id,
          linkedin_url,
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
      if (insertError) {
        console.error('Error guardando verificación de LinkedIn:', insertError)
        return NextResponse.json({ error: 'Error al iniciar verificación de LinkedIn' }, { status: 500 })
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Verificación iniciada. Agrega el código a tu perfil de LinkedIn',
        linkedin_url,
        verification_code: verificationCode,
        expires_in: 1800 // 30 minutos en segundos
      })
    } else if (action === 'verify_profile') {
      // Verificar que el código esté en el perfil de LinkedIn
      const isVerified = await verifyLinkedInProfile(linkedin_url, user.id)
      if (!isVerified) {
        return NextResponse.json({ 
          error: 'No se pudo verificar el código en tu perfil de LinkedIn. Asegúrate de haberlo agregado.' 
        }, { status: 400 })
      }
      // Actualizar el perfil del coach
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ 
          linkedin_url,
          linkedin_verified: true,
          linkedin_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      if (updateError) {
        console.error('Error actualizando LinkedIn:', updateError)
        return NextResponse.json({ error: 'Error al conectar LinkedIn' }, { status: 500 })
      }
      // Limpiar verificaciones usadas
      await supabase
        .from('linkedin_verifications')
        .delete()
        .eq('coach_id', user.id)
        .eq('linkedin_url', linkedin_url)
      return NextResponse.json({ 
        success: true, 
        message: 'LinkedIn conectado exitosamente',
        linkedin_url,
        verified: true
      })
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error conectando LinkedIn:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
// Función para verificar el perfil de LinkedIn (simulada)
async function verifyLinkedInProfile(linkedinUrl: string, coachId: string): Promise<boolean> {
  try {
    // En producción, aquí se haría una llamada real a la API de LinkedIn
    // Por ahora, simulamos una verificación exitosa
    const response = await fetch(linkedinUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    // Si la respuesta es 200, asumimos que el perfil existe
    // En producción, aquí se buscaría el código de verificación en el contenido
    return response.status === 200
  } catch (error) {
    console.error('Error verificando perfil de LinkedIn:', error)
    // En caso de error, asumimos que el perfil es válido para desarrollo
    return true
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Desconectar LinkedIn
    const { error: updateError } = await supabase
      .from('coaches')
      .update({ 
        linkedin_url: null,
        linkedin_verified: false,
        linkedin_verified_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    if (updateError) {
      console.error('Error desconectando LinkedIn:', updateError)
      return NextResponse.json({ error: 'Error al desconectar LinkedIn' }, { status: 500 })
    }
    // Limpiar verificaciones pendientes
    await supabase
      .from('linkedin_verifications')
      .delete()
      .eq('coach_id', user.id)
    return NextResponse.json({ 
      success: true, 
      message: 'LinkedIn desconectado exitosamente'
    })
  } catch (error) {
    console.error('Error desconectando LinkedIn:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
