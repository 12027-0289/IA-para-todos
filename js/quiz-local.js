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
function jugador(box) {
    let qs, i, ok;
    function inicio() {
        box.replaceChildren(aviso('El concurso en vivo no está disponible aquí, pero puede practicar con las mismas preguntas en este dispositivo, a su ritmo y sin tiempo límite.'));
        const b = h('button', 'btn', 'Empezar la práctica (10 preguntas)'); b.onclick = () => { qs = mezclar(10); i = 0; ok = 0; pregunta() };
        const d = h('div', 'btns'); d.append(b); box.append(d); b.focus();
    }
    function pregunta() {
        const q = qs[i]; box.replaceChildren();
        box.append(h('p', 'small', 'Pregunta ' + (i + 1) + ' de ' + qs.length + ' · ' + q.cat), h('p', 'qtxt', q.q));
        const ans = h('div', 'ans'), fb = h('div'); fb.setAttribute('aria-live', 'polite');
        q.opts.forEach((o, k) => {
            const b = h('button', null, MARK[k] + '  ' + o);
            b.onclick = () => {
                const bien = k === q.a; if (bien) ok++;
                ans.querySelectorAll('button').forEach((x, j) => { x.disabled = true; x.classList.add(j === q.a ? 'right' : 'wrong') }); b.classList.add('mine');
                const sig = h('button', 'btn', i < qs.length - 1 ? 'Siguiente pregunta' : 'Ver mi resultado'); sig.onclick = () => { i++; i < qs.length ? pregunta() : fin() };
                const d = h('div', 'btns'); d.append(sig);
                fb.replaceChildren(h('p', 'fb', bien ? '¡Correcto! 🎉' : 'Esta vez no. La respuesta correcta era: ' + MARK[q.a] + '  ' + q.opts[q.a]), h('p', null, q.e), d); sig.focus();
            };
            ans.append(b);
        });
        box.append(ans, fb);
    }
    function fin() {
        box.replaceChildren(h('p', 'qtxt', '¡Terminó la práctica!'), h('p', 'code', ok + ' / ' + qs.length),
            h('p', null, ok >= 8 ? '¡Excelente! Ya domina lo más importante sobre la IA.' : ok >= 5 ? '¡Muy bien! Va por buen camino.' : '¡Gracias por practicar! Cada pregunta es una oportunidad para aprender.'));
        const otra = h('button', 'btn', 'Practicar otra vez'); otra.onclick = () => { qs = mezclar(10); i = 0; ok = 0; pregunta() };
        const d = h('div', 'btns'); d.append(otra, Object.assign(h('a', 'btn ghost', 'Volver a la charla'), { href: 'index.html' })); box.append(d);
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
