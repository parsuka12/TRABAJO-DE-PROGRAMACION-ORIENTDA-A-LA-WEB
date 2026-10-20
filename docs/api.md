# Documentación de la API

## ¿Qué es la API?

La API permite que el frontend se comunique con el backend del proyecto MRP Industrial.

El sistema busca organizar los artículos, controlar el stock y ayudar a calcular los materiales necesarios para la producción.

## Endpoints

Los endpoints son las direcciones que se utilizan para hacer peticiones al backend.

Por ahora, el proyecto tiene estas tres rutas:

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/articulos` | Consultar todos los artículos. |
| GET | `/api/articulos/:id` | Buscar un artículo por su ID. |
| PUT | `/api/articulos/:id/stock` | Actualizar el stock de un artículo. |

## ¿Quién puede utilizar los endpoints?

Durante el desarrollo, estas rutas pueden ser utilizadas por el frontend o por una herramienta de pruebas como Postman.

Por ahora, el proyecto no tiene un sistema de inicio de sesión ni permisos por usuario.

## Ejemplos de peticiones

### 1. Consultar todos los artículos

**Método:** GET

**Dirección:** `http://localhost:3000/api/articulos`

Esta petición permite consultar la lista de artículos registrados.

### 2. Buscar un artículo por su ID

**Método:** GET

**Dirección:** `http://localhost:3000/api/articulos/1`

El número 1 es un ejemplo de ID. El artículo debe existir en la base de datos para que aparezca el resultado.

### 3. Actualizar el stock de un artículo

**Método:** PUT

**Dirección:** `http://localhost:3000/api/articulos/1/stock`

**Cuerpo de la petición (JSON):**

```json
{
  "stock": 50
}
```

En este ejemplo se intenta dejar el stock del artículo con ID 1 en 50 unidades. El backend valida que el stock sea un número válido y que no sea negativo.

## Estado actual

Las rutas y el controlador de artículos ya están creados. La conexión y las pruebas con datos reales quedan pendientes de verificar cuando la base de datos esté montada y configurada.