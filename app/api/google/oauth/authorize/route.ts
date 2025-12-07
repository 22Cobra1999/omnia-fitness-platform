import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { GoogleOAuth } from '@/lib/google/oauth';

/**
 * Endpoint para iniciar el flujo OAuth de Google Calendar
 * Redirige al coach a Google para autorizar a OMNIA
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coach_id');

    if (!coachId) {
      return NextResponse.json({ error: 'coach_id es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el coach_id coincida con el usuario autenticado
    if (session.user.id !== coachId) {
      return NextResponse.json({ error: 'No autorizado para este coach' }, { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://omnia-app.vercel.app';
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI?.trim() || 
                       `${appUrl}/api/google/oauth/callback`;

    // Verificar variables de entorno con mejor mensaje de error
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    
    console.log('🔵 [Google OAuth Authorize] Verificando configuración:', {
      hasGoogleClientId: !!googleClientId,
      clientIdLength: googleClientId?.length || 0,
      clientIdPrefix: googleClientId?.substring(0, 20) || 'N/A',
      clientIdSuffix: googleClientId?.substring(googleClientId.length - 30) || 'N/A',
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET?.trim(),
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
    });
    
    if (!googleClientId) {
      console.error('❌ GOOGLE_CLIENT_ID no configurado. Variables de entorno disponibles:', {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
        nodeEnv: process.env.NODE_ENV,
      });
      
      return NextResponse.json({ 
        error: 'GOOGLE_CLIENT_ID no configurado',
        details: 'Por favor, verifica que la variable de entorno GOOGLE_CLIENT_ID esté configurada en Vercel',
        hint: 'Ve a Vercel Dashboard → Settings → Environment Variables y verifica que GOOGLE_CLIENT_ID esté configurado para producción'
      }, { status: 500 });
    }

    // Construir URL de autorización de Google directamente para tener control del state
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state: coachId, // Pasar coach_id en el state
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log('🔗 Redirigiendo a Google Calendar OAuth:', authUrl);
    console.log('📋 Parámetros:', {
      coachId,
      redirectUri,
      appUrl,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID
    });

    // Redirigir a Google con headers explícitos
    return NextResponse.redirect(authUrl, {
      status: 307,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Location': authUrl
      }
    });

  } catch (error: any) {
    console.error('Error en OAuth authorize:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

