# 🧭 Sistema de Navegación con Pila (Navigation Stack)

## 📋 Descripción
Sistema inteligente de navegación que mantiene una pila de estados para manejar correctamente el flujo de navegación entre modales.

## 🔄 Flujos de Navegación

### Flujo 1: Search → Actividad → Coach
```
1. Search Tab
2. Click Actividad → Pila: [Activity]
3. Click Coach → Pila: [Activity, Coach]
4. Cerrar Coach → Regresa a Activity
5. Cerrar Activity → Regresa a Search
```

### Flujo 2: Search → Coach → Actividad
```
1. Search Tab
2. Click Coach → Pila: [Coach]
3. Click Activity → Pila: [Coach, Activity]
4. Cerrar Activity → Regresa a Coach
5. Cerrar Coach → Regresa a Search
```

### Flujo 3: Search → Actividad → Coach → Actividad
```
1. Search Tab
2. Click Actividad → Pila: [Activity]
3. Click Coach → Pila: [Activity, Coach]
4. Click Activity → Pila: [Activity, Coach, Activity]
5. Cerrar Activity → Regresa a Coach
6. Cerrar Coach → Regresa a Activity
7. Cerrar Activity → Regresa a Search
```

## 🏗️ Estructura de la Pila

```typescript
interface NavigationStackItem {
  type: 'activity' | 'coach'
  data: any // Activity o Coach object
  context?: any // Información adicional del contexto
}
```

## 🔧 Funciones Principales

### `handleActivityClick()`
- Agrega actividad a la pila
- Configura contexto de navegación
- Abre modal de actividad

### `handleCoachClickFromActivity()`
- Agrega coach a la pila
- Busca coach en displayedCoaches o API
- Abre modal de coach

### `handleModalClose()`
- Analiza la pila de navegación
- Determina a qué estado regresar
- Actualiza estados correctamente

## 📊 Logs de Debugging

```
🚪 Cerrando modal - Pila actual: [{type: 'activity', id: 59}, {type: 'coach', id: 'b16c4f8c...'}]
🔙 Último elemento de la pila: {type: 'coach', data: {...}}
👤 Volviendo al coach anterior
🏃 Volviendo a la actividad anterior
📱 No hay pila - volviendo al search
```

## ✅ Beneficios

1. **Navegación Intuitiva**: Siempre regresa al estado anterior correcto
2. **Sin Instancias Anidadas**: Cada modal es independiente
3. **Memoria de Contexto**: Mantiene información del flujo de navegación
4. **Debugging Fácil**: Logs detallados para troubleshooting
5. **Experiencia de Usuario Mejorada**: Navegación predecible y lógica

## 🎯 Casos de Uso

- **Usuario explora actividades** → Click coach → Ve perfil → Regresa a actividad
- **Usuario ve coach** → Click actividad → Ve detalles → Regresa a coach
- **Usuario navega profundamente** → Cada "atrás" lo lleva al paso anterior
- **Usuario cierra desde cualquier punto** → Navegación lógica y predecible




























