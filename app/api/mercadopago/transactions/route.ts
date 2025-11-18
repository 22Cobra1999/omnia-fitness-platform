import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint para obtener transacciones de Mercado Pago
 * Permite ver transacciones del coach, integrador o comprador
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('account_type'); // 'coach', 'integrator', 'buyer'
    const coachId = searchParams.get('coach_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener transacciones desde la base de datos
    let query = supabase
      .from('banco')
      .select(`
        *,
        activity_enrollments!inner(
          id,
          activity_id,
          client_id,
          status,
          activities(
            id,
            title,
            price,
            coach_id
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtrar por tipo de cuenta
    if (accountType === 'coach' && coachId) {
      // Transacciones donde el coach es el vendedor
      query = query.eq('activity_enrollments.activities.coach_id', coachId);
    } else if (accountType === 'integrator') {
      // Transacciones donde hay marketplace_fee (OMNIA recibe comisión)
      query = query.gt('marketplace_fee', 0);
    } else if (accountType === 'buyer') {
      // Transacciones del cliente autenticado
      query = query.eq('activity_enrollments.client_id', session.user.id);
    }

    const { data: transactions, error: dbError } = await query;

    if (dbError) {
      console.error('Error obteniendo transacciones:', dbError);
      return NextResponse.json({ error: 'Error obteniendo transacciones' }, { status: 500 });
    }

    // Enriquecer con datos de Mercado Pago si hay payment_id
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (tx: any) => {
        if (!tx.mercadopago_payment_id) {
          return {
            ...tx,
            mercadoPagoDetails: null
          };
        }

        try {
          // Determinar qué access token usar
          let accessToken: string;
          
          if (accountType === 'integrator') {
            // Usar token del integrador (OMNIA)
            accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
          } else if (tx.coach_access_token_encrypted) {
            // Desencriptar token del coach
            accessToken = decrypt(tx.coach_access_token_encrypted);
          } else {
            // Fallback al token del integrador
            accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
          }

          if (!accessToken) {
            return {
              ...tx,
              mercadoPagoDetails: null
            };
          }

          const client = new MercadoPagoConfig({
            accessToken: accessToken,
            options: { timeout: 5000 }
          });

          const payment = new Payment(client);
          const paymentDetails = await payment.get({ id: tx.mercadopago_payment_id });

          // Extraer información relevante
          return {
            ...tx,
            mercadoPagoDetails: {
              id: paymentDetails.id,
              status: paymentDetails.status,
              status_detail: paymentDetails.status_detail,
              transaction_amount: paymentDetails.transaction_amount,
              fee_details: paymentDetails.fee_details,
              transaction_details: paymentDetails.transaction_details,
              // Información de split payment
              marketplace_fee_received: paymentDetails.fee_details?.find(
                (fee: any) => fee.type === 'marketplace_fee'
              )?.amount || 0,
              seller_amount_received: paymentDetails.transaction_details?.net_received_amount || 0,
              date_created: paymentDetails.date_created,
              date_approved: paymentDetails.date_approved
            }
          };
        } catch (error: any) {
          console.error(`Error obteniendo detalles de pago ${tx.mercadopago_payment_id}:`, error);
          return {
            ...tx,
            mercadoPagoDetails: null,
            error: error.message
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      accountType,
      transactions: enrichedTransactions,
      summary: {
        total: enrichedTransactions.length,
        totalAmount: enrichedTransactions.reduce((sum, tx) => sum + (tx.amount_paid || 0), 0),
        totalMarketplaceFee: enrichedTransactions.reduce((sum, tx) => sum + (tx.marketplace_fee || 0), 0),
        totalSellerAmount: enrichedTransactions.reduce((sum, tx) => sum + (tx.seller_amount || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('Error en transactions endpoint:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}

