# IA para todos · Charla ADEP para personas adultas mayores

Sitio de apoyo para una charla introductoria sobre inteligencia artificial: explica lo básico con calma, da tres reglas de seguridad y propone tres actividades prácticas. Cierra con el **Reto IA**, un concurso en vivo que se juega desde el teléfono.

## Cómo abrirlo

### Para la charla: publicarlo en internet con Render (gratis, sin instalar nada)
Así funcionan **el quiz en vivo en cada celular** y **el registro de participantes** de la ruleta.
1. Entre a https://render.com y elija **Sign in with GitHub**.
2. Toque **New → Blueprint** y elija el repositorio **IA-para-todos** (el archivo `render.yaml` ya trae la configuración).
3. Toque **Apply** y espere unos minutos. Render le da una dirección como `https://ia-para-todos.onrender.com`.

Páginas importantes (cambie la dirección por la suya):
- `/` → la charla (proyéctela).
- `/registro.html` → **registro de participantes**: sus compañeros lo abren en el celular y agregan los nombres al llegar. Aparecen al instante en la ruleta.
- `/presentador.html` → crear el Reto IA en vivo (muestra un código y un QR).
- `/quiz.html` → el público entra desde su celular con el código.
- `/compartir.html` → los **enlaces** de la charla y del registro listos para copiar, y el **código QR** de la charla para proyectar, descargar o imprimir.

Consejos: el plan gratuito "se duerme" tras 15 minutos sin uso; ábralo unos minutos antes de la charla (la primera carga tarda ~1 minuto). Mientras la ruleta, el registro o el presentador estén abiertos, la página lo mantiene despierto. Los nombres de la ruleta se guardan en el servidor, y si se borraran, la computadora de la ruleta los vuelve a enviar.

### Sin internet ni servidor
Abra `index.html` con doble clic o con Live Server. Funciona la charla completa; la ruleta guarda los nombres solo en esa computadora y el Reto IA cambia a **modo proyector** o **práctica individual**.

### Con Node.js (opcional)
`npm start` y abra `http://localhost:3000`. Los celulares deben estar en la misma Wi‑Fi.

## Contenido
| Sección | Qué incluye |
|---|---|
| Portada | Video introductorio (`video/video_final.mp4`) |
| Parte 1 · Lo básico | Qué es la IA, cómo aprende, dónde la usamos, qué puede y qué no, glosario |
| Parte 2 · Seguridad | Tres reglas de oro y la palabra clave familiar |
| Parte 3 · Actividades | 1) ¿Dónde hay IA? 2) Converse con un asistente (simulado) 3) La ruleta de las experiencias (nombres del grupo; a quien le toca cuenta una experiencia con la tecnología o la IA) |
| Parte 4 · Reto IA | Enlace al quiz multijugador (`quiz.html` y `presentador.html`) |

Las tres actividades funcionan solo en el navegador; no se envía ni se guarda ningún dato. El asistente de la actividad 2 es una simulación con respuestas preparadas.

## Archivos
- `index.html`, `css/styles.css`, `css/site.css`, `js/main.js`: la charla y las actividades.
- `quiz.html`, `presentador.html`, `css/quiz.css`, `js/quiz-client.js`, `js/presentador.js`: Reto IA en vivo.
- `js/quiz-local.js`: Reto IA sin servidor (modo proyector y práctica individual).
- `js/preguntas.js`: banco de 30 preguntas, compartido por ambos modos.
- `registro.html`, `js/registro.js`, `css/registro.css`: registro de participantes en vivo para el equipo.
- `server/server.js`: servidor sin dependencias (quiz en memoria; nombres de la ruleta en `data/ruleta.json`).
- `render.yaml`: configuración para publicar en Render.

El quiz y el video provienen del proyecto ADEP Aprende.
