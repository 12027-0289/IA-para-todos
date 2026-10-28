# IA para todos · Charla ADEP para personas adultas mayores

Sitio de apoyo para una charla introductoria sobre inteligencia artificial: explica lo básico con calma, da tres reglas de seguridad y propone tres actividades prácticas. Cierra con el **Reto IA**, un concurso en vivo que se juega desde el teléfono.

## Cómo abrirlo

**Sin instalar nada:** abra `index.html` con doble clic, con la extensión Live Server de Visual Studio Code o desde GitHub Pages. Funciona todo: la charla, el video, las actividades y el Reto IA en *modo sin servidor*:
- `presentador.html` → **modo proyector**: cada pregunta se muestra en pantalla grande y el público responde levantando la mano por la figura (▲ ◆ ● ■).
- `quiz.html` → **práctica individual**: cada persona responde 10 preguntas en su teléfono, a su ritmo.

**Con Node.js 18+ (opcional):** ejecute `npm start` y abra `http://localhost:3000` para el concurso **en vivo**: cada persona entra desde su teléfono con un código o QR, con puntaje y podio. Los teléfonos deben estar en la misma Wi‑Fi, o publique el servidor y defina `PUBLIC_URL`.

El Reto IA detecta solo si hay servidor y elige el modo adecuado.

## Contenido
| Sección | Qué incluye |
|---|---|
| Portada | Video introductorio (`video/video_final.mp4`) |
| Parte 1 · Lo básico | Qué es la IA, cómo aprende, dónde la usamos, qué puede y qué no, glosario |
| Parte 2 · Seguridad | Tres reglas de oro y la palabra clave familiar |
| Parte 3 · Actividades | 1) ¿Dónde hay IA? 2) Converse con un asistente (simulado) 3) Enséñele a la máquina |
| Parte 4 · Reto IA | Enlace al quiz multijugador (`quiz.html` y `presentador.html`) |

Las tres actividades funcionan solo en el navegador; no se envía ni se guarda ningún dato. El asistente de la actividad 2 es una simulación con respuestas preparadas.

## Archivos
- `index.html`, `css/styles.css`, `css/site.css`, `js/main.js`: la charla y las actividades.
- `quiz.html`, `presentador.html`, `css/quiz.css`, `js/quiz-client.js`, `js/presentador.js`: Reto IA en vivo.
- `js/quiz-local.js`: Reto IA sin servidor (modo proyector y práctica individual).
- `js/preguntas.js`: banco de 30 preguntas, compartido por ambos modos.
- `server/server.js`: servidor opcional sin dependencias (estado en memoria).

El quiz y el video provienen del proyecto ADEP Aprende.
