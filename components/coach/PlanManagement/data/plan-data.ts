
import { Zap, Shield, Crown, Gift } from 'lucide-react'

export const PLAN_PRICES = {
    free: { price: 0, currency: 'ARS', period: '3 meses o hasta 3 ventas' },
    basico: { price: 12000, currency: 'ARS', period: 'mensual' },
    black: { price: 22000, currency: 'ARS', period: 'mensual' },
    premium: { price: 35000, currency: 'ARS', period: 'mensual' }
}

export const PLAN_COMMISSION_PERCENT = {
    free: 5,
    basico: 5,
    black: 4,
    premium: 3
}

export const PLAN_NAMES = {
    free: 'Free / Inicial',
    basico: 'Básico',
    black: 'Black',
    premium: 'Premium'
}

export const PLAN_ICONS = {
    free: Gift,
    basico: Zap,
    black: Shield,
    premium: Crown
}

export const PLAN_COLORS = {
    free: 'bg-[#FF7939]/20 text-[#CC5C2E] border-[#CC5C2E]/30',
    basico: 'bg-[#FF7939]/20 text-[#FF7939] border-[#FF7939]/30',
    black: 'bg-[#FF7939]/20 text-[#FFA570] border-[#FFA570]/30',
    premium: 'bg-[#FF7939]/20 text-[#FFB894] border-[#FFB894]/30'
}

export const PLAN_FEATURES: any[] = [
    {
        name: 'Almacenamiento',
        free: '1 GB',
        basico: '5 GB',
        black: '25 GB',
        premium: '100 GB'
    },
    {
        name: 'Productos activos',
        free: '3',
        basico: '5',
        black: '10',
        premium: '20'
    },
    {
        name: 'Clientes totales',
        free: '10',
        basico: '30',
        black: '70',
        premium: '150'
    },
    {
        name: 'Actividades por producto',
        free: '20',
        basico: '40',
        black: '60',
        premium: '100'
    },
    {
        name: 'Stock por producto (cupos)',
        free: '10',
        basico: '30',
        black: '75',
        premium: '150'
    },
    {
        name: 'Semanas por producto',
        free: '2',
        basico: '4',
        black: '9',
        premium: '17'
    },
    {
        name: 'Comisión por venta',
        free: '5%',
        basico: '5%',
        black: '4%',
        premium: '3%'
    },
    {
        name: 'Duración de video (máx)',
        free: '—',
        basico: '30 s',
        black: '60 s',
        premium: '120 s'
    },
    {
        name: 'Video de portada',
        free: false,
        basico: true,
        black: true,
        premium: true
    },
    {
        name: 'Analítica',
        free: '—',
        basico: 'Básica',
        black: 'Avanzada',
        premium: 'Completa'
    },
    {
        name: 'Soporte',
        free: 'E-mail',
        basico: 'E-mail prioritario',
        black: 'Chat directo',
        premium: 'Soporte técnico directo'
    }
]
