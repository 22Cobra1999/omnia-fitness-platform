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
    const { phone_number, action } = await request.json()
    if (!phone_number) {
      return NextResponse.json({ error: 'Número de teléfono requerido' }, { status: 400 })
    }
    // Validar formato del número de teléfono
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone_number)) {
      return NextResponse.json({ 
        error: 'Formato de teléfono inválido. Debe incluir código de país (ej: +5491112345678)' 
      }, { status: 400 })
    }
    if (action === 'send_code') {
      // Generar código de verificación
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
      // Guardar el código en la base de datos
      const { error: insertError } = await supabase
        .from('whatsapp_verifications')
        .insert({
          coach_id: user.id,
          phone_number,
          verification_code: verificationCode,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
      if (insertError) {
        console.error('Error guardando código de verificación:', insertError)
        return NextResponse.json({ error: 'Error al enviar código de verificación' }, { status: 500 })
      }
      // En producción, aquí se enviaría el código por WhatsApp usando Twilio o similar
      // Por ahora, simulamos el envío
      console.log(`Código de verificación para ${phone_number}: ${verificationCode}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Código de verificación enviado',
        phone_number,
        expires_in: 600 // 10 minutos en segundos
      })
    } else if (action === 'verify_code') {
      const { verification_code } = await request.json()
      if (!verification_code) {
        return NextResponse.json({ error: 'Código de verificación requerido' }, { status: 400 })
      }
      // Verificar el código
      const { data: verification, error: verifyError } = await supabase
        .from('whatsapp_verifications')
        .select('*')
        .eq('coach_id', user.id)
        .eq('phone_number', phone_number)
        .eq('verification_code', verification_code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (verifyError || !verification) {
        return NextResponse.json({ 
          error: 'Código de verificación inválido o expirado' 
        }, { status: 400 })
      }
      // Actualizar el perfil del coach
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ 
          whatsapp: phone_number,
          whatsapp_verified: true,
          whatsapp_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      if (updateError) {
        console.error('Error actualizando WhatsApp:', updateError)
        return NextResponse.json({ error: 'Error al verificar WhatsApp' }, { status: 500 })
      }
      // Limpiar códigos de verificación usados
      await supabase
        .from('whatsapp_verifications')
        .delete()
        .eq('coach_id', user.id)
        .eq('phone_number', phone_number)
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp verificado exitosamente',
        phone_number,
        verified: true
      })
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error verificando WhatsApp:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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
    // Desconectar WhatsApp
    const { error: updateError } = await supabase
      .from('coaches')
      .update({ 
        whatsapp: null,
        whatsapp_verified: false,
        whatsapp_verified_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    if (updateError) {
      console.error('Error desconectando WhatsApp:', updateError)
      return NextResponse.json({ error: 'Error al desconectar WhatsApp' }, { status: 500 })
    }
    // Limpiar verificaciones pendientes
    await supabase
      .from('whatsapp_verifications')
      .delete()
      .eq('coach_id', user.id)
    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp desconectado exitosamente'
    })
  } catch (error) {
    console.error('Error desconectando WhatsApp:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
