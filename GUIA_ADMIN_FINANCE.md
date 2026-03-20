# 🛡️ OMNIA FINANCE: Gestión de Accesos y Dashboard

Este documento detalla la operativa profesional para gestionar el acceso al Dashboard de Conciliación y el control de cuentas de la plataforma OMNIA.

---

### 🚀 1. ¿Cómo se accede al Dashboard?
El Dashboard de OMNIA FINANCE es **invisible para el público** y para los coaches estándar. Solo se activa mediante el sistema **"Smart-Switch"** de la App.

*   **Acceso Directo**: No hace falta ninguna URL especial. Simplemente inicia sesión en **omnia-app.vercel.app** con una cuenta que tenga privilegios de Administrador.
*   **La Transformación**: Al entrar, la App detectará tu nivel de acceso y, en lugar del menú normal de coach, te mostrará automáticamente el Centro de Control Financiero a pantalla completa. ✨📈

---

### 🔑 2. ¿Cómo dar acceso ADMIN a alguien? (Gobernanza)
El control de quién es Admin se gestiona desde el panel de control de la base de datos (**Supabase**). No hay riesgo de inyecciones externas.

**Pasos para convertir a un usuario en ADMIN:**
1.  Entra en tu consola de **Supabase**.
2.  Ve a la sección **Table Editor** > selecciona la tabla **`user_profiles`**.
3.  Busca la fila del usuario al que quieres dar acceso (puedes buscarlo por su `full_name` o `id`).
4.  Localiza la columna **`level`**. Por defecto estará en `client` o `coach`.
5.  Cambia ese valor a **`admin`** (en minúsculas) y guarda los cambios. 🦾✅
    *   *Nota*: Para quitar el acceso, simplemente vuelve a ponerlo en `coach` o `client`.

---

### 📊 3. Gestión de la Conciliación
El Dashboard está diseñado para que audites tres puntos clave sin tocar código:

*   **A. Monitor de Mora Coaches**:
    *   **🚨 ALERTA ROJA**: Si un pago mensual falló o transcurrieron más de 30 días, el sistema marcará el plan como "PENDIENTE".
    *   **⚠️ LÍMITE FREE**: El sistema detecta la regla de los **3 meses** para el Plan Free. Si el coach sobrepasa los 90 días, verás la alerta de *"FREE AGOTADO"*.

*   **B. Auditoría de Ventas**:
    *   Ves el flujo real de dinero. Recordamos que **el dinero de OMNIA** (las comisiones) cae físicamente en la cuenta de Mercado Pago asociada a las credenciales del servidor (`MERCADOPAGO_ACCESS_TOKEN`).

*   **C. Link Directo a MP**:
    *   Cada transacción tiene un botón de **"Ver MP"**. Si haces clic, te llevará directamente al recibo oficial de Mercado Pago para gestionar cualquier reclamo o devolución rápidamente. 💸💨

---

### 🛡️ 4. Seguridad
Este sistema de "Modo Camaleón" es altamente seguro porque:
- Se basa en el JWT de autenticación de Supabase (inviolable por el front-end).
- El componente `AdminFinanceDashboard` se carga solo si el servidor valida tu `level`.

---

*Manual generado por OMNIA AI - Consola Administrativa v1.0*
