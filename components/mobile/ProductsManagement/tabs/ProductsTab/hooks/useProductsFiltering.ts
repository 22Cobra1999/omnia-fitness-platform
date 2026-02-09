import { useState, useMemo } from "react"
import { Product, SortField, SortDirection, Stats } from "../../../types"

export function useProductsFiltering(products: Product[]) {
    const [typeFilter, setTypeFilter] = useState<'todos' | 'fitness' | 'nutrition' | 'workshop' | 'document' | 'program'>('todos')
    const [sortField, setSortField] = useState<SortField>('title')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [visibleProductsCount, setVisibleProductsCount] = useState(20)

    const filteredProducts = useMemo(() => {
        return products.filter(p => typeFilter === 'todos' || p.type === typeFilter)
    }, [products, typeFilter])

    const sortedProducts = useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
            }
            return 0
        })
    }, [filteredProducts, sortField, sortDirection])

    const stats = useMemo<Stats>(() => {
        const totalProducts = products.length
        const ratings = products.map(p => p.program_rating).filter((v): v is number => typeof v === 'number')
        const totalReviews = products.reduce((acc, p) => acc + (p.total_program_reviews || 0), 0)
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        return {
            totalProducts,
            totalRevenue: 0,
            avgRating,
            totalReviews,
            totalEnrollments: 0,
            totalSales: 0
        }
    }, [products])

    return {
        state: {
            typeFilter,
            sortField,
            sortDirection,
            showTypeDropdown,
            visibleProductsCount,
            filteredProducts,
            sortedProducts,
            stats
        },
        actions: {
            setTypeFilter,
            setSortField,
            setSortDirection,
            setShowTypeDropdown,
            setVisibleProductsCount
        }
    }
}
