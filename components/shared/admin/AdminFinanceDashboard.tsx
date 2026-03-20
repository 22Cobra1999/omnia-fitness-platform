'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/supabase-client';
import { Loader2, TrendingUp, Users, CreditCard, AlertCircle, ExternalLink, Search, RefreshCw, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/auth-context';

export default function AdminFinanceDashboard() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Reconciliación de Pagos de Clientes
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

      // 2. Reconciliación de Suscripciones de Coaches
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

  const totalCommissions = payments
    ?.filter(p => p.mercadopago_status === 'approved')
    .reduce((sum, p) => sum + (Number(p.marketplace_fee) || 0), 0) || 0;

  const filteredPayments = payments.filter(p => 
    p.activities?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-[#FF7939] animate-spin" />
      <p className="text-white/40 font-mono text-sm">SINCRONIZANDO OMNIA FINANCE...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black italic tracking-tighter">OMNIA <span className="text-[#FF7939]">FINANCE</span></h1>
              <span className="bg-[#FF7939] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Admin Mode</span>
            </div>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">Consola de Conciliación de Pagos</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500/80 rounded-xl hover:bg-red-500/20 transition-all font-bold text-xs">
              <LogOut className="w-4 h-4" /> SALIR
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#111] border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group">
            <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-[#FF7939]/5 -rotate-12 group-hover:scale-110 transition-transform" />
            <p className="text-white/40 text-[10px] font-black uppercase mb-1">Comisiones Acumuladas</p>
            <p className="text-4xl font-black italic">${totalCommissions.toLocaleString()}</p>
          </div>
          <div className="bg-[#111] border border-white/10 p-6 rounded-[2rem]">
            <Users className="w-5 h-5 text-blue-500 mb-3" />
            <p className="text-white/40 text-[10px] font-black uppercase mb-1">Coaches Activos</p>
            <p className="text-4xl font-black italic">{subscriptions.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 p-6 rounded-[2rem]">
            <CreditCard className="w-5 h-5 text-green-500 mb-3" />
            <p className="text-white/40 text-[10px] font-black uppercase mb-1">Ventas Confirmadas</p>
            <p className="text-4xl font-black italic">{payments.filter(p => p.mercadopago_status === 'approved').length}</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, coach o actividad..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#FF7939]/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: COACH SUBSCRIPTIONS */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#FF7939] flex items-center gap-2">
              <span className="w-1 h-3 bg-[#FF7939] rounded-full"></span>
              Suscripciones Coaches
            </h2>
            <div className="space-y-3">
              {subscriptions.map((sub: any) => {
                const startDate = new Date(sub.started_at);
                const isFree = sub.plan_type === 'free';
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const isFreeExpired = isFree && startDate < threeMonthsAgo;
                const nextCharge = new Date(startDate);
                nextCharge.setMonth(nextCharge.getMonth() + 1);
                const isDelayed = sub.status === 'active' && nextCharge < new Date();

                return (
                  <div key={sub.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-white/30 font-bold uppercase mb-1">Coach ID: {sub.coach_id.substring(0,6)}</p>
                        <p className="text-sm font-black italic uppercase tracking-tighter">{sub.plan_type}</p>
                      </div>
                      <div className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${
                        sub.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {sub.status}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {isFreeExpired && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <p className="text-[9px] font-black italic uppercase">Límite 3 meses FREE agotado</p>
                        </div>
                      )}
                      {isDelayed && !isFree && (
                        <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <p className="text-[9px] font-black italic uppercase">Pago Mensual en Retraso</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: PAYMENTS TABLE */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#FF7939] flex items-center gap-2">
              <span className="w-1 h-3 bg-[#FF7939] rounded-full"></span>
              Historial de Ventas
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Actividad / Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Pagado</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Omnia Fee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Recibo MP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPayments.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-white/90 mb-0.5">{p.activities?.title || 'Consulta'}</p>
                          <p className="text-[10px] text-white/30 font-medium uppercase">{p.user_profiles?.full_name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-mono font-bold">${p.amount_paid}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#FF7939]">+${p.marketplace_fee}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {p.mercadopago_payment_id ? (
                            <a 
                              href={`https://www.mercadopago.com.ar/mshops/notifications-center/payment/${p.mercadopago_payment_id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[9px] font-black bg-white/5 px-2 py-1 rounded-lg hover:bg-white/10 transition-all uppercase"
                            >
                              Ver MP <ExternalLink className="w-2 h-2" />
                            </a>
                          ) : (
                            <span className="text-[9px] text-white/20 italic font-medium">No ID</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
