// Pantalla del presentador (ADEP Reto IA)
const S = sessionStorage; let es = null, last = null, festejo = null;
// Dirección que verán los teléfonos. Si la página se abre como "localhost", se pide al servidor la IP de la red.
let BASE = location.origin, NOLAN = false;
async function resolveBase() {
    if (!/^(localhost|127\.|\[::1\])/.test(location.hostname)) return;
    try { const j = await (await fetch('/api/info')).json(); if (j.urls && j.urls.length) BASE = j.urls[0]; else NOLAN = true } catch { NOLAN = true }
}
const err = m => $('#err').textContent = m || '';
const act = async t => { const r = await api('/api/action', { code: S.hcode, role: 'host', token: S.htoken, type: t }); if (r.error) err(r.error); else err() };
$('#create').onclick = async () => { err(); const r = await api('/api/create', { n: +$('#n').value, secs: +$('#secs').value }); if (r.error) return err(r.error); S.hcode = r.code; S.htoken = r.hostToken; open_() };
async function open_() {
    $('#setup').hidden = true; $('#stage').hidden = false; await resolveBase();
    es = connect(`code=${S.hcode}&role=host&token=${S.htoken}`, render, (ok, gone) => { $('#conn').textContent = gone ? 'La partida expiró' : ok ? 'Conectado' : 'Sin conexión. Reconectando…'; if (gone) S.clear() });
}
if (S.hcode) open_();
setInterval(() => fetch('/api/info', { cache: 'no-store' }).catch(() => { }), 240000); // mantiene despierto el servidor gratuito
const link = () => BASE + '/quiz.html?code=' + S.hcode;
function lobby(s) {
    const v = $('#view');
    if (!$('#qr')) {
        v.replaceChildren();
        const row = h('div', 'row'), left = h('div'), qr = h('div', 'qrbox'); qr.id = 'qr';
        left.append(h('p', null, 'Entre desde su teléfono a:'), h('p', 'qtxt', BASE.replace(/^https?:\/\//, '') + '/quiz.html'), h('p', null, 'y escriba este código:'), Object.assign(h('div', 'code', S.hcode)));
        const cb = h('button', 'btn ghost', 'Copiar enlace'), cc = h('button', 'btn ghost', 'Copiar código'); cb.onclick = () => copy(link(), cb); cc.onclick = () => copy(S.hcode, cc);
        left.append(cb, document.createTextNode(' '), cc); row.append(left, qr); v.append(row);
        if (NOLAN) v.append(h('p', 'err', 'No encontramos la dirección de esta computadora en la red. Conéctela al mismo Wi-Fi que los teléfonos o publique el servidor.'));
        if (window.QRCode) new QRCode(qr, { text: link(), width: 200, height: 200 }); else qr.append(h('p', 'small', 'El código QR no pudo cargarse. Use el enlace o el código.'));
        const info = h('div', 'panel'); info.append(h('p', null, 'Reglas: cada respuesta correcta da entre 800 y 1000 puntos (la rapidez suma poco). Incorrecta o tardía: 0. Empate: más respuestas correctas y, si sigue, menor tiempo en las correctas.')); v.append(info);
        const names = h('div', 'panel'); names.id = 'names'; v.append(names);
        const go = h('button', 'btn', 'Iniciar la partida'); go.onclick = () => act('start'); v.append(go);
    }
    const n = $('#names'); n.replaceChildren(h('p', null, 'Participantes conectados: ' + s.count)); const w = h('div', 'names'); s.names.forEach(x => w.append(h('span', null, x))); n.append(w);
}
function render(s) {
    last = s; timer($('#timer'), s); $('#prog').textContent = s.idx ? `Pregunta ${s.idx} de ${s.total}` : '';
    if (s.state === 'lobby') return lobby(s);
    const v = $('#view'); v.replaceChildren();
    if (s.state === 'question' || s.state === 'results') {
        v.append(h('p', 'small', (typeof CAT_ICO !== 'undefined' && CAT_ICO[s.q.cat] || '') + ' ' + s.q.cat), h('p', 'qtxt', s.q.q)); const box = h('div', 'ans rq-ans');
        s.q.opts.forEach((o, i) => { const b = window.opcion ? opcion(i, o) : h('div', null, MARK[i] + '  ' + o); if (s.state === 'results') b.classList.add(i === s.correct ? 'right' : 'wrong'); box.append(b) }); v.append(box);
        // Al revelar la respuesta (una sola vez por pregunta): sonido y confeti
        if (s.state === 'results' && festejo !== s.idx && window.tono) { festejo = s.idx; sonidoBien(); setTimeout(() => confeti(box.children[s.correct]), 60) }
        v.append(h('p', null, 'Respondieron ' + s.answered + ' de ' + s.count + (s.state === 'question' ? '. Faltan ' + (s.count - s.answered) + '.' : '.')));
        const db = h('div', 'bars'); v.append(db); dist(db, s.dist);
        if (s.order && s.order.length) { const o = h('div', 'panel'); o.append(h('b', null, 'Orden en que llegaron las respuestas')); const ol = h('ol'); s.order.slice(0, 8).forEach((x, i) => ol.append(h('li', null, x.name + ' — ' + ['primero', 'segundo', 'tercero'][i] + ' (' + (x.ms / 1000).toFixed(1) + ' s)' + (x.ok === undefined ? '' : x.ok ? ' ✔ acertó' : ' ✖ no acertó')))); o.append(ol); v.append(o) }
        const ctl = h('div', 'btns');
        if (s.state === 'question') { const c = h('button', 'btn', 'Cerrar la pregunta ahora'); c.onclick = () => act('close'); ctl.append(c) }
        else {
            v.append(h('p', 'fb', 'Respuesta correcta: ' + MARK[s.correct] + '  ' + s.q.opts[s.correct]), h('p', null, s.expl)); const t = h('table'); s.board.forEach(p => { const r = t.insertRow();[p.pos + '.º', p.name, p.score + ' puntos'].forEach(x => r.insertCell().textContent = x) }); v.append(t);
            const n = h('button', 'btn', s.last ? 'Ver el podio final' : 'Siguiente pregunta'); n.onclick = () => act('next'); ctl.append(n)
        }
        const e = h('button', 'btn ghost', 'Finalizar el concurso'); e.onclick = () => { if (confirm('¿Finalizar el concurso ahora?')) act('end') }; ctl.append(e); v.append(ctl);
    }
    if (s.state === 'ended') {
        if (festejo !== 'fin' && window.tono) { festejo = 'fin'; sonidoFin(); aplausos(); setTimeout(() => confeti(v), 200) }
        v.append(h('p', 'qtxt', '¡Podio final! 🏆')); const pd = h('div', 'pod'); v.append(pd); podium(pd, s.podium || []); v.append(h('p', null, '¡Gracias a todas las personas participantes! Aprender juntos es lo más importante.'));
        const b = h('div', 'btns'); const again = h('button', 'btn', 'Crear otra partida'); again.onclick = () => { S.clear(); location.reload() }; b.append(again, Object.assign(h('a', 'btn ghost', 'Regresar a la charla'), { href: 'index.html' })); v.append(b)
    }
}