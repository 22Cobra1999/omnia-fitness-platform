import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Crea un enrollment y una preferencia de pago con Mercado Pago Split Payment
 * Reemplaza el flujo directo con el flujo de Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const { activityId, paymentMethod, notes } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: 'activityId es requerido' }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const clientId = session.user.id;
    const clientEmail = session.user.email || '';
    
    // Obtener información adicional del cliente si está disponible
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('name, surname')
      .eq('id', clientId)
      .single();

    // Permitir múltiples compras - eliminada validación de compra única
    // 1. Obtener datos de la actividad
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id, type')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
    }

    const coachId = activity.coach_id;
    const totalAmount = parseFloat(activity.price.toString());
    
    // Validar que el monto sea válido y mayor a 0
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ 
        error: 'El precio de la actividad debe ser mayor a 0',
        details: `Precio recibido: ${activity.price}`
      }, { status: 400 });
    }

    // 3. Verificar que el coach tenga Mercado Pago autorizado
    // El coach DEBE tener Mercado Pago configurado para poder vender
    // Usar service role para leer credenciales del coach (RLS puede bloquear acceso del cliente)
    const { getSupabaseAdmin } = await import('@/lib/config/db');
    const adminSupabase = await getSupabaseAdmin();
    
    const { data: coachCredentials, error: credsError } = await adminSupabase
      .from('coach_mercadopago_credentials')
      .select('*')
      .eq('coach_id', coachId)
      .eq('oauth_authorized', true)
      .maybeSingle();

    if (credsError) {
      console.error('Error consultando credenciales del coach:', credsError);
      return NextResponse.json({ 
        error: 'Error al verificar credenciales del coach',
        details: credsError.message
      }, { status: 500 });
    }

    if (!coachCredentials) {
      console.log('Coach no tiene Mercado Pago configurado. Coach ID:', coachId);
      return NextResponse.json({ 
        error: 'El coach de esta actividad no ha configurado Mercado Pago. Por favor, contacta al coach para que configure su cuenta de Mercado Pago antes de realizar la compra.',
        requiresCoachSetup: true
      }, { status: 400 });
    }

    // Usar credenciales del coach
    const mercadopagoUserId = coachCredentials.mercadopago_user_id;

    // 4. Calcular comisión de OMNIA
    const { data: commissionResult, error: commissionError } = await supabase
      .rpc('calculate_marketplace_commission', { 
        amount: totalAmount 
      });

    if (commissionError) {
      console.error('Error calculando comisión:', commissionError);
      return NextResponse.json({ error: 'Error calculando comisión' }, { status: 500 });
    }

    const marketplaceFee = parseFloat(commissionResult?.toString() || '0');
    const sellerAmount = totalAmount - marketplaceFee;
    
    // Validar que la comisión no sea mayor que el monto total
    if (marketplaceFee >= totalAmount) {
      console.error('❌ Error: La comisión del marketplace es mayor o igual al monto total');
      return NextResponse.json({ 
        error: 'Error en el cálculo de comisión',
        details: `Comisión: ${marketplaceFee}, Monto total: ${totalAmount}`
      }, { status: 500 });
    }

    // 5. NO crear enrollment todavía - se creará solo cuando el pago sea exitoso
    // Guardamos activity_id y client_id en banco para crear el enrollment después
    console.log('ℹ️ No se crea enrollment todavía - se creará cuando el pago sea aprobado');

    // 6. Desencriptar access token del coach
    let coachAccessToken: string;
    try {
      coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
    } catch (error) {
      console.error('Error desencriptando token:', error);
      return NextResponse.json({ error: 'Error procesando credenciales del coach' }, { status: 500 });
    }

    // Identificar tipo de token para logging y debugging
    const isTestToken = (token: string) => token.startsWith('TEST-');
    const isProductionToken = (token: string) => token.startsWith('APP_USR-');
    
    // En modo test, si marketplace_fee causa problemas, podemos intentar sin split payment temporalmente
    const isTestMode = isTestToken(coachAccessToken) || isTestToken(process.env.MERCADOPAGO_ACCESS_TOKEN || '');
    console.log('🧪 Modo de prueba detectado:', isTestMode);
    
    // Lista de user_ids de cuentas de prueba conocidas (para logging y optimizaciones)
    const TEST_USER_IDS = [
      '2995219181', // ronaldinho (coach de prueba)
      '2992707264', // totti1 (cliente de prueba)
      '2995219179'  // omniav1 (marketplace de prueba)
    ];
    
    const coachTokenType = isTestToken(coachAccessToken) ? 'PRUEBA (TEST-)' : 
                          isProductionToken(coachAccessToken) ? 'PRODUCCIÓN (APP_USR-)' : 
                          'DESCONOCIDO';
    
    const isTestUser = mercadopagoUserId && TEST_USER_IDS.includes(mercadopagoUserId.toString());
    
    // Log del tipo de token para debugging (sin mostrar el token completo por seguridad)
    console.log('🔑 Tipo de token del coach:', coachTokenType);
    console.log('🔑 User ID del coach:', mercadopagoUserId);
    console.log('🔑 Es cuenta de prueba conocida:', isTestUser);
    console.log('🔑 Primeros caracteres del token:', coachAccessToken.substring(0, 10) + '...');
    
    // Permitir tanto tokens de prueba como de producción
    // Para producción: usar tokens de producción (APP_USR-...)
    // Para testing: usar tokens de prueba (TEST-...) o cuentas de prueba conocidas
    if (isProductionToken(coachAccessToken) && isTestUser) {
      console.log('ℹ️ Token de producción detectado con cuenta de prueba conocida. Usando token del coach.');
    } else if (isProductionToken(coachAccessToken)) {
      console.log('✅ Token de producción detectado. Modo producción activado.');
    } else if (isTestToken(coachAccessToken)) {
      console.log('✅ Token de prueba detectado. Modo testing activado.');
    }

    // 7. Crear preferencia de pago con Mercado Pago
    console.log('🔑 Access Token del Coach:', coachTokenType);
    console.log('💰 Monto total:', totalAmount);
    console.log('💵 Comisión marketplace:', marketplaceFee);
    console.log('👤 Monto para vendedor:', sellerAmount);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');
    
    // Construir URLs de retorno - deben ser URLs completas y válidas
    // Mercado Pago requiere que back_urls.success esté definido si usamos auto_return
    const backUrls = {
      success: `${appUrl}/payment/success`,
      failure: `${appUrl}/payment/failure`,
      pending: `${appUrl}/payment/pending`
    };
    
    console.log('🔗 URLs de retorno:', JSON.stringify(backUrls, null, 2));
    console.log('🌐 App URL:', appUrl);
    
    // Construir preferencia - NO usar auto_return por ahora para evitar el error
    // IMPORTANTE: Para split payment en modo de prueba, todas las partes deben ser de prueba
    // Si el coach tiene token de producción pero es cuenta de prueba conocida, 
    // Mercado Pago puede rechazar el pago si detecta mezcla de entornos
    
    // Crear external_reference único para identificar esta compra
    // Formato: pending_activityId_clientId_timestamp
    const externalReference = `pending_${activityId}_${clientId}_${Date.now()}`;

    const preferenceData: any = {
      items: [
        {
          title: activity.title,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: 'ARS'
        }
      ],
      // IMPORTANTE: marketplace_fee solo funciona si el coach tiene cuenta de marketplace configurada
      // En modo test, puede causar que el botón se deshabilite si no está correctamente configurado
      ...(marketplaceFee > 0 && sellerAmount > 0 ? { marketplace_fee: marketplaceFee } : {}),
      external_reference: externalReference,
      back_urls: {
        success: backUrls.success,
        failure: backUrls.failure,
        pending: backUrls.pending
      },
      notification_url: `${appUrl}/api/payments/webhook`,
      // Configurar métodos de pago: permitir todos los métodos incluyendo tarjetas
      // NOTA: No se puede excluir account_money según la API de Mercado Pago
      // Las tarjetas aparecerán automáticamente si el usuario no tiene suficiente saldo
      payment_methods: {
        excluded_payment_methods: [], // No excluir ningún método (account_money no se puede excluir)
        excluded_payment_types: [], // Permitir todos los tipos de pago (tarjetas, transferencias, etc.)
        installments: 12, // Permitir hasta 12 cuotas para tarjetas
        default_installments: 1 // Por defecto 1 cuota
      },
      // Asegurar que las tarjetas estén disponibles y habilitadas
      statement_descriptor: 'OMNIA',
      // Habilitar binarios para mejor experiencia de pago
      binary_mode: false,
      // Información del comprador (requerida para habilitar el botón de pago)
      payer: {
        email: clientEmail,
        name: clientProfile?.name || '',
        surname: clientProfile?.surname || ''
      },
      // Configuraciones adicionales para asegurar que el botón esté habilitado
      expires: false, // No expirar la preferencia
      // Configurar locale directamente (no en metadata)
      // El locale se pasa en la URL del init_point, no en la preferencia
      auto_return: 'approved' // Redirigir automáticamente cuando se apruebe
    };
    
    // Determinar qué token usar para crear la preferencia
    // Para producción: usar siempre el token del coach
    // Para testing: si el coach tiene token de producción pero es cuenta de prueba, usar token de prueba del marketplace
    let tokenToUseForPreference = coachAccessToken;
    
    // Solo usar token del marketplace si estamos en modo testing y hay mezcla de entornos
    if (isProductionToken(coachAccessToken) && isTestUser) {
      console.log('⚠️ ADVERTENCIA: Coach tiene token de producción pero es cuenta de prueba.');
      console.log('⚠️ Mercado Pago puede rechazar el pago si detecta mezcla de entornos.');
      console.log('💡 Intentando usar Access Token de prueba del marketplace...');
      
      // Usar el Access Token de prueba del marketplace en lugar del token del coach
      const marketplaceTestToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
      if (marketplaceTestToken && isTestToken(marketplaceTestToken)) {
        tokenToUseForPreference = marketplaceTestToken;
        console.log('✅ Usando Access Token de prueba del marketplace para split payment.');
      } else {
        console.warn('⚠️ No se encontró Access Token de prueba del marketplace. Usando token del coach.');
        console.warn('⚠️ Esto puede causar errores si Mercado Pago detecta mezcla de entornos.');
      }
    } else {
      // Para producción o tokens de prueba del coach, usar el token del coach directamente
      console.log('✅ Usando Access Token del coach para crear la preferencia.');
    }
    
    // Crear cliente de Mercado Pago con el token apropiado
    const client = new MercadoPagoConfig({
      accessToken: tokenToUseForPreference,
      options: { timeout: 5000 }
    });

    const preference = new Preference(client);
    
    // No usar auto_return por ahora - el cliente será redirigido manualmente usando init_point

    console.log('📋 Creando preferencia con datos:', JSON.stringify(preferenceData, null, 2));
    console.log('🔑 Token usado para crear preferencia:', isTestToken(tokenToUseForPreference) ? 'PRUEBA (TEST-...)' : 'PRODUCCIÓN (APP_USR-...)');
    console.log('💳 Métodos de pago configurados:', JSON.stringify(preferenceData.payment_methods, null, 2));
    console.log('👤 Información del payer:', JSON.stringify(preferenceData.payer, null, 2));
    console.log('💰 Monto total:', totalAmount);
    console.log('💵 Comisión marketplace:', marketplaceFee);
    console.log('👤 Monto para vendedor:', sellerAmount);

    let preferenceResponse;
    try {
      preferenceResponse = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada exitosamente:', preferenceResponse.id);
      
      // Agregar locale a la URL del init_point para evitar warnings de BRICKS
      let initPoint = preferenceResponse.init_point || preferenceResponse.sandbox_init_point || '';
      if (initPoint && !initPoint.includes('locale=')) {
        initPoint = `${initPoint}${initPoint.includes('?') ? '&' : '?'}locale=es-AR`;
      }
      
      console.log('🔗 Init Point original:', preferenceResponse.init_point || preferenceResponse.sandbox_init_point);
      console.log('🔗 Init Point con locale:', initPoint);
      console.log('📊 Respuesta completa de Mercado Pago:', JSON.stringify({
        id: preferenceResponse.id,
        init_point: preferenceResponse.init_point,
        sandbox_init_point: preferenceResponse.sandbox_init_point,
        client_id: preferenceResponse.client_id,
        collector_id: preferenceResponse.collector_id,
        operation_type: preferenceResponse.operation_type,
        date_created: preferenceResponse.date_created,
        items: preferenceResponse.items,
        payer: preferenceResponse.payer,
        payment_methods: preferenceResponse.payment_methods,
        marketplace_fee: preferenceResponse.marketplace_fee
      }, null, 2));
    } catch (error: any) {
      console.error('❌ Error creando preferencia:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Error creando preferencia de pago',
        details: error.message || 'Error desconocido',
        fullError: error
      }, { status: 500 });
    }

    // 8. Guardar en banco SIN enrollment_id (se creará cuando el pago sea aprobado)
    // Guardamos activity_id y client_id para poder crear el enrollment después
    // externalReference ya fue creado arriba para la preferencia
    const { error: bancoError } = await supabase.from('banco').insert({
      enrollment_id: null, // Se asignará cuando se cree el enrollment
      activity_id: activityId,
      client_id: clientId,
      amount_paid: totalAmount,
      payment_status: 'pending',
      payment_method: 'mercadopago',
      currency: 'ARS',
      mercadopago_preference_id: preferenceResponse.id,
      marketplace_fee: marketplaceFee,
      seller_amount: sellerAmount,
      coach_mercadopago_user_id: mercadopagoUserId,
      coach_access_token_encrypted: coachCredentials.access_token_encrypted,
      external_reference: externalReference
    });

    if (bancoError) {
      console.error('Error guardando en banco:', bancoError);
      return NextResponse.json({ 
        error: 'Error guardando información de pago',
        details: bancoError.message
      }, { status: 500 });
    }

    console.log('✅ Información de pago guardada en banco (sin enrollment todavía)');

    // 9. NO duplicar detalles del programa todavía - se hará cuando se cree el enrollment

    // Usar initPoint con locale si fue modificado
    const finalInitPoint = initPoint || preferenceResponse.init_point || preferenceResponse.sandbox_init_point || '';
    
    const responseData = {
      success: true,
      preferenceId: preferenceResponse.id,
      initPoint: finalInitPoint, // URL para redirigir al checkout (con locale)
      marketplaceFee,
      sellerAmount,
      externalReference // Para referencia
    };
    
    console.log('✅ Respuesta exitosa:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error en create-with-mercadopago:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 });
  }
}


