
import { useState, useMemo } from 'react'

export function useCsvPagination<T>(data: T[], itemsPerPage: number = 15) {
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.ceil(data.length / itemsPerPage)

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return data.slice(start, start + itemsPerPage)
    }, [data, currentPage, itemsPerPage])

    const goToPage = (page: number) => {
        const target = Math.max(1, Math.min(page, totalPages))
        setCurrentPage(target)
    }

    const nextPage = () => goToPage(currentPage + 1)
    const prevPage = () => goToPage(currentPage - 1)

    return {
        currentPage,
        totalPages,
        paginatedData,
        goToPage,
        nextPage,
        prevPage,
        startIndex: (currentPage - 1) * itemsPerPage,
        endIndex: Math.min(currentPage * itemsPerPage, data.length)
    }
}
