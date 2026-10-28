// Reto IA sin servidor: si no hay Node.js (GitHub Pages, Live Server o doble clic en el archivo),
// el participante practica en su propio dispositivo y el presentador usa el modo proyector.
async function hayServidor() {
    if (location.protocol === 'file:') return false;
    try { const r = await fetch('/api/info', { cache: 'no-store' }); if (!r.ok) return false; const j = await r.json(); return Array.isArray(j.urls) } catch { return false }
}
function mezclar(n) { const p = [...window.PREGUNTAS]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[p[i], p[j]] = [p[j], p[i]] } return p.slice(0, n) }
function aviso(texto) { const d = h('div', 'panel modo'); d.append(h('b', null, 'Modo sin servidor. '), document.createTextNode(texto)); return d }

(async () => {
    if (!window.PREGUNTAS || await hayServidor()) return;
    const main = document.querySelector('main');
    const box = h('section'); box.id = 'local';
    main.querySelectorAll('section').forEach(s => s.hidden = true);
    main.querySelector('h1').after(box);
    if ($('#player')) jugador(box); else proyector(box);
})();

// ---------- Participante: práctica en su propio teléfono o computadora ----------
const CAT_ICO = { 'Conceptos básicos': '🧠', 'Dónde está la IA': '🔎', 'Utilidad cotidiana': '☕', 'Seguridad digital': '🛡️', 'Estafas por mensajes': '📩', 'Suplantación de voz': '📞', 'Contenidos manipulados': '🎭', 'Datos personales': '🪪', 'Contraseñas y códigos': '🔑', 'Verificar información': '✅' };
const FIG = ['▲', '◆', '●', '■'];
const ROBOT_SVG = '<svg viewBox="0 0 300 340" aria-hidden="true"><defs><linearGradient id="rqm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b9c8e6"/></linearGradient><linearGradient id="rqr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#8b7cf6"/></linearGradient></defs><path d="M70 330 Q70 250 150 245 Q230 250 230 330Z" fill="url(#rqm)"/><circle cx="150" cy="285" r="7" fill="#22d3ee"/><rect x="132" y="225" width="36" height="28" rx="8" fill="#9fb2d8"/><g class="rq-cabeza"><rect x="45" y="40" width="210" height="190" rx="52" fill="url(#rqm)" stroke="url(#rqr)" stroke-width="6"/><rect x="30" y="105" width="20" height="55" rx="10" fill="#9fb2d8"/><rect x="250" y="105" width="20" height="55" rx="10" fill="#9fb2d8"/><rect x="70" y="65" width="160" height="140" rx="38" fill="#0a1a3f"/><ellipse class="rq-ojo" cx="115" cy="125" rx="17" ry="20" fill="#67e8f9"/><ellipse class="rq-ojo" cx="185" cy="125" rx="17" ry="20" fill="#67e8f9"/><path class="rq-boca" d="M125 170 Q150 188 175 170" stroke="#67e8f9" stroke-width="6" fill="none" stroke-linecap="round"/></g></svg>';
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Voz: la más natural y masculina en español disponible (igual que en la charla)
const vozLeer = (() => {
    const tts = 'speechSynthesis' in window ? speechSynthesis : null;
    const HOMBRE = /\b(juan|jorge|pablo|ra[uú]l|[aá]lvaro|diego|carlos|enrique|gonzalo|andr[eé]s|tom[aá]s|gerardo|federico|alonso|jos[eé]|antonio|sergio|rodrigo|mateo|manuel|pedro|alejandro|mario|luis|gabriel)\b/i;
    const MUJER = /\b(sabina|helena|laura|elvira|dalia|paloma|m[oó]nica|paulina|mar[ií]a|lupe|isabela|esperanza|marisol|camila|elena|luc[ií]a)\b/i;
    const pts = v => (HOMBRE.test(v.name) ? 40 : 0) - (MUJER.test(v.name) ? 40 : 0) + (/natural|neural|online|premium|enhanced/i.test(v.name) ? 25 : 0) + ({ 'es-CR': 8, 'es-MX': 6, 'es-419': 6, 'es-US': 5, 'es-ES': 4 }[v.lang.replace('_', '-')] || 0);
    let guardada = null; try { guardada = localStorage.getItem('vozNombre') } catch { }
    return {
        hay: !!tts,
        decir(t) { if (!tts) return; tts.cancel(); const vs = tts.getVoices().filter(v => /^es/i.test(v.lang)).sort((a, b) => pts(b) - pts(a)), v = vs.find(x => x.name === guardada) || vs[0]; const u = new SpeechSynthesisUtterance(t); u.lang = v ? v.lang : 'es-ES'; if (v) u.voice = v; u.rate = .95; tts.speak(u) },
        callar() { tts && tts.cancel() }
    };
})();

// Sonidos suaves hechos con el navegador
let _audio;
function tono(notas) {
    try {
        _audio = _audio || new (window.AudioContext || window.webkitAudioContext)(); const a = _audio, t0 = a.currentTime;
        notas.forEach(([hz, ini, dur]) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = hz; g.gain.setValueAtTime(0, t0 + ini); g.gain.linearRampToValueAtTime(.15, t0 + ini + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + ini + dur); o.connect(g).connect(a.destination); o.start(t0 + ini); o.stop(t0 + ini + dur + .05) });
    } catch { }
}
const sonidoBien = () => tono([[659, 0, .18], [880, .12, .3]]), sonidoMal = () => tono([[330, 0, .25], [262, .15, .35]]), sonidoFin = () => tono([[523, 0, .2], [659, .15, .2], [784, .3, .2], [1047, .45, .5]]);

function confeti(el) {
    if (quieto()) return;
    const r = el.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, cols = ['#2f5ec8', '#1f8a7a', '#e9a23b', '#c9573c', '#7c5ce0', '#38bdf8'];
    for (let i = 0; i < 50; i++) {
        const s = document.createElement('i'); s.className = 'rq-confeti'; s.style.cssText = `left:${x0}px;top:${y0}px;background:${cols[i % 6]}`; document.body.append(s);
        const ang = Math.random() * 6.28, v = 80 + Math.random() * 200;
        s.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * v}px,${Math.sin(ang) * v + 180}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => s.remove();
    }
}

function jugador(box) {
    let qs, i, ok, racha, marcas, leer = true;
    try { leer = localStorage.getItem('rqLeer') !== '0' } catch { }
    document.querySelector('#player > h1').hidden = true;
    const robot = () => { const d = h('div', 'rq-robot'); d.innerHTML = ROBOT_SVG; return d };
    function dice(rb, txt, animo) {
        const b = rb.querySelector('.rq-dice') || h('div', 'rq-dice'); b.textContent = txt; rb.append(b);
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
        rb.classList.remove('feliz', 'triste'); void rb.offsetWidth; if (animo) rb.classList.add(animo);
    }
    function empezar() { qs = mezclar(10); i = 0; ok = 0; racha = 0; marcas = []; pregunta() }

    function inicio() {
        box.replaceChildren();
        const c = h('div', 'rq-inicio'), rb = robot();
        const t = h('div', 'rq-inicio-txt');
        t.append(h('p', 'rq-chip', '🎯 Reto IA · Práctica'), h('h2', null, '¿Cuánto aprendió hoy?'),
            h('p', null, 'Responda 10 preguntas a su ritmo, sin tiempo límite. Yo le acompaño y le explico cada respuesta.'));
        const b = h('button', 'btn rq-grande', '¡Empezar! 🚀'); b.onclick = empezar;
        const d = h('div', 'btns'); d.append(b); t.append(d);
        c.append(rb, t); box.append(c); dice(rb, '¡Hola! ¿Jugamos? 😊');
        b.focus();
    }

    function hud() {
        const top = h('div', 'rq-hud');
        const puntos = h('ol', 'rq-puntos'); puntos.setAttribute('aria-label', 'Avance');
        qs.forEach((_, k) => { const li = h('li', k < marcas.length ? (marcas[k] ? 'bien' : 'mal') : k === i ? 'ahora' : null); li.textContent = k < marcas.length ? (marcas[k] ? '✓' : '✗') : k + 1; puntos.append(li) });
        const marc = h('div', 'rq-marcador');
        marc.append(h('span', 'rq-estrella', '⭐ ' + ok + (ok === 1 ? ' acierto' : ' aciertos')));
        if (racha >= 2) marc.append(h('span', 'rq-racha', '🔥 ' + racha + ' seguidas'));
        top.append(puntos, marc); return top;
    }

    function pregunta() {
        const q = qs[i]; box.replaceChildren(hud());
        const zona = h('div', 'rq-zona'), rb = robot(), tarjeta = h('div', 'rq-tarjeta');
        tarjeta.append(h('p', 'rq-cat', (CAT_ICO[q.cat] || '💡') + ' ' + q.cat + ' · Pregunta ' + (i + 1) + ' de ' + qs.length), h('p', 'rq-preg', q.q));
        if (vozLeer.hay) {
            const oir = h('button', 'rq-oir', '🔊 Escuchar la pregunta'); oir.type = 'button';
            oir.onclick = () => vozLeer.decir(q.q + ' ' + q.opts.map((o, k) => 'Opción ' + 'ABCD'[k] + ': ' + o).join('. '));
            const auto = h('label', 'rq-auto'); const ck = h('input'); ck.type = 'checkbox'; ck.checked = leer;
            ck.onchange = () => { leer = ck.checked; try { localStorage.setItem('rqLeer', leer ? '1' : '0') } catch { } }; auto.append(ck, document.createTextNode(' Leer siempre en voz alta'));
            const fila = h('div', 'rq-voz'); fila.append(oir, auto); tarjeta.append(fila);
        }
        zona.append(rb, tarjeta); box.append(zona);
        const ans = h('div', 'ans rq-ans'), fb = h('div', 'rq-fb'); fb.setAttribute('aria-live', 'polite');
        q.opts.forEach((o, k) => {
            const b = h('button', 'rq-op'); b.type = 'button'; b.style.animationDelay = (k * 90) + 'ms';
            b.append(h('span', 'rq-fig', FIG[k]), h('span', 'rq-letra', 'ABCD'[k]), h('span', 'rq-txt', o));
            b.onclick = () => responder(k, b);
            ans.append(b);
        });
        box.append(ans, fb);
        dice(rb, ['Usted puede 💪', 'Piénselo con calma 🤔', 'Lea con tranquilidad 😊', '¡Vamos! ✨'][i % 4]);
        if (leer && vozLeer.hay) setTimeout(() => vozLeer.decir(q.q), 350);

        function responder(k, b) {
            vozLeer.callar();
            const bien = k === q.a; marcas.push(bien);
            if (bien) { ok++; racha++ } else racha = 0;
            ans.querySelectorAll('button').forEach((x, j) => { x.disabled = true; x.classList.add(j === q.a ? 'right' : 'wrong') }); b.classList.add('mine');
            box.querySelector('.rq-hud').replaceWith(hud());
            const sig = h('button', 'btn rq-grande', i < qs.length - 1 ? 'Siguiente pregunta →' : 'Ver mi resultado 🏆'); sig.onclick = () => { vozLeer.callar(); i++; i < qs.length ? pregunta() : fin() };
            const d = h('div', 'btns'); d.append(sig);
            const titulo = bien ? (racha >= 3 ? '¡' + racha + ' seguidas! ¡Imparable! 🔥' : '¡Correcto! 🎉') : 'Esta vez no, ¡pero ya aprendió algo!';
            fb.className = 'rq-fb ' + (bien ? 'bien' : 'mal');
            fb.replaceChildren(h('p', 'rq-fb-t', titulo));
            if (!bien) fb.append(h('p', null, 'La respuesta correcta era: ' + FIG[q.a] + ' ' + 'ABCD'[q.a] + ' — ' + q.opts[q.a]));
            fb.append(h('p', 'rq-porque', '💡 ' + q.e), d);
            if (bien) { sonidoBien(); confeti(b); dice(rb, ['¡Excelente!', '¡Muy bien!', '¡Así se hace!'][i % 3] + ' 🎉', 'feliz') }
            else { sonidoMal(); dice(rb, 'No pasa nada, así se aprende 💙', 'triste') }
            if (leer && vozLeer.hay) vozLeer.decir((bien ? '¡Correcto! ' : 'La respuesta correcta era ' + q.opts[q.a] + '. ') + q.e);
            fb.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'nearest' }); sig.focus({ preventScroll: true });
        }
    }

    function fin() {
        const pct = Math.round(ok / qs.length * 100), estrellas = ok >= 9 ? 3 : ok >= 6 ? 2 : ok >= 3 ? 1 : 0;
        const medalla = ok >= 9 ? '🏆' : ok >= 6 ? '🥇' : ok >= 3 ? '🌟' : '🌱';
        const msg = ok >= 9 ? '¡Excelente! Es una experta o un experto en IA.' : ok >= 6 ? '¡Muy bien! Ya domina lo más importante.' : ok >= 3 ? '¡Buen trabajo! Va por muy buen camino.' : '¡Gracias por practicar! Cada pregunta le enseñó algo nuevo.';
        box.replaceChildren(hud());
        const c = h('div', 'rq-final'), rb = robot();
        const anillo = h('div', 'rq-anillo'); anillo.style.setProperty('--p', 0); anillo.append(h('span', 'rq-medalla', medalla), h('b', null, ok + ' / ' + qs.length));
        const est = h('p', 'rq-estrellas'); est.setAttribute('aria-label', estrellas + ' de 3 estrellas');
        for (let k = 0; k < 3; k++) { const s = h('span', k < estrellas ? 'llena' : null, '★'); s.style.animationDelay = (600 + k * 250) + 'ms'; est.append(s) }
        const t = h('div'); t.append(h('h2', null, '¡Terminó el reto!'), est, h('p', 'rq-msg', msg));
        const otra = h('button', 'btn rq-grande', 'Jugar otra vez 🔄'); otra.onclick = empezar;
        const d = h('div', 'btns'); d.append(otra, Object.assign(h('a', 'btn ghost', 'Volver a la charla'), { href: 'index.html' })); t.append(d);
        c.append(anillo, t, rb); box.append(c);
        requestAnimationFrame(() => anillo.style.setProperty('--p', pct));
        dice(rb, ok >= 6 ? '¡Estoy muy orgulloso! 🥳' : '¡Lo hizo muy bien! 💙', 'feliz');
        sonidoFin(); if (ok >= 3) setTimeout(() => confeti(anillo), 400);
        if (leer && vozLeer.hay) vozLeer.decir('¡Terminó el reto! Acertó ' + ok + ' de ' + qs.length + '. ' + msg);
        otra.focus();
    }
    inicio();
}

// ---------- Presentador: modo proyector, el público responde levantando la mano ----------
function proyector(box) {
    let qs, i;
    function inicio() {
        box.replaceChildren(aviso('No hay servidor para que el público responda desde el teléfono. Use el modo proyector: usted muestra cada pregunta en pantalla grande y el público responde en voz alta o levantando la mano por la figura (▲ ◆ ● ■).'));
        const p = h('div', 'panel'); const l = h('label', null, 'Número de preguntas (3 a 30)'); l.htmlFor = 'nLocal';
        const n = h('input'); Object.assign(n, { id: 'nLocal', type: 'number', min: 3, max: 30, value: 10 });
        const b = h('button', 'btn', 'Comenzar el Reto IA'); b.onclick = () => { qs = mezclar(Math.min(30, Math.max(3, +n.value || 10))); i = 0; pregunta() };
        const d = h('div', 'btns'); d.append(b, Object.assign(h('a', 'btn ghost', 'Practicar en este dispositivo'), { href: 'quiz.html' }));
        p.append(l, n, d); box.append(p);
    }
    function pregunta() {
        const q = qs[i]; box.replaceChildren();
        box.append(h('p', 'small', 'Pregunta ' + (i + 1) + ' de ' + qs.length + ' · ' + q.cat), h('p', 'qtxt', q.q));
        const ans = h('div', 'ans'); q.opts.forEach((o, k) => ans.append(h('div', null, MARK[k] + '  ' + o))); box.append(ans);
        const zona = h('div'), d = h('div', 'btns');
        const ver = h('button', 'btn', 'Mostrar la respuesta');
        ver.onclick = () => {
            [...ans.children].forEach((x, j) => x.classList.add(j === q.a ? 'right' : 'wrong'));
            zona.replaceChildren(h('p', 'fb', 'Respuesta correcta: ' + MARK[q.a] + '  ' + q.opts[q.a]), h('p', null, q.e));
            const sig = h('button', 'btn', i < qs.length - 1 ? 'Siguiente pregunta' : 'Terminar el reto'); sig.onclick = () => { i++; i < qs.length ? pregunta() : fin() };
            d.replaceChildren(sig, salir()); sig.focus();
        };
        d.append(ver, salir()); box.append(zona, d); ver.focus();
    }
    function salir() { const e = h('button', 'btn ghost', 'Finalizar el concurso'); e.onclick = () => { if (confirm('¿Finalizar el concurso ahora?')) fin() }; return e }
    function fin() {
        box.replaceChildren(h('p', 'qtxt', '¡Terminamos el Reto IA! 🎉'), h('p', null, '¡Gracias a todas las personas participantes! Aprender juntos es lo más importante.'));
        const otra = h('button', 'btn', 'Jugar otra vez'); otra.onclick = inicio;
        const d = h('div', 'btns'); d.append(otra, Object.assign(h('a', 'btn ghost', 'Regresar a la charla'), { href: 'index.html' })); box.append(d);
    }
    inicio();
}
