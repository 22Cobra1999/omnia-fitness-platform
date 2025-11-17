import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Leer de storage_usage
    const { data: storageUsage, error: storageError } = await supabase
      .from('storage_usage')
      .select('*')
      .eq('coach_id', user.id)
    
    if (storageError) {
      console.error('Error leyendo storage_usage:', storageError)
    }

    // Agregar activities info
    const videoRow = storageUsage?.find(s => s.concept === 'video')
    const imageRow = storageUsage?.find(s => s.concept === 'image')
    const pdfRow = storageUsage?.find(s => s.concept === 'pdf')

    const total = (videoRow?.gb_usage || 0) + (imageRow?.gb_usage || 0) + (pdfRow?.gb_usage || 0)

    return NextResponse.json({
      success: true,
      storage: {
        total: parseFloat(total.toFixed(6)),
        breakdown: {
          video: parseFloat((videoRow?.gb_usage || 0).toFixed(6)),
          image: parseFloat((imageRow?.gb_usage || 0).toFixed(6)),
          pdf: parseFloat((pdfRow?.gb_usage || 0).toFixed(6))
        },
        activityUsage: {
          video: videoRow?.products || [],
          image: imageRow?.products || [],
          pdf: pdfRow?.products || []
        },
        fileNames: {
          video: (videoRow as any)?.file_name,
          image: (imageRow as any)?.file_name,
          pdf: (pdfRow as any)?.file_name
        }
      }
    })

  } catch (error) {
    console.error('Error en GET /api/coach/storage-usage:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
