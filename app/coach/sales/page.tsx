"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientSearchSelector } from "@/components/client-search-selector"
import { ImmediatePurchaseActivities } from "@/components/immediate-purchase-activities"
import { PurchaseCheckout } from "@/components/purchase-checkout"
import { ShoppingCart, Users, Package } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  avatar_url?: string
  created_at: string
}

interface Activity {
  id: number
  title: string
  description: string
  price: number
  type: string
  difficulty: string
  availability_type: string
  image_url?: string
  coach_id: string
  coach_name?: string
}

export default function SalesPage() {
  const [selectedClient, setSelectedClient] = useState<Client | undefined>()
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>()
  const [activeTab, setActiveTab] = useState("search")

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    // Automáticamente cambiar a la pestaña de actividades después de seleccionar un cliente
    setActiveTab("activities")
  }

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity)
    // Automáticamente cambiar a la pestaña de checkout después de seleccionar una actividad
    setActiveTab("checkout")
  }

  const handlePurchaseComplete = () => {
    // Reiniciar el proceso
    setSelectedActivity(undefined)
    setActiveTab("activities")
  }

  return (
    <div className="container py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Venta de actividades</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel lateral con información del cliente y actividad seleccionados */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cliente seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{selectedClient.name}</span>
                  <span className="text-sm text-muted-foreground">{selectedClient.email}</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Ningún cliente seleccionado</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Actividad seleccionada</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedActivity ? (
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{selectedActivity.title}</span>
                  <span className="text-sm text-muted-foreground">${selectedActivity.price}</span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Ninguna actividad seleccionada</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel principal con pestañas */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Buscar cliente</span>
              </TabsTrigger>
              <TabsTrigger value="activities" disabled={!selectedClient} className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Actividades</span>
              </TabsTrigger>
              <TabsTrigger
                value="checkout"
                disabled={!selectedClient || !selectedActivity}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Finalizar compra</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar cliente</CardTitle>
                  <CardDescription>Busque y seleccione el cliente que realizará la compra</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientSearchSelector onClientSelect={handleClientSelect} selectedClientId={selectedClient?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card>
                <CardHeader>
                  <CardTitle>Seleccionar actividad</CardTitle>
                  <CardDescription>Elija la actividad que desea vender al cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImmediatePurchaseActivities
                    selectedClientId={selectedClient?.id}
                    onSelectActivity={handleActivitySelect}
                    selectedActivityId={selectedActivity?.id}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checkout">
              <PurchaseCheckout
                client={selectedClient}
                activity={selectedActivity}
                onPurchaseComplete={handlePurchaseComplete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
