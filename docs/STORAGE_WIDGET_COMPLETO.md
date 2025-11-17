# ✅ Widget de Almacenamiento - Documentación Completa

## 🎯 Objetivo

Proporcionar al coach una **visión clara y accionable** de su uso de almacenamiento, con análisis detallado desde múltiples perspectivas.

## 🏗️ Arquitectura

### Componentes

```
storage-usage-widget.tsx (170 líneas)
└─ Widget minimalista en perfil
   ├─ Barra segmentada visual
   ├─ Info Usado/Disponible/Total
   └─ Botón → storage-detail-screen

storage-detail-screen.tsx (300+ líneas)
└─ Pantalla completa de análisis
   ├─ Header sticky (back + refresh)
   ├─ Resumen total + barra
   ├─ Tabs (Archivos/Actividades/Uso Total)
   └─ Listas expandibles por vista
```

### APIs

```
/api/coach/storage-usage
└─ Resumen rápido (totales por concepto)
   → Usado por widget simple

/api/coach/storage-files
└─ Lista detallada (archivos individuales)
   → Usado por pantalla detallada
```

## 📊 Vistas Implementadas

### 1. Vista por Archivo
**Propósito**: Ver archivos individuales

**Muestra**:
- Nombre del archivo
- Tamaño individual
- Cantidad de usos
- Actividades donde se usa

**Orden**: Por tamaño descendente

### 2. Vista por Actividad
**Propósito**: Ver consumo por actividad

**Muestra**:
- Nombre de la actividad
- Total de archivos
- Tipos de medios
- Tamaño total

**Orden**: Por consumo total descendente

### 3. Vista por Uso Total
**Propósito**: Identificar duplicados

**Muestra**:
- Nombre del archivo
- Tamaño × usos
- **Total acumulado**

**Orden**: Por impacto total descendente

## 🎨 UX

### Principios de Diseño

1. **Progresivo**: Información por capas
   - Perfil: Vista simple
   - Detalle: Vista compleja

2. **Accionable**: Datos que permiten decisiones
   - Identificar duplicados
   - Ver qué archivos pesan más
   - Entender distribución

3. **Rápido**: Carga inicial ligera
   - Widget solo carga resumen
   - Detalle carga bajo demanda

4. **Consistente**: Estilo Omnia
   - Paleta naranja
   - Iconos lucide-react
   - Layout minimalista

### Flujo de Usuario

```
Usuario en Perfil Tab
    ↓
Ve widget con barra visual
    ↓
Interesado → Click "Ver más"
    ↓
Pantalla detallada se abre
    ↓
Navega entre vistas (Archivos/Actividades/Uso)
    ↓
Analiza datos
    ↓
Click "←" → Vuelve a perfil
```

## 🔧 Características Técnicas

### Optimizaciones

- **Separación de cargas**: Resumen rápido vs. detalle completo
- **Agrupación**: Mismo archivo en múltiples actividades
- **Ordenamiento**: Por relevancia (tamaño/consumo)
- **Límite**: 10 items visibles por defecto
- **Expansión**: Click para ver todos

### Manejo de Errores

- ✅ Fallback si `storage-files` falla
- ✅ Loading states separados
- ✅ Error boundaries
- ✅ Tolerancia a APIs lentas

## 📝 Datos Necesarios

### Para Widget Simple
```typescript
{
  total: 0.03,
  breakdown: { video: 0.032, image: 0.000, pdf: 0 }
}
```

### Para Pantalla Detallada
```typescript
{
  fileId: "uuid",
  fileName: "nombre",
  concept: "video|image|pdf",
  sizeBytes: 34110336,
  sizeGB: 0.031764,
  usesCount: 3,
  activities: [{id: 78, name: "Actividad"}]
}
```

## 🚀 Estado Actual

- ✅ Widget simple implementado
- ✅ Pantalla detallada implementada
- ✅ 3 vistas funcionales
- ✅ Navegación fluida
- ✅ Cálculos correctos
- ✅ Diseño Omnia
- ⚠️ Pendiente: Ejecutar SQL para `file_name`
- ⚠️ Pendiente: Tamaños reales de imágenes/PDFs

---

**Ver**: `docs/STORAGE_USAGE_SYSTEM.md` para arquitectura completa  
**Ver**: `docs/UX_STORAGE_WIDGET.md` para decisiones de UX




























