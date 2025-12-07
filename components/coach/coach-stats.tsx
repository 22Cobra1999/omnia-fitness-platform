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
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down';
}

function StatCard({ title, value, subtitle, icon, status, trend }: StatCardProps) {
  const statusColors = {
    good: 'border-green-500/50 bg-green-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    critical: 'border-red-500/50 bg-red-500/10'
  };

  const textColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <div className={`backdrop-blur-xl bg-black/40 border rounded-2xl p-4 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${statusColors[status]}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">{title}</h3>
            {subtitle && (
              <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${textColors[status]}`}>
        {value}
      </div>
    </div>
  );
}

export function CoachStats() {
  const [stats, setStats] = useState<CoachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el coach_id del usuario actual
        const response = await fetch('/api/auth/user');
        if (!response.ok) {
          throw new Error('Error al obtener usuario');
        }
        const user = await response.json();

        if (!user?.id) {
          throw new Error('Usuario no encontrado');
        }

        // Obtener estadísticas
        const statsResponse = await fetch(`/api/coach/stats?coach_id=${user.id}`);
        if (!statsResponse.ok) {
          throw new Error('Error al obtener estadísticas');
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
  }, []);

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

