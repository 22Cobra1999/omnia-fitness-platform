import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server'

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createRouteHandlerClient()
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 401 }
            )
        }

        const formData = await request.formData()

        console.log('📦 [API Profile Client] Recibido FormData:', Object.fromEntries(formData.entries()))
        console.log('📦 [API Profile Client] Keys recibidas:', Array.from(formData.keys()))

        // Extraer datos del formData
        const updates: any = {
            updated_at: new Date().toISOString(),
        }

        // Mapear campos permitidos directa o indirectamente
        for (const [key, value] of formData.entries()) {
            // Skip empty values if needed, or handle them. 
            // FormData value is string | File. We expect strings here for these fields.
            const val = value ? value.toString().trim() : ""

            switch (key) {
                case 'height':
                    // DB column: "Height"
                    if (val && !isNaN(parseFloat(val))) {
                        updates['Height'] = parseFloat(val)
                    } else if (val === "") {
                        updates['Height'] = null
                    }
                    break
                case 'gender':
                    // DB column: "Genre"
                    if (val) updates['Genre'] = val
                    break
                case 'level':
                    // DB column: nivel_actividad
                    if (val) updates['nivel_actividad'] = val
                    break
                case 'weight':
                    if (val && !isNaN(parseFloat(val))) {
                        updates['weight'] = parseFloat(val)
                    } else if (val === "") {
                        updates['weight'] = null
                    }
                    break
                case 'birth_date':
                    updates['birth_date'] = val || null
                    break
                case 'phone':
                    updates['phone'] = val
                    break
                case 'location':
                    updates['location'] = val
                    break
                case 'emergency_contact':
                    updates['emergency_contact'] = val
                    break
                // Arrays are handled separately below to aggregate multiple values
            }
        }

        // Recuperar arrays asegurando que sean strings
        const fitnessGoals = formData.getAll('fitness_goals')
        if (fitnessGoals.length > 0) {
            if (fitnessGoals.length === 1 && typeof fitnessGoals[0] === 'string' && (fitnessGoals[0] as string).includes(',')) {
                updates['fitness_goals'] = (fitnessGoals[0] as string).split(',').map(s => s.trim())
            } else {
                // Ensure all elements are strings
                updates['fitness_goals'] = fitnessGoals.map(s => s.toString())
            }
        } else {
            if (formData.has('fitness_goals')) {
                const val = formData.get('fitness_goals')?.toString()
                if (!val) updates['fitness_goals'] = []
            }
        }

        const sports = formData.getAll('sports')
        if (sports.length > 0) {
            if (sports.length === 1 && typeof sports[0] === 'string' && (sports[0] as string).includes(',')) {
                updates['sports'] = (sports[0] as string).split(',').map(s => s.trim())
            } else {
                // Ensure all elements are strings
                updates['sports'] = sports.map(s => s.toString())
            }
        } else {
            if (formData.has('sports')) {
                const val = formData.get('sports')?.toString()
                if (!val) updates['sports'] = []
            }
        }

        console.log('📦 [API Profile Client] Updates finales:', updates)

        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating client profile:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (error) {
        console.error('Error in profile/client route:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
