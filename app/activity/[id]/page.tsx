import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/supabase-server'
import MobileApp from '@/app-mobile'
import Script from 'next/script'
import { headers } from 'next/headers'

// Force dynamic rendering as we fetch data based on params
export const dynamic = 'force-dynamic'

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

async function getActivity(id: string) {
    const supabase = createClient()

    const { data: activity } = await supabase
        .from('activities')
        .select(`
      *,
      coaches (full_name),
      activity_media (image_url)
    `)
        .eq('id', id)
        .single()

    return activity
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const activity = await getActivity(params.id)

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
            url: `https://omnia-app.vercel.app/activity/${params.id}`,
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

export default async function ActivityPage({ params }: Props) {
    const activity = await getActivity(params.id)

    if (!activity) {
        // In case of 404, we let MobileApp handle it or show a generic view
        return <MobileApp />
    }

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
            priceCurrency: 'USD', // Adjust currency as needed (e.g. ARS, USD)
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
            <DeepLinkSync id={activity.id} />
            <MobileApp />
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
