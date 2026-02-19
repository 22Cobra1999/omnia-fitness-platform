import React from "react"
import { Button } from "@/components/ui/button"
import { FileText, Trophy, Edit3 } from "lucide-react"
import { RecentPurchasesList } from "../RecentPurchasesList"

interface ClientProfileHistoryProps {
    user: any
    handleEditSection: (section: string) => void
}

export const ClientProfileHistory: React.FC<ClientProfileHistoryProps> = ({
    user,
    handleEditSection,
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-[#1A1C1F] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2"><FileText className="h-5 w-5 text-[#FF6A00]" /><h2 className="text-lg font-semibold">Compras recientes</h2></div>
                </div>
                <RecentPurchasesList userId={user?.id} />
                <div className="mt-4"><Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10"><FileText className="h-4 w-4 mr-3" />Ver facturas</Button></div>
            </div>

            <div className="bg-[#1A1C1F] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Logros & badges</h2><Button onClick={() => handleEditSection("achievements")} variant="ghost" size="sm" className="text-[#FF6A00] rounded-xl"><Edit3 className="h-4 w-4 mr-2" />Editar</Button></div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-white/5 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center"><Trophy className="h-6 w-6 text-white" /></div>
                                <p className="text-xs text-gray-400">Logro {i}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
