# Base de datos del MRP Industrial

Motor: **PostgreSQL**. Nombre de la base: `backweb_db`.
El esquema completo esta en `docs/esquema.sql` y los datos de prueba en `docs/datos_ejemplo.sql`.

## Tablas

### articulos
Productos y materiales que se usan en la fabricacion.

| Columna | Tipo | Significado |
|---|---|---|
| id | SERIAL (clave primaria) | Identificador automatico |
| codigo | VARCHAR(30), unico | Codigo del articulo (ej. BICI) |
| nombre | VARCHAR(100) | Nombre descriptivo |
| stock | NUMERIC(10,2) | Inventario disponible (no puede ser negativo) |
| stock_seguridad | NUMERIC(10,2) | Colchon minimo que no se quiere tocar |
| tiempo_entrega | INTEGER | Plazo de entrega (lead time) en periodos |
| lote_minimo | NUMERIC(10,2) | Cantidad minima que se puede pedir |
| multiplo | NUMERIC(10,2) | Se pide en multiplos de este valor (mayor que 0) |

### bom (lista de materiales)
Dice que componentes necesita cada articulo.

| Columna | Significado |
|---|---|
| articulo_id | Articulo padre (el producto) |
| componente_id | Articulo hijo (el material) |
| cantidad | Unidades del hijo por cada unidad del padre |

Reglas: la cantidad debe ser mayor que 0, un articulo no puede ser componente de si mismo
y la pareja (articulo_id, componente_id) no se repite.

### demandas
Cuantas unidades se necesitan y en que periodo: `articulo_id`, `periodo` (0 o mayor), `cantidad` (mayor que 0).

### recepciones
Materiales que ya estan pedidos y llegaran: `articulo_id`, `periodo`, `cantidad`.

## Relaciones

- `bom.articulo_id` y `bom.componente_id` apuntan a `articulos.id` (un articulo puede ser padre de varios y componente de varios).
- `demandas.articulo_id` y `recepciones.articulo_id` apuntan a `articulos.id`.
- Las claves foraneas impiden registrar un componente, una demanda o una recepcion de un articulo que no existe.

```
articulos 1 ---- N bom (como padre)
articulos 1 ---- N bom (como componente)
articulos 1 ---- N demandas
articulos 1 ---- N recepciones
```

## Como cargarla

1. Crear la base (una sola vez): `sudo -u postgres psql -c "CREATE DATABASE backweb_db;"`
2. Crear las tablas: `cat docs/esquema.sql | sudo -u postgres psql -d backweb_db`
3. Cargar los datos de ejemplo: `cat docs/datos_ejemplo.sql | sudo -u postgres psql -d backweb_db`

## Como comprobar

- Ver las tablas: `sudo -u postgres psql -d backweb_db -c "\dt"`
- Ver el BOM con nombres:

```sql
SELECT p.codigo AS padre, h.codigo AS hijo, b.cantidad
FROM bom b
JOIN articulos p ON p.id = b.articulo_id
JOIN articulos h ON h.id = b.componente_id;
```

- Ver los articulos por la API: `curl http://localhost:3000/api/articulos`

## Conexion del backend

El backend lee la configuracion de un archivo `.env` (que no se sube a GitHub):
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_SSL`.
La conexion se crea en `backend/src/config/db.js` con un `Pool` de la libreria `pg`, y las consultas SQL estan en `backend/src/models/`.

## Resultado esperado del MRP con los datos de ejemplo

| Articulo | Calculo | Orden | Se lanza en el periodo |
|---|---|---|---|
| BICI | 50 - 10 en stock = 40 | 40 | 3 |
| RUEDA | 40 x 2 = 80, menos 40 en stock = 40 | 40 | 2 |
| CUADRO | 40 x 1 = 40, menos 15 en stock = 25 | 25 | 1 (tiempo de entrega 2) |

Indices para acelerar las consultas por clave foranea
CREATE INDEX IF NOT EXISTS idx_bom_componente ON bom(componente_id);
CREATE INDEX IF NOT EXISTS idx_demandas_articulo ON demandas(articulo_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_articulo ON recepciones(articulo_id);

