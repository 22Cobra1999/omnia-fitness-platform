import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'No se envió ningún archivo' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `certificates/${user.id}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error uploading certificate:', uploadError)
      return NextResponse.json({ success: false, error: 'Error al subir el archivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-media')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl
    })
  } catch (error) {
    console.error('Error in POST /api/profile/upload-certificate:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
