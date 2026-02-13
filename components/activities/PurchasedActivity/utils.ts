export const getCategoryColor = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
        case 'fitness': return 'text-[#FF7939]'
        case 'nutrition': case 'nutricion': return 'text-orange-300'
        default: return 'text-[#FF7939]'
    }
}

export const getCategoryBadge = (categoria?: string) => {
    switch (categoria?.toLowerCase()) {
        case 'fitness': return 'FITNESS'
        case 'nutrition': case 'nutricion': return 'NUTRICIÓN'
        default: return 'FITNESS'
    }
}

export const getTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
        case 'program': case 'programa': return 'PROGRAMA'
        case 'workshop': case 'taller': return 'TALLER'
        case 'document': case 'documento': return 'DOCUMENTO'
        default: return 'PROGRAMA'
    }
}

export const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
        case 'program': case 'programa': return 'text-[#FF7939]'
        case 'workshop': case 'taller': return 'text-orange-300'
        case 'document': case 'documento': return 'text-white'
        default: return 'text-[#FF7939]'
    }
}

export const formatDate = (dateString: string) => {
    if (!dateString) return ''
    if (dateString.includes('-') && !dateString.includes('T')) {
        const parts = dateString.split('-')
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        }
    }
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export const getSizeClasses = (size: string) => {
    switch (size) {
        case "small": return "w-40 h-[30rem]"
        case "large": return "w-[360px] h-[36rem]"
        default: return "w-[340px] h-[32rem]"
    }
}

export const getImageHeightClass = (size: string, isCoachView: boolean) => {
    switch (size) {
        case "small": return isCoachView ? "h-24" : "h-48"
        case "large": return "h-56"
        default: return "h-48"
    }
}
