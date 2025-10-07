import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
export async function POST(request: NextRequest) {
  try {
    // console.log('🔍 Iniciando subida de certificación...')
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // // console.log('✅ Usuario autenticado:', user.id)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const certificationName = formData.get('certification_name') as string
    const issuer = formData.get('issuer') as string
    const year = formData.get('year') as string
    console.log('📋 Datos recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      certificationName,
      issuer,
      year
    })
    if (!file || !certificationName || !issuer || !year) {
      console.error('❌ Campos faltantes:', {
        hasFile: !!file,
        hasCertificationName: !!certificationName,
        hasIssuer: !!issuer,
        hasYear: !!year
      })
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos: file, certification_name, issuer, year' 
      }, { status: 400 })
    }
    // Validar tipo de archivo
    // console.log('🔍 Validando tipo de archivo:', file.type)
    if (file.type !== 'application/pdf') {
      console.error('❌ Tipo de archivo inválido:', file.type)
      return NextResponse.json({ 
        error: 'Solo se permiten archivos PDF' 
      }, { status: 400 })
    }
    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    // console.log('🔍 Validando tamaño:', file.size, 'bytes (máximo:', maxSize, ')')
    if (file.size > maxSize) {
      console.error('❌ Archivo demasiado grande:', file.size, 'bytes')
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB' 
      }, { status: 400 })
    }
    // console.log('✅ Validaciones pasadas correctamente')
    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `${user.id}_${timestamp}_${certificationName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    const filePath = `certificados/${fileName}`
    console.log(`📤 Subiendo certificación a Supabase Storage: ${filePath}`)
    // console.log(`📊 Información del archivo:`, { name: file.name, type: file.type, size: file.size })
    // Subir archivo a Supabase Storage usando el bucket product-images con carpeta certificados
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    if (uploadError) {
      console.error('❌ Error subiendo archivo:', uploadError)
      console.error('📊 Detalles del error:', {
        message: uploadError.message,
        name: uploadError.name
      })
      return NextResponse.json({ 
        error: 'Error al subir el archivo',
        details: uploadError.message 
      }, { status: 500 })
    }
    // console.log('✅ Archivo subido exitosamente a Storage')
    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    console.log('🔗 URL pública generada:', urlData.publicUrl)
    console.log('📁 Ruta del archivo:', filePath)
    // Guardar información de la certificación en la base de datos
    console.log('💾 Guardando certificación en base de datos...')
    // Preparar datos para inserción
    const certificationData = {
      coach_id: user.id,
      name: certificationName,
      issuer,
      year: parseInt(year),
      file_url: urlData.publicUrl,
      file_path: filePath,
      file_size: file.size,
      verified: false // Requiere verificación manual
    }
    console.log('📋 Datos a insertar:', certificationData)
    const { data: insertedCertification, error: insertError } = await supabase
      .from('coach_certifications')
      .insert(certificationData)
      .select()
      .single()
    if (insertError) {
      console.error('❌ Error guardando certificación:', insertError)
      console.error('📊 Detalles del error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      // Intentar obtener más información sobre el error
      if (insertError.code === '42P01') {
        console.error('❌ La tabla coach_certifications no existe')
        return NextResponse.json({ 
          error: 'La tabla de certificaciones no existe. Contacta al administrador.',
          details: 'Tabla coach_certifications no encontrada',
          code: insertError.code
        }, { status: 500 })
      }
      if (insertError.code === '42501') {
        console.error('❌ Error de permisos RLS')
        return NextResponse.json({ 
          error: 'Error de permisos. Contacta al administrador.',
          details: 'Políticas RLS no configuradas correctamente',
          code: insertError.code
        }, { status: 500 })
      }
      // Si falla, eliminar el archivo subido
      try {
        await supabase.storage
          .from('product-images')
          .remove([filePath])
        console.log('🗑️ Archivo eliminado del storage después del error')
      } catch (deleteError) {
        console.error('❌ Error eliminando archivo:', deleteError)
      }
      return NextResponse.json({ 
        error: 'Error al guardar la certificación',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }
    // console.log('✅ Certificación guardada exitosamente en BD')
    return NextResponse.json({ 
      success: true, 
      message: 'Certificación subida exitosamente',
      certification: {
        id: insertedCertification.id,
        name: insertedCertification.name,
        issuer: insertedCertification.issuer,
        year: insertedCertification.year,
        file_url: insertedCertification.file_url,
        verified: insertedCertification.verified
      }
    })
  } catch (error) {
    console.error('Error subiendo certificación:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    // Obtener certificaciones del coach
    const { data: certifications, error: fetchError } = await supabase
      .from('coach_certifications')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    if (fetchError) {
      console.error('Error obteniendo certificaciones:', fetchError)
      return NextResponse.json({ error: 'Error al obtener certificaciones' }, { status: 500 })
    }
    return NextResponse.json({ 
      success: true, 
      certifications: certifications || []
    })
  } catch (error) {
    console.error('Error obteniendo certificaciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function PUT(request: NextRequest) {
  try {
    // console.log('🔍 Iniciando actualización de certificación...')
    const supabase = createClient({ cookies })
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.log('✅ Usuario autenticado:', user.id)
    const body = await request.json()
    const { certification_id, certification_name, issuer, year, file } = body
    console.log('📋 Datos recibidos:', {
      certification_id,
      certification_name,
      issuer,
      year,
      hasFile: !!file
    })
    if (!certification_id || !certification_name || !issuer || !year) {
      console.error('❌ Campos faltantes')
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos: certification_id, certification_name, issuer, year' 
      }, { status: 400 })
    }
    // Verificar que la certificación existe y pertenece al usuario
    const { data: existingCert, error: fetchError } = await supabase
      .from('coach_certifications')
      .select('*')
      .eq('id', certification_id)
      .eq('coach_id', user.id)
      .single()
    if (fetchError || !existingCert) {
      console.error('❌ Certificación no encontrada:', fetchError)
      return NextResponse.json({ error: 'Certificación no encontrada' }, { status: 404 })
    }
    // console.log('✅ Certificación encontrada:', existingCert.id)
    let fileUrl = existingCert.file_url
    let filePath = existingCert.file_path
    // Si se proporciona un nuevo archivo, subirlo
    if (file) {
      try {
        // Convertir base64 a archivo
        const base64Data = file.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const fileBlob = new Blob([buffer], { type: 'application/pdf' })
        // Generar nombre único para el archivo
        const timestamp = Date.now()
        const fileName = `${user.id}_${timestamp}_${certification_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        const newFilePath = `certificados/${fileName}`
        console.log(`📤 Subiendo nuevo archivo: ${newFilePath}`)
        // Subir nuevo archivo
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(newFilePath, fileBlob, {
            cacheControl: '3600',
            upsert: false
          })
        if (uploadError) {
          console.error('❌ Error subiendo nuevo archivo:', uploadError)
          return NextResponse.json({ 
            error: 'Error al subir el nuevo archivo',
            details: uploadError.message 
          }, { status: 500 })
        }
        // Obtener URL del nuevo archivo
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(newFilePath)
        fileUrl = urlData.publicUrl
        filePath = newFilePath
        // Eliminar archivo anterior
        if (existingCert.file_path && existingCert.file_path !== newFilePath) {
          const { error: deleteError } = await supabase.storage
            .from('product-images')
            .remove([existingCert.file_path])
          if (deleteError) {
            console.error('⚠️ Error eliminando archivo anterior:', deleteError)
          }
        }
        // console.log('✅ Nuevo archivo subido exitosamente')
      } catch (fileError) {
        console.error('❌ Error procesando archivo:', fileError)
        return NextResponse.json({ 
          error: 'Error procesando el archivo',
          details: fileError instanceof Error ? fileError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    // Actualizar certificación en la base de datos
    console.log('💾 Actualizando certificación en BD...')
    const updateData = {
      name: certification_name,
      issuer,
      year: parseInt(year),
      file_url: fileUrl,
      file_path: filePath,
      verified: false // Requiere nueva verificación
    }
    console.log('📋 Datos a actualizar:', updateData)
    const { data: updatedCertification, error: updateError } = await supabase
      .from('coach_certifications')
      .update(updateData)
      .eq('id', certification_id)
      .eq('coach_id', user.id)
      .select()
      .single()
    if (updateError) {
      console.error('❌ Error actualizando certificación:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar la certificación',
        details: updateError.message
      }, { status: 500 })
    }
    // console.log('✅ Certificación actualizada exitosamente')
    return NextResponse.json({ 
      success: true, 
      message: 'Certificación actualizada exitosamente',
      certification: {
        id: updatedCertification.id,
        name: updatedCertification.name,
        issuer: updatedCertification.issuer,
        year: updatedCertification.year,
        file_url: updatedCertification.file_url,
        verified: updatedCertification.verified
      }
    })
  } catch (error) {
    console.error('Error actualizando certificación:', error)
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
    const { certification_id } = await request.json()
    if (!certification_id) {
      return NextResponse.json({ error: 'ID de certificación requerido' }, { status: 400 })
    }
    // Obtener información de la certificación
    const { data: certification, error: fetchError } = await supabase
      .from('coach_certifications')
      .select('*')
      .eq('id', certification_id)
      .eq('coach_id', user.id)
      .single()
    if (fetchError || !certification) {
      return NextResponse.json({ error: 'Certificación no encontrada' }, { status: 404 })
    }
    // Eliminar archivo de storage
    if (certification.file_path) {
      const { error: deleteFileError } = await supabase.storage
        .from('product-images')
        .remove([certification.file_path])
      if (deleteFileError) {
        console.error('Error eliminando archivo:', deleteFileError)
      }
    }
    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('coach_certifications')
      .delete()
      .eq('id', certification_id)
      .eq('coach_id', user.id)
    if (deleteError) {
      console.error('Error eliminando certificación:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar la certificación' }, { status: 500 })
    }
    return NextResponse.json({ 
      success: true, 
      message: 'Certificación eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error eliminando certificación:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
