// Registro de participantes: el equipo agrega nombres desde cualquier celular y aparecen en la ruleta al instante.
(() => {
    const $ = s => document.querySelector(s);
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e };
    const COLORES = ['#2449b8', '#7c4dff', '#0b8a7c', '#d9573b', '#e0457b', '#0ea5e9', '#c98a12', '#16a34a'];
    const estado = $('#estado'), form = $('#form'), input = $('#nombre'), ok = $('#ok');
    let datos = { nombres: [], hechos: [] }, sinServidor = false;

    function pintarEstado(t, clase) { estado.textContent = t; estado.className = 'reg-estado ' + (clase || '') }
    function pintar() {
        const lista = $('#lista'); lista.replaceChildren(); $('#cuenta').textContent = datos.nombres.length;
        $('#vacia').hidden = datos.nombres.length > 0;
        datos.nombres.forEach((nm, i) => {
            const li = el('li'); li.style.setProperty('--c', COLORES[i % COLORES.length]);
            const x = el('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Quitar a ' + nm);
            x.onclick = () => { if (confirm('¿Quitar a ' + nm + ' de la ruleta?')) enviar({ accion: 'quitar', nombre: nm }) };
            li.append(el('span', null, nm), x); lista.append(li);
        });
        const h = $('#hechos'); h.replaceChildren(); $('#hechosBox').hidden = !datos.hechos.length; $('#cuentaH').textContent = datos.hechos.length;
        datos.hechos.forEach(nm => h.append(el('li', null, '✔ ' + nm)));
    }
    async function enviar(cuerpo) {
        try {
            const r = await fetch('/api/ruleta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(j.error || 'No se pudo guardar.');
            datos = j; pintar(); return j;
        } catch (e) { ok.className = 'reg-ok mal'; ok.textContent = '⚠ ' + (e.message === 'Failed to fetch' ? 'Sin conexión. Revise el internet e intente de nuevo.' : e.message); return null }
    }
    form.onsubmit = async e => {
        e.preventDefault();
        if (sinServidor) return;
        const nombres = input.value.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
        if (!nombres.length) { ok.className = 'reg-ok mal'; ok.textContent = 'Escriba un nombre.'; input.focus(); return }
        $('#agregar').disabled = true;
        const r = await enviar({ accion: 'agregar', nombres });
        $('#agregar').disabled = false;
        if (r) {
            const n = r.agregados || [];
            ok.className = 'reg-ok bien';
            ok.textContent = n.length ? '✔ ' + n.join(', ') + (n.length > 1 ? ' fueron agregados' : ' fue agregado/a') + ' a la ruleta.' : 'Ese nombre ya estaba en la ruleta.';
            ok.classList.remove('pop'); void ok.offsetWidth; ok.classList.add('pop');
            input.value = '';
        }
        input.focus();
    };

    // Conexión en tiempo real: cualquier cambio del equipo o de la ruleta se ve aquí al instante
    function conectar() {
        if (location.protocol === 'file:' || !window.EventSource) return sinServidorAviso();
        const es = new EventSource('/api/ruleta/events');
        es.onmessage = e => { datos = JSON.parse(e.data); pintar(); pintarEstado('🟢 Conectado: los nombres se guardan para todo el equipo.', 'bien') };
        es.onerror = async () => {
            try { const r = await fetch('/api/info', { cache: 'no-store' }); if (!r.ok) throw 0 } catch { es.close(); return sinServidorAviso() }
            pintarEstado('🟡 Reconectando… no cierre la página.', 'espera');
        };
    }
    function sinServidorAviso() {
        sinServidor = true; $('#agregar').disabled = true; input.disabled = true;
        pintarEstado('🔴 Esta página necesita el servidor publicado en internet (por ejemplo, en Render). Abierta como archivo o en GitHub Pages no puede compartir nombres entre celulares.', 'mal');
    }
    pintar(); conectar(); input.focus();
    setInterval(() => { if (!sinServidor) fetch('/api/info', { cache: 'no-store' }).catch(() => { }) }, 240000); // mantiene despierto el servidor gratuito
})();
