# 🔧 Configuración de Supabase para OMNIA

## ⚠️ Problema Actual
El sistema está mostrando el error: `Supabase not configured, using mock client` porque las variables de entorno de Supabase no están configuradas.

## 🚀 Solución Rápida

### 1. Crear archivo `.env.local`
Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui

# Configuración de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**O simplemente copia el archivo de ejemplo:**
```bash
cp env.local.example .env.local
```

### 2. Obtener credenciales de Supabase

#### Opción A: Crear nuevo proyecto Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Ve a **Settings** → **API**
5. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Opción B: Usar proyecto existente
Si ya tienes un proyecto Supabase, ve a **Settings** → **API** y copia las credenciales.

### 3. Configurar la base de datos

Ejecuta los siguientes archivos SQL en el editor SQL de Supabase:

1. **Tabla de replicaciones de ejercicios:**
   ```sql
   -- Ejecutar el contenido de: db/create-exercise-replications-table.sql
   ```

2. **Columnas adicionales:**
   ```sql
   -- Ejecutar el contenido de: db/add-body-parts-to-fitness-exercises.sql
   ```

### 4. Reiniciar el servidor de desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

## 🔍 Verificar la configuración

Después de configurar las variables de entorno, deberías ver en la consola del navegador:
- ✅ Sin mensajes de "Supabase not configured"
- ✅ Sin errores de importación de `createClient`
- ✅ El login debería funcionar correctamente

## 🛠️ Modo de desarrollo sin Supabase

Si prefieres desarrollar sin configurar Supabase:

1. **No crees el archivo `.env.local`**
2. **El sistema usará automáticamente el mock client**
3. **Las funcionalidades básicas funcionarán en modo simulado**

## 📋 Funcionalidades que requieren Supabase

- ✅ **Autenticación de usuarios**
- ✅ **Creación/edición de productos**
- ✅ **Replicación de ejercicios** (nueva funcionalidad)
- ✅ **Gestión de CSV y actividades**
- ✅ **Almacenamiento de archivos**

## 🚨 Solución de problemas

### Error: "Module not found: Can't resolve '@supabase/auth-helpers-nextjs'"
- ✅ **Solucionado**: Eliminada la dependencia de `@supabase/auth-helpers-nextjs`
- ✅ **Ahora usa**: Solo `@supabase/supabase-js` que ya está instalado

### Error: "createClient is not a function"
- ✅ **Solucionado**: Actualizado `lib/supabase-browser.ts`

### Error: "signInWithPassword is not a function"
- ✅ **Solucionado**: Actualizado el mock client en `lib/supabase.ts`

### Error: "Supabase not configured"
- **Solución**: Configurar las variables de entorno como se indica arriba

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verifica que el archivo `.env.local` esté en la raíz del proyecto
2. Reinicia el servidor de desarrollo
3. Verifica que las credenciales de Supabase sean correctas
4. Revisa la consola del navegador para errores específicos

---

**Nota**: La funcionalidad de replicación de ejercicios está completamente implementada y funcionará una vez que Supabase esté configurado correctamente.