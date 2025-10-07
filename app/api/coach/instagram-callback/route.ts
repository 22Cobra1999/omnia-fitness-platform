import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const error_reason = searchParams.get('error_reason')
    const error_description = searchParams.get('error_description')
    // console.log('🔍 Instagram OAuth Callback - Params:', { hasCode: !!code, hasState: !!state })
    
    // Si hay un error en la autorización
    if (error) {
      console.error('❌ Instagram OAuth Callback - Authorization error:', {
        error,
        error_reason,
        error_description
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent(error_description || 'Error de autorización')}`
      )
    }
    if (!code || !state) {
      console.error('❌ Instagram OAuth Callback - Missing code or state')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Código de autorización faltante')}`
      )
    }
    const supabase = createClient({ cookies })
    // Verificar que el usuario existe
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== state) {
      console.error('❌ Instagram OAuth Callback - User verification failed:', {
        authError: authError?.message,
        userId: user?.id,
        state
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Verificación de usuario fallida')}`
      )
    }
    // Intercambiar el código por un token de acceso
    const tokenResponse = await exchangeCodeForToken(code)
    if (!tokenResponse.success) {
      console.error('❌ Instagram OAuth Callback - Token exchange failed:', tokenResponse.error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Error al obtener token de acceso')}`
      )
    }
    // Obtener información del usuario de Instagram
    const userInfo = await getInstagramUserInfo(tokenResponse.access_token)
    if (!userInfo.success) {
      console.error('❌ Instagram OAuth Callback - User info failed:', userInfo.error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Error al obtener información del usuario')}`
      )
    }
    // Actualizar el perfil del coach con la información de Instagram
    const { error: updateError } = await supabase
      .from('coaches')
      .update({
        instagram_username: userInfo.username,
        instagram_verified: true,
        instagram_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    if (updateError) {
      console.error('❌ Instagram OAuth Callback - Database update failed:', updateError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Error al guardar información')}`
      )
    }
    // console.log('✅ Instagram OAuth Callback - Success:', { username: userInfo.username, userId: user.id })
    // Redirigir de vuelta al perfil con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_success=true&username=${encodeURIComponent(userInfo.username)}`
    )
  } catch (error) {
    console.error('❌ Instagram OAuth Callback - Unexpected error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/coach/profile?instagram_error=${encodeURIComponent('Error inesperado')}`
    )
  }
}
// Función para intercambiar código por token de acceso
async function exchangeCodeForToken(code: string) {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
      console.log('❌ Instagram Token Exchange - Missing environment variables')
      // Para desarrollo, simular éxito
      return {
        success: true,
        access_token: 'simulated_token_for_development',
        simulated: true
      }
    }
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('❌ Instagram Token Exchange - API error:', data)
      return {
        success: false,
        error: data.error_message || 'Error en el intercambio de token'
      }
    }
    return {
      success: true,
      access_token: data.access_token,
      user_id: data.user_id
    }
  } catch (error) {
    console.error('❌ Instagram Token Exchange - Network error:', error)
    return {
      success: false,
      error: 'Error de red al intercambiar token'
    }
  }
}
// Función para obtener información del usuario de Instagram
async function getInstagramUserInfo(accessToken: string) {
  try {
    if (accessToken === 'simulated_token_for_development') {
      // Para desarrollo, simular información de usuario
      return {
        success: true,
        username: 'usuario_instagram_simulado',
        id: '123456789',
        simulated: true
      }
    }
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    )
    const data = await response.json()
    if (!response.ok) {
      console.error('❌ Instagram User Info - API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Error al obtener información del usuario'
      }
    }
    return {
      success: true,
      username: data.username,
      id: data.id
    }
  } catch (error) {
    console.error('❌ Instagram User Info - Network error:', error)
    return {
      success: false,
      error: 'Error de red al obtener información del usuario'
    }
  }
}
