-- =====================================================
-- CONFIGURACIÓN FINAL DE RELACIONES Y CLAVES FORÁNEAS
-- =====================================================
-- Este script configura todas las relaciones finales, índices adicionales
-- y políticas de seguridad para el esquema modular

-- =====================================================
-- 1. VERIFICAR Y COMPLETAR CLAVES FORÁNEAS
-- =====================================================

-- Verificar que todas las claves foráneas estén correctamente configuradas
DO $$
BEGIN
    -- Verificar ejercicios_detalles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ejercicios_detalles_activity_id_fkey'
    ) THEN
        ALTER TABLE ejercicios_detalles 
        ADD CONSTRAINT ejercicios_detalles_activity_id_fkey 
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar organizacion_ejercicios
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizacion_ejercicios_activity_id_fkey'
    ) THEN
        ALTER TABLE organizacion_ejercicios 
        ADD CONSTRAINT organizacion_ejercicios_activity_id_fkey 
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizacion_ejercicios_ejercicio_id_fkey'
    ) THEN
        ALTER TABLE organizacion_ejercicios 
        ADD CONSTRAINT organizacion_ejercicios_ejercicio_id_fkey 
        FOREIGN KEY (ejercicio_id) REFERENCES ejercicios_detalles(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar periodos_asignados
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'periodos_asignados_enrollment_id_fkey'
    ) THEN
        ALTER TABLE periodos_asignados 
        ADD CONSTRAINT periodos_asignados_enrollment_id_fkey 
        FOREIGN KEY (enrollment_id) REFERENCES activity_enrollments(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar ejecuciones_ejercicio
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ejecuciones_ejercicio_periodo_id_fkey'
    ) THEN
        ALTER TABLE ejecuciones_ejercicio 
        ADD CONSTRAINT ejecuciones_ejercicio_periodo_id_fkey 
        FOREIGN KEY (periodo_id) REFERENCES periodos_asignados(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ejecuciones_ejercicio_ejercicio_id_fkey'
    ) THEN
        ALTER TABLE ejecuciones_ejercicio 
        ADD CONSTRAINT ejecuciones_ejercicio_ejercicio_id_fkey 
        FOREIGN KEY (ejercicio_id) REFERENCES ejercicios_detalles(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar intensidades
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'intensidades_ejercicio_id_fkey'
    ) THEN
        ALTER TABLE intensidades 
        ADD CONSTRAINT intensidades_ejercicio_id_fkey 
        FOREIGN KEY (ejercicio_id) REFERENCES ejercicios_detalles(id) ON DELETE CASCADE;
    END IF;
    
    RAISE NOTICE 'Claves foráneas verificadas y configuradas correctamente';
END $$;

-- =====================================================
-- 2. CREAR ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

-- Índices para consultas de búsqueda y filtrado (corregidos)
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_nombre_text 
    ON ejercicios_detalles(nombre_ejercicio) 
    WHERE nombre_ejercicio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_descripcion_text 
    ON ejercicios_detalles(descripcion) 
    WHERE descripcion IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_periodo_ejercicio 
    ON ejecuciones_ejercicio(periodo_id, ejercicio_id);

CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_bloque_dia 
    ON organizacion_ejercicios(bloque, dia, semana);

CREATE INDEX IF NOT EXISTS idx_periodos_asignados_fecha_inicio 
    ON periodos_asignados(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_periodos_asignados_fecha_fin 
    ON periodos_asignados(fecha_fin);

-- Índices para consultas de estadísticas
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_completado_fecha 
    ON ejecuciones_ejercicio(completado, fecha_ejecucion);

CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_calorias 
    ON ejecuciones_ejercicio(calorias_estimadas) WHERE calorias_estimadas IS NOT NULL;

-- =====================================================
-- 3. CONFIGURAR POLÍTICAS DE SEGURIDAD (RLS) COMPLETAS
-- =====================================================

-- Políticas para ejercicios_detalles
DROP POLICY IF EXISTS "Coaches can manage their own exercises" ON ejercicios_detalles;
CREATE POLICY "Coaches can manage their own exercises" ON ejercicios_detalles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activities 
            WHERE id = activity_id 
            AND coach_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clients can view exercises from their activities" ON ejercicios_detalles;
CREATE POLICY "Clients can view exercises from their activities" ON ejercicios_detalles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_enrollments ae
            JOIN activities a ON a.id = ae.activity_id
            WHERE a.id = activity_id 
            AND ae.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Public exercises are viewable by everyone" ON ejercicios_detalles;
CREATE POLICY "Public exercises are viewable by everyone" ON ejercicios_detalles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activities 
            WHERE id = activity_id 
            AND is_public = true
        )
    );

-- Políticas para organizacion_ejercicios
DROP POLICY IF EXISTS "Coaches can manage exercise organization" ON organizacion_ejercicios;
CREATE POLICY "Coaches can manage exercise organization" ON organizacion_ejercicios
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activities 
            WHERE id = activity_id 
            AND coach_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clients can view exercise organization" ON organizacion_ejercicios;
CREATE POLICY "Clients can view exercise organization" ON organizacion_ejercicios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_enrollments ae
            JOIN activities a ON a.id = ae.activity_id
            WHERE a.id = activity_id 
            AND ae.client_id = auth.uid()
        )
    );

-- Políticas para periodos_asignados
DROP POLICY IF EXISTS "Clients can view their own periods" ON periodos_asignados;
CREATE POLICY "Clients can view their own periods" ON periodos_asignados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_enrollments ae
            WHERE ae.id = enrollment_id 
            AND ae.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Coaches can view periods of their clients" ON periodos_asignados;
CREATE POLICY "Coaches can view periods of their clients" ON periodos_asignados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_enrollments ae
            JOIN activities a ON a.id = ae.activity_id
            WHERE ae.id = enrollment_id 
            AND a.coach_id = auth.uid()
        )
    );

-- Políticas para ejecuciones_ejercicio
DROP POLICY IF EXISTS "Clients can manage their own executions" ON ejecuciones_ejercicio;
CREATE POLICY "Clients can manage their own executions" ON ejecuciones_ejercicio
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM periodos_asignados pa
            JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
            WHERE pa.id = periodo_id 
            AND ae.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Coaches can view executions of their clients" ON ejecuciones_ejercicio;
CREATE POLICY "Coaches can view executions of their clients" ON ejecuciones_ejercicio
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM periodos_asignados pa
            JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
            JOIN activities a ON a.id = ae.activity_id
            WHERE pa.id = periodo_id 
            AND a.coach_id = auth.uid()
        )
    );

-- Políticas para intensidades
DROP POLICY IF EXISTS "Coaches can manage intensities" ON intensidades;
CREATE POLICY "Coaches can manage intensities" ON intensidades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ejercicios_detalles ed
            JOIN activities a ON a.id = ed.activity_id
            WHERE ed.id = ejercicio_id 
            AND a.coach_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Clients can view intensities" ON intensidades;
CREATE POLICY "Clients can view intensities" ON intensidades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ejercicios_detalles ed
            JOIN activities a ON a.id = ed.activity_id
            JOIN activity_enrollments ae ON ae.activity_id = a.id
            WHERE ed.id = ejercicio_id 
            AND ae.client_id = auth.uid()
        )
    );

-- =====================================================
-- 4. CREAR VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista para obtener ejercicios del día con toda la información
CREATE OR REPLACE VIEW ejercicios_del_dia_completo AS
SELECT 
    ee.id as ejecucion_id,
    ee.periodo_id,
    ee.ejercicio_id,
    ed.nombre_ejercicio,
    ed.tipo,
    ed.descripcion,
    ed.equipo,
    ed.variantes,
    ed.body_parts,
    ee.intensidad_aplicada,
    ee.duracion,
    ee.calorias_estimadas,
    ee.fecha_ejecucion,
    ee.completado,
    ee.peso_usado,
    ee.repeticiones_realizadas,
    ee.series_completadas,
    ee.tiempo_real_segundos,
    ee.nota_cliente,
    ee.nota_coach,
    ee.completed_at,
    pa.numero_periodo,
    oe.bloque,
    oe.dia,
    oe.semana,
    ae.client_id,
    ae.activity_id,
    a.title as activity_title,
    a.coach_id
FROM ejecuciones_ejercicio ee
JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
JOIN periodos_asignados pa ON pa.id = ee.periodo_id
JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
JOIN activities a ON a.id = ae.activity_id
LEFT JOIN organizacion_ejercicios oe ON (
    oe.activity_id = a.id 
    AND oe.ejercicio_id = ed.id
    AND oe.numero_periodo = pa.numero_periodo
);

-- Vista para estadísticas de progreso por cliente
CREATE OR REPLACE VIEW progreso_cliente_resumen AS
SELECT 
    ae.client_id,
    ae.activity_id,
    a.title as activity_title,
    COUNT(ee.id) as total_ejecuciones,
    COUNT(ee.id) FILTER (WHERE ee.completado = true) as ejecuciones_completadas,
    ROUND(
        (COUNT(ee.id) FILTER (WHERE ee.completado = true)::DECIMAL / 
         NULLIF(COUNT(ee.id), 0)) * 100, 2
    ) as porcentaje_completado,
    COALESCE(SUM(ee.calorias_estimadas), 0) as calorias_totales,
    COALESCE(SUM(ee.duracion), 0) as tiempo_total_minutos,
    MIN(pa.fecha_inicio) as fecha_inicio_programa,
    MAX(pa.fecha_fin) as fecha_fin_programa,
    COUNT(DISTINCT pa.id) as total_periodos
FROM activity_enrollments ae
JOIN activities a ON a.id = ae.activity_id
JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id
WHERE ae.status = 'activa'
GROUP BY ae.client_id, ae.activity_id, a.title;

-- Vista para estadísticas de coach
CREATE OR REPLACE VIEW estadisticas_coach AS
SELECT 
    a.coach_id,
    COUNT(DISTINCT a.id) as total_actividades,
    COUNT(DISTINCT ae.client_id) as total_clientes,
    COUNT(DISTINCT ed.id) as total_ejercicios,
    COUNT(ee.id) FILTER (WHERE ee.completado = true) as ejecuciones_completadas,
    COUNT(ee.id) as total_ejecuciones,
    ROUND(
        (COUNT(ee.id) FILTER (WHERE ee.completado = true)::DECIMAL / 
         NULLIF(COUNT(ee.id), 0)) * 100, 2
    ) as porcentaje_completado_promedio,
    COALESCE(SUM(ee.calorias_estimadas), 0) as calorias_totales_clientes
FROM activities a
LEFT JOIN activity_enrollments ae ON ae.activity_id = a.id
LEFT JOIN ejercicios_detalles ed ON ed.activity_id = a.id
LEFT JOIN organizacion_ejercicios oe ON oe.activity_id = a.id
LEFT JOIN periodos_asignados pa ON pa.enrollment_id = ae.id
LEFT JOIN ejecuciones_ejercicio ee ON ee.periodo_id = pa.id
GROUP BY a.coach_id;

-- =====================================================
-- 5. CREAR FUNCIONES DE UTILIDAD ADICIONALES
-- =====================================================

-- Función para obtener el próximo ejercicio de un cliente
CREATE OR REPLACE FUNCTION obtener_proximo_ejercicio_cliente(
    p_client_id UUID
) RETURNS TABLE (
    ejecucion_id INTEGER,
    ejercicio_id INTEGER,
    nombre_ejercicio TEXT,
    fecha_ejecucion DATE,
    tipo TEXT,
    intensidad_aplicada TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ee.id,
        ee.ejercicio_id,
        ed.nombre_ejercicio,
        ee.fecha_ejecucion,
        ed.tipo,
        ee.intensidad_aplicada
    FROM ejecuciones_ejercicio ee
    JOIN ejercicios_detalles ed ON ed.id = ee.ejercicio_id
    JOIN periodos_asignados pa ON pa.id = ee.periodo_id
    JOIN activity_enrollments ae ON ae.id = pa.enrollment_id
    WHERE ae.client_id = p_client_id
    AND ee.completado = false
    AND ee.fecha_ejecucion >= CURRENT_DATE
    ORDER BY ee.fecha_ejecucion ASC, ed.tipo, ed.nombre_ejercicio
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar ejercicio como completado con validación
CREATE OR REPLACE FUNCTION marcar_ejercicio_completado(
    p_ejecucion_id INTEGER,
    p_peso_usado DECIMAL(5,2) DEFAULT NULL,
    p_repeticiones INTEGER DEFAULT NULL,
    p_series INTEGER DEFAULT NULL,
    p_tiempo_segundos INTEGER DEFAULT NULL,
    p_nota_cliente TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_ejecucion RECORD;
    v_resultado JSONB;
BEGIN
    -- Obtener la ejecución
    SELECT * INTO v_ejecucion
    FROM ejecuciones_ejercicio
    WHERE id = p_ejecucion_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ejecución no encontrada',
            'ejecucion_id', p_ejecucion_id
        );
    END IF;
    
    -- Actualizar la ejecución
    UPDATE ejecuciones_ejercicio
    SET 
        completado = true,
        peso_usado = COALESCE(p_peso_usado, peso_usado),
        repeticiones_realizadas = COALESCE(p_repeticiones, repeticiones_realizadas),
        series_completadas = COALESCE(p_series, series_completadas),
        tiempo_real_segundos = COALESCE(p_tiempo_segundos, tiempo_real_segundos),
        nota_cliente = COALESCE(p_nota_cliente, nota_cliente),
        completed_at = NOW()
    WHERE id = p_ejecucion_id;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'ejecucion_id', p_ejecucion_id,
        'completado', true,
        'completed_at', NOW()
    );
    
    RETURN v_resultado;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CONFIGURAR PERMISOS Y ROLES
-- =====================================================

-- Crear roles específicos si no existen
DO $$
BEGIN
    -- Rol para coaches
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'coach_role') THEN
        CREATE ROLE coach_role;
    END IF;
    
    -- Rol para clientes
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'client_role') THEN
        CREATE ROLE client_role;
    END IF;
    
    RAISE NOTICE 'Roles creados: coach_role, client_role';
END $$;

-- =====================================================
-- 7. CREAR ÍNDICES DE RENDIMIENTO FINALES
-- =====================================================

-- Índices para consultas de calendario
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_calendario 
    ON ejecuciones_ejercicio(fecha_ejecucion, completado) 
    WHERE fecha_ejecucion >= CURRENT_DATE - INTERVAL '30 days';

-- Índices para consultas de progreso
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_progreso 
    ON ejecuciones_ejercicio(periodo_id, completado, fecha_ejecucion);

-- Índices para búsquedas de ejercicios (corregido)
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_busqueda_completa 
    ON ejercicios_detalles(nombre_ejercicio, descripcion, equipo, body_parts) 
    WHERE nombre_ejercicio IS NOT NULL;

-- =====================================================
-- 8. VERIFICACIÓN FINAL DEL ESQUEMA
-- =====================================================

-- Crear función para verificar la integridad del esquema
CREATE OR REPLACE FUNCTION verificar_esquema_modular()
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
    v_tablas_existentes INTEGER;
    v_indices_existentes INTEGER;
    v_funciones_existentes INTEGER;
    v_triggers_existentes INTEGER;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO v_tablas_existentes
    FROM information_schema.tables
    WHERE table_name IN (
        'ejercicios_detalles', 
        'organizacion_ejercicios', 
        'periodos_asignados', 
        'ejecuciones_ejercicio', 
        'intensidades'
    );
    
    -- Contar índices
    SELECT COUNT(*) INTO v_indices_existentes
    FROM pg_indexes
    WHERE tablename IN (
        'ejercicios_detalles', 
        'organizacion_ejercicios', 
        'periodos_asignados', 
        'ejecuciones_ejercicio', 
        'intensidades'
    );
    
    -- Contar funciones
    SELECT COUNT(*) INTO v_funciones_existentes
    FROM information_schema.routines
    WHERE routine_name LIKE '%modular%' 
    OR routine_name LIKE '%periodo%'
    OR routine_name LIKE '%ejecucion%';
    
    -- Contar triggers
    SELECT COUNT(*) INTO v_triggers_existentes
    FROM information_schema.triggers
    WHERE trigger_name LIKE '%modular%'
    OR trigger_name LIKE '%periodo%'
    OR trigger_name LIKE '%ejecucion%';
    
    v_resultado := jsonb_build_object(
        'esquema_completo', v_tablas_existentes = 5,
        'tablas_creadas', v_tablas_existentes,
        'indices_creados', v_indices_existentes,
        'funciones_creadas', v_funciones_existentes,
        'triggers_creados', v_triggers_existentes,
        'fecha_verificacion', NOW()
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación
SELECT verificar_esquema_modular();

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON VIEW ejercicios_del_dia_completo IS 'Vista completa con todos los ejercicios del día incluyendo información de período y organización';
COMMENT ON VIEW progreso_cliente_resumen IS 'Resumen de progreso por cliente con estadísticas agregadas';
COMMENT ON VIEW estadisticas_coach IS 'Estadísticas generales por coach con métricas de rendimiento';
COMMENT ON FUNCTION obtener_proximo_ejercicio_cliente IS 'Obtiene el próximo ejercicio pendiente para un cliente';
COMMENT ON FUNCTION marcar_ejercicio_completado IS 'Marca un ejercicio como completado con validación y datos adicionales';
COMMENT ON FUNCTION verificar_esquema_modular IS 'Verifica la integridad y completitud del esquema modular';

RAISE NOTICE 'Configuración final del esquema modular completada exitosamente';
RAISE NOTICE 'Esquema listo para uso en producción con todas las relaciones, índices y políticas configuradas';
