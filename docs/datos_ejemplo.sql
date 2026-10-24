-- Datos de ejemplo: una bicicleta que lleva 2 ruedas y 1 cuadro.
-- Cargar con:  cat docs/datos_ejemplo.sql | sudo -u postgres psql -d backweb_db
-- Ejecutarlo UNA sola vez: la tabla demandas no tiene restriccion unica.

INSERT INTO articulos (codigo, nombre, stock, stock_seguridad, tiempo_entrega, lote_minimo, multiplo) VALUES
('BICI',   'Bicicleta', 10, 0, 1, 0, 1),
('RUEDA',  'Rueda',     40, 0, 1, 0, 1),
('CUADRO', 'Cuadro',    15, 0, 2, 0, 1)
ON CONFLICT (codigo) DO NOTHING;

-- BOM: la bicicleta necesita 2 ruedas y 1 cuadro
INSERT INTO bom (articulo_id, componente_id, cantidad)
SELECT p.id, h.id, v.cantidad
FROM (VALUES ('BICI','RUEDA',2), ('BICI','CUADRO',1)) AS v(padre, hijo, cantidad)
JOIN articulos p ON p.codigo = v.padre
JOIN articulos h ON h.codigo = v.hijo
ON CONFLICT DO NOTHING;

-- Demanda: 50 bicicletas en el periodo 4
INSERT INTO demandas (articulo_id, periodo, cantidad)
SELECT id, 4, 50 FROM articulos WHERE codigo = 'BICI';