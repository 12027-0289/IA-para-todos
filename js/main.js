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
    // Musiquita de baile a 120 pulsos por minuto: bombo, platillo, bajo y melodía alegre
    function musica(seg) {
        if (!sonar()) return;
        try {
            const a = ac(), t0 = a.currentTime + .05, T = .5, sal = a.createGain(); sal.gain.value = .45; sal.connect(a.destination);
            const nota = (hz, ini, dur, tipo, vol) => {
                const o = a.createOscillator(), g = a.createGain(); o.type = tipo; o.frequency.value = hz; o.connect(g).connect(sal);
                g.gain.setValueAtTime(vol, t0 + ini); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + dur); o.start(t0 + ini); o.stop(t0 + ini + dur + .02);
            };
            const bombo = ini => { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(150, t0 + ini); o.frequency.exponentialRampToValueAtTime(45, t0 + ini + .25); g.gain.setValueAtTime(.9, t0 + ini); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + .3); o.connect(g).connect(sal); o.start(t0 + ini); o.stop(t0 + ini + .32) };
            const plat = ini => { const n = ruido(.08), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = 7000; n.connect(f).connect(g).connect(sal); g.gain.setValueAtTime(.25, t0 + ini); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + .07); n.start(t0 + ini) };
            const BAJO = [131, 131, 165, 165, 175, 175, 196, 196], MEL = [523, 659, 784, 659, 698, 880, 784, 1047];
            const tiempos = Math.round(seg / T);
            for (let i = 0; i < tiempos; i++) {
                const t = i * T; bombo(t); plat(t + T / 2);
                nota(BAJO[i % 8], t, T * .9, 'triangle', .5);
                nota(MEL[i % 8], t, T * .45, 'square', .07); nota(MEL[i % 8] * (i % 2 ? 1.25 : 1.5), t + T / 2, T * .4, 'square', .05);
            }
            nota(1047, tiempos * T, .8, 'square', .08); nota(1319, tiempos * T, .8, 'square', .06); bombo(tiempos * T); plat(tiempos * T);
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
        girando = true; res.hidden = true; pintarLista();
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
        if (window.Robot && Robot.presentar && !quieto()) Robot.presentar(nm, { alBailar: musica }).then(() => fiesta(res));
        else robot('¡Le toca a ' + nm + '! Le escuchamos con atención. 👂', 'feliz');
        pendiente = nm; tSacar = setTimeout(sacar, quieto() ? 800 : 2500);
    }
    botones.forEach(b => b.onclick = girar);
    if (document.fonts) document.fonts.ready.then(dibujar);
    cambio();
})();
