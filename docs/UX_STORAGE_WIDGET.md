# 🎨 UX: Widget de Almacenamiento para Coach

## 📱 Ubicación
**Tab:** Perfil (Profile)
**Sección:** "Mi Suscripción" (debajo)

## 🎯 Información Mostrada

### 1. **Resumen Total**
```
Total usado: 0.03 GB
[====....................................] 0.0%
0 GB                           100 GB
```
- Barra de progreso visual
- Indicador de porcentaje
- Colores según uso:
  - Verde: < 75%
  - Amarillo: 75-90%
  - Rojo: > 90%

### 2. **Desglose por Tipo**
```
┌──────────┬──────────┬──────────┐
│ 📹 Video │ 🖼️ Imagen │ 📄 PDF   │
│  0.03 GB │  0.00 GB │  0.00 GB │
└──────────┴──────────┴──────────┘
```
- Iconos por tipo
- GB usados
- Grid responsive

### 3. **🆕 Usado en Actividades** (NUEVO)
```
Usado en actividades:

📹 Videos:     #78 (1)
🖼️ Imágenes:   #48, #59, #78, #90 (4)
📄 PDFs:       [vacío]
```
- Muestra qué actividades usan cada tipo
- Contador entre paréntesis
- Solo muestra si hay actividades

### 4. **Alertas (si aplica)**
```
⚠️ Almacenamiento alto. Ten cuidado con el límite.
```

## 💡 Casos de Uso para el Coach

### Caso 1: Ver qué actividad usa más storage
**Antes:** Solo veía "0.03 GB de videos"
**Ahora:** Ve "#78 usa videos" → Puede clicar y revisar esa actividad

### Caso 2: Encontrar archivos huérfanos
**Antes:** No podía identificar problemas
**Ahora:** Si tiene 5 actividades pero solo 2 aparecen en el storage, sabe que hay un problema

### Caso 3: Decidir qué eliminar
**Ejemplo:** Coach con 80 GB usados
- Ve que videos: #15, #20 (5 GB total)
- Ve que imágenes: #15, #20, #100 (10 GB total)
- Puede decidir: "Tengo archivos pesados solo en #15 y #20, voy a optimizar esos"

### Caso 4: Verificar carga de medios
**Uso:** Coach acaba de subir videos
- Ve el widget actualizado
- Verifica que las actividades correctas aparecen
- "Ok, mis 3 nuevos videos de #50 aparecen aquí"

## 🎨 Diseño Visual

```
┌─────────────────────────────────────────┐
│ 💾 Almacenamiento              ⟳        │
├─────────────────────────────────────────┤
│ Total usado: 0.03 GB                    │
│ ▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ 0 GB                           100 GB   │
│ 0.0%                                      │
├─────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┐     │
│ │ 📹 Video │ 🖼️ Imagen │ 📄 PDF   │     │
│ │  0.03 GB │  0.00 GB │  0.00 GB │     │
│ └──────────┴──────────┴──────────┘     │
├─────────────────────────────────────────┤
│ Usado en actividades:                   │
│                                         │
│ 📹 Videos:     #78 (1)                  │
│ 🖼️ Imágenes:   #48, #59, #78, #90 (4) │
└─────────────────────────────────────────┘
```

## 🔄 Interacciones

1. **Botón Refresh (⟳):**
   - Recalcula storage
   - Animación de carga
   - Actualiza datos en tiempo real

2. **Clickable (Futuro):**
   - Clic en actividad → navegar a esa actividad
   - Ver detalles de archivos

3. **Expandible (Futuro):**
   - "Ver más" → desglose detallado
   - Lista de archivos individuales

## 📊 Ejemplo Real

```json
{
  "total": 0.032,
  "breakdown": {
    "video": 0.032,
    "image": 0.000,
    "pdf": 0.000
  },
  "activityUsage": {
    "video": [78],
    "image": [48, 59, 78, 90],
    "pdf": []
  }
}
```

**Se muestra:**
- Total: 0.03 GB
- Video: 0.03 GB (usado en #78)
- Imagen: 0.00 GB (usado en #48, #59, #78, #90)
- PDF: 0.00 GB

## ✅ Beneficios UX

1. **Transparencia:** Coach ve exactamente dónde está su storage
2. **Acción:** Puede identificar qué optimizar
3. **Confirmación:** Verifica que sus archivos se cargaron correctamente
4. **Control:** Entiende qué actividades consumen más espacio
5. **Prevención:** Identifica archivos duplicados o huérfanos

## 🚀 Mejoras Futuras

1. **Hover details:** Mostrar más info al pasar mouse
2. **Drill-down:** Clic para ver archivos individuales
3. **Filtros:** Ver solo por tipo o actividad
4. **Historial:** Gráfica de evolución del uso
5. **Limpieza automática:** Sugerencias de archivos para eliminar




































