import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/supabase-server'
import MobileApp from '@/app-mobile'
import Script from 'next/script'
import { headers } from 'next/headers'

// Force dynamic rendering as we fetch data based on params
export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getActivity(id: string) {
    const supabase = await createClient()

    const { data: activity, error } = await supabase
        .from('activities')
        .select(`
      *,
      coaches!activities_coach_id_fkey (full_name),
      activity_media!activity_media_activity_id_fkey (image_url)
    `)
        .eq('id', id)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows found
        console.error('❌ [getActivity] Error fetching activity:', error)
    }

    return activity
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params
    const activity = await getActivity(resolvedParams.id)

    if (!activity) {
        return {
            title: 'Activity Not Found | OMNIA',
        }
    }

    const previousImages = (await parent).openGraph?.images || []
    const activityImage = activity.activity_media?.[0]?.image_url
        ? activity.activity_media[0].image_url
        : 'https://omnia-app.vercel.app/images/omnia-logo.png' // Fallback image

    return {
        title: `${activity.title} | OMNIA`,
        description: activity.description || `Join ${activity.coaches?.full_name || 'us'}'s program on OMNIA.`,
        openGraph: {
            title: activity.title,
            description: activity.description,
            images: [activityImage, ...previousImages],
            url: `https://omnia-app.vercel.app/activity/${resolvedParams.id}`,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: activity.title,
            description: activity.description,
            images: [activityImage],
        },
    }
}

export default async function ActivityPage({ params, searchParams }: Props) {
    const resolvedParams = await params
    const activityId = resolvedParams.id

    console.log('🚀 [ActivityPage] Rendering for ID:', activityId)

    const activity = await getActivity(activityId)

    if (!activity) {
        console.warn('⚠️ [ActivityPage] Activity not found for ID:', activityId)
        // In case of 404, we let MobileApp handle it or show a generic view
        return <MobileApp />
    }

    console.log('✅ [ActivityPage] Activity found:', activity.title)

    // Define Schema.org Product/Course Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: activity.title,
        image: activity.activity_media?.[0]?.image_url,
        description: activity.description,
        sku: activity.id,
        brand: {
            '@type': 'Brand',
            name: 'OMNIA'
        },
        offers: {
            '@type': 'Offer',
            url: `https://omnia-app.vercel.app/activity/${activity.id}`,
            priceCurrency: 'USD',
            price: activity.price || 0,
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: activity.coaches?.full_name || 'OMNIA Coach'
            }
        }
    }

    return (
        <>
            <Script
                id="activity-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Inject a script to log on client side for final confirmation */}
            <Script id="deep-link-debug">
                {`console.log("🔗 [ActivityPage] Server-side rendered for ID: ${activity.id}")`}
            </Script>
            <MobileApp
                initialTab="search"
                initialActivityId={String(activity.id)}
                initialActivityData={activity}
            />
        </>
    )
}

// Client Component to Sync URL for SPA
// Need to inline this or import it. Since Next.js App Router allows mixed directives in one file IF structured specifically...
// Actually, it's safer to separate the Client Component to avoid "use client" conflicts in the same file if not doing it perfectly.
// But we can put a small script or just use a separate file.
// For now, I'll use a Client Component in a separate chunk below -> Wait, write_to_file is one file.
// I'll create a new component file for the sync logic and import it, OR make this page a CLIENT component that fetches data?
// NO, Metadata generation MUST be Server Side.
// So the page must be Server Side.
// The DeepLinkSync must be Client Side.
// I will create `components/seo/deep-link-sync.tsx` first, then import it here.
