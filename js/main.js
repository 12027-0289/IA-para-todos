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

/* ---------- Actividad 3: Enséñele a la máquina ---------- */
(() => {
    const SIG = { urgencia: '⏱️ Prisa', dinero: '💰 Pide dinero', premio: '🎁 Premio', enlace: '🔗 Enlace raro', secreto: '🤫 Secreto', codigo: '🔢 Pide código o PIN' };
    const TRAIN = [
        ['📩', '¡Felicidades! Ganó un carro. Pague ₡15 000 hoy para reclamarlo: bit.ly/premio', ['premio', 'dinero', 'urgencia', 'enlace']],
        ['💬', 'Hola mamá, ¿le parece si el domingo almorzamos juntos?', []],
        ['📩', 'Su cuenta será bloqueada en 1 hora. Envíe el código que le llegó por SMS.', ['urgencia', 'codigo']],
        ['🏥', 'Recordatorio: su cita en el EBAIS es el martes a las 9 a. m.', []],
        ['💬', 'Abuelo, cambié de número. Necesito plata urgente, no le diga a nadie.', ['dinero', 'urgencia', 'secreto']],
        ['💊', 'La farmacia le informa que su receta ya está lista para recoger.', []]
    ];
    const TEST = [
        ['📩', 'Último aviso: actualice los datos de su banco aquí: banco-seguro.xyz', ['urgencia', 'enlace'], 1],
        ['💬', 'Doña Ana, ya le dejé las naranjas en la puerta. ¡Que esté bien!', [], 0],
        ['📩', 'Ganó un bono del gobierno. Envíe su PIN para depositarlo.', ['premio', 'codigo'], 1]
    ];
    const labels = Array(TRAIN.length).fill(null);
    const list = $('#trainList'), btn = $('#trainBtn');
    const step = (on, done) => ['#s3a', '#s3b', '#s3c'].forEach((s, k) => { $(s).classList.toggle('on', k === on); $(s).classList.toggle('done', k < done) });
    function msgText(icon, text) { const d = el('div', 'txt'); const i = el('span', null, icon); i.setAttribute('aria-hidden', 'true'); d.append(i, el('p', null, text)); return d }
    function build() {
        list.replaceChildren();
        TRAIN.forEach(([ic, tx], k) => {
            const li = el('li'), g = el('div', 'lbl'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Marcar mensaje ' + (k + 1));
            [['safe', '✔ Seguro', 0], ['sus', '⚠ Sospechoso', 1]].forEach(([c, t, v]) => {
                const b = el('button', c, t); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
                b.onclick = () => { labels[k] = v; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); update() };
                g.append(b);
            });
            li.append(msgText(ic, tx), g); list.append(li);
        });
        update();
    }
    function update() {
        const left = labels.filter(x => x === null).length;
        btn.disabled = left > 0; btn.textContent = left ? 'Entrenar a la máquina (faltan ' + left + ')' : 'Entrenar a la máquina';
    }
    btn.onclick = () => {
        // Cada señal suma +1 si apareció en un mensaje marcado sospechoso y −1 si apareció en uno marcado seguro.
        const w = {}; Object.keys(SIG).forEach(s => w[s] = 0);
        let plainSus = 0, plainSafe = 0;
        TRAIN.forEach(([, , f], k) => { f.forEach(s => w[s] += labels[k] ? 1 : -1); if (!f.length) labels[k] ? plainSus++ : plainSafe++ });
        step(1, 1); btn.disabled = true; btn.textContent = 'Entrenando…';
        setTimeout(() => { showLearned(w, plainSus, plainSafe) }, calm ? 100 : 1100);
    };
    function showLearned(w, plainSus, plainSafe) {
        step(2, 2); $('#a3Train').hidden = true; $('#a3Learn').hidden = false;
        const sg = $('#signals'); sg.replaceChildren();
        Object.entries(w).filter(([, v]) => v).forEach(([s, v]) => sg.append(el('span', 'sig ' + (v > 0 ? 'sus' : 'safe'), SIG[s] + (v > 0 ? ' → sospechoso' : ' → seguro'))));
        sg.append(el('span', 'sig ' + (plainSus > plainSafe ? 'sus' : 'safe'), '💬 Sin señales → ' + (plainSus > plainSafe ? 'sospechoso' : 'seguro')));
        const tl = $('#testList'); tl.replaceChildren(); let hits = 0;
        TEST.forEach(([ic, tx, f, truth]) => {
            const sc = f.reduce((a, s) => a + w[s], 0);
            const pred = f.length ? (sc > 0 ? 1 : sc < 0 ? 0 : null) : (plainSus > plainSafe ? 1 : 0);
            if (pred === truth) hits++;
            const li = el('li'), v = el('div', 'verdict');
            const tag = el('b', pred === null ? 'unsure' : pred ? 'sus' : 'safe', pred === null ? '🤔 No está segura' : pred ? '⚠ Sospechoso' : '✔ Seguro');
            const why = f.length ? 'Señales: ' + f.map(s => SIG[s].replace(/^\S+\s/, '')).join(', ') : 'No encontró señales';
            v.append(el('small', null, 'La máquina dice:'), tag, el('small', null, why));
            li.append(msgText(ic, tx), v); tl.append(li);
        });
        const L = $('#a3Lesson'); L.replaceChildren();
        L.append(el('b', null, hits === TEST.length ? '¡La máquina acertó las 3! ' : 'La máquina acertó ' + hits + ' de 3. '),
            document.createTextNode(hits === TEST.length
                ? 'Aprendió bien porque usted le enseñó bien. Fíjese: no “entiende” los mensajes, solo encontró patrones en sus ejemplos.'
                : 'Se equivocó porque aprendió de los ejemplos que usted le dio. Así funciona la IA real: si aprende de ejemplos equivocados, se equivoca.'));
        L.append(el('br'), el('span', 'small', 'Pruebe volver a empezar y enséñele a propósito algo diferente para ver qué pasa.'));
        if (hits === TEST.length) { fiesta($('#a3Lesson')); robot('¡Gracias por enseñarme tan bien! 🤖💙', 'feliz') } else robot('Aprendí de sus ejemplos… ¡por eso me equivoqué! 🤔', 'alerta');
        $('#a3Learn').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    }
    $('#a3Reset').onclick = () => { labels.fill(null); $('#a3Learn').hidden = true; $('#a3Train').hidden = false; step(0, 0); build(); $('#act3').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }) };
    build();
})();
