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

## Segundo Ejemplo de Cálculo: Mesa de Madera

Para demostrar la versatilidad del algoritmo, analicemos un producto con un BOM de dos niveles y tiempos de entrega más largos.

**Datos iniciales:**
*   **MESA:** Stock 0, Lead Time 2, Lote Mínimo 5.
*   **TABLON:** Stock 10, Lead Time 3, Lote Mínimo 10, Múltiplo 5.
*   **TORNILLO:** Stock 100, Lead Time 1, Lote Mínimo 50, Múltiplo 50.
*   **BOM MESA:** 4 Tablones y 12 Tornillos.
*   **Demanda:** 10 Mesas en el período 5.

**Resolución paso a paso:**
1.  **Nivel 0 (MESA):** Demanda bruta = 10. Stock = 0. Requerimiento neto = 10. Al aplicar lote mínimo (5), se piden 10. Como el Lead Time es 2, se lanza en el período 3.
2.  **Explosión a Nivel 1:**
    *   **TABLON:** Requerimiento bruto = 10 (mesas) * 4 = 40. Restando stock (10), el neto es 30. Con lote mínimo y múltiplo, la orden es de 30. Se lanza en el período 0 (3 - 3 de Lead Time).
    *   **TORNILLO:** Requerimiento bruto = 10 * 12 = 120. Restando stock (100), el neto es 20. Aplicando el lote mínimo de 50, se piden 50. Se lanza en el período 2.

**Resultado esperado:**
El sistema debe generar 3 órdenes de producción/compra, demostrando que el inventario de tornillos se descuenta correctamente y que los lotes mínimos fuerzan compras de mayores cantidades.