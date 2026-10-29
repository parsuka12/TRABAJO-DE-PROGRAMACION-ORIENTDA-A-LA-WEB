-- Vacia las tablas y reinicia los ids, para volver al caso base.
-- Despues se puede recargar docs/datos_ejemplo.sql.
-- CUIDADO: BORRA TODOS LOS DATOS de articulos, bom, demandas y recepciones.
TRUNCATE demandas, recepciones, bom, articulos RESTART IDENTITY CASCADE;