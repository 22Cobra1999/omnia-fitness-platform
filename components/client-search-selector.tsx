"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, UserCheck, Loader2 } from "lucide-react"
import { createClient } from '@/lib/supabase-browser'
import { useToast } from "@/components/ui/use-toast"

interface Client {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at: string
}

interface ClientSearchSelectorProps {
  onClientSelect: (client: Client) => void
  selectedClientId?: string
}

export function ClientSearchSelector({ onClientSelect, selectedClientId }: ClientSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, full_name, email, avatar_url, created_at")
          .eq("role", "client")
          .order("full_name", { ascending: true })

        if (error) throw error

        const formattedClients = data.map((client) => ({
          id: client.id,
          name: client.full_name || "Cliente sin nombre",
          email: client.email || "",
          avatar_url: client.avatar_url,
          created_at: client.created_at,
        }))

        setClients(formattedClients)
        setFilteredClients(formattedClients)
      } catch (error) {
        console.error("Error al cargar clientes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes. Intente nuevamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadClients()
  }, [supabase, toast])

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = clients.filter(
        (client) => client.name.toLowerCase().includes(query) || client.email.toLowerCase().includes(query),
      )
      setFilteredClients(filtered)
    }
  }, [searchQuery, clients])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar cliente por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No se encontraron clientes</div>
      ) : (
        <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedClientId === client.id ? "border-primary bg-accent/50" : ""
              }`}
              onClick={() => onClientSelect(client)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={client.avatar_url || "/placeholder.svg?height=40&width=40"} alt={client.name} />
                    <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  </div>
                </div>
                {selectedClientId === client.id && <UserCheck className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
