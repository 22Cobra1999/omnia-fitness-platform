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
    days = { completed: 0, absent: 0, total: 30 },
    fitness = { completed: 0, absent: 0, total: 0 },
    nutrition = { completed: 0, absent: 0, total: 0 },
    streak = 0
}) => {
    const size = 110;
    const center = size / 2;
    const strokeWidth = 7;
    const gap = 3.5;

    const r1 = center - strokeWidth;
    const r2 = r1 - strokeWidth - gap;
    const r3 = r2 - strokeWidth - gap;

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
                {renderRing(r1, days, { completed: "#FF7939", absent: "#ef4444" })}
                {/* Always show second ring conceptual track */}
                {renderRing(r2, fitness, { completed: "#FFFFFF", absent: "#ef4444" })}
                {nutrition.total > 0 && renderRing(r3, nutrition, { completed: "#FACC15", absent: "#ef4444" })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="bg-white/5 backdrop-blur-xl rounded-full w-9 h-9 flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                    <Flame size={12} className="text-[#FF7939] mb-0.5" fill="#FF7939" />
                    <span className="text-[12px] font-black text-white italic leading-none">{streak}</span>
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
            {/* Row with Avatar and Rings side-by-side */}
            <div className="flex items-center justify-center w-full gap-2 mb-3">
                {/* Circular Avatar (Extra Large) */}
                <div className="w-20 h-20 rounded-full border border-white/10 overflow-hidden shadow-lg group-hover:border-[#FF7939]/50 transition-all duration-500 shrink-0">
                    <img
                        src={client.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"}
                        alt={client.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </div>

                {/* Rings (Very Close) */}
                <div className="scale-95 shrink-0 ml-[-8px]">
                    <ActivityRings
                        days={{
                            completed: client.daysCompleted || 0,
                            absent: client.absentDays || 0,
                            total: client.daysTotal || 30
                        }}
                        fitness={fitnessStats}
                        nutrition={nutritionStats}
                        streak={client.streak || 0}
                    />
                </div>
            </div>

            {/* Name at the bottom - Title Case and Dimmer */}
            <h4 className="text-[12px] font-bold text-white/50 leading-none tracking-tight group-hover:text-white transition-colors truncate w-full text-center">
                {toTitleCase(client.name)}
            </h4>
        </div>
    )
}
