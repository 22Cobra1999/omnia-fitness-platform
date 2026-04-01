import { Client } from "../types"
import { cn } from "@/lib/utils/utils"
import { Flame } from "lucide-react"

interface ClientCardProps {
    client: Client
    onClick: (client: Client) => void
}

const SegmentedRing = ({
    center,
    radius,
    strokeWidth,
    history = [],
    getSegmentColor
}: {
    center: number,
    radius: number,
    strokeWidth: number,
    history: any[],
    getSegmentColor: (day: any) => string
}) => {
    // Group consecutive days with same color
    const groups: { color: string, startIndex: number, count: number }[] = [];
    let currentGroup: { color: string, startIndex: number, count: number } | null = null;
    
    // Default to 30 days if history is empty
    const totalDays = history.length || 30;
    const gapDegrees = 6; 
    const unitDegrees = 360 / totalDays;

    history.forEach((day, i) => {
        const color = getSegmentColor(day);
        if (!currentGroup || currentGroup.color !== color) {
            currentGroup = { color, startIndex: i, count: 1 };
            groups.push(currentGroup);
        } else {
            currentGroup.count++;
        }
    });

    return (
        <g transform={`rotate(-90, ${center}, ${center})`}>
            {groups.map((group, i) => {
                const startAngle = (group.startIndex * unitDegrees) + (gapDegrees / 2);
                const sweep = (group.count * unitDegrees) - gapDegrees;
                const endAngle = startAngle + sweep;
                
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                const x1 = center + radius * Math.cos(startRad);
                const y1 = center + radius * Math.sin(startRad);
                const x2 = center + radius * Math.cos(endRad);
                const y2 = center + radius * Math.sin(endRad);
                
                const largeArcFlag = sweep <= 180 ? "0" : "1";
                const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

                return (
                    <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={group.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="transition-all duration-500 ease-out"
                    />
                );
            })}
        </g>
    );
};

const ActivityRings = ({
    history = [],
    avatarUrl,
    clientName,
    streak = 0
}: {
    history?: any[],
    avatarUrl?: string | null,
    clientName?: string,
    streak?: number
}) => {
    const size = 160;
    const center = size / 2;
    const strokeWidth = 5;
    const gap = 4;

    const r1 = center - strokeWidth - 2;
    const r2 = r1 - strokeWidth - gap;

    return (
        <div className="relative flex items-center justify-center transition-all group-hover:scale-105" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                {/* Ring 1: Fitness */}
                <SegmentedRing
                    center={center}
                    radius={r1}
                    strokeWidth={strokeWidth}
                    history={history}
                    getSegmentColor={(day) => {
                        if (day.status === 'future' || !day.has_fit) return '#27272a';
                        return day.fit_ok ? '#FF7939' : '#DC2626';
                    }}
                />
                {/* Ring 2: Nutrition */}
                <SegmentedRing
                    center={center}
                    radius={r2}
                    strokeWidth={strokeWidth}
                    history={history}
                    getSegmentColor={(day) => {
                        if (day.status === 'future' || !day.has_nut) return '#27272a';
                        return day.nut_ok ? '#FACC15' : '#DC2626';
                    }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative w-[110px] h-[110px]">
                    <div className="w-full h-full rounded-full border-2 border-white/5 overflow-hidden shadow-2xl group-hover:border-[#FF7939]/30 transition-all duration-500 bg-neutral-950">
                        <img
                            src={avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                            alt={clientName || "Cliente"}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                        />
                    </div>
                    {/* Overlapping Flame (Matching Interior Detail) */}
                    {streak > 0 && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 scale-110 transform-gpu">
                            <div className="relative flex items-center justify-center">
                                <Flame className="h-6 w-6 text-[#FF7939] drop-shadow-[0_0_8px_rgba(255,121,57,0.6)]" fill="#FF7939" />
                                <span className="absolute text-black font-black text-[9px] font-[var(--font-anton)] pt-0.5 pointer-events-none">
                                    {streak}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function ClientCard({ client, onClick }: ClientCardProps) {
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
            {/* Rings with inner Avatar and Streak */}
            <div className="flex items-center justify-center w-full mb-3 shrink-0">
                <ActivityRings
                    history={client.history || []}
                    avatarUrl={client.avatar_url}
                    clientName={client.name}
                    streak={client.streak}
                />
            </div>

            {/* Name at the bottom */}
            <div className="flex flex-col items-center gap-1 w-full mt-1">
                <h4 className="text-[14px] font-bold text-white/90 leading-none tracking-tight group-hover:text-white transition-colors truncate w-full text-center">
                    {toTitleCase(client.name)}
                </h4>
            </div>
        </div>
    )
}
