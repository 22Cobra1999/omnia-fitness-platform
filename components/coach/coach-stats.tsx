'use client';

import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Clock, 
  XCircle, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
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
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF7939]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-black/40 border border-red-500/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Determinar status de cada métrica
  const getResponseRateStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate >= 80) return 'good';
    if (rate >= 60) return 'warning';
    return 'critical';
  };

  const getResponseTimeStatus = (hours: number): 'good' | 'warning' | 'critical' => {
    if (hours <= 12) return 'good';
    if (hours <= 24) return 'warning';
    return 'critical';
  };

  const getCancellationsStatus = (count: number): 'good' | 'warning' | 'critical' => {
    if (count === 0) return 'good';
    if (count <= 2) return 'warning';
    return 'critical';
  };

  const getLateReschedulesStatus = (count: number): 'good' | 'warning' | 'critical' => {
    if (count === 0) return 'good';
    if (count <= 1) return 'warning';
    return 'critical';
  };

  const getAttendanceStatus = (rate: number): 'good' | 'warning' | 'critical' => {
    if (rate >= 95) return 'good';
    if (rate >= 85) return 'warning';
    return 'critical';
  };

  const getIncidentsStatus = (count: number): 'good' | 'warning' | 'critical' => {
    if (count === 0) return 'good';
    if (count <= 2) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Estadísticas del Coach</h2>
        <span className="text-xs text-white/60">Últimos {stats.period}</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* 1. Tasa de respuesta */}
        <StatCard
          title="Tasa de respuesta"
          value={`${stats.responseRate}%`}
          subtitle={stats.responseRate >= 80 ? 'Excelente' : stats.responseRate >= 60 ? 'Mejorable' : 'Crítico'}
          icon={<MessageCircle className="w-5 h-5 text-white" />}
          status={getResponseRateStatus(stats.responseRate)}
        />

        {/* 2. Tiempo promedio de respuesta */}
        <StatCard
          title="Tiempo promedio de respuesta"
          value={stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours}h` : 'N/A'}
          subtitle={stats.avgResponseTimeHours <= 12 ? 'Rápido' : stats.avgResponseTimeHours <= 24 ? 'Aceptable' : 'Lento'}
          icon={<Clock className="w-5 h-5 text-white" />}
          status={getResponseTimeStatus(stats.avgResponseTimeHours)}
        />

        {/* 3. Cancelaciones */}
        <StatCard
          title="Cancelaciones"
          value={stats.cancellations}
          subtitle={stats.cancellations === 0 ? 'Sin cancelaciones' : `${stats.cancellations} en el período`}
          icon={<XCircle className="w-5 h-5 text-white" />}
          status={getCancellationsStatus(stats.cancellations)}
        />

        {/* 4. Reprogramaciones tardías */}
        <StatCard
          title="Reprogramaciones tardías"
          value={stats.lateReschedules}
          subtitle={stats.lateReschedules === 0 ? 'Sin reprogramaciones tardías' : 'Cambios dentro de 12-24h'}
          icon={<Calendar className="w-5 h-5 text-white" />}
          status={getLateReschedulesStatus(stats.lateReschedules)}
        />

        {/* 5. Asistencia / puntualidad */}
        <StatCard
          title="Asistencia"
          value={`${stats.attendanceRate}%`}
          subtitle={stats.attendanceRate >= 95 ? 'Excelente asistencia' : stats.attendanceRate >= 85 ? 'Buena asistencia' : 'Necesita mejorar'}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          status={getAttendanceStatus(stats.attendanceRate)}
        />

        {/* 6. Incidentes reportados */}
        <StatCard
          title="Incidentes reportados"
          value={stats.incidents}
          subtitle={stats.incidents === 0 ? 'Sin incidentes' : stats.incidents > 2 ? 'Alerta roja' : 'Atención requerida'}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          status={getIncidentsStatus(stats.incidents)}
        />
      </div>

      {/* Información adicional */}
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4">
        <p className="text-xs text-white/60">
          <strong className="text-white/80">Top 5 estadísticas que definen a un buen coach:</strong>
        </p>
        <ul className="text-xs text-white/60 mt-2 space-y-1 list-disc list-inside">
          <li>Responde rápido</li>
          <li>No cancela</li>
          <li>Sus clientes cumplen el programa</li>
          <li>Sus clientes renuevan</li>
          <li>No tiene quejas</li>
        </ul>
      </div>
    </div>
  );
}

