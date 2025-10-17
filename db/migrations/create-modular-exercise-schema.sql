-- =====================================================
-- NUEVO ESQUEMA MODULAR PARA GESTIÓN DE RUTINAS OMNIA
-- =====================================================
-- Este script crea el nuevo esquema modular que reemplaza
-- las tablas actuales por un sistema más escalable y automatizado

-- =====================================================
-- 1. EJERCICIOS_DETALLES
-- =====================================================
-- Reemplaza: fitness_exercises
-- Plantillas de ejercicios base replicables

CREATE TABLE IF NOT EXISTS ejercicios_detalles (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    nombre_ejercicio TEXT NOT NULL,
    tipo TEXT NOT NULL, -- fuerza, cardio, movilidad, etc.
    descripcion TEXT,
    equipo TEXT, -- mancuernas, banda, peso corporal, etc.
    variantes JSONB, -- [{reps: 12, series: 3, peso: 10}, {reps: 8, series: 4, peso: 15}]
    body_parts TEXT, -- pecho;tríceps;hombros (separado por punto y coma)
    replicar BOOLEAN DEFAULT TRUE, -- ¿Puede ser replicado como plantilla?
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_tipo CHECK (tipo IN ('fuerza', 'cardio', 'movilidad', 'flexibilidad', 'equilibrio', 'otro')),
    CONSTRAINT valid_variantes CHECK (jsonb_typeof(variantes) = 'array' OR variantes IS NULL)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_activity_id ON ejercicios_detalles(activity_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_tipo ON ejercicios_detalles(tipo);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_replicar ON ejercicios_detalles(replicar);
CREATE INDEX IF NOT EXISTS idx_ejercicios_detalles_body_parts ON ejercicios_detalles USING gin(to_tsvector('spanish', body_parts));

-- =====================================================
-- 2. ORGANIZACIÓN_EJERCICIOS
-- =====================================================
-- Organiza ejercicios por día/semana/bloque dentro de una plantilla

CREATE TABLE IF NOT EXISTS organizacion_ejercicios (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    bloque TEXT NOT NULL, -- Mañana, Tarde, Noche
    dia INTEGER NOT NULL, -- Día relativo (1-7 para semana, 1-30 para mes, etc.)
    semana INTEGER NOT NULL, -- Semana relativa (1, 2, 3, etc.)
    numero_periodo INTEGER NOT NULL, -- Etapa lógica (sustituye al "mes")
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_bloque CHECK (bloque IN ('Mañana', 'Tarde', 'Noche')),
    CONSTRAINT valid_dia CHECK (dia >= 1 AND dia <= 31),
    CONSTRAINT valid_semana CHECK (semana >= 1 AND semana <= 52),
    CONSTRAINT valid_numero_periodo CHECK (numero_periodo >= 1),
    
    -- Un ejercicio no puede estar duplicado en el mismo día/semana/período/bloque
    UNIQUE(activity_id, ejercicio_id, dia, semana, numero_periodo, bloque)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_activity_id ON organizacion_ejercicios(activity_id);
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_ejercicio_id ON organizacion_ejercicios(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_periodo ON organizacion_ejercicios(numero_periodo, semana, dia);
CREATE INDEX IF NOT EXISTS idx_organizacion_ejercicios_bloque ON organizacion_ejercicios(bloque);

-- =====================================================
-- 3. ACTIVITY_ENROLLMENTS (ACTUALIZACIÓN)
-- =====================================================
-- Mantiene relación cliente-actividad, se agrega lógica nueva

-- Agregar columnas nuevas si no existen
DO $$ 
BEGIN
    -- Agregar expiration_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_enrollments' 
        AND column_name = 'expiration_date'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD COLUMN expiration_date DATE;
    END IF;
    
    -- Asegurar que status tenga el constraint correcto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'activity_enrollments_status_check'
    ) THEN
        ALTER TABLE activity_enrollments 
        ADD CONSTRAINT activity_enrollments_status_check 
        CHECK (status IN ('pendiente', 'activa', 'finalizada', 'pausada', 'cancelada'));
    END IF;
END $$;

-- =====================================================
-- 4. PERIODOS_ASIGNADOS
-- =====================================================
-- Una vez iniciado un enrollment, se generan periodos replicados por cliente

CREATE TABLE IF NOT EXISTS periodos_asignados (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES activity_enrollments(id) ON DELETE CASCADE,
    numero_periodo INTEGER NOT NULL, -- 1, 2, 3...
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_numero_periodo CHECK (numero_periodo >= 1),
    CONSTRAINT valid_fechas CHECK (fecha_fin >= fecha_inicio),
    
    -- Un enrollment no puede tener períodos duplicados
    UNIQUE(enrollment_id, numero_periodo)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_enrollment_id ON periodos_asignados(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_fechas ON periodos_asignados(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_periodos_asignados_numero_periodo ON periodos_asignados(numero_periodo);

-- =====================================================
-- 5. EJECUCIONES_EJERCICIO
-- =====================================================
-- Instancia concreta de un ejercicio planificado + resultado

CREATE TABLE IF NOT EXISTS ejecuciones_ejercicio (
    id SERIAL PRIMARY KEY,
    periodo_id INTEGER NOT NULL REFERENCES periodos_asignados(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    intensidad_aplicada TEXT NOT NULL, -- Nombre de preset de intensidad
    duracion INTEGER, -- Minutos
    calorias_estimadas INTEGER, -- Calorías
    fecha_ejecucion DATE NOT NULL, -- Fecha del ejercicio (calculada)
    completado BOOLEAN DEFAULT FALSE,
    
    -- Datos adicionales de ejecución
    peso_usado DECIMAL(5,2), -- Peso real usado
    repeticiones_realizadas INTEGER, -- Reps reales
    series_completadas INTEGER, -- Series reales
    tiempo_real_segundos INTEGER, -- Tiempo real de ejecución
    nota_cliente TEXT, -- Notas del cliente
    nota_coach TEXT, -- Notas del coach
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_duracion CHECK (duracion IS NULL OR duracion > 0),
    CONSTRAINT valid_calorias CHECK (calorias_estimadas IS NULL OR calorias_estimadas >= 0),
    CONSTRAINT valid_peso CHECK (peso_usado IS NULL OR peso_usado >= 0),
    CONSTRAINT valid_repeticiones CHECK (repeticiones_realizadas IS NULL OR repeticiones_realizadas >= 0),
    CONSTRAINT valid_series CHECK (series_completadas IS NULL OR series_completadas >= 0),
    CONSTRAINT valid_tiempo CHECK (tiempo_real_segundos IS NULL OR tiempo_real_segundos >= 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_periodo_id ON ejecuciones_ejercicio(periodo_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_ejercicio_id ON ejecuciones_ejercicio(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_fecha ON ejecuciones_ejercicio(fecha_ejecucion);
CREATE INDEX IF NOT EXISTS idx_ejecuciones_ejercicio_completado ON ejecuciones_ejercicio(completado);

-- =====================================================
-- 6. INTENSIDADES
-- =====================================================
-- Presets personalizables por coach para aplicar a ejercicios

CREATE TABLE IF NOT EXISTS intensidades (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios_detalles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL, -- "Principiante", "Avanzado", "Intermedio"
    orden INTEGER NOT NULL, -- Nivel de dificultad (1, 2, 3...)
    
    -- Parámetros de intensidad
    reps INTEGER, -- Repeticiones sugeridas
    series INTEGER, -- Series sugeridas
    peso DECIMAL(5,2), -- Peso sugerido
    duracion_minutos INTEGER, -- Duración para ejercicios de tiempo
    descanso_segundos INTEGER, -- Tiempo de descanso entre series
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_orden CHECK (orden >= 1),
    CONSTRAINT valid_reps CHECK (reps IS NULL OR reps > 0),
    CONSTRAINT valid_series CHECK (series IS NULL OR series > 0),
    CONSTRAINT valid_peso CHECK (peso IS NULL OR peso >= 0),
    CONSTRAINT valid_duracion CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),
    CONSTRAINT valid_descanso CHECK (descanso_segundos IS NULL OR descanso_segundos >= 0),
    
    -- Un ejercicio no puede tener intensidades duplicadas con el mismo nombre
    UNIQUE(ejercicio_id, nombre)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_intensidades_ejercicio_id ON intensidades(ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_intensidades_orden ON intensidades(orden);
CREATE INDEX IF NOT EXISTS idx_intensidades_nombre ON intensidades(nombre);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en todas las tablas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas nuevas
CREATE TRIGGER trigger_ejercicios_detalles_updated_at
    BEFORE UPDATE ON ejercicios_detalles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_organizacion_ejercicios_updated_at
    BEFORE UPDATE ON organizacion_ejercicios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_periodos_asignados_updated_at
    BEFORE UPDATE ON periodos_asignados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ejecuciones_ejercicio_updated_at
    BEFORE UPDATE ON ejecuciones_ejercicio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_intensidades_updated_at
    BEFORE UPDATE ON intensidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE ejercicios_detalles IS 'Plantillas de ejercicios base replicables que pueden ser utilizadas en múltiples actividades';
COMMENT ON TABLE organizacion_ejercicios IS 'Organiza ejercicios por día/semana/bloque dentro de una plantilla de actividad';
COMMENT ON TABLE periodos_asignados IS 'Períodos de entrenamiento asignados a un cliente específico basados en su enrollment';
COMMENT ON TABLE ejecuciones_ejercicio IS 'Instancias concretas de ejercicios ejecutados por clientes con resultados y métricas';
COMMENT ON TABLE intensidades IS 'Presets de intensidad personalizables por coach para aplicar a ejercicios específicos';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas nuevas
ALTER TABLE ejercicios_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizacion_ejercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_asignados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejecuciones_ejercicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE intensidades ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (se pueden expandir según necesidades)
-- Los coaches pueden gestionar sus propios ejercicios
CREATE POLICY "Coaches can manage their own exercises" ON ejercicios_detalles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM activities 
            WHERE id = activity_id 
            AND coach_id = auth.uid()
        )
    );

-- Los clientes pueden ver ejercicios de actividades en las que están inscritos
CREATE POLICY "Clients can view exercises from their activities" ON ejercicios_detalles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_enrollments ae
            JOIN activities a ON a.id = ae.activity_id
            WHERE a.id = activity_id 
            AND ae.client_id = auth.uid()
        )
    );

-- Políticas similares para las otras tablas...
-- (Se pueden expandir según las necesidades específicas de seguridad)

RAISE NOTICE 'Esquema modular creado exitosamente. Tablas: ejercicios_detalles, organizacion_ejercicios, periodos_asignados, ejecuciones_ejercicio, intensidades';
