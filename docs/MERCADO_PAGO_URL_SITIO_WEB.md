# URL de Sitio Web para Credenciales de Producción

## 🎯 ¿Qué URL poner?

Mercado Pago requiere una URL de sitio web para activar las credenciales de producción. Tienes varias opciones:

---

## ✅ Opciones Recomendadas

### Opción 1: Si tienes la app deployada (RECOMENDADA)

Si ya tienes OMNIA deployada en algún servicio:

**Vercel/Netlify/Railway/etc:**
```
https://tu-app.vercel.app
https://omnia.vercel.app
https://tu-dominio.com
```

**Ejemplo:**
```
https://omnia-in-te.vercel.app
```

---

### Opción 2: Si NO tienes dominio aún (Temporal)

Puedes usar un servicio temporal para crear una URL pública:

**A) Usar ngrok (túnel temporal):**
```bash
# Instalar ngrok
npm install -g ngrok

# Crear túnel
ngrok http 3000
```

Esto te dará una URL como:
```
https://abc123.ngrok.io
```

**B) Usar un dominio temporal:**
- Puedes usar un servicio como `localtunnel` o similar
- O simplemente poner el dominio que planeas usar en producción

---

### Opción 3: Dominio que planeas usar (Futuro)

Si ya sabes qué dominio usarás en producción:

```
https://omnia.com
https://omnia.app
https://omnia.com.ar
https://www.omnia.com
```

**⚠️ IMPORTANTE**: Asegúrate de que este dominio esté disponible y que puedas configurarlo después.

---

## 🔧 Configuración Recomendada

### Para Desarrollo (AHORA):

**Si tienes app deployada:**
```
https://tu-app.vercel.app
```

**Si NO tienes app deployada:**
1. **Opción rápida**: Usa ngrok para crear URL temporal
2. **Opción permanente**: Deploya en Vercel (gratis) y usa esa URL

### Para Producción (DESPUÉS):

Cuando tengas tu dominio real:
```
https://tu-dominio-real.com
```

---

## 📋 Pasos Recomendados

### Si NO tienes dominio aún:

1. **Deploya en Vercel (gratis y rápido)**:
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Deployar
   vercel
   ```
   
   Esto te dará una URL como: `https://omnia-xxx.vercel.app`

2. **Usa esa URL en Mercado Pago**

3. **Actualiza después** cuando tengas tu dominio real

---

## ⚠️ Consideraciones

1. **La URL debe ser HTTPS** (no HTTP)
2. **Debe ser accesible públicamente** (no localhost)
3. **Puedes cambiarla después** si es necesario
4. **Mercado Pago puede verificar** que el sitio existe

---

## 🎯 Recomendación Final

**Para empezar rápido:**
1. Si tienes Vercel/Netlify → Usa esa URL
2. Si no → Usa ngrok temporalmente
3. O deploya en Vercel (5 minutos, gratis)

**Ejemplo de URL para poner:**
```
https://omnia-in-te.vercel.app
```

O si planeas usar un dominio específico:
```
https://omnia.com.ar
```

---

## ❓ ¿Qué pasa si cambio la URL después?

- ✅ Puedes actualizar la URL en Mercado Pago después
- ✅ Las credenciales seguirán funcionando
- ⚠️ Solo asegúrate de actualizar también el Redirect URI para OAuth









