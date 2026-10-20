## Algoritmo MRP multinivel

## Objetivo

Dado un producto final, su lista de materiales (BOM), el inventario, los plazos de entrega (lead time) y la demanda por periodo, calcular qué ordenar, cuánto y cuándo.

## Conceptos
BOM: árbol que dice qué componentes lleva cada ítem y en qué cantidad.
Requerimiento bruto: lo que se necesita en total en un periodo.
Requerimiento neto: lo que falta tras descontar inventario y recepciones programadas.
Lead time: periodos que tarda en llegar o fabricarse un ítem. Una orden se lanza periodo de necesidad - lead time.
Nivel bajo: el nivel más profundo en que aparece un ítem en el BOM.
Explosión: convertir una orden del padre en requerimiento bruto de cada hijo (cantidad de la orden x cantidad por padre).
Pasos del algoritmo
validar: comprueba que los componentes existan, que las cantidades sean mayores que 0 y detecta ciclos (A usa B y B usa A) con una búsqueda en profundidad.
nivelBajo: asigna a cada ítem su nivel más profundo, para procesar primero los padres y después los hijos.
Se cargan los requerimientos brutos iniciales con la demanda externa.
Para cada ítem, ordenados por nivel bajo, y para cada periodo t:
disponible = inventario + recepciones programadas - bruto
Si disponible < stock de seguridad: neto = seguridad - disponible.
La cantidad real a pedir se ajusta con lote (lote mínimo y múltiplo).
Se lanza la orden en t - lead_time (si es negativo, se marca atrasada y se lanza en 0).
Se hace la explosión: cada hijo recibe cantidad de la orden x qty del BOM como bruto en el periodo de lanzamiento.
Se devuelven las órdenes planificadas y el detalle por ítem.
Por qué se procesa por nivel

Si un ítem (por ejemplo un tornillo) lo usan dos padres, hay que sumar la demanda de ambos antes de descontar su inventario. Procesando por nivel bajo, todos los padres ya enviaron su demanda cuando se calcula el hijo. Si no, el inventario se descontaría dos veces.

Ejemplo: bicicleta
BICI: lead time 1, stock 10. Lleva 2 RUEDA.
RUEDA: lead time 1, stock 40.
Demanda: 50 BICI en el periodo 4.

Cálculo:

BICI: neto = 50 - 10 = 40. Se lanza en el periodo 3.
Explosión: 40 BICI x 2 = 80 RUEDA necesarias en el periodo 3.
RUEDA: neto = 80 - 40 = 40. Se lanza en el periodo 2.
Pruebas

npm test ejecuta backend/tests/mrp.test.js (7 casos: inventario y lead time, ítem compartido, ciclos, recepciones programadas, lote y múltiplo, nivel bajo, orden atrasada).

## Cómo probarlo
1. Entrar a la carpeta `backend`.
2. Ejecutar `npm test`.
3. Deben salir 7 pruebas aprobadas.
