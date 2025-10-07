import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/db"
export async function GET() {
  try {
    // console.log("🔍 GET /api/activities - Obteniendo todas las actividades")
    const supabaseAdmin = await getSupabaseAdmin()
    const { data: activities, error } = await supabaseAdmin
      .from("activities")
      .select(`
        *,
        activity_media!activity_media_activity_id_fkey(*),
        activity_program_info!activity_program_info_activity_id_fkey(*),
        activity_consultation_info!activity_consultation_info_activity_id_fkey(*),
        activity_availability!activity_availability_activity_id_fkey(*),
        activity_tags!activity_tags_activity_id_fkey(*),
        coaches!activities_coach_id_fkey(
          id,
          full_name,
          specialization,
          avatar_url,
          rating,
          total_reviews
        )
      `)
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching activities:", error)
      throw error
    }
    // Flatten the nested objects for easier consumption on the frontend
    const formattedActivities = activities.map((activity) => ({
      ...activity,
      media: activity.activity_media?.[0] || null, // Assuming one media entry per activity
      program_info: activity.activity_program_info?.[0] || null, // Assuming one program_info entry per activity
      availability: activity.activity_availability?.[0] || null, // Assuming one availability entry per activity
      consultation_info: activity.activity_consultation_info?.[0] || null, // Assuming one consultation_info entry per activity
      tags: activity.activity_tags || [], // Tags can be multiple
    }))
    return NextResponse.json(formattedActivities || [])
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    // console.log("🚀 POST /api/activities - Creando nueva actividad")
    const data = await request.json()
    console.log("📄 Datos recibidos:", {
      title: data.title,
      type: data.type,
      price: data.price,
      coach_id: data.coach_id,
      hasMedia: !!data.media,
      hasImageUrl: !!data.image_url,
      hasProgramInfo: !!data.program_info,
      hasRichDescription: !!data.rich_description
    })
    const {
      title,
      description,
      rich_description,
      price,
      coach_id,
      type,
      difficulty,
      is_public,
      duration,
      calories,
      // Campos directos (formato plano del product-form-modal)
      image_url,
      video_url,
      vimeo_id,
      pdf_url,
      videocall_duration,
      available_days,
      available_hours,
      availability_type,
      session_type,
      available_slots,
      available_times,
      consultation_type,
      program_duration,
      // Campos anidados (formato original)
      media,
      program_info,
      availability,
      consultation_info,
      tags,
    } = data
    // Validate required fields
    if (!title || !coach_id) {
      console.log("❌ Faltan campos requeridos:", { title: !!title, coach_id: !!coach_id })
      return NextResponse.json({ 
        success: false,
        error: "Faltan campos requeridos: título y coach_id son obligatorios" 
      }, { status: 400 })
    }
    const supabaseAdmin = await getSupabaseAdmin()
    // Insert into activities table - formato simplificado
    console.log("💾 Insertando actividad principal...")
    const activityInsert = {
      title,
      description,
      price: price ? parseFloat(String(price)) : 0,
      coach_id,
      type: type || 'fitness_program',
      difficulty: difficulty || 'Principiante',
      is_public: is_public !== false, // default true si no se especifica
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log("📋 Datos de actividad a insertar:", activityInsert)
    const { data: newActivity, error: activityError } = await supabaseAdmin
      .from("activities")
      .insert(activityInsert)
      .select()
      .single()
    if (activityError) {
      console.error("❌ Error insertando actividad:", activityError)
      return NextResponse.json({ 
        success: false,
        error: `Error al crear actividad: ${activityError.message}` 
      }, { status: 500 })
    }
    // console.log("✅ Actividad creada con ID:", newActivity.id)
    // Insert related data - soportar ambos formatos
    const promises = []
    // Media (formato plano o anidado)
    const mediaData = media || {
      image_url: image_url || null,
      video_url: video_url || null,
      vimeo_id: vimeo_id || null,
      pdf_url: pdf_url || null
    }
    if (mediaData && (mediaData.image_url || mediaData.video_url || mediaData.vimeo_id || mediaData.pdf_url)) {
      console.log("📸 ACTIVITIES-POST: Insertando media...", {
        activity_id: newActivity.id,
        image_url: mediaData.image_url,
        video_url: mediaData.video_url,
        vimeo_id: mediaData.vimeo_id,
        pdf_url: mediaData.pdf_url
      })
      promises.push(
        supabaseAdmin.from("activity_media").insert({
          activity_id: newActivity.id,
          image_url: mediaData.image_url,
          video_url: mediaData.video_url,
          vimeo_id: mediaData.vimeo_id,
          pdf_url: mediaData.pdf_url
        }).then(result => {
          if (result.error) {
            console.error("❌ ACTIVITIES-POST: Error media:", result.error)
            throw new Error(`Error insertando media: ${result.error.message}`)
          } else {
            console.log("✅ ACTIVITIES-POST: Media insertado exitosamente")
          }
        })
      )
    }
    // Program info - NO EXISTE EN NUEVO ESQUEMA
    // Los campos de programa ahora están directamente en activities
    // const programData = program_info || {
    //   duration: duration || null,
    //   calories: calories || null,
    //   program_duration: program_duration || null,
    //   rich_description: rich_description || null
    // }
    // if (programData && (programData.duration || programData.calories || programData.program_duration || programData.rich_description)) {
    //   console.log("📋 Insertando program info...")
    //   promises.push(
    //     supabaseAdmin.from("activity_program_info").insert({
    //       activity_id: newActivity.id,
    //       duration: programData.duration,
    //       calories: programData.calories,
    //       program_duration: programData.program_duration,
    //       rich_description: programData.rich_description,
    //       interactive_pauses: programData.interactive_pauses || null,
    //     }).then(result => {
    //       if (result.error) console.error("❌ Error program info:", result.error)
    //       else // console.log("✅ Program info insertado")
    //     })
    //   )
    // }
    // Availability (formato plano o anidado)
    const availabilityData = availability || {
      available_hours: available_hours || null,
      availability_type: availability_type || null,
      available_slots: available_slots || null,
      available_times: available_times || null
    }
    if (availabilityData && (availabilityData.available_hours || availabilityData.availability_type)) {
      // console.log("📅 Insertando availability...")
      promises.push(
        supabaseAdmin.from("activity_availability").insert({
          activity_id: newActivity.id,
          available_hours: availabilityData.available_hours,
          availability_type: availabilityData.availability_type,
          start_date: availabilityData.start_date || null,
          end_date: availabilityData.end_date || null,
        }).then(result => {
          if (result.error) console.error("❌ Error availability:", result.error)
          // else console.log("✅ Availability insertado")
        })
      )
    }
    // Consultation info (formato plano o anidado)
    const consultationData = consultation_info || {
      videocall_duration: videocall_duration || null,
      consultation_type: consultation_type || null
    }
    if (consultationData && (consultationData.videocall_duration || consultationData.consultation_type)) {
      console.log("💬 Insertando consultation info...")
      promises.push(
        supabaseAdmin.from("activity_consultation_info").insert({
          activity_id: newActivity.id,
          videocall_duration: consultationData.videocall_duration,
          general_preference: consultationData.general_preference || 'flexible',
        }).then(result => {
          if (result.error) console.error("❌ Error consultation info:", result.error)
          // else console.log("✅ Consultation info insertado")
        })
      )
    }
    // Tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      console.log("🏷️ Insertando tags...")
      const formattedTags = tags.map((tag: string) => ({ 
        activity_id: newActivity.id, 
        tag_name: tag 
      }))
      promises.push(
        supabaseAdmin.from("activity_tags").insert(formattedTags).then(result => {
          if (result.error) console.error("❌ Error tags:", result.error)
          // else console.log("✅ Tags insertados")
        })
      )
    }
    // Ejecutar todas las inserciones en paralelo para optimizar velocidad
    console.log("⚡ Ejecutando inserciones paralelas...")
    await Promise.allSettled(promises)
    // console.log("✅ Actividad y datos relacionados guardados exitosamente")
    return NextResponse.json({ 
      success: true, 
      activityId: newActivity.id,
      activity: newActivity,
      message: "Actividad creada exitosamente"
    }, { status: 201 })
  } catch (error) {
    console.error("💥 Error en POST /api/activities:", error)
    return NextResponse.json({ 
      success: false,
      error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    }, { status: 500 })
  }
}
