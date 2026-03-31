import { Client } from "../types"
import { cn } from "@/lib/utils/utils"
import { Flame } from "lucide-react"

interface ClientCardProps {
    client: Client
    onClick: (client: Client) => void
}

const RingSegment = ({
    center,
    radius,
    strokeWidth,
    percentage,
    offset = 0,
    color,
    opacity = 1,
    className = ""
}: {
    center: number,
    radius: number,
    strokeWidth: number,
    percentage: number,
    offset?: number,
    color: string,
    opacity?: number,
    className?: string
}) => {
    const circumference = 2 * Math.PI * radius;
    const dashArray = circumference;
    const dashOffset = circumference * (1 - percentage / 100);
    const rotation = (offset / 100) * 360 - 90;

    return (
        <g transform={`rotate(${rotation}, ${center}, ${center})`}>
            {/* Border Effect (Darker/Slightly Thicker) */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="black"
                strokeWidth={strokeWidth + 1.5}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap={percentage > 0 ? "round" : "butt"}
                opacity={0.4}
            />
            {/* Core Segment Color */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap={percentage > 0 ? "round" : "butt"}
                opacity={opacity}
                className={cn("drop-shadow-sm", className)}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
        </g>
    );
};

const ActivityRings = ({
    fitness = { completed: 0, absent: 0, total: 0 },
    nutrition = { completed: 0, absent: 0, total: 0 },
    avatarUrl,
    clientName
}: {
    fitness?: { completed: number, absent: number, total: number },
    nutrition?: { completed: number, absent: number, total: number },
    avatarUrl?: string | null,
    clientName?: string
}) => {
    const size = 146;
    const center = size / 2;
    const strokeWidth = 8;
    const gap = 5;

    const r1 = center - strokeWidth - 2;
    const r2 = r1 - strokeWidth - gap;

    const renderRing = (radius: number, stats: { completed: number, absent: number, total: number }, colors: { completed: string, absent: string }) => {
        const total = stats.total || 30;
        const compPerc = Math.min((stats.completed / total) * 100, 100);
        const absPerc = Math.min((stats.absent / total) * 100, 100 - compPerc);

        return (
            <>
                {/* Track (Future/Gray) */}
                <circle cx={center} cy={center} r={radius} fill="transparent" stroke="#27272a" strokeWidth={strokeWidth} />

                {/* Absent Segment (Red) */}
                <RingSegment
                    center={center} radius={radius} strokeWidth={strokeWidth}
                    percentage={absPerc} offset={0} color="#ef4444"
                    className="opacity-40"
                />

                {/* Completed Segment */}
                <RingSegment
                    center={center} radius={radius} strokeWidth={strokeWidth}
                    percentage={compPerc} offset={absPerc} color={colors.completed}
                    className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]"
                />
            </>
        );
    };

    return (
        <div className="relative flex items-center justify-center transition-all group-hover:scale-105" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                {/* Ring 1: Fitness (Orange) */}
                {renderRing(r1, fitness, { completed: "#FF7939", absent: "#ef4444" })}
                {/* Ring 2: Nutrition (Yellow) */}
                {renderRing(r2, nutrition, { completed: "#FACC15", absent: "#ef4444" })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-[84px] h-[84px] rounded-full border border-white/10 overflow-hidden shadow-lg group-hover:border-[#FF7939]/50 transition-all duration-500">
                    <img
                        src={avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                        alt={clientName || "Cliente"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </div>
            </div>
        </div>
    );
};

export function ClientCard({ client, onClick }: ClientCardProps) {
    const fitnessStats = client.fitStats || { completed: 0, total: 0, absent: 0 };
    const nutritionStats = client.nutriStats || { completed: 0, total: 0, absent: 0 };

    const toTitleCase = (str: string) => {
        return str.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div
            className="flex flex-col items-center justify-center p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
            onClick={() => onClick(client)}
        >
            {/* Rings with inner Avatar */}
            <div className="flex items-center justify-center w-full mb-3 shrink-0">
                <ActivityRings
                    fitness={fitnessStats}
                    nutrition={nutritionStats}
                    avatarUrl={client.avatar_url}
                    clientName={client.name}
                />
            </div>

            {/* Name and Streak at the bottom */}
            <div className="flex flex-col items-center gap-1 w-full mt-1">
                <h4 className="text-[14px] font-bold text-white/70 leading-none tracking-tight group-hover:text-white transition-colors truncate w-full text-center">
                    {toTitleCase(client.name)}
                </h4>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
                    {client.streak !== undefined && client.streak > 0 && (
                        <div className="flex items-center gap-1 bg-[#FF7939]/10 text-[#FF7939] px-2 py-0.5 rounded-full border border-[#FF7939]/20 group-hover:bg-[#FF7939]/20 transition-colors">
                            <Flame size={10} fill="currentColor" />
                            <span className="text-[10px] font-black italic">{client.streak}</span>
                        </div>
                    )}
                    
                    {(client.itemsToday || 0) > 0 ? (
                        <div className="bg-zinc-800/50 px-2 py-0.5 rounded-full border border-white/5">
                            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-tighter ring-offset-zinc-900">Hoy: {client.itemsToday}</span>
                        </div>
                    ) : client.nextActivityDate ? (
                        <div className="px-2 py-0.5 opacity-60">
                            <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter">
                                Próx: {new Date(client.nextActivityDate + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
