import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint de debugging para verificar la configuración de preferencias
 * 
 * Este endpoint ayuda a diagnosticar problemas con el botón deshabilitado
 * mostrando exactamente qué se está enviando a Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const totalAmount = parseFloat(activity.price?.toString() || '0');

    // Obtener credenciales del coach
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const adminSupabase = await getSupabaseAdmin();
    
    const { data: coachCredentials } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', activity.coach_id)
      .eq('oauth_authorized', true)
      .maybeSingle();

    if (!coachCredentials) {
      return NextResponse.json({ error: 'Coach no configurado' }, { status: 400 });
    }

    const coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    const clientEmail = session.user.email || '';

    // Obtener perfil del cliente
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('name, surname, phone, dni, document_type')
      .eq('id', session.user.id)
      .single();

    // Calcular comisión
    const { data: commissionResult } = await supabase
      .rpc('calculate_marketplace_commission', { amount: totalAmount });

    const marketplaceFee = parseFloat(commissionResult?.toString() || '0');
    const sellerAmount = totalAmount - marketplaceFee;

    // Crear preferencia de ejemplo (sin enviarla realmente)
    const preferenceData = {
      items: [
        {
          id: String(activityId),
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      ...(marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}),
      payer: {
        email: clientEmail,
        name: clientProfile?.name || 'Cliente',
        surname: clientProfile?.surname || 'OMNIA',
        ...(clientProfile?.phone ? { phone: { number: clientProfile.phone } } : {}),
        identification: clientProfile?.dni ? {
          type: clientProfile?.document_type || 'DNI',
          number: clientProfile.dni.toString()
        } : {
          type: 'DNI',
          number: '12345678'
        }
      },
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
        default_installments: 1
      },
      statement_descriptor: 'OMNIA',
      binary_mode: false,
      expires: false
    };

    // Retornar información de debugging
    return NextResponse.json({
      success: true,
      debug: {
        activity: {
          id: activity.id,
          title: activity.title,
          price: activity.price,
          totalAmount
        },
        payer: {
          email: clientEmail,
          name: clientProfile?.name || 'Cliente',
          surname: clientProfile?.surname || 'OMNIA',
          hasPhone: !!clientProfile?.phone,
          hasIdentification: !!preferenceData.payer.identification,
          identification: preferenceData.payer.identification
        },
        commission: {
          marketplaceFee,
          sellerAmount,
          hasMarketplaceFee: !!(marketplaceFee > 0 && sellerAmount > 0)
        },
        preference: preferenceData,
        coach: {
          hasCredentials: !!coachCredentials,
          userId: coachCredentials?.mercadopago_user_id,
          tokenPrefix: coachAccessToken.substring(0, 20) + '...'
        }
      }
    });

  } catch (error: any) {
    console.error('Error en debug-preference:', error);
    return NextResponse.json({
      error: 'Error en debugging',
      details: error.message
    }, { status: 500 });
  }
}

