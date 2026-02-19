import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/', '/coach/storage/'],
        },
        sitemap: 'https://omnia-fitness.vercel.app/sitemap.xml',
    }
}
