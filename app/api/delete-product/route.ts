import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    
    if (!productId) {
      return NextResponse.json({ 
        success: false,
        error: 'ID del producto requerido'
      }, { status: 400 })
    }
    
    console.log('🗑️ DELETE PRODUCT: Eliminando producto:', productId)
    
    // Verificar si el producto tiene compradores (opcional, no fallar si no existe la tabla)
    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('activity_id', productId)
        .limit(1)
      
      if (purchaseError) {
        console.log('⚠️ DELETE PRODUCT: Tabla purchases no disponible, continuando...')
      } else if (purchases && purchases.length > 0) {
        return NextResponse.json({ 
          success: false,
          error: 'No se puede eliminar el producto porque ya tiene compradores'
        }, { status: 400 })
      }
    } catch (error) {
      console.log('⚠️ DELETE PRODUCT: Error verificando compras, continuando...')
    }
    
    // Eliminar datos relacionados (opcional, no fallar si no existen)
    try {
      // Eliminar ejercicios relacionados
      console.log('🗑️ DELETE PRODUCT: Eliminando ejercicios...')
      await supabase
        .from('ejercicios_detalles')
        .delete()
        .eq('activity_id', productId)
      
      // Eliminar media relacionada
      console.log('🗑️ DELETE PRODUCT: Eliminando media...')
      await supabase
        .from('activity_media')
        .delete()
        .eq('activity_id', productId)
      
      // Eliminar períodos relacionados
      console.log('🗑️ DELETE PRODUCT: Eliminando períodos...')
      await supabase
        .from('periodos')
        .delete()
        .eq('activity_id', productId)
        
      console.log('✅ DELETE PRODUCT: Datos relacionados eliminados')
    } catch (error) {
      console.log('⚠️ DELETE PRODUCT: Error eliminando datos relacionados, continuando...')
    }
    
    // Eliminar el producto principal
    console.log('🗑️ DELETE PRODUCT: Eliminando producto principal...')
    const { data: deletedProduct, error: deleteProductError } = await supabase
      .from('activities')
      .delete()
      .eq('id', productId)
      .select()
    
    if (deleteProductError) {
      console.error('❌ DELETE PRODUCT: Error eliminando producto:', deleteProductError)
      return NextResponse.json({ 
        success: false,
        error: 'Error eliminando producto',
        details: deleteProductError.message
      }, { status: 500 })
    }
    
    console.log('🗑️ DELETE PRODUCT: Producto eliminado:', deletedProduct)
    
    console.log('✅ DELETE PRODUCT: Producto eliminado exitosamente:', productId)
    
    return NextResponse.json({ 
      success: true,
      message: 'Producto eliminado exitosamente'
    })
    
  } catch (error) {
    console.error('❌ DELETE PRODUCT: Error general:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
