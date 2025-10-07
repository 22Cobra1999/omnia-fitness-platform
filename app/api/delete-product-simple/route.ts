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
    
    console.log('🗑️ DELETE PRODUCT SIMPLE: Eliminando producto:', productId)
    
    // Primero intentar eliminar datos relacionados (si existen)
    try {
      // Eliminar ejercicios relacionados
      const { error: ejerciciosError } = await supabase
        .from('ejercicios_detalles')
        .delete()
        .eq('activity_id', productId)
      
      if (ejerciciosError) {
        console.log('⚠️ DELETE PRODUCT SIMPLE: No se pudieron eliminar ejercicios (tabla puede no existir):', ejerciciosError.message)
      }
    } catch (err) {
      console.log('⚠️ DELETE PRODUCT SIMPLE: Error eliminando ejercicios (ignorando):', err.message)
    }
    
    try {
      // Eliminar planificación de ejercicios
      const { error: planificacionError } = await supabase
        .from('planificacion_ejercicios')
        .delete()
        .eq('activity_id', productId)
      
      if (planificacionError) {
        console.log('⚠️ DELETE PRODUCT SIMPLE: No se pudo eliminar planificación (tabla puede no existir):', planificacionError.message)
      }
    } catch (err) {
      console.log('⚠️ DELETE PRODUCT SIMPLE: Error eliminando planificación (ignorando):', err.message)
    }
    
    try {
      // Eliminar períodos
      const { error: periodosError } = await supabase
        .from('periodos')
        .delete()
        .eq('activity_id', productId)
      
      if (periodosError) {
        console.log('⚠️ DELETE PRODUCT SIMPLE: No se pudieron eliminar períodos (tabla puede no existir):', periodosError.message)
      }
    } catch (err) {
      console.log('⚠️ DELETE PRODUCT SIMPLE: Error eliminando períodos (ignorando):', err.message)
    }
    
    try {
      // Eliminar media
      const { error: mediaError } = await supabase
        .from('activity_media')
        .delete()
        .eq('activity_id', productId)
      
      if (mediaError) {
        console.log('⚠️ DELETE PRODUCT SIMPLE: No se pudo eliminar media (tabla puede no existir):', mediaError.message)
      }
    } catch (err) {
      console.log('⚠️ DELETE PRODUCT SIMPLE: Error eliminando media (ignorando):', err.message)
    }
    
    // Finalmente eliminar el producto principal
    const { data: deletedProduct, error: deleteProductError } = await supabase
      .from('activities')
      .delete()
      .eq('id', productId)
      .select()
    
    if (deleteProductError) {
      console.error('❌ DELETE PRODUCT SIMPLE: Error eliminando producto:', deleteProductError)
      return NextResponse.json({ 
        success: false,
        error: 'Error eliminando producto',
        details: deleteProductError.message
      }, { status: 500 })
    }
    
    console.log('✅ DELETE PRODUCT SIMPLE: Producto eliminado:', deletedProduct)
    
    return NextResponse.json({ 
      success: true,
      message: 'Producto eliminado exitosamente',
      deletedProduct: deletedProduct
    })
    
  } catch (error) {
    console.error('❌ DELETE PRODUCT SIMPLE: Error general:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
