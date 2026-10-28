// IA para todos · interacciones de la página principal
const $ = s => document.querySelector(s);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
const store = { get(k) { try { return localStorage.getItem(k) } catch { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch { } } };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const robot = (txt, mood) => window.Robot && Robot.say(txt, mood);
const fiesta = el => window.confeti && confeti(el);

/* ---------- Lectura: tamaño de letra y contraste ---------- */
(() => {
    const root = document.documentElement;
    let fs = +store.get('fs') || 20;
    const apply = () => { root.style.setProperty('--fs', fs + 'px'); store.set('fs', fs) };
    $('#aMas').onclick = () => { fs = Math.min(28, fs + 2); apply() };
    $('#aMenos').onclick = () => { fs = Math.max(16, fs - 2); apply() };
    const hc = $('#contraste');
    const setHc = on => { root.classList.toggle('hc', on); hc.setAttribute('aria-pressed', on); store.set('hc', on ? '1' : '') };
    hc.onclick = () => setHc(!root.classList.contains('hc'));
    apply(); setHc(store.get('hc') === '1');
})();

/* ---------- Voz del robot (compartida por «Pregúntele al robot» y la ruleta) ---------- */
const Voz = (() => {
    const tts = 'speechSynthesis' in window ? speechSynthesis : null;
    // Elegir la voz más natural y masculina disponible (depende del navegador y del sistema)
    const HOMBRE = /\b(juan|jorge|pablo|ra[uú]l|[aá]lvaro|diego|carlos|enrique|gonzalo|andr[eé]s|tom[aá]s|gerardo|federico|alonso|liberto|jos[eé]|antonio|emilio|sergio|rodrigo|luciano|yago|arnau|dar[ií]o|sebasti[aá]n|javier|lorenzo|mateo|manuel|nicol[aá]s|pedro|ricardo|roberto|santiago|alex|alejandro|mario|hugo|luis|gabriel)\b/i;
    const MUJER = /\b(sabina|helena|laura|elvira|dalia|paloma|m[oó]nica|paulina|mar[ií]a|lupe|isabela|esperanza|marisol|francisca|camila|elena|luc[ií]a|soledad|abril|catalina|ximena|irene|salome|ver[oó]nica|valentina|andrea|carla|beatriz|estrella|marta|sara|tatiana|teresa|yolanda|renata|elsa|karla|paola)\b/i;
    const NATURAL = /natural|neural|online|premium|enhanced|mejorad|siri/i;
    function puntaje(v) {
        const l = v.lang.replace('_', '-');
        return (HOMBRE.test(v.name) ? 40 : 0) - (MUJER.test(v.name) ? 40 : 0) + (NATURAL.test(v.name) ? 25 : 0) + (v.localService ? 0 : 3) +
            ({ 'es-CR': 8, 'es-MX': 6, 'es-419': 6, 'es-US': 5, 'es-CO': 5, 'es-ES': 4 }[l] || 0);
    }
    const vocesEs = () => tts.getVoices().filter(v => /^es/i.test(v.lang)).sort((a, b) => puntaje(b) - puntaje(a));
    function vozEspanol() { const vs = vocesEs(), elegida = store.get('vozNombre'); return vs.find(v => v.name === elegida) || vs[0] }
    let actual = 0;
    // Dice un texto con la voz elegida; alTerminar se llama al acabar (o enseguida si no hay voz)
    function decir(texto, alTerminar) {
        const t = ++actual, fin = () => { if (t === actual && alTerminar) alTerminar() };
        if (!tts) { setTimeout(fin, Math.min(6000, 600 + texto.length * 45)); return }
        tts.cancel();
        const u = new SpeechSynthesisUtterance(texto), v = vozEspanol();
        u.lang = v ? v.lang : 'es-ES'; if (v) u.voice = v; u.rate = .95; u.pitch = 1;
        u.onend = u.onerror = fin; tts.speak(u);
    }
    return { tts, voces: () => tts ? vocesEs() : [], elegida: () => tts ? vozEspanol() : null, decir, callar: () => { actual++; tts && tts.cancel() } };
})();

/* ---------- Pregúntele al robot: responde por escrito y en voz alta ---------- */
(() => {
    const PREGUNTAS = [
            {
                    "e": "💰",
                    "q": "¿Es gratis usar la inteligencia artificial?",
                    "r": "Muchas herramientas tienen una <b>versión gratuita</b>: el asistente de su celular, Gemini, ChatGPT o Meta AI en WhatsApp. Algunas cobran por funciones extra.",
                    "t": "Nunca le pague a alguien que le ofrezca “activar” o “vender” la IA por mensaje o llamada."
            },
            {
                    "e": "📶",
                    "q": "¿Necesito internet?",
                    "r": "Sí, casi siempre. La mayoría de estas herramientas funcionan <b>conectadas a internet</b>, por Wi‑Fi o con los datos del celular.",
                    "t": null
            },
            {
                    "e": "📱",
                    "q": "¿Necesito un celular nuevo o caro?",
                    "r": "No. Funciona en la mayoría de los celulares y computadoras de los últimos años. Solo necesita <b>una aplicación</b> o entrar desde el navegador.",
                    "t": null
            },
            {
                    "e": "👂",
                    "q": "¿La IA me escucha todo el tiempo?",
                    "r": "Los asistentes de voz quedan atentos solo a su <b>palabra de activación</b>, como “Oye Siri” u “Ok Google”, y ahí empiezan a escuchar.",
                    "t": "Si prefiere, puede apagar esa función o el micrófono en la configuración del celular."
            },
            {
                    "e": "🔒",
                    "q": "¿Es seguro usarla?",
                    "r": "Sí, si cuida lo que escribe. Pregunte <b>sin datos personales</b>: nunca escriba su cédula, contraseñas, PIN, números de tarjeta ni códigos que le lleguen por mensaje.",
                    "t": null
            },
            {
                    "e": "🔄",
                    "q": "¿Qué pasa si me equivoco o si la IA se equivoca?",
                    "r": "<b>No pasa nada.</b> Puede borrar y volver a preguntar, o decirle “eso no es correcto, explíquemelo de otra forma”. La IA también se equivoca, por eso conviene confirmar lo importante.",
                    "t": null
            },
            {
                    "e": "🎤",
                    "q": "¿Puedo hablarle en lugar de escribir?",
                    "r": "Sí. Casi todas tienen un botón de <b>micrófono</b> para hablarle, y muchas pueden <b>leerle la respuesta en voz alta</b>.",
                    "t": null
            },
            {
                    "e": "🤝",
                    "q": "¿La IA va a reemplazar a las personas?",
                    "r": "Es una herramienta que ayuda, como una calculadora o un mapa. No reemplaza el cariño de la familia, el criterio de cada persona ni a los profesionales. <b>Usted decide.</b>",
                    "t": null
            },
            {
                    "e": "🆘",
                    "q": "¿Dónde pido ayuda si tengo dudas?",
                    "r": "Pregunte a un familiar o a una persona de confianza, o a quienes organizan esta charla.",
                    "t": "Si sospecha una estafa, llame a su banco al número oficial, el que aparece detrás de su tarjeta."
            }
    ];
    const caja = $('#charlaPreguntas'), qEl = $('#charlaQ'), rEl = $('#charlaR'), otra = $('#charlaOtraVez'), vozBtn = $('#charlaVoz');
    const escena = $('#charlaRobot'), bot = window.Robot && Robot.copiar ? Robot.copiar('q-') : null;
    if (bot) escena.append(bot);
    const ojos = bot && bot.querySelector('#q-eyes');
    if (ojos) { ojos.style.transformBox = 'fill-box'; ojos.style.transformOrigin = 'center'; ojos.style.transition = 'transform .35s ease' }
    const mirar = (x, y) => { if (ojos) ojos.style.transform = `translate(${x}px,${y}px)` };
    const tts = Voz.tts;
    let voz = store.get('voz') !== '0', actual = null, turno = 0;
    const quieto = () => calm || document.documentElement.classList.contains('no-anim');
    const espera = ms => new Promise(ok => setTimeout(ok, ms));
    function pintarVoz() { vozBtn.textContent = voz ? '🔊 Voz: sí' : '🔇 Voz: no'; vozBtn.setAttribute('aria-pressed', voz); vozBtn.hidden = !tts }
    const sel = $('#charlaVozSel');
    function llenarVoces() {
        if (!tts) return; const vs = Voz.voces(); $('#charlaVozCaja').hidden = !vs.length; if (!vs.length) return;
        const elegida = Voz.elegida(); sel.replaceChildren();
        vs.forEach((v, i) => { const o = el('option', null, v.name.replace(/^(Microsoft|Google)\s+/, '').replace(/\s+Online \(Natural\)/, ' (natural)') + (i === 0 ? ' ⭐ recomendada' : '')); o.value = v.name; o.selected = v === elegida; sel.append(o) });
    }
    // Mueve la boca mientras habla; termina cuando acaba la voz (o un tiempo prudente si no hay voz)
    function hablar(texto, t) {
        escena.classList.add('hablando');
        const fin = () => { if (t === turno) escena.classList.remove('hablando') };
        if (!voz || !tts) { setTimeout(fin, Math.min(6000, 600 + texto.length * 45)); return }
        Voz.decir(texto, fin);
    }
    // Texto que lee la voz: la respuesta sin etiquetas y, si hay, el consejo
    function paraVoz(r, t) { const d = document.createElement('div'); d.innerHTML = r; return d.textContent.replace(/[.\s]+$/, '') + '.' + (t ? ' Un consejo: ' + t : '') }
    async function responder(i, boton) {
        const t = ++turno, p = PREGUNTAS[i]; actual = i;
        Voz.callar();
        caja.querySelectorAll('button').forEach(b => b.classList.toggle('activa', b === boton));
        qEl.hidden = false; qEl.textContent = p.e + ' ' + p.q;
        // 1. Piensa
        escena.classList.remove('hablando'); escena.classList.add('pensando'); mirar(10, -12);
        const puntos = el('span', 'typing'); puntos.append(el('i'), el('i'), el('i')); rEl.replaceChildren(puntos);
        await espera(quieto() ? 50 : 800); if (t !== turno) return;
        escena.classList.remove('pensando'); mirar(0, 0);
        // 2. Responde: escribe la respuesta y la dice en voz alta
        const resp = document.createElement('p'); resp.innerHTML = p.r;
        const tip = p.t ? el('p', 'charla-tip', '💡 ' + p.t) : null;
        const leer = paraVoz(p.r, p.t);
        rEl.replaceChildren(resp); if (tip) { tip.hidden = true; rEl.append(tip) }
        hablar(leer, t);
        if (!quieto()) {
            const html = p.r; resp.textContent = ''; const total = resp.ownerDocument.createElement('div'); total.innerHTML = html;
            const plano = total.textContent; for (let k = 1; k <= plano.length; k += 2) { if (t !== turno) return; resp.textContent = plano.slice(0, k); await espera(22) }
            resp.innerHTML = html;
        }
        if (tip) tip.hidden = false;
        otra.hidden = false;
    }
    PREGUNTAS.forEach((p, i) => {
        const b = el('button', 'charla-p'); b.type = 'button';
        b.append(el('span', 'charla-e', p.e), el('span', null, p.q)); b.querySelector('.charla-e').setAttribute('aria-hidden', 'true');
        b.onclick = () => responder(i, b);
        b.onmouseenter = () => { if (!escena.classList.contains('pensando')) mirar(14, 6) };
        b.onmouseleave = () => mirar(0, 0);
        caja.append(b);
    });
    otra.onclick = () => { if (actual !== null) { const p = PREGUNTAS[actual]; hablar(paraVoz(p.r, p.t), turno) } };
    vozBtn.onclick = () => { voz = !voz; store.set('voz', voz ? '1' : '0'); if (!voz) { Voz.callar(); escena.classList.remove('hablando') } pintarVoz() };
    sel.onchange = () => { store.set('vozNombre', sel.value); if (voz) hablar('Hola, así suena mi voz. ¿Qué le gustaría preguntarme?', ++turno) };
    if (tts) { llenarVoces(); tts.addEventListener ? tts.addEventListener('voiceschanged', llenarVoces) : (tts.onvoiceschanged = llenarVoces) }
    pintarVoz();
})();

/* ---------- Actividad 1: ¿Dónde hay IA? ---------- */
(() => {
    const ITEMS = [
        ['🗺️', 'Mapa en el celular', 'Le avisa que hay presa y le propone otra ruta.', 1, 'Aprende de millones de viajes para predecir el tráfico.'],
        ['🔦', 'Linterna', 'Se enciende cuando usted toca el botón.', 0, 'Solo sigue una orden fija: encender o apagar. No aprende nada.'],
        ['🎙️', 'Asistente de voz', 'Usted dice “¿Qué clima hace?” y le responde.', 1, 'Reconoce su voz y entiende la pregunta gracias a la IA.'],
        ['🧮', 'Calculadora', 'Suma, resta, multiplica y divide.', 0, 'Sigue reglas matemáticas fijas. Siempre da el mismo resultado.'],
        ['🎬', 'Películas recomendadas', '“Porque vio esta película, le puede gustar…”', 1, 'Busca patrones en lo que usted y otras personas han visto.'],
        ['⏰', 'Alarma del despertador', 'Suena todos los días a las 6 a. m.', 0, 'Es una regla sencilla: a cierta hora, sonar.'],
        ['📷', 'Cámara del celular', 'Reconoce caras y mejora la foto de noche.', 1, 'Aprendió con millones de fotos a reconocer rostros y luz.'],
        ['📻', 'Radio', 'Sintoniza su emisora favorita.', 0, 'Recibe una señal y la convierte en sonido. No hay IA.'],
        ['📧', 'Filtro de correo basura', 'Separa la publicidad y las estafas de sus correos.', 1, 'Aprendió a reconocer mensajes basura viendo muchos ejemplos.']
    ];
    let i = 0, score = 0;
    const card = $('#a1Card'), fb = $('#a1Fb'), next = $('#a1Next'), choices = [...document.querySelectorAll('#a1Choices .choice')];
    function show() {
        const [e, n, d] = ITEMS[i];
        $('#a1Emoji').textContent = e; $('#a1Name').textContent = n; $('#a1Desc').textContent = d;
        $('#a1Prog').textContent = (i + 1) + ' de ' + ITEMS.length; $('#a1Bar').style.width = (i / ITEMS.length * 100) + '%';
        $('#a1Score').textContent = 'Aciertos: ' + score;
        choices.forEach(b => { b.disabled = false; b.classList.remove('right', 'wrong') });
        fb.hidden = true; next.hidden = true;
        card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    }
    choices.forEach(b => b.onclick = () => {
        const it = ITEMS[i], ok = +b.dataset.v === it[3];
        if (ok) score++;
        choices.forEach(c => { c.disabled = true; if (+c.dataset.v === it[3]) c.classList.add('right') });
        if (!ok) b.classList.add('wrong');
        fb.className = 'feedback ' + (ok ? 'ok' : 'bad');
        fb.replaceChildren(el('b', null, ok ? '¡Muy bien! ' : 'Casi. '), document.createTextNode((it[3] ? 'Sí usa IA. ' : 'No usa IA. ') + it[4]));
        fb.hidden = false; $('#a1Score').textContent = 'Aciertos: ' + score;
        robot(ok ? ['¡Muy bien! 🎉', '¡Excelente!', '¡Eso es! 👏'][i % 3] : '¡Casi! Equivocarse también es aprender. 💪', ok ? 'feliz' : null);
        next.textContent = i < ITEMS.length - 1 ? 'Siguiente' : 'Ver mi resultado'; next.hidden = false; next.focus();
    });
    next.onclick = () => { i++; if (i < ITEMS.length) show(); else end() };
    function end() {
        $('#a1Bar').style.width = '100%';
        const box = $('#a1'), wrap = el('div', 'a1-end');
        wrap.append(el('p', 'big', score + ' / ' + ITEMS.length),
            el('p', null, score >= 7 ? '¡Excelente! Ya sabe reconocer dónde está la IA.' : '¡Bien hecho! Ahora ya sabe que la IA está en más lugares de los que parece.'),
            el('p', 'small', 'La pista: si el aparato “aprende” o “adivina” algo, probablemente usa IA. Si siempre hace lo mismo, no.'));
        const again = el('button', 'btn ghost', 'Jugar otra vez');
        again.onclick = () => { i = 0; score = 0; box.replaceChildren(...saved); show() };
        wrap.append(again);
        const saved = [...box.children]; box.replaceChildren(wrap); again.focus();
        fiesta(wrap); robot('¡Terminó la actividad 1! Acertó ' + score + ' de ' + ITEMS.length + '. 🏅', 'feliz');
    }
    show();
})();

/* ---------- Actividad 2: Converse con un asistente ---------- */
(() => {
    const log = $('#chatLog'), input = $('#chatIn'), chips = $('#chips');
    const SUGGEST = [
        '¿Cómo hago una videollamada?',
        'Deme una receta fácil con arroz y pollo',
        'Escriba un mensaje de cumpleaños para mi nieta',
        '¿Qué es un deepfake?',
        '¿Me puede ayudar con mi presión arterial?'
    ];
    const PRIVATE = /(contrase|clave|pin\b|c[eé]dula|tarjeta|cvv|c[oó]digo de verificaci|\b\d{4,}\b)/i;
    const ANSWERS = [
        [/videollamada|video llamada|whatsapp|llamar/i, 'Claro, en WhatsApp es así:\n1. Abra el chat de la persona.\n2. Toque el ícono de la cámara 📹 arriba a la derecha.\n3. Espere a que la otra persona conteste.\n\n¿Quiere que le explique cómo cambiar a la cámara de atrás?'],
        [/receta|cocinar|arroz|pollo|comida|almuerzo/i, 'Arroz con pollo sencillo (2 personas):\n1. Dore 2 muslos de pollo en trocitos.\n2. Agregue cebolla, chile dulce y ajo picados.\n3. Sume 1 taza de arroz y 2 tazas de caldo.\n4. Tape y cocine 20 minutos a fuego bajo.\n\n¡Buen provecho! 🍲'],
        [/cumplea|nieta|nieto|felicita|mensaje/i, 'Aquí tiene una idea:\n\n“Querida nieta: hoy celebro el regalo de tenerte en mi vida. Que este nuevo año te traiga salud, alegría y muchos sueños cumplidos. Te quiero mucho. 🎂”\n\nPuede cambiar las palabras para que suenen a usted.'],
        [/deepfake|falso|video falso|voz falsa/i, 'Un deepfake es un video o audio falso hecho con IA que imita la cara o la voz de una persona real.\n\nSi un video o una llamada le pide dinero con urgencia, deténgase y verifique llamando usted a la persona.'],
        [/presi[oó]n|m[eé]dic|salud|pastilla|medicina|doctor|dolor/i, 'Puedo darle información general: la presión se controla con chequeos, poca sal, actividad física y los medicamentos indicados.\n\n⚠️ Pero no reemplazo a su médico. Para cualquier cambio en su tratamiento, consulte en su EBAIS o con su doctor.'],
        [/qu[eé] eres|qui[eé]n eres|eres una persona|eres humano/i, 'Soy un programa de inteligencia artificial de práctica. No soy una persona: no pienso ni siento, pero puedo ayudarle a buscar ideas y explicar cosas.'],
        [/clima|lluvia|tiempo hace/i, 'Un asistente real consultaría el clima de su zona en internet. En esta práctica no estoy conectado, pero así se pregunta: “¿Va a llover hoy en Cartago?”'],
        [/gracias|muy amable/i, '¡Con mucho gusto! Siga practicando: entre más pregunte, más fácil se vuelve. 😊'],
        [/hola|buenos d|buenas/i, '¡Hola! ¿En qué le puedo ayudar hoy?']
    ];
    function bubble(text, who, extra) { const m = el('div', 'msg ' + who + (extra ? ' ' + extra : ''), text); log.append(m); log.scrollTop = log.scrollHeight; return m }
    function reply(q) {
        let a, alert = false;
        if (PRIVATE.test(q)) { a = '🔒 ¡Alto! Parece que escribió un dato privado (una clave, un PIN, un número de cédula o de tarjeta).\n\nNunca comparta esos datos con una IA ni con nadie por mensaje. Buen ejercicio: usted acaba de practicar la regla más importante.'; alert = true }
        else { const hit = ANSWERS.find(([re]) => re.test(q)); a = hit ? hit[1] : 'Buena pregunta. Esta es solo una práctica y tengo pocas respuestas preparadas.\n\nEn un asistente real, intente dar más detalles: qué necesita, para quién y cómo lo quiere (por ejemplo, “en pasos cortos”).' }
        const t = bubble('', 'bot'); const dots = el('span', 'typing'); dots.setAttribute('aria-label', 'Escribiendo'); dots.append(el('i'), el('i'), el('i')); t.append(dots);
        setTimeout(() => { t.remove(); bubble(a, 'bot', alert ? 'alert' : '') }, calm ? 200 : 900);
        if (alert) robot('¡Cuidado! Ese dato es privado. Nunca lo comparta. 🔒', 'alerta');
    }
    function ask(q) { q = q.trim(); if (!q) return; bubble(q, 'me'); reply(q) }
    SUGGEST.forEach(s => { const b = el('button', null, s); b.type = 'button'; b.onclick = () => ask(s); chips.append(b) });
    $('#chatForm').onsubmit = e => { e.preventDefault(); ask(input.value); input.value = '' };
    bubble('¡Hola! Soy un asistente de práctica. 👋\nPregúnteme algo o toque una de las sugerencias de abajo.', 'bot');
})();

/* ---------- Actividad 3: La ruleta de las experiencias ---------- */
(() => {
    const PREGUNTAS = [
        '¿Recuerda la primera vez que hizo una videollamada? ¿Con quién habló?',
        '¿Alguna vez le ha hablado a su celular o le ha pedido algo a un asistente de voz?',
        '¿Ha recibido un mensaje o una llamada sospechosa? ¿Qué hizo?',
        '¿Qué aparato o aplicación le ha cambiado la vida para bien?',
        '¿Ha usado un mapa en el celular para llegar a algún lugar?',
        '¿Qué le gustaría que la inteligencia artificial le ayudara a hacer?',
        '¿Cuál fue el primer celular o computadora que tuvo? ¿Cómo era?',
        '¿Le ha pasado algo divertido o curioso con la tecnología?',
        '¿Quién le enseñó a usar el celular? ¿Cómo fue esa experiencia?',
        '¿Ha visto alguna noticia, foto o video que resultó ser falso?',
        '¿Qué es lo que más le cuesta de la tecnología y qué es lo que más disfruta?',
        '¿Cómo era comunicarse con la familia antes de los celulares?'
    ];
    const COLORES = ['#2449b8', '#7c4dff', '#0b8a7c', '#d9573b', '#e0457b', '#0ea5e9', '#c98a12', '#16a34a'];
    const EJEMPLO = ['María', 'José', 'Ana', 'Carlos', 'Rosa', 'Luis', 'Carmen', 'Jorge'];
    const cv = $('#ruletaCv'), ctx = cv.getContext('2d'), lista = $('#listaNombres'), res = $('#ruletaRes');
    const botones = [$('#girar'), $('#girar2')];
    let nombres = [], hechos = [];
    try { nombres = JSON.parse(store.get('ruleta') || '[]'); hechos = JSON.parse(store.get('ruletaHechos') || '[]') } catch { }
    let ang = 0, girando = false, audio = null, pendiente = null, tSacar;
    const guardar = () => { store.set('ruleta', JSON.stringify(nombres)); store.set('ruletaHechos', JSON.stringify(hechos)) };
    const quieto = () => calm || document.documentElement.classList.contains('no-anim');

    function dibujar() {
        const W = cv.width, c = W / 2, r = c - 8, n = nombres.length;
        ctx.clearRect(0, 0, W, W);
        if (!n) {
            const listo = hechos.length > 0;
            ctx.fillStyle = listo ? '#e1f5ea' : '#eef3fb'; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.fill();
            ctx.fillStyle = '#4a5672'; ctx.font = '700 26px "Atkinson Hyperlegible", sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(listo ? '¡Todos participaron!' : 'Agregue nombres', c, c - 70); ctx.fillText(listo ? 'Gracias 🎉' : 'para empezar ✍️', c, c - 38); return;
        }
        const paso = Math.PI * 2 / n, fs = Math.max(16, Math.min(34, 300 / n + 10));
        nombres.forEach((nm, i) => {
            const a0 = ang + i * paso - Math.PI / 2;
            ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, r, a0, a0 + paso); ctx.closePath();
            ctx.fillStyle = COLORES[i % COLORES.length]; if (n % COLORES.length === 1 && i === n - 1 && n > 1) ctx.fillStyle = COLORES[3];
            ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
            ctx.save(); ctx.translate(c, c); ctx.rotate(a0 + paso / 2);
            ctx.fillStyle = '#fff'; ctx.font = '700 ' + fs + 'px "Atkinson Hyperlegible", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            let t = nm; while (ctx.measureText(t).width > r - 95 && t.length > 3) t = t.slice(0, -2) + '…';
            ctx.fillText(t, r - 22, 0); ctx.restore();
        });
        ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
    }
    function pintarLista() {
        lista.replaceChildren(); $('#cuenta').textContent = nombres.length;
        nombres.forEach((nm, i) => {
            const li = el('li'); li.style.setProperty('--c', COLORES[i % COLORES.length]);
            const x = el('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Quitar a ' + nm);
            x.onclick = () => { nombres.splice(i, 1); cambio() };
            li.append(el('span', null, nm), x); lista.append(li);
        });
        botones.forEach(b => b.disabled = girando || !nombres.length);
        // Quienes ya participaron: salen solos de la ruleta y se pueden volver a poner
        const hl = $('#listaHechos'); hl.replaceChildren(); $('#hechosBox').hidden = !hechos.length;
        hechos.forEach(nm => hl.append(el('li', null, '✔ ' + nm)));
    }
    function cambio() { guardar(); pintarLista(); dibujar() }
    function agregar(txt) {
        txt.split(/[,;\n]+/).map(t => t.trim().replace(/\s+/g, ' ').slice(0, 24)).filter(Boolean).forEach(t => {
            hechos = hechos.filter(x => x.toLowerCase() !== t.toLowerCase());
            if (nombres.length < 60 && !nombres.some(x => x.toLowerCase() === t.toLowerCase())) nombres.push(t);
        });
        cambio();
    }
    $('#nombreForm').onsubmit = e => { e.preventDefault(); agregar($('#nombreIn').value); $('#nombreIn').value = ''; $('#nombreIn').focus() };
    $('#ejemplo').onclick = () => agregar(EJEMPLO.join(','));
    $('#vaciar').onclick = () => { if (!nombres.length || confirm('¿Borrar todos los nombres de la ruleta?')) { clearTimeout(tSacar); pendiente = null; nombres = []; hechos = []; res.hidden = true; cambio() } };
    $('#reiniciar').onclick = () => { sacar(); nombres = nombres.concat(hechos); hechos = []; res.hidden = true; cambio(); robot('¡Listo! Todos están de nuevo en la ruleta. 🎡') };
    // Saca de la ruleta a la persona que acaba de salir
    function sacar() {
        clearTimeout(tSacar); if (!pendiente) return;
        const k = nombres.indexOf(pendiente); if (k > -1) { nombres.splice(k, 1); hechos.push(pendiente) }
        pendiente = null; cambio();
        if (nombres.length === 1) robot('Solo falta ' + nombres[0] + '. ¡Su turno! 😊');
        if (!nombres.length) robot('¡Todos participaron! Gracias por compartir. 💙', 'feliz');
    }

    // Sonidos creados con el navegador (sin archivos): tic al girar, redoble de suspenso y fanfarria final
    const sonar = () => $('#sonido').checked;
    function ac() { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); return audio }
    function ruido(seg) { const a = ac(), b = a.createBuffer(1, a.sampleRate * seg, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const n = a.createBufferSource(); n.buffer = b; return n }
    function tic() {
        if (!sonar()) return;
        try {
            const a = ac(), o = a.createOscillator(), g = a.createGain();
            o.frequency.value = 900; g.gain.setValueAtTime(.08, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .05);
            o.connect(g).connect(a.destination); o.start(a.currentTime); o.stop(a.currentTime + .06);
        } catch { }
    }
    function redoble(seg) {
        if (!sonar()) return;
        try {
            const a = ac(), t0 = a.currentTime, f = a.createBiquadFilter(), g = a.createGain();
            f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .7; f.connect(g).connect(a.destination);
            g.gain.setValueAtTime(.05, t0); g.gain.linearRampToValueAtTime(.32, t0 + seg);
            for (let t = 0; t < seg; t += .045) {
                const n = ruido(.04), e = a.createGain(); n.connect(e).connect(f);
                e.gain.setValueAtTime(1, t0 + t); e.gain.exponentialRampToValueAtTime(.01, t0 + t + .04); n.start(t0 + t);
            }
        } catch { }
    }
    function fanfarria() {
        if (!sonar()) return;
        try {
            const a = ac(), t0 = a.currentTime + .02, sal = a.createGain(); sal.gain.value = .5; sal.connect(a.destination);
            const trompeta = (hz, ini, dur, vol = .16) => {
                const f = a.createBiquadFilter(), g = a.createGain(); f.type = 'lowpass'; f.frequency.value = 2600; f.connect(g).connect(sal);
                g.gain.setValueAtTime(0, t0 + ini); g.gain.linearRampToValueAtTime(vol, t0 + ini + .03);
                g.gain.setValueAtTime(vol * .8, t0 + ini + dur * .7); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + dur);
                [-6, 6].forEach(cents => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz; o.detune.value = cents; o.connect(f); o.start(t0 + ini); o.stop(t0 + ini + dur + .05) });
            };
            const platillo = (ini, dur, vol) => {
                const n = ruido(dur), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 5500;
                n.connect(f).connect(g).connect(sal); g.gain.setValueAtTime(vol, t0 + ini); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + dur); n.start(t0 + ini);
            };
            const timbal = ini => {
                const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t0 + ini); o.frequency.exponentialRampToValueAtTime(55, t0 + ini + .5);
                g.gain.setValueAtTime(.7, t0 + ini); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + .6); o.connect(g).connect(sal); o.start(t0 + ini); o.stop(t0 + ini + .65);
            };
            // Ta-ta-ta-táaa… y acorde final
            [[392, 0, .13], [523, .14, .13], [659, .28, .13], [784, .42, .42]].forEach(([hz, i, d]) => trompeta(hz, i, d));
            timbal(0); timbal(.42); platillo(.42, .5, .25);
            [523, 659, 784, 1047].forEach(hz => trompeta(hz, .9, 1.5, .11));
            timbal(.9); platillo(.9, 1.6, .35);
        } catch { }
    }
    function girar() {
        if (girando) return;
        sacar(); if (!nombres.length) return;
        Voz.callar(); girando = true; res.hidden = true; pintarLista();
        const n = nombres.length, paso = Math.PI * 2 / n, gana = Math.floor(Math.random() * n);
        // Ángulo final: el centro del sector ganador queda bajo la flecha (arriba)
        const base = -(gana * paso + paso / 2), vueltas = quieto() ? 1 : 6 + Math.floor(Math.random() * 3);
        const desde = ang, hasta = base + Math.PI * 2 * (Math.ceil((desde - base) / (Math.PI * 2)) + vueltas) + (Math.random() - .5) * paso * .6;
        const dur = quieto() ? 600 : 5200, t0 = performance.now();
        try { if (sonar()) ac() } catch { }
        let redoblando = quieto();
        let ult = Math.floor(desde / paso);
        robot('¡Girando! ¿A quién le tocará? 🎡');
        (function f(t) {
            const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
            ang = desde + (hasta - desde) * e; dibujar();
            const s = Math.floor(ang / paso); if (s !== ult) { ult = s; if (!redoblando) tic() }
            if (!redoblando && t - t0 > dur - 1500) { redoblando = true; redoble(1.45) }
            if (k < 1) requestAnimationFrame(f); else fin(gana);
        })(t0);
    }
    function fin(i) {
        girando = false;
        const nm = nombres[i];
        let pi = Math.floor(Math.random() * PREGUNTAS.length);
        res.replaceChildren();
        const q = el('p', 'res-preg', PREGUNTAS[pi]);
        const otra = el('button', 'btn ghost', '🔄 Otra pregunta'); otra.type = 'button';
        otra.onclick = () => { pi = (pi + 1 + Math.floor(Math.random() * (PREGUNTAS.length - 1))) % PREGUNTAS.length; q.textContent = PREGUNTAS[pi] };
        const b = el('div', 'btns'); b.append(otra);
        res.append(el('p', 'res-le', '🎤 ¡Le toca a…'), el('p', 'res-nombre', nm), el('p', 'small', 'Cuéntenos una experiencia con la tecnología o la IA. Por ejemplo:'), q, b,
            el('p', 'small', '✔ ' + nm + ' sale de la ruleta automáticamente para que no se repita.'));
        res.hidden = false; pintarLista();
        fanfarria(); fiesta(res);
        // El robot dice el nombre en voz alta (si el sonido de la ruleta está encendido)
        const decir = (txt, alTerminar) => sonar() ? Voz.decir(txt, alTerminar) : alTerminar && alTerminar();
        if (window.Robot && Robot.presentar && !quieto()) Robot.presentar(nm, { decir }).then(() => fiesta(res));
        else { robot('¡Le toca a ' + nm + '! Le escuchamos con atención. 👂', 'feliz'); decir('¡Le toca a ' + nm + '! Cuéntenos su experiencia.') }
        pendiente = nm; tSacar = setTimeout(sacar, quieto() ? 800 : 2500);
    }
    botones.forEach(b => b.onclick = girar);
    if (document.fonts) document.fonts.ready.then(dibujar);
    cambio();
})();
