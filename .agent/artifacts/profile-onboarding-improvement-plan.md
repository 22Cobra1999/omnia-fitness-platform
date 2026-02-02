# Plan de Implementación: Mejora de Perfil y Cuestionario

## Objetivo
Simplificar el flujo de onboarding y hacer el perfil editable in-place sin modales.

## Cambios Principales

### 1. REGISTRO INICIAL
**Archivo:** `app/(auth)/signup/page.tsx`
- Agregar campos:
  - Edad (number input)
  - Altura (number input, cm)
  - Peso (number input, kg)
- Guardar en tabla `clients` al crear cuenta

### 2. POST-REGISTRO: MODAL DE CUESTIONARIO
**Nuevo componente:** `components/mobile/onboarding-prompt-modal.tsx`
- Mostrar después del registro exitoso
- Mensaje: "¿Querés completar el cuestionario? Los programas serán 100% hechos a tu medida..."
- Botones: "Completar ahora" | "Después"
- Si elige "Después", guardar flag en localStorage/sessionStorage

### 3. CUESTIONARIO SIMPLIFICADO
**Archivo:** `components/mobile/onboarding-modal.tsx`

**Pasos a MANTENER:**
1. Nivel de exigencia
2. Deseo de cambio
3. Horizonte del progreso
4. Constancia
5. Relación con el coach
6. Modalidad e intereses

**Paso FINAL (reemplaza "Últimos detalles"):**
- Foto de perfil (upload)
- Ubicación (text input)
- Deportes (multi-select con chips + botón +)
- Lesiones (multi-select con chips + botón +)
- Objetivos (multi-select con chips + botón +)

**ELIMINAR:**
- Paso "Últimos detalles" con datos físicos
- Campos de peso, altura, fecha nacimiento (ya están en registro)

### 4. PERFIL EDITABLE IN-PLACE
**Archivo:** `components/mobile/profile-screen.tsx`

**Cambios en sección de perfil:**

**Estado normal (no editando):**
```tsx
<div className="profile-header">
  <Avatar src={avatar} />
  <h2>{nombre}</h2>
  <p>{ubicacion}</p>
  <p>{edad} años</p>
  <div className="chips">
    {objetivos.map(obj => <Chip>{obj}</Chip>)}
  </div>
  <div className="chips">
    {deportes.map(dep => <Chip>{dep}</Chip>)}
  </div>
  <Button onClick={() => setIsEditing(true)}>Editar</Button>
</div>
```

**Estado editando:**
```tsx
<div className="profile-header expanded">
  <div className="avatar-edit">
    <Avatar src={avatar} />
    <Button className="change-avatar">+</Button>
  </div>
  <Input value={nombre} onChange={...} />
  <Input value={ubicacion} onChange={...} placeholder="Ubicación" />
  <Input type="number" value={edad} onChange={...} />
  
  <div className="editable-chips">
    <label>Objetivos</label>
    {objetivos.map(obj => (
      <Chip>
        {obj}
        <button className="remove">-</button>
      </Chip>
    ))}
    <button className="add-chip">+</button>
  </div>
  
  <div className="editable-chips">
    <label>Deportes</label>
    {deportes.map(dep => (
      <Chip>
        {dep}
        <button className="remove">-</button>
      </Chip>
    ))}
    <button className="add-chip">+</button>
  </div>
  
  <div className="actions">
    <Button onClick={handleCancel}>Cancelar</Button>
    <Button onClick={handleSave}>Guardar</Button>
  </div>
</div>
```

**Funcionalidad de foto:**
- Al hacer click en `+`: Abrir file picker
- Upload a Supabase Storage
- Eliminar foto anterior del storage
- Actualizar URL en `user_profiles.avatar_url`

### 5. CUESTIONARIO (ÍCONO)
**Archivo:** `components/mobile/onboarding-modal.tsx`
- Cuando se abre desde el ícono de perfil
- Solo mostrar las 6 preguntas de preferencias
- NO mostrar paso final con foto/ubicación/deportes/lesiones
- Guardar solo en `client_onboarding_responses`

## Archivos a Modificar

1. `app/(auth)/signup/page.tsx` - Agregar campos edad, altura, peso
2. `components/mobile/onboarding-prompt-modal.tsx` - CREAR NUEVO
3. `components/mobile/onboarding-modal.tsx` - Simplificar pasos
4. `components/mobile/profile-screen.tsx` - Perfil editable in-place
5. `components/mobile/profile-edit-modal.tsx` - ELIMINAR (ya no se usa)
6. `hooks/client/use-profile-management.ts` - Agregar funciones para editar in-place

## Base de Datos

**Tabla `clients`:**
- Ya tiene: height (Height), weight, birth_date (Genre)
- Calcular edad desde birth_date

**Tabla `user_profiles`:**
- avatar_url
- full_name
- location (agregar si no existe)

**Tabla `client_onboarding_responses`:**
- Solo preferencias de entrenamiento
- NO datos físicos ni personales

## Flujo de Usuario

1. **Registro** → Completa nombre, email, contraseña, edad, altura, peso
2. **Post-registro** → Modal: "¿Completar cuestionario?"
   - SÍ → Abre cuestionario completo (6 preguntas + paso final)
   - NO → Va directo al home
3. **Perfil** → Click "Editar" → Sección se expande in-place
4. **Cuestionario (ícono)** → Solo 6 preguntas de preferencias

## Prioridad de Implementación

1. ✅ Agregar campos a signup (edad, altura, peso)
2. ✅ Crear modal de prompt post-registro
3. ✅ Simplificar cuestionario (eliminar "Últimos detalles")
4. ✅ Modificar paso final del cuestionario
5. ✅ Implementar perfil editable in-place
6. ✅ Eliminar ProfileEditModal
7. ✅ Agregar funcionalidad de cambio de foto
