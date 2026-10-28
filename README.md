# IA para todos · Charla ADEP para personas adultas mayores

Sitio de apoyo para una charla introductoria sobre inteligencia artificial: explica lo básico con calma, da tres reglas de seguridad y propone tres actividades prácticas. Cierra con el **Reto IA**, un concurso en vivo que se juega desde el teléfono.

## Cómo ejecutar
1. Instale Node.js 18 o superior.
2. En esta carpeta, ejecute `npm start`.
3. Abra `http://localhost:3000`.

Para que el público se una al Reto IA desde sus teléfonos, la computadora y los teléfonos deben estar en la misma red Wi‑Fi (la pantalla del presentador muestra la dirección y un código QR), o bien publique el proyecto en un servidor con Node.js y defina `PUBLIC_URL`.

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
- `quiz.html`, `presentador.html`, `css/quiz.css`, `js/quiz-client.js`, `js/presentador.js`: Reto IA.
- `server/server.js`, `server/questions.js`: servidor sin dependencias y banco de 30 preguntas (estado en memoria).

El quiz y el video provienen del proyecto ADEP Aprende.
