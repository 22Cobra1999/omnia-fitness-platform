'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Clock,
  XCircle,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface CoachStats {
  responseRate: number;
  avgResponseTimeHours: number;
  cancellations: number;
  lateReschedules: number;
  attendanceRate: number;
  incidents: number;
  period: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorIndex: number;
}

// Tonos de naranja para diferenciar las tarjetas
const orangeTones = [
  'text-[#FF7939]', // Naranja principal
  'text-[#FF8C42]', // Naranja claro
  'text-[#FF6B2B]', // Naranja oscuro
  'text-[#FF9F5A]', // Naranja muy claro
  'text-[#FF5A1F]', // Naranja muy oscuro
  'text-[#FFA366]', // Naranja medio claro
];

function StatCard({ title, value, subtitle, icon, colorIndex }: StatCardProps) {
  const orangeColor = orangeTones[colorIndex % orangeTones.length];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={orangeColor}>
          {icon}
        </div>
        <h3 className="text-xs font-medium text-white/70">{title}</h3>
      </div>
      <div className={`text-xl font-bold ${orangeColor}`}>
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-white/50 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function CoachStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener estadísticas
        const statsResponse = await fetch(`/api/coach/stats?coach_id=${user.id}`);
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json();
          throw new Error(errorData.error || 'Error al obtener estadísticas');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (err: any) {
        console.error('Error cargando estadísticas:', err);
        setError(err.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#FF7939]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 py-4">
        <AlertTriangle className="w-4 h-4" />
        <p className="text-xs">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">Estadísticas</h3>
        <span className="text-xs text-white/50">Últimos {stats.period}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 1. Tasa de respuesta */}
        <StatCard
          title="Tasa de respuesta"
          value={`${stats.responseRate}%`}
          subtitle={stats.responseRate >= 80 ? 'Excelente' : stats.responseRate >= 60 ? 'Mejorable' : 'Crítico'}
          icon={<MessageCircle className="w-4 h-4" />}
          colorIndex={0}
        />

        {/* 2. Tiempo promedio de respuesta */}
        <StatCard
          title="Tiempo de respuesta"
          value={stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours}h` : 'N/A'}
          subtitle={stats.avgResponseTimeHours <= 12 ? 'Rápido' : stats.avgResponseTimeHours <= 24 ? 'Aceptable' : 'Lento'}
          icon={<Clock className="w-4 h-4" />}
          colorIndex={1}
        />

        {/* 3. Cancelaciones */}
        <StatCard
          title="Cancelaciones"
          value={stats.cancellations}
          subtitle={stats.cancellations === 0 ? 'Sin cancelaciones' : `${stats.cancellations} en el período`}
          icon={<XCircle className="w-4 h-4" />}
          colorIndex={2}
        />

        {/* 4. Reprogramaciones tardías */}
        <StatCard
          title="Reprogramaciones tardías"
          value={stats.lateReschedules}
          subtitle={stats.lateReschedules === 0 ? 'Sin reprogramaciones' : 'Cambios 12-24h'}
          icon={<Calendar className="w-4 h-4" />}
          colorIndex={3}
        />

        {/* 5. Asistencia / puntualidad */}
        <StatCard
          title="Asistencia"
          value={`${stats.attendanceRate}%`}
          subtitle={stats.attendanceRate >= 95 ? 'Excelente' : stats.attendanceRate >= 85 ? 'Buena' : 'Mejorar'}
          icon={<CheckCircle className="w-4 h-4" />}
          colorIndex={4}
        />

        {/* 6. Incidentes reportados */}
        <StatCard
          title="Incidentes"
          value={stats.incidents}
          subtitle={stats.incidents === 0 ? 'Sin incidentes' : stats.incidents > 2 ? 'Alerta' : 'Atención'}
          icon={<AlertTriangle className="w-4 h-4" />}
          colorIndex={5}
        />
      </div>
    </div>
  );
}
