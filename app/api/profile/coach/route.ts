import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()

    const coachUpdates: any = {}
    const meetsUpdates: any = { id: user.id }
    const socialUpdates: any = { id: user.id }
    const contactUpdates: any = { id: user.id }

    let hasMeets = false
    let hasSocial = false
    let hasContact = false

    // Mapear campos a sus respectivas tablas
    if (formData.has('full_name')) coachUpdates.full_name = formData.get('full_name') || null
    if (formData.has('specialization')) coachUpdates.specialization = formData.get('specialization') || null
    if (formData.has('experience_years')) {
      const exp = formData.get('experience_years')
      coachUpdates.experience_years = exp ? parseInt(exp.toString()) : 0
    }
    if (formData.has('bio')) coachUpdates.bio = formData.get('bio') || null
    if (formData.has('category')) coachUpdates.category = formData.get('category') || 'general'
    if (formData.has('experience_history')) {
      try {
        const historyStr = formData.get('experience_history') as string
        coachUpdates.experience_history = historyStr ? JSON.parse(historyStr) : []
      } catch (e) {}
    }

    // Meets Config
    if (formData.has('cafe')) { meetsUpdates.cafe = parseFloat(formData.get('cafe')!.toString()); hasMeets = true; }
    if (formData.has('cafe_enabled')) { meetsUpdates.cafe_enabled = formData.get('cafe_enabled') === 'true'; hasMeets = true; }
    if (formData.has('meet_1')) { meetsUpdates.meet_1 = parseInt(formData.get('meet_1')!.toString()); hasMeets = true; }
    if (formData.has('meet_1_enabled')) { meetsUpdates.meet_1_enabled = formData.get('meet_1_enabled') === 'true'; hasMeets = true; }
    if (formData.has('meet_30')) { meetsUpdates.meet_30 = parseInt(formData.get('meet_30')!.toString()); hasMeets = true; }
    if (formData.has('meet_30_enabled')) { meetsUpdates.meet_30_enabled = formData.get('meet_30_enabled') === 'true'; hasMeets = true; }

    // Social
    if (formData.has('instagram_username')) { socialUpdates.instagram_username = formData.get('instagram_username') || null; hasSocial = true; }

    // Contact & Personal
    if (formData.has('whatsapp')) { contactUpdates.whatsapp = parseFloat(formData.get('whatsapp')!.toString()); hasContact = true; }
    if (formData.has('phone')) { contactUpdates.phone = formData.get('phone') || null; hasContact = true; }
    if (formData.has('location')) { contactUpdates.location = formData.get('location') || null; hasContact = true; }
    if (formData.has('emergency_contact')) { contactUpdates.emergency_contact = formData.get('emergency_contact') || null; hasContact = true; }
    if (formData.has('height')) { contactUpdates.height = parseInt(formData.get('height')!.toString()); hasContact = true; }
    if (formData.has('weight')) { contactUpdates.weight = parseFloat(formData.get('weight')!.toString()); hasContact = true; }
    if (formData.has('birth_date')) { contactUpdates.birth_date = formData.get('birth_date') || null; hasContact = true; }
    if (formData.has('gender')) { contactUpdates.gender = formData.get('gender') || null; hasContact = true; }

    // Ejecutar actualizaciones en paralelo
    const promises = []
    
    if (Object.keys(coachUpdates).length > 0) {
      promises.push(supabase.from('coaches').update(coachUpdates).eq('id', user.id).select().single())
    }
    if (hasMeets) promises.push(supabase.from('coach_meets_config').upsert(meetsUpdates).select().maybeSingle())
    if (hasSocial) promises.push(supabase.from('coach_social_accounts').upsert(socialUpdates).select().maybeSingle())
    if (hasContact) promises.push(supabase.from('coach_contact_info').upsert(contactUpdates).select().maybeSingle())

    const results = await Promise.all(promises)
    const coachResult = results[0]

    if (coachResult?.error) {
      console.error('Error actualizando coach:', coachResult.error)
      return NextResponse.json({ success: false, error: 'Error al actualizar el perfil' }, { status: 500 })
    }

    const finalCoach = coachResult?.data || {}
    const finalMeets = results.find(r => r.data && 'cafe' in r.data)?.data || {}
    const finalSocial = results.find(r => r.data && 'instagram_username' in r.data)?.data || {}
    const finalContact = results.find(r => r.data && 'whatsapp' in r.data)?.data || {}

    return NextResponse.json({
      success: true,
      profile: {
        ...finalCoach,
        ...finalMeets,
        ...finalSocial,
        ...finalContact,
        // Asegurar nombres consistentes
        experience_years: finalCoach.experience_years || 0,
        experience_history: finalCoach.experience_history || []
      }
    })

  } catch (error) {
    console.error('Error en PUT /api/profile/coach:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

