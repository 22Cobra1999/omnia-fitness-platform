-- Aumentar la precisión de gb_usage a 6 decimales para poder almacenar valores pequeños como MB

ALTER TABLE storage_usage 
ALTER COLUMN gb_usage TYPE DECIMAL(12, 6);

COMMENT ON COLUMN storage_usage.gb_usage IS 'Espacio usado en GB con 6 decimales de precisión';

































