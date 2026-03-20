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
      // 1. Reconciliación Clientes con Relaciones Explícitas
      const { data: pData, error: pErr } = await supabase
        .from('banco')
        .select(`
          created_at,
          amount_paid,
          marketplace_fee,
          seller_amount,
          mercadopago_status,
          mercadopago_payment_id,
          concept,
          activities:activity_id (title, type),
          user_profiles:client_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (pErr) console.error('Error banco:', pErr);

      // 2. Reconciliación Coaches
      const { data: sData, error: sErr } = await supabase
        .from('planes_uso_coach')
        .select(`
          id,
          coach_id,
          started_at,
          plan_type,
          status,
          mercadopago_subscription_next_payment_date
        `)
        .order('started_at', { ascending: false });

      if (sErr) console.error('Error planes:', sErr);

      if (pData) setPayments(pData);
      if (sData) setSubscriptions(sData);
    } finally {
      setLoading(false);
    }
  };

  const totalCommissions = payments?.filter(p => p.mercadopago_status === 'approved').reduce((sum, p) => sum + (Number(p.marketplace_fee) || 0), 0) || 0;
  
  const delayedCoachesCount = subscriptions.filter(sub => {
    const nextCharge = sub.mercadopago_subscription_next_payment_date ? new Date(sub.mercadopago_subscription_next_payment_date) : null;
    return sub.status === 'active' && nextCharge && nextCharge < new Date() && sub.plan_type !== 'free';
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
    (p.activities?.title || p.concept || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <p className="text-white/40 font-mono text-xs tracking-widest uppercase">Cargando OMNIA FINANCE...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#FF7939]/30">
      <div className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
              <span className="text-[#FF7939]">OMNIA</span> 
              <span className="text-white/40 font-light truncate">/ FINANCE ADMIN</span>
            </h1>
            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button onClick={() => setActiveTab('sales')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'sales' ? 'bg-[#FF7939] text-black' : 'text-white/40 hover:text-white'}`}>Ventas Clientes</button>
              <button onClick={() => setActiveTab('coaches')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'coaches' ? 'bg-[#FF7939] text-black' : 'text-white/40 hover:text-white'}`}>Suscripciones Coaches</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input type="text" placeholder="Buscar ID, Cliente o Producto..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-[11px] w-[300px] focus:outline-none focus:border-[#FF7939]/40 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><RefreshCw className="w-4 h-4 text-white/40 hover:text-[#FF7939]" /></button>
            <button onClick={() => signOut()} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500/80 rounded-lg hover:bg-red-500/20 transition-all font-bold text-[10px] uppercase"><LogOut className="w-3 h-3" /> Salir</button>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Caja Omnia (Comisiones)</p>
            <p className="text-2xl font-black italic tracking-tighter">${totalCommissions.toLocaleString()}</p>
          </div>
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Coaches ACTIVOS</p>
            <p className="text-2xl font-black italic tracking-tighter">{subscriptions.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Coaches en Mora</p>
            <p className={`text-2xl font-black italic tracking-tighter ${delayedCoachesCount > 0 ? 'text-orange-500 font-black' : 'text-white/40'}`}>{delayedCoachesCount}</p>
          </div>
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <p className="text-white/30 text-[10px] font-bold uppercase mb-0.5 tracking-wider">Planes FREE +3 meses</p>
            <p className={`text-2xl font-black italic tracking-tighter ${freeExpiringCount > 0 ? 'text-red-500 font-black' : 'text-white/40'}`}>{freeExpiringCount}</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            {activeTab === 'sales' ? (
              <table className="w-full text-left">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Fecha Pago</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Producto / ID</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5">Cliente</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-right font-mono">TOTAL</th>
                    <th className="px-4 py-3 text-[9px] font-black text-[#FF7939] uppercase border-b border-white/5 text-right font-mono">OMNIA FEE</th>
                    <th className="px-4 py-3 text-[9px] font-black text-blue-400 uppercase border-b border-white/5 text-right font-mono">COACH NETO</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Estado MP</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredPayments.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-2 font-mono text-[10px] text-white/40">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <p className="text-[11px] font-bold text-white/90 leading-none mb-1">{p.activities?.title || p.concept || 'Consulta'}</p>
                        <p className="text-[9px] text-white/20 font-bold tracking-tighter">{p.mercadopago_payment_id || 'ID Pendiente'}</p>
                      </td>
                      <td className="px-4 py-2 text-[11px] font-medium text-white/60">{p.user_profiles?.full_name || 'Desconocido'}</td>
                      <td className="px-4 py-2 text-right font-mono text-[11px] font-bold">${p.amount_paid}</td>
                      <td className="px-4 py-2 text-right font-mono text-[11px] font-black text-[#FF7939]">${p.marketplace_fee}</td>
                      <td className="px-4 py-2 text-right font-mono text-[11px] font-black text-blue-400">${p.seller_amount}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${p.mercadopago_status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-white/5 text-white/20 border-white/5'}`}>{p.mercadopago_status || 'PEND'}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {p.mercadopago_payment_id && <a href={`https://www.mercadopago.com.ar/mshops/notifications-center/payment/${p.mercadopago_payment_id}`} target="_blank" className="text-white/20 hover:text-[#FF7939] transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left font-mono">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 font-sans">Coach ID</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-center font-sans">U. Pago</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 font-sans">Plan</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 text-right font-sans">Próx. Cobro</th>
                    <th className="px-4 py-3 text-[9px] font-black text-white/30 uppercase border-b border-white/5 font-sans">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredSubscriptions.map((sub: any, i: number) => {
                    const nextDate = sub.mercadopago_subscription_next_payment_date ? new Date(sub.mercadopago_subscription_next_payment_date) : null;
                    const isMora = nextDate && nextDate < new Date() && sub.status === 'active' && sub.plan_type !== 'free';
                    return (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 text-[11px] font-bold text-white/40">{sub.coach_id.substring(0,12)}...</td>
                        <td className="px-4 py-3 text-center text-[10px] text-white/30">{new Date(sub.started_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-[11px] font-black text-white uppercase tracking-tighter">{sub.plan_type}</td>
                        <td className="px-4 py-3 text-right text-[10px] text-white/60 font-bold">{nextDate ? nextDate.toLocaleDateString() : 'Pendiente'}</td>
                        <td className="px-4 py-3">
                          {isMora ? <span className="text-[9px] font-black bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md border border-orange-500/20 uppercase tracking-tighter">🚨 Mora Detectada</span> : <span className="text-[9px] font-bold text-white/20 uppercase">✅ Sin Novedades</span>}
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

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #080808; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}
