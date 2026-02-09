export const getTypeColor = (type: string) => {
    switch (type) {
        case 'fitness': return 'bg-orange-500'
        case 'nutrition': return 'bg-green-500'
        case 'workshop': return 'bg-purple-500'
        case 'document': return 'bg-violet-500'
        case 'program': return 'bg-indigo-500'
        default: return 'bg-gray-500'
    }
}

export const getTypeLabel = (type: string) => {
    switch (type) {
        case 'fitness': return 'Fitness'
        case 'nutrition': return 'Nutrición'
        case 'workshop': return 'Taller'
        case 'document': return 'Documento'
        case 'program': return 'Programa'
        default: return type
    }
}

export const getCategoryColor = (categoria: string) => {
    switch (categoria) {
        case 'fitness':
            return 'bg-orange-500'
        case 'nutrition':
            return 'bg-green-500'
        default:
            return 'bg-gray-500'
    }
}

export const getCategoryLabel = (categoria: string) => {
    switch (categoria) {
        case 'fitness':
            return 'Fitness'
        case 'nutrition':
            return 'Nutrición'
        default:
            return 'Otro'
    }
}

export const getValidImageUrl = (product: any) => {
    if (product.image_url) return product.image_url
    if (product.media?.image_url) return product.media.image_url
    if (product.activity_media && product.activity_media.length > 0) {
        return product.activity_media[0].image_url
    }
    return '/placeholder-activity.jpg'
}

export const convertProductToActivity = (product: any) => {
    if (!product) return null
    return {
        ...product,
        title: product.title || product.name,
        image_url: getValidImageUrl(product),
        categoria: product.categoria || product.type,
        coach_name: 'Tu', // O el nombre real si lo tenemos
        rating: product.program_rating || 0,
        reviews: product.total_program_reviews || 0
    }
}
