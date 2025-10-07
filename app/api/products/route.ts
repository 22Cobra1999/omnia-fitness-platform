import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener productos básicos
    const { data: products, error: productsError } = await supabase
      .from('activities')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    
    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }
    
    // Obtener media para cada producto
    const productsWithMedia = await Promise.all(
      (products || []).map(async (product) => {
        const { data: media } = await supabase
          .from('activity_media')
          .select('id, image_url, video_url, pdf_url')
          .eq('activity_id', product.id)
          .single()
        
        return {
          id: product.id,
          title: product.title || 'Sin título',
          name: product.title || 'Sin título', // Alias para compatibilidad
          description: product.description || 'Sin descripción',
          price: product.price || 0,
          type: product.type || 'activity',
          difficulty: product.difficulty || 'beginner',
          is_public: product.is_public || false,
          capacity: product.capacity || null,
          created_at: product.created_at,
          updated_at: product.updated_at,
          // Valores seguros para campos que pueden no existir
          program_rating: product.program_rating || null,
          total_program_reviews: product.total_program_reviews || null,
          coach_name: product.coach_name || null,
          coach_avatar_url: product.coach_avatar_url || null,
          coach_whatsapp: product.coach_whatsapp || null,
          // Media real
          media: media,
          image_url: media?.image_url || null,
          video_url: media?.video_url || null,
          pdf_url: media?.pdf_url || null,
          // Para compatibilidad con el modal
          activity_media: media ? [media] : []
        }
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      products: productsWithMedia 
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Crear producto en activities (la tabla real)
    const { data: product, error: productError } = await supabase
      .from('activities')
      .insert({
        title: body.name, // Usar title en lugar de name
        description: body.description,
        price: body.price,
        type: body.modality, // Usar type en lugar de modality
        difficulty: body.level, // Usar difficulty en lugar de level
        is_public: body.is_public,
        capacity: body.capacity,
        stockQuantity: body.stockQuantity,
        coach_id: user.id
      })
      .select()
      .single()
    
    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }
    
    return NextResponse.json(product)
    
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}