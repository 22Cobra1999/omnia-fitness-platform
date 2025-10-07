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

    console.log('🗑️ DELETE PRODUCT BASIC: Eliminando producto:', productId)

    // Solo eliminar de la tabla activities
    const { data: deletedProduct, error: deleteProductError } = await supabase
      .from('activities')
      .delete()
      .eq('id', productId)
      .select()

    if (deleteProductError) {
      console.error('❌ DELETE PRODUCT BASIC: Error eliminando producto:', deleteProductError)
      return NextResponse.json({
        success: false,
        error: 'Error eliminando producto',
        details: deleteProductError.message
      }, { status: 500 })
    }

    console.log('✅ DELETE PRODUCT BASIC: Producto eliminado:', deletedProduct)

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      deletedProduct: deletedProduct
    })

  } catch (error) {
    console.error('❌ DELETE PRODUCT BASIC: Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}