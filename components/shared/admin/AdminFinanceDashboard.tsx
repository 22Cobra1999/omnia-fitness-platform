'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, TrendingUp, Users, CreditCard, AlertCircle, 
  ExternalLink, Search, RefreshCw, LogOut, CheckCircle2, 
  Clock, XCircle, ChevronDown, ChevronUp, BarChart3, Wallet,
  ShieldCheck, ArrowRightLeft, Target, Award
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function AdminFinanceDashboard() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'coaches'>('sales');
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/finance/data');
      const json = await response.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      console.error('Error cargando dashboard finance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-[#FF7939] animate-spin" />
      <p className="text-white/40 font-mono text-[10px] tracking-[0.3em] uppercase">Sincronizando Bóveda OMNIA...</p>
    </div>
  );

  const { banco, plans, profiles, activities, credentials } = data;

  // 1. Enriquecer Ventas (Client + Coach)
  const enrichedSales = banco?.map((p: any) => {
    const client = profiles?.find((u: any) => u.id === p.client_id);
    const coachCred = credentials?.find((c: any) => c.mercadopago_user_id === p.coach_mercadopago_user_id);
    const coach = profiles?.find((u: any) => u.id === coachCred?.coach_id);
    const activity = activities?.find((a: any) => a.id === p.activity_id);
    
    return {
      ...p,
      client_name: client?.full_name || 'Anónimo',
      coach_name: coach?.full_name || 'Desconocido',
      activity_title: activity?.title || p.concept || 'Consulta'
    };
  });

  // 2. Agrupar Suscripciones por Coach
  const groupedCoaches = plans?.reduce((acc: any, p: any) => {
    if (!acc[p.coach_id]) {
      const profile = profiles?.find((u: any) => u.id === p.coach_id);
      const cred = credentials?.find((c: any) => c.coach_id === p.coach_id);
      acc[p.coach_id] = {
        coach_id: p.coach_id,
        name: profile?.full_name || 'Coach Desconocido',
        email: profile?.email || '',
        current_mp: cred?.mercadopago_user_id || 'SIN VINCULAR',
        history: [],
        total_paid: 0,
        active_plan: p.plan_type,
        status: p.status,
        last_payment: p.started_at,
        next_payment: p.mercadopago_subscription_next_payment_date
      };
    }
    
    // Sumar montos según plan (Aproximación para historial)
    const monto = p.plan_type === 'basico' ? 12000 : p.plan_type === 'black' ? 22000 : p.plan_type === 'premium' ? 35000 : 0;
    if (p.status === 'active' || p.status === 'expired') acc[p.coach_id].total_paid += monto;
    
    acc[p.coach_id].history.push(p);
    return acc;
  }, {});

  const coachList = Object.values(groupedCoaches || {});

  const filteredSales = enrichedSales?.filter((s: any) => 
    s.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.coach_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.activity_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoaches = coachList.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-[#FF7939]/30">
      
      {/* HEADER SLIM */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center whitespace-nowrap overflow-x-auto gap-4">
          <div className="flex items-center gap-6 min-w-fit">
            <h1 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
              <span className="text-[#FF7939]">OMNIA</span> 
              <span className="text-white/40 font-light truncate">/ BÓVEDA</span>
            </h1>
            <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <button onClick={() => setActiveTab('sales')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'sales' ? 'bg-[#FF7939] text-black shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}>Ventas Productos</button>
              <button onClick={() => setActiveTab('coaches')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'coaches' ? 'bg-[#FF7939] text-black shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}>Suscripciones Coaches</button>
            </nav>
          </div>

          <div className="flex items-center gap-4 min-w-fit">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[#FF7939] transition-colors" />
              <input type="text" placeholder="Buscar Cliente, Coach, ID..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-[11px] w-[300px] focus:outline-none focus:border-[#FF7939]/40 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors group"><RefreshCw className={`w-4 h-4 text-white/40 group-hover:text-[#FF7939] ${loading ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => signOut()} className="px-3 py-1.5 bg-red-500/10 text-red-500/80 rounded-lg hover:bg-red-500/20 transition-all font-black text-[10px] uppercase tracking-wider">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        
        {/* KPI CARDS (CON SUBDIVISIÓN POR PLAN) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-3xl rounded-full -translate-y-12 translate-x-12"></div>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Caja Omnia Bruta</p>
            <p className="text-3xl font-black italic tracking-tighter mb-2 text-[#FF7939]">${enrichedSales?.filter((s:any) => s.mercadopago_status === 'approved').reduce((a:any, b:any) => a + (Number(b.marketplace_fee)||0), 0).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Mes en curso</p>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Distribución de Planes</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p className="text-[11px] font-bold text-white/40">BLACK: <span className="text-white font-black">{plans?.filter((p:any) => p.plan_type === 'black' && p.status === 'active').length}</span></p>
              <p className="text-[11px] font-bold text-white/40">PREMIUM: <span className="text-white font-black">{plans?.filter((p:any) => p.plan_type === 'premium' && p.status === 'active').length}</span></p>
              <p className="text-[11px] font-bold text-white/40">BASICO: <span className="text-white font-black">{plans?.filter((p:any) => p.plan_type === 'basico' && p.status === 'active').length}</span></p>
              <p className="text-[11px] font-bold text-white/40">FREE: <span className="text-white font-black">{plans?.filter((p:any) => p.plan_type === 'free' && p.status === 'active').length}</span></p>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl border-l-[#FF7939] border-l-2">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Alertas en Mora</p>
            <p className="text-3xl font-black italic tracking-tighter text-orange-500">{coachList.filter((c:any) => c.status === 'active' && c.next_payment && new Date(c.next_payment) < new Date() && c.active_plan !== 'free').length}</p>
            <p className="text-[10px] font-bold text-orange-500/40 uppercase tracking-tighter">Pagos Pendientes</p>
          </div>

          <div className="bg-[#111] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
               <Award className="w-6 h-6 text-blue-500" />
             </div>
             <div>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-0.5">Retención Total</p>
                <p className="text-xl font-black italic tracking-tighter">{coachList.filter((c:any) => c.status === 'active').length} <span className="text-xs text-white/20 not-italic">ACTIVOS</span></p>
             </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="overflow-x-auto">
            {activeTab === 'sales' ? (
              <table className="w-full text-left">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5">Operación / ID</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5">De (Cliente)</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-center">Ruta Fondos</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5">A (Coach)</th>
                    <th className="px-5 py-4 text-[9px] font-black text-orange-500 uppercase border-b border-white/5 text-right font-mono tracking-tighter"> FEE OMNIA</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-center">Status MP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredSales?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-4">
                         <div className="text-[11px] font-black text-white italic mb-1 uppercase tracking-tighter truncate max-w-[200px]">{p.activity_title}</div>
                         <div className="text-[9px] font-mono text-white/20 whitespace-nowrap">ID: {p.mercadopago_payment_id || '---'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[11px] font-bold text-white group-hover:text-[#FF7939] transition-colors">{p.client_name}</div>
                        <div className="text-[9px] font-mono text-white/30">{new Date(p.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                         <ArrowRightLeft className="w-4 h-4 text-white/10 inline-block" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[11px] font-black text-white/70 italic uppercase">{p.coach_name}</div>
                        <div className="text-[9px] font-mono text-blue-500/60 font-black">+${p.seller_amount}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <div className="text-[12px] font-black text-orange-500 italic tracking-tighter">${p.marketplace_fee}</div>
                         <div className="text-[9px] font-bold text-white/10 uppercase italic">S/ Total de ${p.amount_paid}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                         <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${p.mercadopago_status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-white/20'}`}>{p.mercadopago_status || 'PEND'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#111]">
                  <tr>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5">Coach / Cta actual</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-center">Plan</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-center">U. Pago / Próx</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-right font-mono">T. Pagado</th>
                    <th className="px-5 py-4 text-[9px] font-black text-white/40 uppercase border-b border-white/5 text-center">Historial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredCoaches?.map((c: any) => (
                    <React.Fragment key={c.coach_id}>
                      <tr className={`hover:bg-white/[0.03] transition-all cursor-pointer ${expandedCoach === c.coach_id ? 'bg-white/[0.04]' : ''}`} onClick={() => setExpandedCoach(expandedCoach === c.coach_id ? null : c.coach_id)}>
                        <td className="px-5 py-4">
                           <div className="text-[11px] font-black text-white uppercase italic tracking-tighter mb-1">{c.name}</div>
                           <div className="text-[9px] font-mono text-white/20 tracking-widest underline decoration-orange-500/40 truncate max-w-[150px]">MP: {c.current_mp}</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black italic uppercase tracking-tighter ${c.status === 'active' ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-red-500/20 text-red-500'}`}>{c.active_plan}</span>
                        </td>
                        <td className="px-5 py-4 text-center font-mono">
                           <div className="text-[10px] text-white/60 mb-1">{new Date(c.last_payment).toLocaleDateString()}</div>
                           <div className="text-[11px] font-black text-[#FF7939] tracking-tighter">{c.next_payment ? new Date(c.next_payment).toLocaleDateString() : 'EL DÍA 1'}</div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <div className="text-sm font-black italic tracking-tighter text-blue-500">${c.total_paid.toLocaleString()}</div>
                           <div className="text-[9px] font-mono text-white/10 uppercase">{c.history.length} Pagos Totales</div>
                        </td>
                        <td className="px-5 py-4 text-center">
                           {expandedCoach === c.coach_id ? <ChevronUp className="w-4 h-4 text-[#FF7939] inline shadow-glow" /> : <ChevronDown className="w-4 h-4 text-white/20 inline" />}
                        </td>
                      </tr>
                      {expandedCoach === c.coach_id && (
                        <tr className="bg-[#050505]">
                          <td colSpan={5} className="p-0">
                            <div className="px-8 py-6 border-l-2 border-[#FF7939] animate-in slide-in-from-top-4 duration-300">
                               <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Línea de Tiempo de Suscripción</p>
                               <div className="grid grid-cols-1 gap-2">
                                  {c.history.map((h: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl hover:border-white/20 transition-all group">
                                       <div className="flex items-center gap-4">
                                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-glow"></div>
                                          <div>
                                             <p className="text-[10px] font-black text-white/80 uppercase tracking-tighter leading-none mb-1">Pago #{c.history.length - idx} - {h.plan_type}</p>
                                             <p className="text-[9px] font-mono text-white/20">Registrado el {new Date(h.started_at).toLocaleDateString()}</p>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-6">
                                          <div className="text-right">
                                             <p className="text-[10px] font-black text-white/40 uppercase mb-0.5 font-sans tracking-widest text-[8px]">CTA MP Asociada</p>
                                             <p className="text-[11px] font-mono text-white/80 group-hover:text-[#FF7939] transition-colors">{h.id_cuenta_mp || 'Desconocida'}</p>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[10px] font-black text-white/40 uppercase mb-0.5 font-sans tracking-widest text-[8px]">ESTADO</p>
                                             <p className={`text-[10px] font-black uppercase ${h.status === 'active' ? 'text-green-500' : 'text-red-500/60'}`}>{h.status}</p>
                                          </div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;0,900;1,900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #080808; margin: 0; }
        .shadow-glow { filter: drop-shadow(0 0 8px #FF7939); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        .animate-in { animation: slideIn 0.3s ease-out forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
