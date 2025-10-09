import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getSupabaseAdmin } from "@/lib/db"
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const activityId = resolvedParams.id
    // console.log("🔄 PUT /api/activities/[id] - Actualizando actividad:", activityId)
    const data = await request.json()
    console.log("📋 Datos recibidos para actualización:", {
      title: data.title,
      type: data.type,
      coach_id: data.coach_id,
    })
    // Validar datos requeridos
    if (!data.title || !data.type || !data.coach_id) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: title, type, coach_id" },
        { status: 400 },
      )
    }
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    // Fetch the existing activity to compare
    const { data: existingActivity, error: fetchError } = await supabase
      .from("activities") // Corrected table name
      .select(
        `
        *,
        activity_availability (*),
        activity_consultation_info (*),
        activity_media (*),
        activity_tags (*)
      `,
      )
      .eq("id", activityId)
      .single()
    if (fetchError) {
      console.error("❌ Error fetching existing activity:", fetchError)
      return NextResponse.json(
        { success: false, error: `Error al obtener actividad existente: ${fetchError.message}` },
        { status: 500 },
      )
    }
    if (!existingActivity) {
      return NextResponse.json({ success: false, error: "Actividad no encontrada para actualización" }, { status: 404 })
    }
    // Flatten existing nested objects for easier comparison
    const existingFormattedActivity: any = {
      ...existingActivity,
      activity_availability: existingActivity.activity_availability ? existingActivity.activity_availability[0] : null,
      activity_consultation_info: existingActivity.activity_consultation_info
        ? existingActivity.activity_consultation_info[0]
        : null,
      // activity_program_info no existe en el nuevo esquema
      activity_program_info: null,
      activity_media: existingActivity.activity_media ? existingActivity.activity_media[0] : null,
    }
    // Separate data for each table
    const baseUpdateData: Record<string, any> = { updated_at: new Date().toISOString() }
    const availabilityUpdateData: Record<string, any> = {}
    const consultationUpdateData: Record<string, any> = {}
    const programUpdateData: Record<string, any> = {}
    const mediaUpdateData: Record<string, any> = {}
    const tagsToInsert: { tag_type: string; tag_value: string }[] = []
    const tagsToDelete: string[] = [] // Assuming tags are identified by tag_value for deletion
    let changesDetected = false
    // Process activities fields
    const baseFields = [
      "title", 
      "description", 
      "rich_description",
      "type", 
      "difficulty", 
      "price", 
      "is_public",
      "duration",
      "calories",
      "program_duration",
      "availability_type",
      // Campos específicos para Workshop/Taller
      "session_type",
      "available_slots",
      "available_times",
      "workshop_type",
      "workshop_schedule_blocks"
    ]
    for (const field of baseFields) {
      if (data[field] !== undefined && data[field] !== existingFormattedActivity[field]) {
        baseUpdateData[field] = data[field]
        changesDetected = true
      }
    }
    // Process activity_availability fields
    // NOTA: session_type, available_slots, availability_type ahora están en la tabla activities
    const availabilityFields = [
      "available_days",
      "available_hours",
    ]
    for (const field of availabilityFields) {
      const incomingValue = data[field]
      const existingValue = existingFormattedActivity.activity_availability?.[field]
      if (incomingValue !== undefined && incomingValue !== existingValue) {
        availabilityUpdateData[field] = incomingValue
        changesDetected = true
      }
    }
    // Process activity_consultation_info fields
    const consultationFields = ["includes_videocall", "includes_message", "videocall_duration", "expiration_date"]
    for (const field of consultationFields) {
      const incomingValue = data[field]
      const existingValue = existingFormattedActivity.activity_consultation_info?.[field]
      if (incomingValue !== undefined && incomingValue !== existingValue) {
        consultationUpdateData[field] = incomingValue
        changesDetected = true
      }
    }
    // Process activity_program_info fields - NO EXISTE EN NUEVO ESQUEMA
    // Los campos de programa ahora están directamente en activities
    const programFields = ["duration", "calories", "program_duration", "rich_description", "interactive_pauses"]
    for (const field of programFields) {
      const incomingValue = data[field]
      const existingValue = existingFormattedActivity[field] // Ahora están en activities directamente
      if (incomingValue !== undefined && incomingValue !== existingValue) {
        baseUpdateData[field] = incomingValue // Agregar a baseUpdateData en lugar de programUpdateData
        changesDetected = true
      }
    }
    // Process activity_media fields
    const mediaFields = ["image_url", "video_url", "vimeo_id", "pdf_url"]
    for (const field of mediaFields) {
      const incomingValue = data[field]
      const existingValue = existingFormattedActivity.activity_media?.[field]
      if (incomingValue !== undefined && incomingValue !== existingValue) {
        mediaUpdateData[field] = incomingValue
        changesDetected = true
      }
    }
    // Process activity_tags (more complex: add/remove)
    const existingTags = existingFormattedActivity.activity_tags || []
    const incomingTags = data.tags || []
    // Tags to delete: present in existing but not in incoming
    for (const existingTag of existingTags) {
      if (
        !incomingTags.some((t: any) => t.tag_type === existingTag.tag_type && t.tag_value === existingTag.tag_value)
      ) {
        tagsToDelete.push(existingTag.tag_value) // Assuming tag_value is unique enough for deletion
        changesDetected = true
      }
    }
    // Tags to insert: present in incoming but not in existing
    for (const incomingTag of incomingTags) {
      if (
        !existingTags.some((t: any) => t.tag_type === incomingTag.tag_type && t.tag_value === incomingTag.tag_value)
      ) {
        tagsToInsert.push(incomingTag)
        changesDetected = true
      }
    }
    if (!changesDetected) {
      console.log("ℹ️ No se detectaron cambios en los campos de la actividad, solo el timestamp.")
      return NextResponse.json({
        success: true,
        activityId: existingActivity.id,
        activity: existingFormattedActivity,
        message: "No se detectaron cambios en la actividad.",
      })
    }
    // Perform updates
    const updatePromises = []
    if (Object.keys(baseUpdateData).length > 1) {
      // More than just updated_at
      updatePromises.push(
        supabase
          .from("activities")
          .update(baseUpdateData)
          .eq("id", activityId)
          .eq("coach_id", data.coach_id), // Corrected table name
      )
    }
    if (Object.keys(availabilityUpdateData).length > 0) {
      updatePromises.push(
        supabase.from("activity_availability").update(availabilityUpdateData).eq("activity_id", activityId),
      )
    }
    if (Object.keys(consultationUpdateData).length > 0) {
      updatePromises.push(
        supabase.from("activity_consultation_info").update(consultationUpdateData).eq("activity_id", activityId),
      )
    }
    // activity_program_info no existe en el nuevo esquema - los campos están en activities
    // if (Object.keys(programUpdateData).length > 0) {
    //   updatePromises.push(
    //     supabase.from("activity_program_info").update(programUpdateData).eq("activity_id", activityId),
    //   )
    // }
    if (Object.keys(mediaUpdateData).length > 0) {
      updatePromises.push(supabase.from("activity_media").update(mediaUpdateData).eq("activity_id", activityId))
    }
    if (tagsToDelete.length > 0) {
      updatePromises.push(
        supabase.from("activity_tags").delete().eq("activity_id", activityId).in("tag_value", tagsToDelete),
      )
    }
    if (tagsToInsert.length > 0) {
      updatePromises.push(
        supabase.from("activity_tags").insert(tagsToInsert.map((tag) => ({ ...tag, activity_id: activityId }))),
      )
    }
    await Promise.all(updatePromises)
    // Re-fetch the updated activity with all joined data
    const { data: updatedActivity, error: refetchError } = await supabase
      .from("activities") // Corrected table name
      .select(
        `
        *,
        availability:activity_availability (*),
        consultation_info:activity_consultation_info (*),
        media:activity_media (*),
        tags:activity_tags (*),
        coaches (full_name, whatsapp)
      `,
      )
      .eq("id", activityId)
      .single()
    if (refetchError) {
      console.error("❌ Error al re-obtener actividad actualizada:", refetchError)
      return NextResponse.json(
        { success: false, error: `Error al re-obtener actividad actualizada: ${refetchError.message}` },
        { status: 500 },
      )
    }
    if (!updatedActivity) {
      return NextResponse.json(
        { success: false, error: "Actividad no encontrada después de la actualización" },
        { status: 404 },
      )
    }
    // Flatten the re-fetched activity for consistent return
    const finalUpdatedActivity: any = {
      ...updatedActivity,
      availability: updatedActivity.availability ? updatedActivity.availability[0] : null,
      consultation_info: updatedActivity.consultation_info ? updatedActivity.consultation_info[0] : null,
      // program_info no existe en el nuevo esquema
      program_info: null,
      media: updatedActivity.media ? updatedActivity.media[0] : null,
      coach_name: updatedActivity.coaches?.full_name || null,
      coach_whatsapp: updatedActivity.coaches?.whatsapp || null,
    }
    // console.log("✅ Actividad actualizada exitosamente:", finalUpdatedActivity.id)
    return NextResponse.json({
      success: true,
      activityId: finalUpdatedActivity.id,
      activity: finalUpdatedActivity,
    })
  } catch (error) {
    console.error("💥 Error en PUT /api/activities/[id]:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const activityId = resolvedParams.id
    // console.log("🔍 GET /api/activities/[id] - Obteniendo actividad:", activityId)
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: activity, error } = await supabase
      .from("activities")
      .select(
        `
        *,
        consultation_info:activity_consultation_info (*),
        media:activity_media (*),
        tags:activity_tags (*),
        coaches (full_name, whatsapp)
      `,
      )
      .eq("id", activityId)
      .single()
    if (error) {
      console.error("❌ Error al obtener actividad:", error)
      return NextResponse.json(
        { success: false, error: `Error al obtener actividad: ${error.message}` },
        { status: 500 },
      )
    }
    if (!activity) {
      return NextResponse.json({ success: false, error: "Actividad no encontrada" }, { status: 404 })
    }
    // Flatten the nested objects if they are arrays
    const formattedActivity: any = {
      ...activity,
      consultation_info: activity.consultation_info ? activity.consultation_info[0] : null,
      // program_info no existe en el nuevo esquema
      program_info: null,
      media: activity.media ? activity.media[0] : null,
      coach_name: activity.coaches?.full_name || null,
      coach_whatsapp: activity.coaches?.whatsapp || null,
    }
    // console.log("✅ Actividad obtenida exitosamente:", formattedActivity.id)
    return NextResponse.json({
      success: true,
      activity: formattedActivity,
    })
  } catch (error) {
    console.error("💥 Error en GET /api/activities/[id]:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const activityId = resolvedParams.id
    console.log("🗑️ DELETE /api/activities/[id] - Eliminando actividad físicamente:", activityId)
    const supabase = await getSupabaseAdmin()
    const url = new URL(request.url)
    const coachId = url.searchParams.get("coach_id")
    if (!coachId) {
      return NextResponse.json({ success: false, error: "ID del coach requerido" }, { status: 400 })
    }
    // console.log("🔍 Verificando permisos del coach:", coachId, "para actividad:", activityId)
    // Verificar que la actividad pertenece al coach antes de eliminar
    const { data: activityCheck, error: checkError } = await supabase
      .from("activities")
      .select("id, coach_id, title")
      .eq("id", activityId)
      .eq("coach_id", coachId)
      .single()
    if (checkError || !activityCheck) {
      console.error("❌ Error verificando actividad:", checkError)
      return NextResponse.json(
        { success: false, error: "Actividad no encontrada o no tienes permisos para eliminarla" },
        { status: 404 }
      )
    }
    // console.log("✅ Permisos verificados. Eliminando actividad físicamente:", activityCheck.title)
    // ELIMINACIÓN FÍSICA: Eliminar de la tabla activities
    console.log("🗑️ Eliminando actividad de la tabla activities...")
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId)
      .eq("coach_id", coachId)
    if (error) {
      console.error("❌ Error al eliminar actividad:", error)
      return NextResponse.json(
        { success: false, error: `Error al eliminar actividad: ${error.message}` },
        { status: 500 }
      )
    }
    // console.log("✅ Actividad eliminada físicamente de la tabla activities:", activityId)
    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente. Los clientes que ya lo compraron mantendrán acceso.",
    })
  } catch (error) {
    console.error("💥 Error en DELETE /api/activities/[id]:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    )
  }
}
