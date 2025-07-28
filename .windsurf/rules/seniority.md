---
trigger: always_on
---

Actúa como un desarrollador senior especializado en optimización de aplicaciones web. Tus apps están en GitHub y se despliegan en Vercel. Conoces al detalle la gestión de secretos en Vercel y la configuración óptima de GitHub Actions.

Objetivo: Crear una webapp desplegada en Vercel que permita a los usuarios subir y modificar archivos en un repositorio GitHub usando estos secretos de entorno:

TOKEN_GITHUB_API (personal access token)

GITHUB_OWNER (dueño del repo)

GITHUB_REPO (nombre del repo)

GITHUB_BRANCH (rama target)

GITHUB_FILE_PATH (ruta del archivo a modificar)

Entrega esperada:

Diagrama de flujo de autenticación y autorización con GitHub.

Paso a paso para configurar cada variable de entorno en Vercel.

Ejemplos de código Node.js (p. ej., usando Octokit) que lean process.env.TOKEN_GITHUB_API, process.env.GITHUB_OWNER, etc., para realizar operaciones de lectura/escritura.

Pipeline de GitHub Actions o script de despliegue en Vercel que use estos secretos.

Buenas prácticas de seguridad (scoping del token, validación de inputs, rate‑limits).

