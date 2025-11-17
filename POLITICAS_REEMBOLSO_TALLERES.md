# 📋 POLÍTICAS DE REEMBOLSO PARA TALLERES

## 🎯 **SISTEMA DE SEGURO DE CANCELACIÓN**

### **Seguro Premium para Coaches**
- **Coach paga premium** por cobertura de cancelaciones
- **Cobertura:** Protege al coach de reembolsos en casos de cancelación
- **Beneficio:** Coach puede cancelar sin asumir costos de reembolso

---

## 📊 **FÓRMULA DE REEMBOLSO POR TEMA CANCELADO**

### **Fórmula Base:**
```
Reembolso = (Porcentaje del tema cancelado) × 3
```

### **Ejemplos de Cálculo:**

| **Escenario** | **Cálculo** | **Reembolso** |
|---------------|-------------|---------------|
| Cancela 1 tema de 10 | 10% × 3 | **30%** |
| Cancela 1 tema de 20 | 5% × 3 | **15%** |
| Cancela 1 tema de 2 | 50% × 3 | **100%** (tope máximo) |
| Cancela 1 tema de 3 | 33% × 3 | **99%** |

### **Reglas de la Fórmula:**
- **Tope máximo:** 100% (no puede excederse)
- **Aplicación:** Solo para temas individuales cancelados
- **Base:** Porcentaje del tema respecto al total del taller

---

## ⏰ **REGLAS DE ANTICIPACIÓN EN REPROGRAMACIÓN**

### **Con más de 72 horas de anticipación:**
- **Cliente DEBE aceptar** la nueva fecha o **PIERDE** el tema
- **No hay reembolso automático**
- **Decisión binaria:** Acepta o pierde
- **Sin opciones intermedias**

### **Con menos de 72 horas de anticipación:**
- **Coach debe ofrecer reembolso** ADEMÁS de nueva fecha
- **Cliente puede elegir:**
  - ✅ **Aceptar nueva fecha**
  - 💰 **Solicitar reembolso** (según fórmula)
- **Protección del cliente** por falta de anticipación

---

## 🔄 **FLUJO DE DECISIONES**

### **Escenario 1: Reprogramación con 72+ horas**
```
Coach cancela tema → Ofrece nueva fecha → Cliente decide:
├── ✅ Acepta → Se reprograma
└── ❌ Rechaza → Pierde tema (sin reembolso)
```

### **Escenario 2: Reprogramación con menos de 72 horas**
```
Coach cancela tema → Ofrece nueva fecha + reembolso → Cliente decide:
├── ✅ Acepta nueva fecha → Se reprograma
└── 💰 Solicita reembolso → Recibe porcentaje calculado
```

---

## 🛡️ **PROTECCIONES Y LÍMITES**

### **Protección del Cliente:**
- **Anticipación mínima:** 72 horas para reprogramación sin reembolso
- **Reembolso garantizado:** Si coach no cumple anticipación
- **Transparencia:** Cliente ve el motivo de cancelación

### **Protección del Coach:**
- **Seguro premium:** Cobertura de reembolsos
- **Flexibilidad:** Puede cancelar con anticipación adecuada
- **Sin penalización:** Si cumple tiempos de anticipación

### **Protección de la Plataforma:**
- **Políticas claras:** Reglas definidas y transparentes
- **Automatización:** Cálculos automáticos de reembolsos
- **Tracking:** Seguimiento de cancelaciones y reembolsos

---

## 📱 **IMPLEMENTACIÓN TÉCNICA**

### **Estados de Tema:**
- **ACTIVO** - Disponible para compra
- **CANCELADO** - Cancelado por el coach
- **REPROGRAMADO** - Nueva fecha asignada
- **PERDIDO** - Cliente rechazó reprogramación

### **Campos de Base de Datos:**
```sql
tema_cancelado: {
  tema_id: INTEGER,
  fecha_cancelacion: TIMESTAMP,
  anticipacion_horas: INTEGER,
  nueva_fecha: DATE,
  cliente_acepto: BOOLEAN,
  reembolso_calculado: DECIMAL,
  motivo_cancelacion: TEXT
}
```

### **Notificaciones Automáticas:**
- **Cancelación:** Cliente recibe notificación inmediata
- **Nueva fecha:** Opciones de aceptar/rechazar
- **Reembolso:** Procesamiento automático si aplica
- **Recordatorio:** 24h antes de vencimiento de respuesta

---

## 🎯 **CASOS DE USO ESPECÍFICOS**

### **Caso 1: Coach con Seguro Premium**
- **Cancelación:** Sin costo para el coach
- **Reembolso:** Cubierto por el seguro
- **Cliente:** Recibe reembolso automático

### **Caso 2: Coach sin Seguro Premium**
- **Cancelación:** Coach asume costo del reembolso
- **Reembolso:** Coach debe pagar al cliente
- **Cliente:** Recibe reembolso del coach

### **Caso 3: Fuerza Mayor (Clima, Emergencias)**
- **Cancelación:** Sin penalización
- **Reembolso:** 100% automático
- **Cliente:** Protección total

---

## 📊 **MÉTRICAS Y SEGUIMIENTO**

### **Métricas del Coach:**
- **Cancelaciones por mes**
- **Tiempo promedio de anticipación**
- **Tasa de aceptación de reprogramaciones**
- **Costo de reembolsos**

### **Métricas del Cliente:**
- **Temas perdidos por rechazo**
- **Reembolsos recibidos**
- **Satisfacción con reprogramaciones**

### **Métricas de la Plataforma:**
- **Volumen de cancelaciones**
- **Tiempo promedio de procesamiento**
- **Tasa de resolución de disputas**

---

## 🔧 **CONFIGURACIÓN DEL SISTEMA**

### **Parámetros Configurables:**
- **Anticipación mínima:** 72 horas (configurable)
- **Tope máximo de reembolso:** 100% (configurable)
- **Multiplicador de fórmula:** 3x (configurable)
- **Tiempo de respuesta del cliente:** 48 horas (configurable)

### **Automatizaciones:**
- **Cálculo automático** de reembolsos
- **Notificaciones automáticas** a clientes
- **Procesamiento automático** de reembolsos
- **Actualización automática** de estados

---

**Última actualización:** $(date)
**Versión:** 1.0
**Autor:** Sistema de Políticas OMNIA

