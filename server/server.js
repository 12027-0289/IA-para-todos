// ADEP Reto IA: servidor sin base de datos. Estado en memoria; tiempo real con Server-Sent Events + POST.
// Sin dependencias externas: node server/server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const QS = require('./questions');
const PORT = process.env.PORT || 3000, ROOT = path.join(__dirname, '..');
const games = new Map(), hits = new Map();
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code6 = () => Array.from({ length: 6 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join('');
const tok = () => crypto.randomBytes(16).toString('hex');
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function limited(key, max) { const now = Date.now(); let h = hits.get(key); if (!h || now - h.t > 60000) { h = { t: now, n: 0 }; hits.set(key, h) } return ++h.n > max }
// Direcciones por las que otros dispositivos pueden entrar. Si existe PUBLIC_URL (servidor publicado) se usa esa.
function lanUrls() {
    if (process.env.PUBLIC_URL) return [process.env.PUBLIC_URL.replace(/\/+$/, '')];
    const rank = a => a.startsWith('192.168.') ? 0 : a.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a) ? 2 : 3;
    const list = [];
    for (const arr of Object.values(os.networkInterfaces())) for (const i of arr || []) if ((i.family === 'IPv4' || i.family === 4) && !i.internal) list.push(i.address);
    return list.sort((a, b) => rank(a) - rank(b)).map(a => 'http://' + a + ':' + PORT);
}
const clamp = (v, a, b, d) => Number.isFinite(+v) ? Math.min(b, Math.max(a, Math.round(+v))) : d;

function newGame(n, secs) {
    const pool = [...QS]; for (let i = pool.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[pool[i], pool[j]] = [pool[j], pool[i]] }
    let code; do code = code6(); while (games.has(code));
    const g = { code, hostToken: tok(), qs: pool.slice(0, n), limit: secs, state: 'lobby', qi: -1, players: new Map(), answers: new Map(), order: [], clients: new Set(), last: Date.now(), timer: null };
    games.set(code, g); return g;
}
const ranking = g => [...g.players.entries()].map(([id, p]) => ({ id, ...p })).sort((a, b) => b.score - a.score || b.correct - a.correct || a.time - b.time)
    .map((p, i) => ({ id: p.id, pos: i + 1, name: p.name, score: p.score, correct: p.correct, answered: p.answered, pct: p.answered ? Math.round(100 * p.correct / p.answered) : 0 }));
function snap(g, role, pid) {
    const q = g.qs[g.qi], now = Date.now();
    const s = { code: g.code, state: g.state, total: g.qs.length, idx: g.qi + 1, names: [...g.players.values()].map(p => p.name), count: g.players.size, limit: g.limit };
    if (g.state === 'question' || g.state === 'results') {
        s.q = { cat: q.cat, q: q.q, opts: q.opts }; s.answered = g.answers.size;
        if (g.state === 'question') s.remaining = Math.max(0, g.endsAt - now);
        if (role === 'host' || g.state === 'results') { s.dist = [0, 0, 0, 0]; g.answers.forEach(a => s.dist[a.c]++) }
        if (role === 'player') { const a = g.answers.get(pid); s.mine = a ? (g.state === 'results' ? { choice: a.c, ok: a.pts > 0, pts: a.pts } : { received: true }) : null }
        if (role === 'host') s.order = g.order.map(o => ({ name: o.name, ms: o.ms, ok: g.state === 'results' ? o.ok : undefined }));
    }
    if (g.state === 'results') { s.correct = q.a; s.expl = q.e; s.last = g.qi === g.qs.length - 1 }
    if (g.state === 'results' || g.state === 'ended') {
        const r = ranking(g); s.board = r.slice(0, g.state === 'ended' ? 50 : 5).map(({ id, ...x }) => x);
        if (role === 'player') { const me = r.find(x => x.id === pid); if (me) { const { id, ...x } = me; s.me = x } }
        if (g.state === 'ended') s.podium = s.board.slice(0, 3);
    }
    return s;
}
function broadcast(g) { g.last = Date.now(); for (const c of g.clients) c.res.write('data: ' + JSON.stringify(snap(g, c.role, c.pid)) + '\n\n') }
function startQ(g) {
    g.qi++; g.state = 'question'; g.answers = new Map(); g.order = []; g.t0 = Date.now(); g.endsAt = g.t0 + g.limit * 1000;
    clearTimeout(g.timer); g.timer = setTimeout(() => closeQ(g), g.limit * 1000 + 50); broadcast(g);
}
function closeQ(g) { if (g.state !== 'question') return; clearTimeout(g.timer); g.state = 'results'; broadcast(g) }
function endGame(g) { clearTimeout(g.timer); g.state = 'ended'; broadcast(g) }

function body(req) { return new Promise(r => { let d = ''; req.on('data', c => { d += c; if (d.length > 2048) { req.destroy() } }); req.on('end', () => { try { r(JSON.parse(d || '{}')) } catch { r({}) } }) }) }
const send = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)) };
const ip = req => (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

async function api(req, res, u) {
    const b = req.method === 'POST' ? await body(req) : {}, qs = u.searchParams, I = ip(req);
    if (u.pathname === '/api/info') return send(res, 200, { urls: lanUrls() });
    if (u.pathname === '/api/create') {
        if (limited(I + 'c', 10)) return send(res, 429, { error: 'Demasiados intentos. Espere un minuto.' });
        if (games.size >= 50) return send(res, 503, { error: 'El servidor está lleno. Intente más tarde.' });
        const g = newGame(clamp(b.n, 3, QS.length, 10), clamp(b.secs, 10, 90, 30));
        return send(res, 200, { code: g.code, hostToken: g.hostToken, total: g.qs.length });
    }
    if (u.pathname === '/api/join') {
        const code = String(b.code || '').toUpperCase().trim(), g = games.get(code);
        if (!g) { if (limited(I + 'f', 20)) return send(res, 429, { error: 'Demasiados intentos. Espere un minuto.' }); return send(res, 404, { error: 'No encontramos esa partida. Revise el código.' }) }
        const name = String(b.name || '').normalize('NFC').trim().replace(/\s+/g, ' ');
        if (!name) return send(res, 400, { error: 'Escriba su nombre o apodo para entrar.' });
        if (name.length > 20 || /[\u0000-\u001f\u007f-\u009f<>]/.test(name)) return send(res, 400, { error: 'Use un nombre de hasta 20 letras, sin símbolos especiales.' });
        if (g.state !== 'lobby') return send(res, 409, { error: 'La partida ya empezó. Pida al presentador una nueva.' });
        if (g.players.size >= 100) return send(res, 409, { error: 'La partida está llena.' });
        if ([...g.players.values()].some(p => p.name.toLowerCase() === name.toLowerCase())) return send(res, 409, { error: 'Ese nombre ya está en uso. Escriba otro diferente.' });
        const pid = tok().slice(0, 12), token = tok(); g.players.set(pid, { name, token, score: 0, correct: 0, answered: 0, time: 0 }); broadcast(g);
        return send(res, 200, { pid, token, name });
    }
    const g = games.get(String(qs.get('code') || b.code || '').toUpperCase());
    if (!g) return send(res, 404, { error: 'La partida terminó o no existe.' });
    const host = same(qs.get('token') || b.token, g.hostToken) && (qs.get('role') === 'host' || b.role === 'host');
    const pid = qs.get('pid') || b.pid, pl = g.players.get(pid), player = pl && same(qs.get('token') || b.token, pl.token);
    if (u.pathname === '/api/events' || u.pathname === '/api/state') {
        const role = host ? 'host' : player ? 'player' : null; if (!role) return send(res, 403, { error: 'No tiene permiso para esta partida.' });
        if (u.pathname === '/api/state') return send(res, 200, snap(g, role, pid));
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        const c = { res, role, pid }; g.clients.add(c); res.write('retry: 2000\n\ndata: ' + JSON.stringify(snap(g, role, pid)) + '\n\n');
        const hb = setInterval(() => res.write(': ping\n\n'), 15000); req.on('close', () => { clearInterval(hb); g.clients.delete(c) }); return;
    }
    if (u.pathname === '/api/action') {
        if (!host) return send(res, 403, { error: 'Solo el presentador puede hacer esto.' });
        const t = b.type; g.last = Date.now();
        if (t === 'start' && g.state === 'lobby') { if (!g.players.size) return send(res, 409, { error: 'Espere a que se una al menos una persona.' }); startQ(g) }
        else if (t === 'next' && g.state === 'results') { g.qi >= g.qs.length - 1 ? endGame(g) : startQ(g) }
        else if (t === 'close') closeQ(g);
        else if (t === 'end') endGame(g);
        else return send(res, 409, { error: 'Esa acción no está disponible ahora.' });
        return send(res, 200, { ok: true });
    }
    if (u.pathname === '/api/answer') {
        if (!player) return send(res, 403, { error: 'No pudimos identificarlo. Vuelva a entrar.' });
        if (limited(pid, 40)) return send(res, 429, { error: 'Vaya más despacio, por favor.' });
        const now = Date.now();
        if (g.state !== 'question' || now > g.endsAt) return send(res, 409, { error: 'El tiempo de esta pregunta terminó.' });
        if (g.answers.has(pid)) return send(res, 409, { error: 'Ya registramos su respuesta.' });
        const c = Number(b.choice); if (!Number.isInteger(c) || c < 0 || c > 3) return send(res, 400, { error: 'Respuesta no válida.' });
        const el = now - g.t0, ok = c === g.qs[g.qi].a, pts = ok ? Math.round(800 + 200 * Math.max(0, 1 - el / (g.limit * 1000))) : 0;
        g.answers.set(pid, { c, el, pts }); g.order.push({ name: pl.name, ms: el, ok });
        pl.score += pts; pl.answered++; if (ok) { pl.correct++; pl.time += el }
        if (g.answers.size >= g.players.size) closeQ(g); else broadcast(g);
        return send(res, 200, { received: true });
    }
    send(res, 404, { error: 'No encontrado.' });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.png': 'image/png', '.vtt': 'text/vtt' };
http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/')) return api(req, res, u).catch(() => send(res, 500, { error: 'Error del servidor.' }));
    let p = decodeURIComponent(u.pathname); if (p === '/') p = '/index.html';
    const f = path.normalize(path.join(ROOT, p));
    if (!f.startsWith(ROOT + path.sep) || f.startsWith(path.join(ROOT, 'server')) || !MIME[path.extname(f)]) { res.writeHead(404); return res.end('No encontrado') }
    fs.stat(f, (e, s) => {
        if (e || !s.isFile()) { res.writeHead(404); return res.end('No encontrado') }
        const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''), h = { 'Content-Type': MIME[path.extname(f)], 'Accept-Ranges': 'bytes' };
        if (range) { const st = +range[1] || 0, en = range[2] ? +range[2] : s.size - 1; res.writeHead(206, { ...h, 'Content-Range': `bytes ${st}-${en}/${s.size}`, 'Content-Length': en - st + 1 }); return fs.createReadStream(f, { start: st, end: en }).pipe(res) }
        res.writeHead(200, { ...h, 'Content-Length': s.size }); fs.createReadStream(f).pipe(res)
    });
}).listen(PORT, '0.0.0.0', () => { console.log('ADEP Aprende en http://localhost:' + PORT); lanUrls().forEach(x => console.log('Para otros dispositivos en la misma red: ' + x)) });
setInterval(() => { const n = Date.now(); for (const [c, g] of games) if (n - g.last > (g.state === 'ended' ? 600000 : 7200000)) { clearTimeout(g.timer); g.clients.forEach(x => { x.res.write('event: gone\ndata: {}\n\n'); x.res.end() }); games.delete(c) } }, 60000).unref();