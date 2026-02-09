import { useState, useEffect } from "react"
import { Client } from "../types"

export function useClientListLogic() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    const fetchClients = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/coach/clients', {
                credentials: 'include'
            })
            const data = await response.json()

            console.log('👤 ClientsScreen: Respuesta /api/coach/clients', {
                status: response.status,
                ok: response.ok,
                success: data?.success,
                clientsCount: data?.clients?.length || 0,
                debug: data?.debug,
                error: data?.error,
                warning: data?.warning
            })

            if (response.ok && data.success) {
                if (data.clients && data.clients.length > 0) {
                    console.log('👤 ClientsScreen: Clientes cargados', data.clients.map((client: any) => ({
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        activitiesCount: client.activitiesCount,
                        progress: 0,
                        todoCount: client.todoCount,
                        totalRevenue: client.totalRevenue,
                        activities: client.activities
                    })))
                }
                setClients(data.clients || [])
            } else {
                setError(data.error || 'Error al cargar clientes')
            }
        } catch (err) {
            console.error('❌ [CLIENTS LIST] Error fetching clients:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const filteredClients = clients.filter((client) => {
        const matchesFilter = filter === "all" || client.status === filter
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return {
        clients,
        loading,
        error,
        filter,
        setFilter,
        searchTerm,
        setSearchTerm,
        filteredClients,
        refreshClients: fetchClients
    }
}
