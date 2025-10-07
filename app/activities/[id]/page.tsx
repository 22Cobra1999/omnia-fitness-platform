import { notFound } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { ActivityDetailPage } from "@/components/activity-detail-page"
import type { Activity } from "@/types/activity"

interface ActivityPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const supabase = getSupabaseClient()
  const { id } = await params

  if (!id) {
    notFound()
  }

  // Fetch activity details
  const { data: activityData, error: activityError } = await supabase
    .from("activities")
    .select(
      `
      id,
      title,
      description,
      type,
      difficulty,
      price,
      coach_id,
      is_public,
      created_at,
      updated_at,
      media:activity_media!activity_media_activity_id_fkey (image_url, video_url, vimeo_id, pdf_url),
      // program_info no existe en el nuevo esquema
      consultation_info:activity_consultation_info!activity_consultation_info_activity_id_fkey (includes_videocall, includes_message, videocall_duration, available_days, available_hours, expiration_date),
      tags:activity_tags!activity_tags_activity_id_fkey(tag_type, tag_value),
      coach:coaches!activities_coach_id_fkey(
        id,
        full_name,
        specialization,
        experience_years,
        bio,
        rating,
        total_reviews,
        user_profile:user_profiles!user_profiles_id_fkey(avatar_url, whatsapp)
      )
    `,
    )
    .eq("id", id)
    .eq("is_public", true)
    .single()

  if (activityError || !activityData) {
    console.error("Error fetching activity:", activityError)
    notFound()
  }

  const activity: Activity = {
    ...activityData,
    media: activityData.media ? activityData.media[0] : null,
    // program_info no existe en el nuevo esquema
    program_info: null,
    consultation_info: activityData.consultation_info ? activityData.consultation_info[0] : null,
    tags: activityData.tags || [],
    // Flattened properties for convenience
    image_url: activityData.media?.[0]?.image_url || null,
    video_url: activityData.media?.[0]?.video_url || null,
    vimeo_id: activityData.media?.[0]?.vimeo_id || null,
    pdf_url: activityData.media?.[0]?.pdf_url || null,
    // Los campos de programa ahora están directamente en activities
    rich_description: activityData.rich_description || null,
    duration_minutes: activityData.duration || null,
    calories_info: activityData.calories || null,
    program_duration_weeks_months: activityData.program_duration || null,
    includes_videocall: activityData.consultation_info?.[0]?.includes_videocall || null,
    includes_message: activityData.consultation_info?.[0]?.includes_message || null,
    videocall_duration: activityData.consultation_info?.[0]?.videocall_duration || null,
    available_days: activityData.consultation_info?.[0]?.available_days || null,
    available_hours: activityData.consultation_info?.[0]?.available_hours || null,
    expiration_date: activityData.consultation_info?.[0]?.expiration_date || null,
    is_popular: activityData.tags?.some((tag: any) => tag.tag_value === "popular") || false,
    // Coach details
    coach_name: activityData.coach?.full_name || '',
    coach_avatar_url: activityData.coach?.user_profile?.avatar_url || null,
    coach_rating: activityData.coach?.rating || 0,
    total_coach_reviews: activityData.coach?.total_reviews || 0,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ActivityDetailPage activity={activity} />
    </div>
  )
}
