'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/supabase-client';
import { 
  Loader2, TrendingUp, Users, CreditCard, AlertCircle, 
  ExternalLink, Search, RefreshCw, LogOut, CheckCircle2, 
  Clock, XCircle, ChevronRight, BarChart3, Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function AdminFinanceDashboard() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'coaches'>('sales');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase
        .from('banco')
        .select(`
          created_at,
          amount_paid,
          marketplace_fee,
          seller_amount,
          mercadopago_status,
          mercadopago_payment_id,
          activities (title, type),
          user_profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      const { data: sData } = await supabase
        .from('planes_uso_coach')
        .select(`
          id,
          coach_id,
          started_at,
          plan_type,
          status,
          coach_mercadopago_credentials (mercadopago_user_id)
        `)
        .order('started_at', { ascending: false });

      if (pData) setPayments(pData);
      if (sData) setSubscriptions(sData);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de Totales e Inteligencia
  const totalCommissions = payments?.filter(p => p.mercadopago_status === 'approved').reduce((sum, p) => sum + (Number(p.marketplace_fee) || 0), 0) || 0;
  const delayedCoachesCount = subscriptions.filter(sub => {
    const nextCharge = new Date(sub.started_at);
    nextCharge.setMonth(nextCharge.getMonth() + 1);
    return sub.status === 'active' && nextCharge < new Date() && sub.plan_type !== 'free';
  }).length;
  
  const freeExpiringCount = subscriptions.filter(sub => {
    const startDate = new Date(sub.started_at);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return sub.plan_type === 'free' && startDate < threeMonthsAgo;
  }).length;

  const getProductTypeIcon = (type: string) => {
    if (type?.includes('workshop')) return '🎓';
    if (type?.includes('consult')) return '📞';
    if (type?.includes('nutrition')) return '🍎';
    return '💪';
  };

  const filteredPayments = payments.filter(p => 
    p.activities?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mercadopago_payment_id?.includes(searchTerm)
  );

  const filteredSubscriptions = subscriptions.filter(s => 
    s.coach_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.plan_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-[#FF7939] animate-spin" />
      <p className="text-white/40 font-mono text-xs tracking-widest uppercase">Cargando Bóveda Omnia...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#FF7939]/30">
      
      {/* NAVEGACIÓN LATERAL / TOP SLIM */}
      <div className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
              <span className="text-[#FF7939]">OMNIA</span> 
              <span className="text-white/40 font-light truncate">/ FINANCE ADMIN</span>
            </h1>
            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('sales')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'sales' ? 'bg-[#FF7939] text-black' : 'text-white/40 hover:text-white'}`}
              >
                Ventas Clientes
              </button>
              <button 
                onClick={() => setActiveTab('coaches')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'coaches' ? 'bg-[#FF7939] text-black' : 'text-white/40 hover:text-white'}`}
              >
                Suscripciones Coaches
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input 
                type="text" 
                placeholder="Buscar ID, Cliente o Producto..." 
                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-[11px] w-[300px] focus:outline-none focus:border-[#FF7939]/40 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-white/40 hover:text-[#FF7939]" />
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500/80 rounded-lg hover:bg-red-500/20 transition-all font-bold text-[10px] uppercase">
              <LogOut className="w-3 h-3" /> Salir
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6">
        
        {/* KPI SUMMARY CARDS (COMPACT) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <Wallet className="w-4 h-4 text-[#FF7939]" />
              <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full font-bold">MES ACTUAL</span>
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Caja Omnia (Comisiones)</p>
            <p className="text-2xl font-black italic tracking-tighter">${totalCommissions.toLocaleString()}</p>
          </div>
          
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full font-bold">{subscriptions.length} TOTAL</span>
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Coaches Registrados</p>
            <p className="text-2xl font-black italic tracking-tighter">{subscriptions.filter(s => s.status === 'active').length} <span className="text-[10px] text-white/20 not-italic">ACTIVOS</span></p>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl group hover:border-orange-500/40 transition-colors cursor-help">
            <div className="flex justify-between items-start mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              {delayedCoachesCount > 0 && <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></span>}
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Pagos en Retraso</p>
            <p className={`text-2xl font-black italic tracking-tighter ${delayedCoachesCount > 0 ? 'text-orange-500' : 'text-white/40'}`}>
              {delayedCoachesCount} <span className="text-[10px] not-italic opacity-50 uppercase">Coaches en mora</span>
            </p>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl group hover:border-red-500/40 transition-colors cursor-help">
            <div className="flex justify-between items-start mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Planes FREE al Límite</p>
            <p className={`text-2xl font-black italic tracking-tighter ${freeExpiringCount > 0 ? 'text-red-500' : 'text-white/40'}`}>
              {freeExpiringCount} <span className="text-[10px] not-italic opacity-50 uppercase">Vencen pronto (+3m)</span>
            </p>
          </div>
        </div>

        {/* TABLA DE ALTA DENSIDAD */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-[12px] font-black uppercase tracking-[0.1em] flex items-center gap-2">
              {activeTab === 'sales' ? <BarChart3 className="w-4 h-4 text-[#FF7939]" /> : <Users className="w-4 h-4 text-blue-500" />}
              {activeTab === 'sales' ? 'Conciliación de Ventas (Clientes)' : 'Conciliación de Suscripciones (Coaches)'}
            </h2>
            <p className="text-[10px] text-white/30 font-bold uppercase">Mostrando {activeTab === 'sales' ? filteredPayments.length : filteredSubscriptions.length} registros</p>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'sales' ? (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Fecha Pago</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Producto / Tipo</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Cliente</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-right">Pagó</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#FF7939] uppercase border-b border-white/5 text-right">Omnia Fee</th>
                    <th className="px-4 py-3 text-[9px] font-black text-blue-400 uppercase border-b border-white/5 text-right">Neto Coach</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Estado MP</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredPayments.map((p: any, i: number) => {
                    const status = p.mercadopago_status;
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-2 font-mono text-[10px] text-white/40">
                          {new Date(p.created_at).toLocaleDateString()} <span className="opacity-30">{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{getProductTypeIcon(p.activities?.type)}</span>
                            <div>
                              <p className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors leading-none mb-1 truncate max-w-[200px]">{p.activities?.title || 'Consulta'}</p>
                              <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">{p.activities?.type || 'No especificado'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-[11px] font-medium text-white/60">{p.user_profiles?.full_name}</td>
                        <td className="px-4 py-2 text-right font-mono text-[11px] font-bold">${p.amount_paid}</td>
                        <td className="px-4 py-2 text-right font-mono text-[11px] font-black text-[#FF7939]">-${p.marketplace_fee}</td>
                        <td className="px-4 py-2 text-right font-mono text-[11px] font-black text-blue-400">${p.seller_amount}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${
                            status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                            status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            'bg-white/5 text-white/20 border-white/5'
                          }`}>
                            {status || 'S/D'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {p.mercadopago_payment_id ? (
                            <a href={`https://www.mercadopago.com.ar/mshops/notifications-center/payment/${p.mercadopago_payment_id}`} target="_blank" className="text-white/20 hover:text-[#FF7939] transition-colors inline-block">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : <span className="text-[9px] opacity-10 italic">N/A</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Coach ID</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">U. Pago</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Plan / Monto</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Vinculación</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-right">Cuenta MP</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-right">Próx. Cobro</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Mora</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredSubscriptions.map((sub: any, i: number) => {
                    const startDate = new Date(sub.started_at);
                    const isFree = sub.plan_type === 'free';
                    const nextCharge = new Date(startDate);
                    nextCharge.setMonth(nextCharge.getMonth() + 1);
                    const dayDiff = Math.floor((new Date().getTime() - nextCharge.getTime()) / (1000 * 3600 * 24));
                    const isDelayed = sub.status === 'active' && nextCharge < new Date();
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                    const isFreeExpired = isFree && startDate < threeMonthsAgo;

                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-mono text-[#FF7939] font-bold group-hover:underline cursor-pointer tracking-tighter">{sub.coach_id.substring(0,12)}...</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[10px] text-white/40">{startDate.toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <p className={`text-[11px] font-black uppercase tracking-tighter ${isFree ? 'text-white/30' : 'text-white/80'}`}>{sub.plan_type}</p>
                          <p className="text-[9px] font-mono opacity-40">${isFree ? '0' : sub.plan_type === 'basico' ? '12.000' : sub.plan_type === 'black' ? '22.000' : '35.000'}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${
                            sub.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[10px] text-white/30">{sub.coach_mercadopago_credentials?.mercadopago_user_id || 'SIN VINC.'}</td>
                        <td className="px-4 py-3 text-right font-mono text-[10px] text-white/60">{nextCharge.toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] font-black ${dayDiff > 0 && !isFree ? 'text-orange-500' : 'text-white/20'}`}>
                            {dayDiff > 0 && !isFree ? `${dayDiff}d` : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isFreeExpired ? (
                            <div className="flex items-center gap-1.5 text-red-500">
                              <AlertCircle className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase italic">¡FREE AGOTADO!</span>
                            </div>
                          ) : isDelayed && !isFree ? (
                            <div className="flex items-center gap-1.5 text-orange-500">
                              <Clock className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">PAGO PENDIENTE</span>
                            </div>
                          ) : sub.status === 'active' ? (
                            <div className="flex items-center gap-1.5 text-green-500 opacity-60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">SINCRO OK</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-white/20 uppercase font-bold tracking-widest">{sub.status}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER TOTALS SLIM */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 px-6 py-2.5 flex justify-between items-center text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] z-50">
        <div className="flex gap-6">
          <span>OMNIA ENGINE v2.5.0-FINANCE</span>
          <span className="text-green-500/60 uppercase">● Server Status: Online</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-white/60">© 2026 Admin Panel</span>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #080808; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
}
