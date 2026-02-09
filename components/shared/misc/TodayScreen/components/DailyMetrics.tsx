import React from 'react';
import { Flame, Clock, Dumbbell } from 'lucide-react';

interface DailyMetricsProps {
    calories: number;
    minutes: number;
    exercisesCompleted: number;
    exercisesTotal: number;
}

const MetricCard = ({ icon: Icon, value, label, color }: any) => (
    <div className="flex flex-col items-center justify-center bg-[#1C1C1E] rounded-2xl p-4 w-full h-24 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon className={`w-12 h-12 ${color}`} />
        </div>
        <span className={`text-2xl font-bold ${color.replace('text-', 'text-')}`}>
            {value}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">
            {label}
        </span>
    </div>
);

export const DailyMetrics: React.FC<DailyMetricsProps> = ({
    calories,
    minutes,
    exercisesCompleted,
    exercisesTotal
}) => {
    return (
        <div className="grid grid-cols-3 gap-3 px-6 mb-6">
            <MetricCard
                icon={Flame}
                value={calories}
                label="Kcal"
                color="text-orange-500"
            />
            <MetricCard
                icon={Clock}
                value={minutes}
                label="Minutos"
                color="text-blue-500"
            />
            <MetricCard
                icon={Dumbbell}
                value={`${exercisesCompleted}/${exercisesTotal}`}
                label="Ejercicios"
                color="text-green-500"
            />
        </div>
    );
};
