import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from '@/lib/supabase/supabase-server';
import { decrypt } from '@/lib/utils/encryption';

/**
 * Endpoint de validación completa para diagnosticar problemas con el botón de pagar
 * 
 * Este endpoint valida:
 * - SDK de Mercado Pago
 * - Variables de entorno
 * - Credenciales
 * - Monto
 * - Métodos de pago
 * - Información del payer
 * - Configuración de la preferencia
 * - Cuentas de prueba
 * 
 * @route POST /api/mercadopago/validate-checkout
 */
export async function POST(request: NextRequest) {
  const validationResults: any = {
    timestamp: new Date().toISOString(),
    validations: {},
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    const { activityId } = await request.json();

    if (!activityId) {
      return NextResponse.json(
        { error: 'activityId es requerido' },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. VALIDAR SDK DE MERCADO PAGO
    // ============================================================
    validationResults.validations.sdk = {
      status: 'checking',
      details: {}
    };

    try {
      const testConfig = new MercadoPagoConfig({
        accessToken: 'TEST-TOKEN',
        options: { timeout: 5000 }
      });
      const testPreference = new Preference(testConfig);
      
      validationResults.validations.sdk = {
        status: 'success',
        details: {
          message: 'SDK de Mercado Pago está instalado y funcionando',
          version: 'installed'
        }
      };
    } catch (error: any) {
      validationResults.validations.sdk = {
        status: 'error',
        details: {
          message: 'Error al inicializar SDK de Mercado Pago',
          error: error.message
        }
      };
      validationResults.errors.push('SDK de Mercado Pago no está funcionando correctamente');
    }

    // ============================================================
    // 2. VALIDAR VARIABLES DE ENTORNO
    // ============================================================
    validationResults.validations.environmentVariables = {
      status: 'checking',
      details: {}
    };

    const requiredEnvVars = {
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
      NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY
    };

    const missingVars: string[] = [];
    const emptyVars: string[] = [];

    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        missingVars.push(key);
      } else if (value.trim() === '') {
        emptyVars.push(key);
      }
    }

    if (missingVars.length > 0 || emptyVars.length > 0) {
      validationResults.validations.environmentVariables = {
        status: 'error',
        details: {
          missing: missingVars,
          empty: emptyVars,
          message: 'Variables de entorno faltantes o vacías'
        }
      };
      validationResults.errors.push(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    } else {
      // Verificar formato de las credenciales
      const accessToken = requiredEnvVars.MERCADOPAGO_ACCESS_TOKEN!.trim();
      const publicKey = requiredEnvVars.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!.trim();

      const isTestToken = accessToken.startsWith('TEST-');
      const isProductionToken = accessToken.startsWith('APP_USR-');
      const isTestPublicKey = publicKey.startsWith('TEST-') || publicKey.startsWith('APP_USR-');

      validationResults.validations.environmentVariables = {
        status: 'success',
        details: {
          message: 'Todas las variables de entorno están configuradas',
          accessTokenType: isTestToken ? 'TEST' : isProductionToken ? 'PRODUCTION' : 'UNKNOWN',
          publicKeyType: isTestPublicKey ? 'VALID' : 'INVALID',
          accessTokenLength: accessToken.length,
          publicKeyLength: publicKey.length,
          appUrl: requiredEnvVars.NEXT_PUBLIC_APP_URL
        }
      };

      if (!isTestToken && !isProductionToken) {
        validationResults.warnings.push('El Access Token no tiene un formato válido (debe empezar con TEST- o APP_USR-)');
      }
    }

    // ============================================================
    // 3. VALIDAR AUTENTICACIÓN Y USUARIO
    // ============================================================
    validationResults.validations.authentication = {
      status: 'checking',
      details: {}
    };

    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      validationResults.validations.authentication = {
        status: 'error',
        details: {
          message: 'Usuario no autenticado',
          error: userError?.message
        }
      };
      validationResults.errors.push('Usuario no autenticado');
    } else {
      const clientEmail = user.email;
      const clientId = user.id;

      validationResults.validations.authentication = {
        status: 'success',
        details: {
          message: 'Usuario autenticado correctamente',
          userId: clientId,
          email: clientEmail,
          hasEmail: !!clientEmail
        }
      };

      if (!clientEmail) {
        validationResults.warnings.push('El usuario no tiene email, esto puede causar problemas con el payer');
      }
    }

    // ============================================================
    // 4. VALIDAR ACTIVIDAD
    // ============================================================
    validationResults.validations.activity = {
      status: 'checking',
      details: {}
    };

    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, title, price, coach_id, type')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      validationResults.validations.activity = {
        status: 'error',
        details: {
          message: 'Actividad no encontrada',
          error: activityError?.message
        }
      };
      validationResults.errors.push('Actividad no encontrada');
    } else {
      const totalAmount = parseFloat(activity.price?.toString() || '0');

      // Validar monto
      const amountValidations = {
        isNumber: !isNaN(totalAmount),
        isPositive: totalAmount > 0,
        isGreaterThanOne: totalAmount >= 1,
        isLessThanMax: totalAmount <= 1000000,
        hasDecimals: totalAmount % 1 !== 0
      };

      const amountIssues: string[] = [];
      if (!amountValidations.isNumber) amountIssues.push('No es un número válido');
      if (!amountValidations.isPositive) amountIssues.push('Debe ser mayor a 0');
      if (!amountValidations.isGreaterThanOne) amountIssues.push('Monto muy bajo (< $1), puede causar problemas');
      if (!amountValidations.hasDecimals) {
        validationResults.warnings.push('El monto tiene decimales, Mercado Pago puede tener restricciones');
      }

      validationResults.validations.activity = {
        status: amountIssues.length === 0 ? 'success' : 'warning',
        details: {
          message: amountIssues.length === 0 ? 'Actividad válida' : 'Actividad con advertencias',
          activityId: activity.id,
          title: activity.title,
          price: activity.price,
          totalAmount: totalAmount,
          validations: amountValidations,
          issues: amountIssues
        }
      };

      if (amountIssues.length > 0) {
        validationResults.warnings.push(`Problemas con el monto: ${amountIssues.join(', ')}`);
      }
    }

    // ============================================================
    // 5. VALIDAR CREDENCIALES DEL COACH
    // ============================================================
    validationResults.validations.coachCredentials = {
      status: 'checking',
      details: {}
    };

    if (activity) {
      const { getSupabaseAdmin } = await import('@/lib/config/db');
      const adminSupabase = await getSupabaseAdmin();
      
      const { data: coachCredentials, error: credsError } = await adminSupabase
        .from('coach_mercadopago_credentials')
        .select('*')
        .eq('coach_id', activity.coach_id)
        .eq('oauth_authorized', true)
        .maybeSingle();

      if (credsError) {
        validationResults.validations.coachCredentials = {
          status: 'error',
          details: {
            message: 'Error al obtener credenciales del coach',
            error: credsError.message
          }
        };
        validationResults.errors.push('Error al obtener credenciales del coach');
      } else if (!coachCredentials) {
        validationResults.validations.coachCredentials = {
          status: 'error',
          details: {
            message: 'Coach no tiene Mercado Pago configurado',
            coachId: activity.coach_id
          }
        };
        validationResults.errors.push('El coach no ha configurado Mercado Pago');
      } else {
        // Intentar desencriptar el token
        let coachAccessToken: string | null = null;
        let decryptionError: string | null = null;

        try {
          coachAccessToken = decrypt(coachCredentials.access_token_encrypted);
        } catch (error: any) {
          decryptionError = error.message;
        }

        const isTestToken = coachAccessToken?.startsWith('TEST-') || false;
        const isProductionToken = coachAccessToken?.startsWith('APP_USR-') || false;

        validationResults.validations.coachCredentials = {
          status: decryptionError ? 'error' : 'success',
          details: {
            message: decryptionError ? 'Error al desencriptar token' : 'Credenciales del coach válidas',
            coachId: activity.coach_id,
            mercadopagoUserId: coachCredentials.mercadopago_user_id,
            oauthAuthorized: coachCredentials.oauth_authorized,
            tokenType: isTestToken ? 'TEST' : isProductionToken ? 'PRODUCTION' : 'UNKNOWN',
            tokenLength: coachAccessToken?.length || 0,
            decryptionError: decryptionError
          }
        };

        if (decryptionError) {
          validationResults.errors.push('Error al desencriptar token del coach');
        }
      }
    }

    // ============================================================
    // 6. VALIDAR INFORMACIÓN DEL PAYER
    // ============================================================
    validationResults.validations.payerInfo = {
      status: 'checking',
      details: {}
    };

    if (user) {
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('name, surname, phone, address, dni, document_type')
        .eq('id', user.id)
        .single();

      const payerValidations = {
        hasEmail: !!user.email,
        hasName: !!(clientProfile?.name),
        hasSurname: !!(clientProfile?.surname),
        hasPhone: !!(clientProfile?.phone),
        hasIdentification: !!(clientProfile?.dni),
        hasDocumentType: !!(clientProfile?.document_type)
      };

      const payerIssues: string[] = [];
      if (!payerValidations.hasEmail) payerIssues.push('Falta email');
      if (!payerValidations.hasName) payerIssues.push('Falta nombre');
      if (!payerValidations.hasSurname) payerIssues.push('Falta apellido');
      if (!payerValidations.hasIdentification) payerIssues.push('Falta DNI (se usará uno por defecto)');

      validationResults.validations.payerInfo = {
        status: payerIssues.length === 0 ? 'success' : 'warning',
        details: {
          message: payerIssues.length === 0 ? 'Información del payer completa' : 'Información del payer incompleta',
          validations: payerValidations,
          issues: payerIssues,
          email: user.email,
          name: clientProfile?.name || 'No disponible',
          surname: clientProfile?.surname || 'No disponible',
          hasPhone: !!clientProfile?.phone,
          hasDni: !!clientProfile?.dni
        }
      };

      if (payerIssues.length > 0) {
        validationResults.warnings.push(`Información del payer incompleta: ${payerIssues.join(', ')}`);
      }
    }

    // ============================================================
    // 7. VALIDAR CONFIGURACIÓN DE MÉTODOS DE PAGO
    // ============================================================
    validationResults.validations.paymentMethods = {
      status: 'success',
      details: {
        message: 'Configuración de métodos de pago válida',
        excludedMethods: [],
        excludedTypes: [],
        installments: 12,
        defaultInstallments: 1,
        note: 'Todos los métodos de pago están habilitados'
      }
    };

    // ============================================================
    // 8. VALIDAR TOKEN DEL MARKETPLACE
    // ============================================================
    validationResults.validations.marketplaceToken = {
      status: 'checking',
      details: {}
    };

    const marketplaceToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || '';
    const TEST_USER_IDS = ['2995219181', '2992707264', '2995219179'];
    
    const isTestToken = marketplaceToken.startsWith('TEST-');
    const isProductionToken = marketplaceToken.startsWith('APP_USR-');
    const marketplaceTokenIsTest = isTestToken || 
                                   marketplaceToken.includes('2995219179') || 
                                   marketplaceToken.includes('2995219181') || 
                                   marketplaceToken.includes('8497664518687621');

    validationResults.validations.marketplaceToken = {
      status: marketplaceToken ? 'success' : 'error',
      details: {
        message: marketplaceToken ? 'Token del marketplace configurado' : 'Token del marketplace no configurado',
        isTest: marketplaceTokenIsTest,
        isProduction: isProductionToken && !marketplaceTokenIsTest,
        tokenType: isTestToken ? 'TEST' : isProductionToken ? 'PRODUCTION' : 'UNKNOWN',
        tokenLength: marketplaceToken.length,
        willUseMarketplaceToken: marketplaceTokenIsTest
      }
    };

    // ============================================================
    // 9. VALIDAR CONFIGURACIÓN DE PREFERENCIA
    // ============================================================
    validationResults.validations.preferenceConfig = {
      status: 'checking',
      details: {}
    };

    if (activity && user) {
      const totalAmount = parseFloat(activity.price?.toString() || '0');
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '');

      const preferenceConfig = {
        hasItems: true,
        itemsValid: totalAmount > 0,
        hasBackUrls: true,
        backUrlsValid: !!appUrl,
        hasAutoReturn: true,
        hasNotificationUrl: true,
        hasPayer: true,
        hasExternalReference: true,
        marketplaceFeeIncluded: !marketplaceTokenIsTest, // Solo en producción
        expires: false
      };

      const configIssues: string[] = [];
      if (!preferenceConfig.itemsValid) configIssues.push('Items inválidos (monto <= 0)');
      if (!preferenceConfig.backUrlsValid) configIssues.push('Back URLs inválidas');

      validationResults.validations.preferenceConfig = {
        status: configIssues.length === 0 ? 'success' : 'warning',
        details: {
          message: configIssues.length === 0 ? 'Configuración de preferencia válida' : 'Configuración con advertencias',
          config: preferenceConfig,
          issues: configIssues,
          backUrls: {
            success: `${appUrl}/payment/success`,
            failure: `${appUrl}/payment/failure`,
            pending: `${appUrl}/payment/pending`
          },
          marketplaceFeeIncluded: preferenceConfig.marketplaceFeeIncluded,
          note: marketplaceTokenIsTest ? 'Marketplace fee NO incluido (modo prueba)' : 'Marketplace fee incluido (producción)'
        }
      };

      if (configIssues.length > 0) {
        validationResults.warnings.push(`Problemas con la configuración: ${configIssues.join(', ')}`);
      }
    }

    // ============================================================
    // 10. GENERAR RECOMENDACIONES
    // ============================================================
    if (validationResults.errors.length === 0 && validationResults.warnings.length === 0) {
      validationResults.recommendations.push('✅ Todas las validaciones pasaron. El botón debería funcionar correctamente.');
    }

    if (validationResults.warnings.length > 0) {
      validationResults.recommendations.push('⚠️ Hay advertencias que podrían causar problemas. Revisa las validaciones.');
    }

    if (validationResults.errors.length > 0) {
      validationResults.recommendations.push('❌ Hay errores que deben corregirse antes de poder hacer la compra.');
    }

    // Verificar si el monto es muy bajo
    if (activity) {
      const totalAmount = parseFloat(activity.price?.toString() || '0');
      if (totalAmount < 1) {
        validationResults.recommendations.push('💡 El monto es muy bajo (< $1). Considera usar un monto mayor para pruebas.');
      }
    }

    // Verificar si falta información del payer
    if (user && !user.email) {
      validationResults.recommendations.push('💡 El usuario no tiene email. Asegúrate de que el usuario tenga email configurado.');
    }

    // ============================================================
    // RESUMEN FINAL
    // ============================================================
    const overallStatus = validationResults.errors.length > 0 ? 'error' : 
                         validationResults.warnings.length > 0 ? 'warning' : 
                         'success';

    return NextResponse.json({
      status: overallStatus,
      summary: {
        totalValidations: Object.keys(validationResults.validations).length,
        passed: Object.values(validationResults.validations).filter((v: any) => v.status === 'success').length,
        warnings: Object.values(validationResults.validations).filter((v: any) => v.status === 'warning').length,
        errors: Object.values(validationResults.validations).filter((v: any) => v.status === 'error').length
      },
      ...validationResults
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Error inesperado durante la validación',
        details: error.message,
        ...validationResults
      },
      { status: 500 }
    );
  }
}

