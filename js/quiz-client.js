// Utilidades comunes y pantalla de participantes (ADEP Reto IA)
const $ = s => document.querySelector(s);
function h(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e }
async function api(p, b) { try { const r = await fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); const j = await r.json().catch(() => ({})); return r.ok ? j : { error: j.error || 'Algo salió mal. Intente de nuevo.' } } catch (e) { return { error: 'No hay conexión con el servidor. Revise su internet e intente de nuevo.' } } }
function connect(qs, onState, onConn) { const es = new EventSource('/api/events?' + qs); es.onmessage = e => { onConn(true); onState(JSON.parse(e.data)) }; es.onerror = () => onConn(false); es.addEventListener('gone', () => { es.close(); onConn(false, true) }); return es }
let _t; function timer(el, s) { clearInterval(_t); if (s.state !== 'question') { el.textContent = ''; return } const end = performance.now() + s.remaining, f = () => { el.textContent = 'Tiempo: ' + Math.max(0, Math.ceil((end - performance.now()) / 1000)) + ' s' }; f(); _t = setInterval(f, 250) }
const MARK = ['▲ A', '◆ B', '● C', '■ D'];
function dist(box, d) { box.replaceChildren(); const m = Math.max(1, ...d); d.forEach((n, i) => { const r = h('div', 'bar2'), b = h('i'); b.style.width = (n / m * 70) + '%'; r.append(h('b', null, MARK[i]), b, h('span', null, n + '')); box.append(r) }) }
function podium(box, top) { box.replaceChildren();[[1, '🥇', 'Primer lugar', 'p1'], [0, '🥈', 'Segundo lugar', 'p2'], [2, '🥉', 'Tercer lugar', 'p3']].forEach(([i, m, l, c]) => { const p = top[i]; if (!p) return; const d = h('div', c); d.append(h('div', null, m), h('b', null, l), h('p', null, p.name), h('p', null, p.score + ' puntos'), h('p', null, p.correct + ' de ' + p.answered + ' correctas (' + p.pct + '%)')); box.append(d) }) }
const copy = async (t, btn) => { try { await navigator.clipboard.writeText(t); const o = btn.textContent; btn.textContent = '¡Copiado!'; setTimeout(() => btn.textContent = o, 1500) } catch { prompt('Copie este texto:', t) } };

if ($('#player')) {
    const S = sessionStorage, P = new URLSearchParams(location.search); let es = null;
    const err = m => ($('#game').hidden ? $('#err') : $('#errG')).textContent = m || '';
    if (P.get('code')) $('#code').value = P.get('code').toUpperCase().slice(0, 6);
    function enter() {
        $('#join').hidden = true; $('#game').hidden = false;
        es = connect(`code=${S.code}&pid=${S.pid}&token=${S.token}`, render, (ok, gone) => { $('#conn').textContent = gone ? 'La partida terminó' : ok ? 'Conectado' : 'Sin conexión. Reconectando…'; if (gone) { S.clear(); $('#view').replaceChildren(h('p', 'qtxt', 'La partida terminó. Gracias por participar.'), Object.assign(h('a', 'btn', 'Volver a la charla'), { href: 'index.html' })) } });
    }
    $('#joinBtn').onclick = async () => {
        err(); const code = $('#code').value.trim().toUpperCase(), name = $('#name').value.trim();
        if (!code) return err('Escriba el código de la partida (6 letras y números).'); if (!name) return err('Escriba su nombre o apodo para entrar.');
        $('#joinBtn').disabled = true; const r = await api('/api/join', { code, name }); $('#joinBtn').disabled = false; if (r.error) return err(r.error);
        Object.assign(S, { code, pid: r.pid, token: r.token, name: r.name }); enter()
    };
    if (S.code && S.pid) enter();
    function render(s) {
        const v = $('#view'); v.replaceChildren(); timer($('#timer'), s); $('#prog').textContent = s.idx ? `Pregunta ${s.idx} de ${s.total}` : '';
        if (s.state === 'lobby') { v.append(h('p', 'qtxt', '¡Ya está dentro, ' + S.name + '!'), h('p', null, 'Espere a que el presentador inicie. Participantes conectados: ' + s.count)); return }
        if (s.state === 'question' || s.state === 'results') {
            v.append(h('p', 'small', s.q.cat), h('p', 'qtxt', s.q.q)); const box = h('div', 'ans');
            s.q.opts.forEach((o, i) => {
                const b = h(s.state === 'question' ? 'button' : 'div', null, MARK[i] + '  ' + o);
                if (s.state === 'question') { b.disabled = !!s.mine; b.onclick = async () => { box.querySelectorAll('button').forEach(x => x.disabled = true); const r = await api('/api/answer', { code: S.code, pid: S.pid, token: S.token, choice: i }); if (r.error) { err(r.error); if (!/tiempo|Ya registramos/.test(r.error)) box.querySelectorAll('button').forEach(x => x.disabled = false) } else err() } }
                else { if (i === s.correct) b.classList.add('right'); else b.classList.add('wrong'); if (s.mine && s.mine.choice === i) b.classList.add('mine') } box.append(b)
            });
            v.append(box);
            if (s.state === 'question' && s.mine) v.append(h('p', 'fb', '¡Respuesta recibida! Espera los resultados.'));
            if (s.state === 'results') { const ok = s.mine && s.mine.ok; v.append(h('p', 'fb', s.mine ? (ok ? '¡Correcto! Ganó ' + s.mine.pts + ' puntos.' : 'Esta vez no fue la respuesta correcta.') : 'No alcanzó a responder esta vez.'), h('p', null, 'La respuesta correcta era: ' + MARK[s.correct] + '  ' + s.q.opts[s.correct]), h('p', null, s.expl)); if (s.me) v.append(h('p', null, 'Su puesto: ' + s.me.pos + '.º con ' + s.me.score + ' puntos.')); v.append(h('p', 'small', 'Espere a que el presentador continúe.')) }
        }
        if (s.state === 'ended') { v.append(h('p', 'qtxt', '¡Terminó el concurso!')); const pd = h('div', 'pod'); v.append(pd); podium(pd, s.podium || []); if (s.me) v.append(h('p', 'fb', 'Usted quedó en el puesto ' + s.me.pos + ' con ' + s.me.score + ' puntos y ' + s.me.correct + ' respuestas correctas.')); v.append(h('p', null, '¡Gracias por participar! Cada pregunta es una oportunidad para aprender.'), Object.assign(h('a', 'btn', 'Regresar a la charla'), { href: 'index.html' })) }
    }
}