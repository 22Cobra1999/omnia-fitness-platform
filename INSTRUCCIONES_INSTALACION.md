# 🚀 Instrucciones de Instalación - Esquema Modular OMNIA

## ⚠️ IMPORTANTE: Antes de Empezar

1. **HACER BACKUP COMPLETO** de tu base de datos:
```bash
pg_dump tu_base_de_datos > backup_antes_modular.sql
```

2. **Verificar que tienes permisos** de DDL (CREATE, ALTER, DROP) en la base de datos

## 🔧 Solución a los Errores Encontrados

### Error 1: `relation "fitness_program_details" does not exist`
**Causa**: La tabla no existe en tu base de datos actual
**Solución**: Ejecutar primero `setup-base-tables.sql`

### Error 2: `functions in index predicate must be marked IMMUTABLE`
**Causa**: Índices con funciones `to_tsvector()` que no son inmutables
**Solución**: Corregido en los archivos actualizados

## 📋 Pasos de Instalación Corregidos

### Opción 1: Instalación Automática (Recomendada)

```bash
# Conectarse a la base de datos
psql -d tu_base_de_datos -U tu_usuario

# Ejecutar instalación completa
\i db/install-complete-modular-schema.sql
```

### Opción 2: Instalación Manual (Paso a Paso)

Si prefieres ejecutar paso a paso para mayor control:

```sql
-- 1. Configurar tablas base
\i db/setup-base-tables.sql

-- 2. Crear esquema modular
\i db/create-modular-exercise-schema.sql

-- 3. Crear funciones auxiliares
\i db/create-modular-functions.sql

-- 4. Crear triggers de automatización
\i db/create-modular-triggers.sql

-- 5. Migrar datos existentes (corregido)
\i db/fix-migration-errors.sql

-- 6. Configurar relaciones finales
\i db/configure-modular-schema-relationships.sql
```

## 🔍 Verificación Post-Instalación

Después de la instalación, verifica que todo funcionó:

```sql
-- Verificar que las tablas fueron creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
    'ejercicios_detalles', 
    'organizacion_ejercicios', 
    'periodos_asignados', 
    'ejecuciones_ejercicio', 
    'intensidades'
);

-- Verificar funciones principales
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%periodo%' 
   OR routine_name LIKE '%ejecucion%';

-- Verificar datos migrados
SELECT 
    (SELECT COUNT(*) FROM ejercicios_detalles) as ejercicios,
    (SELECT COUNT(*) FROM organizacion_ejercicios) as organizaciones,
    (SELECT COUNT(*) FROM periodos_asignados) as periodos,
    (SELECT COUNT(*) FROM ejecuciones_ejercicio) as ejecuciones,
    (SELECT COUNT(*) FROM intensidades) as intensidades;
```

## 🎯 Pruebas Básicas

### 1. Probar función principal
```sql
-- Si tienes un enrollment activo, prueba generar períodos
SELECT generar_periodos_para_enrollment(1);
```

### 2. Probar vista de ejercicios
```sql
-- Ver ejercicios del día (reemplaza con un client_id real)
SELECT * FROM ejercicios_del_dia_completo 
WHERE client_id = 'tu-client-id' 
LIMIT 5;
```

### 3. Probar función de progreso
```sql
-- Ver progreso de un cliente (reemplaza con IDs reales)
SELECT * FROM progreso_cliente_resumen 
WHERE client_id = 'tu-client-id' 
LIMIT 5;
```

## 🚨 Solución de Problemas

### Si encuentras errores de permisos:
```sql
-- Otorgar permisos necesarios
GRANT CREATE ON DATABASE tu_base_de_datos TO tu_usuario;
GRANT USAGE ON SCHEMA public TO tu_usuario;
```

### Si las tablas no se crean:
1. Verificar que `activities` y `activity_enrollments` existen
2. Ejecutar primero `setup-base-tables.sql`
3. Verificar permisos de DDL

### Si la migración falla:
1. Verificar que `fitness_program_details` tiene datos
2. Ejecutar `fix-migration-errors.sql` que maneja casos vacíos
3. Revisar logs de PostgreSQL para errores específicos

## 📊 Archivos Corregidos

Los siguientes archivos han sido corregidos para solucionar los errores:

- ✅ `fix-migration-errors.sql` - Migración corregida con validaciones
- ✅ `configure-modular-schema-relationships.sql` - Índices corregidos
- ✅ `setup-base-tables.sql` - Crea tablas base necesarias
- ✅ `install-complete-modular-schema.sql` - Instalación completa corregida

## 🎉 Después de la Instalación

Una vez instalado correctamente, tendrás:

- ✅ **5 nuevas tablas** del esquema modular
- ✅ **6 funciones principales** automatizadas
- ✅ **9 triggers** que automatizan el flujo
- ✅ **3 vistas útiles** para consultas
- ✅ **Datos migrados** desde las tablas antiguas
- ✅ **Seguridad configurada** con RLS

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs** de PostgreSQL para errores específicos
2. **Verificar permisos** de usuario en la base de datos
3. **Comprobar que las tablas base** (`activities`, `activity_enrollments`) existen
4. **Ejecutar paso a paso** en lugar del script completo

---

**¡El nuevo esquema modular está listo para transformar OMNIA!** 🚀
