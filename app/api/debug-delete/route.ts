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

    console.log('🔍 DEBUG DELETE: Investigando eliminación de producto:', productId)

    // 1. Verificar si el producto existe
    console.log('🔍 DEBUG DELETE: Verificando si el producto existe...')
    const { data: existingProduct, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.log('❌ DEBUG DELETE: Error obteniendo producto:', fetchError)
      return NextResponse.json({
        success: false,
        error: 'Producto no encontrado',
        details: fetchError.message
      }, { status: 404 })
    }

    console.log('✅ DEBUG DELETE: Producto encontrado:', existingProduct)

    // 2. Verificar tablas relacionadas
    console.log('🔍 DEBUG DELETE: Verificando tablas relacionadas...')
    
    const tablesToCheck = [
      'ejercicios_detalles',
      'planificacion_ejercicios', 
      'periodos',
      'activity_media',
      'purchases'
    ]

    const relatedData = {}
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('activity_id', productId)
          .limit(5)
        
        if (error) {
          console.log(`⚠️ DEBUG DELETE: Error en tabla ${table}:`, error.message)
          relatedData[table] = { error: error.message, count: 0 }
        } else {
          console.log(`✅ DEBUG DELETE: Tabla ${table} - ${data?.length || 0} registros`)
          relatedData[table] = { count: data?.length || 0, data: data }
        }
      } catch (err) {
        console.log(`❌ DEBUG DELETE: Error accediendo tabla ${table}:`, err.message)
        relatedData[table] = { error: err.message, count: 0 }
      }
    }

    // 3. Intentar eliminación paso a paso
    console.log('🔍 DEBUG DELETE: Intentando eliminación paso a paso...')
    
    // Primero eliminar datos relacionados
    for (const table of tablesToCheck) {
      try {
        console.log(`🗑️ DEBUG DELETE: Eliminando de tabla ${table}...`)
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('activity_id', productId)
        
        if (error) {
          console.log(`⚠️ DEBUG DELETE: Error eliminando de ${table}:`, error.message)
        } else {
          console.log(`✅ DEBUG DELETE: Eliminado exitosamente de ${table}`)
        }
      } catch (err) {
        console.log(`❌ DEBUG DELETE: Error eliminando de ${table}:`, err.message)
      }
    }

    // Finalmente eliminar el producto principal
    console.log('🗑️ DEBUG DELETE: Eliminando producto principal...')
    const { data: deletedProduct, error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', productId)
      .select()

    if (deleteError) {
      console.log('❌ DEBUG DELETE: Error eliminando producto principal:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error eliminando producto principal',
        details: deleteError.message,
        relatedData: relatedData
      }, { status: 500 })
    }

    console.log('✅ DEBUG DELETE: Producto eliminado exitosamente:', deletedProduct)

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      deletedProduct: deletedProduct,
      relatedData: relatedData
    })

  } catch (error) {
    console.error('❌ DEBUG DELETE: Error general:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 })
  }
}
















