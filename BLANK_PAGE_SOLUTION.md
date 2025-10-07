# Solución para Página en Blanco

## Problema Identificado
El navegador está intentando cargar recursos estáticos desde `localhost:3000` pero el servidor está corriendo en `localhost:3001`, causando errores 404 y página en blanco.

## Solución Rápida

### Opción 1: Reiniciar Servidor (Recomendado)
```bash
# Ejecutar el script de reinicio
./restart-dev.sh
```

### Opción 2: Manual
1. **Detener el servidor actual** (Ctrl+C en la terminal)
2. **Limpiar cache del navegador**:
   - Chrome: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
   - Firefox: Ctrl+F5 (o Cmd+Shift+R en Mac)
3. **Reiniciar servidor**:
   ```bash
   npm run dev
   ```
4. **Abrir** `http://localhost:3000` (no 3001)

### Opción 3: Forzar Puerto 3000
```bash
# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# Iniciar en puerto 3000
npm run dev
```

## Verificación

Después de reiniciar, deberías ver:
- ✅ Servidor corriendo en `http://localhost:3000`
- ✅ Página cargando correctamente
- ✅ Sin errores 404 en la consola
- ✅ Estadísticas funcionando

## Si Persiste el Problema

1. **Limpiar cache completo del navegador**
2. **Abrir ventana de incógnito**
3. **Verificar que no hay otros procesos usando el puerto 3000**

## Archivos Modificados

- ✅ `next.config.mjs` - Configuración mejorada
- ✅ `lib/api-config.ts` - URLs dinámicas
- ✅ `restart-dev.sh` - Script de reinicio
- ✅ `components/mobile/products-management-screen.tsx` - URLs actualizadas

La aplicación debería funcionar correctamente después del reinicio.
