'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidateCheckoutButtonProps {
  activityId: string | number;
  className?: string;
}

interface ValidationResult {
  status: 'success' | 'warning' | 'error';
  summary: {
    totalValidations: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  validations: Record<string, any>;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export function ValidateCheckoutButton({
  activityId,
  className = '',
}: ValidateCheckoutButtonProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    setResult(null);
    setShowDetails(false);

    try {
      const response = await fetch('/api/mercadopago/validate-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId }),
      });

      const data = await response.json();
      setResult(data);
      setShowDetails(true);
    } catch (error: any) {
      setResult({
        status: 'error',
        summary: { totalValidations: 0, passed: 0, warnings: 0, errors: 1 },
        validations: {},
        errors: ['Error al validar: ' + error.message],
        warnings: [],
        recommendations: [],
      });
      setShowDetails(true);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleValidate}
        disabled={isValidating}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validando...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Validar Configuración de Pago
          </>
        )}
      </Button>

      {result && showDetails && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <span className={getStatusColor(result.status)}>
                Resultado de la Validación
              </span>
            </CardTitle>
            <CardDescription>
              {result.summary.passed} de {result.summary.totalValidations} validaciones pasaron
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {result.summary.passed}
                </div>
                <div className="text-sm text-gray-400">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {result.summary.warnings}
                </div>
                <div className="text-sm text-gray-400">Advertencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {result.summary.errors}
                </div>
                <div className="text-sm text-gray-400">Errores</div>
              </div>
            </div>

            {/* Errores */}
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Errores</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Advertencias */}
            {result.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advertencias</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recomendaciones */}
            {result.recommendations.length > 0 && (
              <Alert>
                <AlertTitle>Recomendaciones</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Detalles de Validaciones */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detalles de Validaciones:</h4>
              {Object.entries(result.validations).map(([key, validation]: [string, any]) => (
                <div
                  key={key}
                  className="border rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validation.status)}
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 ml-7">
                    {validation.details?.message || 'Sin mensaje'}
                  </p>
                  {validation.details && Object.keys(validation.details).length > 1 && (
                    <details className="ml-7 mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Ver detalles técnicos
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto">
                        {JSON.stringify(validation.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={() => setShowDetails(false)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

