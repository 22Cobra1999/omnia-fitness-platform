import { Client } from "../types"

interface ClientCardProps {
    client: Client
    onClick: (client: Client) => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
    return (
        <div
            className="bg-[#141414] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-lg cursor-pointer hover:bg-[#181818] transition-all hover:border-[#FF7939]/30 flex flex-col group h-full"
            onClick={() => onClick(client)}
        >
            {/* Card Header/Hero area */}
            <div className="relative h-24 bg-zinc-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-black/40"></div>

                {/* Alert Badge (Top Left) */}
                {client.hasAlert && (
                    <div className="absolute top-2 left-2 z-20">
                        <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border shadow-lg ${client.alertLevel === 3 ? "bg-red-500/20 text-red-500 border-red-500/30" :
                            client.alertLevel === 2 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                            }`}>
                            {client.alertLabel || 'Alerta'}
                        </div>
                    </div>
                )}

                {/* Status Badge (Top Right) */}
                <div className="absolute top-2 right-2 z-20">
                    <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border shadow-lg ${client.status === "active" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        client.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20" :
                            "bg-gray-500/20 text-gray-400 border-gray-500/20"
                        }`}>
                        {client.status === "active" ? "Activo" : client.status === "pending" ? "Pendiente" : "Inactivo"}
                    </div>
                </div>

                {/* Large Avatar */}
                <div className="relative z-10 w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl group-hover:scale-105 transition-transform duration-300">
                    <img
                        src={client.avatar_url || "/placeholder.svg"}
                        alt={client.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Card Body */}
            <div className="p-3 flex-1 flex flex-col">
                <div className="text-center mb-3">
                    <h3 className="font-bold text-sm text-white truncate leading-tight mb-1">{client.name}</h3>
                    <div className="flex flex-col items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-gray-400">
                        <span className="leading-tight text-center">Última: {client.lastActive}</span>
                        {(client.age || 0) > 0 && (
                            <span className="opacity-60">{client.age} años</span>
                        )}
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mt-4 mb-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-orange-400 font-bold uppercase tracking-tighter text-[7px] opacity-80">Progreso</span>
                        <span className="text-orange-400 font-black text-xs">{client.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FF7939] rounded-full shadow-[0_0_8px_rgba(255,121,57,0.4)] transition-all duration-500"
                            style={{ width: `${client.progress}%` }}
                        />
                    </div>
                </div>

                {/* Footer Stats Grid */}
                <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-zinc-800/60 mt-auto">
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-bold text-white">{client.itemsPending ?? 0}</span>
                        <span className="text-[7px] text-gray-400 uppercase font-black tracking-tighter">Pend</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-zinc-800/40">
                        <span className="text-[11px] font-bold text-white">{client.todoCount || 0}</span>
                        <span className="text-[7px] text-gray-500 uppercase font-medium">Tareas</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-zinc-800/40">
                        <span className="text-[10px] sm:text-[11px] font-bold text-white">${(() => {
                            const val = Math.round(client.totalRevenue);
                            return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
                        })()}</span>
                        <span className="text-[7px] text-gray-400 uppercase font-black tracking-tighter">Ingr</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
