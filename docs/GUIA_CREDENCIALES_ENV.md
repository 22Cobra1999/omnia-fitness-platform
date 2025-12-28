# 🔑 Guía Completa: Credenciales del .env.local

## 📍 ¿Dónde están guardadas las credenciales?

Las credenciales están guardadas en el archivo **`.env.local`** que se encuentra en la **raíz del proyecto**:

```
/Users/francopomati/Downloads/omnia (3)/.env.local
```

### ⚠️ Importante
- Este archivo está en `.gitignore`, por lo que **NO se sube a GitHub** (es seguro para credenciales)
- Solo existe en tu máquina local
- Cada desarrollador debe crear su propio `.env.local`

---

## 🔍 ¿Cómo leo las credenciales?

### Método 1: Manualmente desde la Terminal

```bash
# Ver el contenido completo del archivo
cat .env.local

# Ver solo las primeras 20 líneas
head -20 .env.local

# Buscar una variable específica (ej: SUPABASE_URL)
grep "SUPABASE_URL" .env.local

# Abrir en editor de texto desde terminal
open .env.local          # macOS
code .env.local          # VS Code
nano .env.local          # Editor nano
vim .env.local           # Editor vim
```

### Método 2: Desde VS Code / Cursor

1. **Abrir el archivo directamente:**
   - Presiona `Cmd+P` (Mac) o `Ctrl+P` (Windows/Linux)
   - Escribe `.env.local`
   - Selecciona el archivo

2. **Desde el explorador de archivos:**
   - Busca el archivo `.env.local` en la raíz del proyecto
   - Haz clic derecho → "Open with..."

### Método 3: Desde el Finder (macOS)

1. Abre Finder
2. Navega a: `/Users/francopomati/Downloads/omnia (3)/`
3. Presiona `Cmd+Shift+.` para mostrar archivos ocultos (que empiezan con punto)
4. Busca `.env.local` y ábrelo con cualquier editor de texto

---

## 🤖 ¿Qué decirle a GitHub Copilot para abrir el archivo?

### Opción 1: Pedirle que lo abra directamente
```
Abre el archivo .env.local del proyecto
```

### Opción 2: Pedirle que muestre las variables
```
Muestra las variables de entorno del archivo .env.local
```

### Opción 3: Pedirle que busque una variable específica
```
Busca la variable NEXT_PUBLIC_SUPABASE_URL en el archivo .env.local
```

### Opción 4: Pedirle que cree/edite el archivo
```
Crea/edita el archivo .env.local y agrega las siguientes variables...
```

---

## ⚙️ ¿Cómo Next.js carga las variables automáticamente?

Next.js carga automáticamente las variables de entorno en este orden de prioridad:

1. **`.env.local`** (mayor prioridad - siempre se carga, ignorado por git)
2. **`.env.development`** o **`.env.production`** (según el entorno)
3. **`.env`** (menor prioridad)

### Proceso automático:

Cuando ejecutas `npm run dev`, Next.js:
1. Lee el archivo `.env.local` automáticamente
2. Carga todas las variables en `process.env`
3. Las variables con prefijo `NEXT_PUBLIC_` están disponibles en el navegador
4. Las demás solo están disponibles en el servidor

### Ejemplo de uso en código:

```typescript
// ✅ Correcto - Variable pública (disponible en navegador)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// ✅ Correcto - Variable privada (solo servidor)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ Incorrecto - No funcionará en el navegador
const secret = process.env.SECRET_KEY  // Solo funciona en servidor
```

---

## 📋 Variables comunes en .env.local

Basado en la documentación del proyecto, estas son las variables típicas:

### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Mercado Pago
```env
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
ENCRYPTION_KEY=tu-encryption-key
```

### Google OAuth
```env
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_SA_EMAIL=tu-service-account-email
GOOGLE_SA_PRIVATE_KEY=tu-private-key
```

### Bunny Stream (Videos)
```env
NEXT_PUBLIC_BUNNY_LIBRARY_ID=tu-library-id
BUNNY_STREAM_API_KEY=tu-api-key
BUNNY_STREAM_LIBRARY_ID=tu-library-id
```

---

## 🔄 Scripts que cargan .env.local manualmente

Algunos scripts del proyecto cargan el `.env.local` manualmente porque se ejecutan fuera del contexto de Next.js:

### Ejemplo de código (de `scripts/ejecutar-scripts-directo.ts`):

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
  try {
    const envFile = readFileSync(join(process.cwd(), envPath), 'utf8');
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (e) {}
}
```

Esto lee el archivo línea por línea y carga las variables en `process.env`.

---

## ✅ Verificar que las variables están cargadas

### Desde código:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Tiene Service Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

### Desde terminal (después de iniciar el servidor):
```bash
# Ver variables en el proceso de Node
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

---

## 🚨 Problemas comunes

### 1. "Variable no definida"
**Solución:** Reinicia el servidor después de modificar `.env.local`
```bash
# Detener servidor (Ctrl+C) y reiniciar
npm run dev
```

### 2. "Archivo .env.local no encontrado"
**Solución:** Crea el archivo desde `.env.example`:
```bash
cp .env.example .env.local
```

### 3. "Variables no disponibles en el navegador"
**Solución:** Agrega el prefijo `NEXT_PUBLIC_` a las variables que necesitas en el cliente:
```env
# ❌ No funciona en navegador
SUPABASE_URL=...

# ✅ Funciona en navegador
NEXT_PUBLIC_SUPABASE_URL=...
```

---

## 📚 Referencias

- Documentación oficial de Next.js: [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- Archivo de ejemplo: `.env.example` en la raíz del proyecto
- Documentación del proyecto: `docs/CONFIGURACION_CREDENCIALES_ACTUALIZADA.md`


