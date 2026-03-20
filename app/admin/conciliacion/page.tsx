import { createClient } from '@/lib/supabase/supabase-server';

export default async function ReconciliationDashboard() {
  const supabase = await createClient();
  
  // 1. Obtener Reconciliación de Pagos (Clientes -> Coaches/Omnia)
  const { data: payments } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(50);

  // 2. Obtener Reconciliación de Suscripciones (Coaches -> Omnia)
  const { data: subscriptions } = await supabase
    .from('planes_uso_coach')
    .select(`
      coach_id,
      started_at,
      plan_type,
      status,
      coach_mercadopago_credentials (mercadopago_user_id)
    `)
    .order('started_at', { ascending: false });

  // 3. Cálculos de Billetera Omnia (Comisiones del mes actual)
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0,0,0,0);
  
  const totalCommissions = payments
    ?.filter(p => new Date(p.created_at) >= currentMonthStart && p.mercadopago_status === 'approved')
    .reduce((sum, p) => sum + (Number(p.marketplace_fee) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">OMNIA <span className="text-[#FF7939]">FINANCE</span></h1>
            <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Panel de Control y Conciliación</p>
          </div>
          <div className="bg-[#FF7939]/10 border border-[#FF7939]/20 p-4 rounded-2xl text-right">
            <span className="text-xs text-[#FF7939] font-bold uppercase block mb-1">Comisiones Mes Actual</span>
            <span className="text-3xl font-black italic">${totalCommissions.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECCIÓN 1: SUSCRIPCIONES DE COACHES */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FF7939] rounded-full"></span>
              Estado de Coaches
            </h2>
            <div className="space-y-4">
              {subscriptions?.map((sub: any) => {
                const startDate = new Date(sub.started_at);
                const isFree = sub.plan_type === 'free';
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const isFreeExpired = isFree && startDate < threeMonthsAgo;
                const nextCharge = new Date(startDate);
                nextCharge.setMonth(nextCharge.getMonth() + 1);
                const isDelayed = sub.status === 'active' && nextCharge < new Date();

                return (
                  <div key={sub.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-[#FF7939]/30 transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{sub.coach_id.substring(0,8)}...</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          sub.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                         }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="uppercase font-bold text-white/60">{sub.plan_type}</span>
                        <span>•</span>
                        <span>Desde: {startDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs">
                      {isFreeExpired ? (
                        <span className="text-red-500 font-bold italic underline">¡FREE 3 MESES AGOTADO!</span>
                      ) : isDelayed ? (
                        <span className="text-orange-500 font-bold">RETRASO EN PAGO</span>
                      ) : (
                        <span className="text-white/30 italic">Al día</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECCIÓN 2: VENTAS RECIENTES */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              Movimientos de Ventas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-white/30 border-b border-white/5">
                    <th className="pb-4 font-medium uppercase text-[10px]">Producto / Cliente</th>
                    <th className="pb-4 font-medium uppercase text-[10px]">Total</th>
                    <th className="pb-4 font-medium uppercase text-[10px]">OMNIA</th>
                    <th className="pb-4 font-medium uppercase text-[10px]">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments?.map((p: any, i: number) => (
                    <tr key={i} className="group hover:bg-white/[0.02]">
                      <td className="py-4">
                        <div className="font-bold text-white/90">{p.activities?.title || 'Consulta'}</div>
                        <div className="text-[10px] text-white/40 uppercase">{p.user_profiles?.full_name}</div>
                      </td>
                      <td className="py-4 font-mono">${p.amount_paid}</td>
                      <td className="py-4 text-[#FF7939] font-bold">+${p.marketplace_fee}</td>
                      <td className="py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          p.mercadopago_status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-white/10 text-white/30'
                        }`}>
                          {p.mercadopago_status || 'PEND'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>

      <style jsx global>{\`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      \`}</style>
    </div>
  );
}
