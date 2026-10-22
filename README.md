\# MRP Industrial



API REST (Node.js + Express + PostgreSQL) para gestionar articulos y, a futuro, calcular los materiales necesarios para produccion (MRP). Incluye un frontend simple servido por el propio backend.



\## Estructura del proyecto



La raiz tiene: backend/ (codigo del servidor), docs/ (documentacion: esquema.sql, api.md, algoritmo.md), frontend/ (interfaz web) y este README.md.



El backend sirve los archivos de frontend/ como estaticos, asi que al levantar el servidor la interfaz queda disponible directamente en http://localhost:3000.



\## Requisitos



\- Node.js 18 o superior

\- PostgreSQL 13 o superior (una base de datos ya creada)



\## Instalacion



1\. Clonar el repositorio y pararse en la rama desde-cero:



git clone https://github.com/parsuka12/TRABAJO-DE-PROGRAMACION-ORIENTDA-A-LA-WEB.git

cd TRABAJO-DE-PROGRAMACION-ORIENTDA-A-LA-WEB

git checkout desde-cero



2\. Instalar las dependencias del backend:



cd backend

npm install



\## Configuracion del archivo .env



Dentro de backend/ crear un archivo .env (no se sube al repositorio, esta ignorado en .gitignore) con las siguientes variables:



PORT=3000

DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=mrp\_industrial

DB\_USER=postgres

DB\_PASSWORD=tu\_clave



\## Crear la base de datos



El esquema de tablas esta documentado y listo para ejecutar en docs/esquema.sql. Con la base de datos ya creada en PostgreSQL, se puede cargar asi:



psql -U postgres -d mrp\_industrial -f docs/esquema.sql



\## Ejecutar en desarrollo



cd backend

node src/index.js



Esto levanta el servidor en http://localhost:3000. La interfaz queda en la raiz (/) y la API en /api/articulos (ver docs/api.md para el detalle de endpoints).



\## Ejecutar las pruebas



cd backend

npm test



\## Despliegue en el servidor



1\. Copiar el proyecto completo (backend/, frontend/, docs/, .gitignore) al servidor, o clonarlo directamente con git clone (recordar hacer git checkout desde-cero).

2\. Instalar Node.js y PostgreSQL en el servidor si no estan disponibles.

3\. Crear la base de datos, cargar docs/esquema.sql y crear el archivo backend/.env con los datos de conexion del servidor.

4\. Instalar dependencias en modo produccion:



cd backend

npm install --omit=dev



5\. Iniciar el servidor:



node src/index.js



Para mantenerlo corriendo en segundo plano y que se reinicie si falla o si el servidor se reinicia, se recomienda usar un gestor de procesos como pm2:



npm install -g pm2

pm2 start src/index.js --name mrp-industrial

pm2 save

pm2 startup



6\. Verificar que la API responde en http://<ip-o-dominio-del-servidor>:<PORT>/api/health y que la interfaz carga en la raiz (/).



Si el servidor esta detras de un proxy (Nginx, Apache, etc.), apuntar ese proxy al puerto configurado en PORT y, de ser necesario, configurar HTTPS ahi.

