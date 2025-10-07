import { NextRequest, NextResponse } from 'next/server'
import { createClientWithCookies } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)
    
    const { activity_id, calendar_data } = await request.json()
    
    if (!activity_id || !calendar_data) {
      return NextResponse.json(
        { error: 'activity_id y calendar_data son requeridos' },
        { status: 400 }
      )
    }
    
    // Primero, eliminar datos existentes para esta actividad
    await supabase
      .from('activity_calendar')
      .delete()
      .eq('activity_id', activity_id)
    
    // Insertar nuevos datos del calendario
    const { data, error } = await supabase
      .from('activity_calendar')
      .insert(calendar_data)
      .select()
    
    if (error) {
      console.error('Error inserting calendar data:', error)
      return NextResponse.json(
        { error: 'Error al guardar el calendario' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Calendario guardado exitosamente',
      data: data
    })
    
  } catch (error) {
    console.error('Error in activity-calendar POST:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClientWithCookies(cookieStore)
    
    const { searchParams } = new URL(request.url)
    const activity_id = searchParams.get('activity_id')
    
    if (!activity_id) {
      return NextResponse.json(
        { error: 'activity_id es requerido' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('activity_calendar')
      .select('*')
      .eq('activity_id', activity_id)
      .order('calculated_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching calendar data:', error)
      return NextResponse.json(
        { error: 'Error al obtener el calendario' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: data
    })
    
  } catch (error) {
    console.error('Error in activity-calendar GET:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
