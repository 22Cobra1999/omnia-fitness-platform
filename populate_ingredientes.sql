-- Query para popular la columna ingredientes en progreso_cliente_nutricion
-- Basado en los platos de nutrition_program_details
-- Estructura: {"plato_key": "ingrediente1; ingrediente2; ..."}
-- NOTA: Los keys en ejercicios_pendientes son del formato "ejercicio_id_orden" (ej: "753_1")
-- y dentro de cada objeto hay un campo "ejercicio_id" que contiene el ID real del plato

DO $$
DECLARE
  ingredientes_map JSONB := jsonb_build_object(
    '749', 'Açaí 200g; Granola 50g; Plátano 1 unidad; Fresas 100g; Miel 15g',
    '750', 'Pan integral 2 rebanadas; Aguacate 1 unidad; Huevo 1 unidad; Tomate 100g',
    '751', 'Avena 80g; Proteína en polvo 1 scoop; Sirope sin azúcar 20ml; Frutas frescas 150g',
    '752', 'Espinacas 50g; Kale 50g; Plátano 1 unidad; Manzana verde 1 unidad; Agua de coco 200ml',
    '753', 'Tortilla integral 1 unidad; Pollo 150g; Lechuga 50g; Parmesano 30g; Aderezo césar 20ml',
    '758', 'Garbanzos 200g; Espinacas 100g; Tomate 150g; Leche de coco 100ml; Especias curry 10g; Arroz basmati 100g',
    '759', 'Arroz sushi 150g; Salmón 120g; Edamame 80g; Pepino 100g; Aguacate 80g; Alga nori 2 hojas; Salsa soja 15ml',
    '760', 'Masa integral 150g; Pollo pechuga 150g; Salsa BBQ 30ml; Cebolla morada 50g; Queso light 50g',
    '761', 'Tofu 150g; Brócoli 150g; Pimientos 100g; Zanahoria 100g; Salsa teriyaki 30ml; Arroz integral 100g',
    '762', 'Mango congelado 200g; Yogurt griego 150g; Granola 40g; Coco rallado 20g; Chía 10g',
    '764', 'Avena 50g; Proteína en polvo 1 scoop; Frutos rojos 100g; Almendras 20g',
    '765', 'Pechuga de pollo 200g; Quinoa 100g; Ensalada verde 150g; Limón 1 unidad',
    '766', 'Salmón 200g; Brócoli 150g; Zanahorias 100g; Limón 1 unidad; Eneldo 5g',
    '767', 'Yogur griego natural 200g; Nueces 30g; Stevia al gusto',
    '768', 'Pan integral 2 rebanadas; Aguacate 0.5 unidad; Huevos 2 unidades; Semillas de chía 5g',
    '769', 'Atún en agua 150g; Garbanzos cocidos 100g; Lechuga 80g; Tomate 100g; Pepino 80g; Cebolla 50g; Aceite de oliva 10ml',
    '770', 'Proteína en polvo 1 scoop; Plátano 0.5 unidad; Leche desnatada 200ml',
    '771', 'Avena molida 60g; Plátano 1 unidad; Huevos 2 unidades; Frutos rojos 100g; Miel 10g',
    '772', 'Pechuga de pavo 200g; Batata 200g; Espárragos verdes 150g; Ajo 2 dientes',
    '773', 'Salmón ahumado 150g; Lechuga 100g; Aguacate 80g; Pepino 100g; Tomates cherry 100g; Aceite de oliva 15ml'
  );
  registro RECORD;
  plato_key TEXT;
  ejercicio_id TEXT;
  ingredientes_texto TEXT;
BEGIN
  -- Iterar sobre cada registro de progreso_cliente_nutricion para actividad 93
  FOR registro IN 
    SELECT id, COALESCE(ingredientes, '{}'::jsonb) as ingredientes_actual, ejercicios_pendientes
    FROM public.progreso_cliente_nutricion
    WHERE actividad_id = 93
  LOOP
    -- Iterar sobre cada plato en ejercicios_pendientes
    FOR plato_key IN 
      SELECT jsonb_object_keys(registro.ejercicios_pendientes)
    LOOP
      -- Extraer el ejercicio_id del objeto (el campo dentro de cada objeto en ejercicios_pendientes)
      ejercicio_id := registro.ejercicios_pendientes->plato_key->>'ejercicio_id';
      
      -- Si este ejercicio_id tiene ingredientes definidos
      IF ejercicio_id IS NOT NULL AND ingredientes_map ? ejercicio_id THEN
        ingredientes_texto := ingredientes_map->>ejercicio_id;
        
        -- Verificar si ya tiene ingredientes para este key o si está vacío
        IF NOT (registro.ingredientes_actual ? plato_key) OR 
           registro.ingredientes_actual->>plato_key IS NULL OR 
           registro.ingredientes_actual->>plato_key = '' THEN
          -- Actualizar este registro específico usando el mismo key que ejercicios_pendientes
          -- Esto mantiene la consistencia: el mismo key "753_1" se usa en ambos campos
          UPDATE public.progreso_cliente_nutricion
          SET ingredientes = COALESCE(ingredientes, '{}'::jsonb) || jsonb_build_object(plato_key, ingredientes_texto)
          WHERE id = registro.id;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;
