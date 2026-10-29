// Leer una lista de nombres desde un archivo: Excel (.xlsx), Word (.docx), CSV (.csv) o texto (.txt).
// Todo ocurre en el navegador; el archivo no se sube a ningún lado. Sin librerías externas.
window.leerNombresDeArchivo = (() => {
    const ENCABEZADO = /^(n[°º.]?|no\.?|#|nombres?( (y|e) apellidos?| completos?)?|participantes?|asistentes?|personas?|invitad[oa]s?|lista)$/i;
    const COL_NOMBRE = /^(nombres?( (y|e) apellidos?| completos?)?|participantes?|asistentes?|personas?|invitad[oa]s?)$/i;

    // --- ZIP mínimo (los .xlsx y .docx son archivos ZIP con XML adentro) ---
    async function abrirZip(buf) {
        const v = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
        let fin = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { fin = i; break }
        if (fin < 0) throw new Error('El archivo no es un Excel o Word válido.');
        const total = v.getUint16(fin + 10, true); let p = v.getUint32(fin + 16, true); const entradas = {};
        for (let k = 0; k < total && v.getUint32(p, true) === 0x02014b50; k++) {
            const metodo = v.getUint16(p + 10, true), tam = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
            entradas[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = { metodo, tam, off }; p += 46 + nl + el + cl;
        }
        return {
            nombres: Object.keys(entradas),
            async texto(nombre) {
                const e = entradas[nombre]; if (!e) return null;
                const ini = e.off + 30 + v.getUint16(e.off + 26, true) + v.getUint16(e.off + 28, true), datos = u8.subarray(ini, ini + e.tam);
                if (e.metodo === 0) return dec.decode(datos);
                if (!('DecompressionStream' in window)) throw new Error('Este navegador no puede abrir el archivo. Use Chrome o Edge actualizados, o guarde la lista como .csv.');
                return new Response(new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
            }
        };
    }
    const xml = t => new DOMParser().parseFromString(t, 'application/xml');
    const textoDe = n => [...n.getElementsByTagNameNS('*', 't')].map(t => t.textContent).join('');

    async function filasExcel(buf) {
        const z = await abrirZip(buf), comp = [];
        const ss = await z.texto('xl/sharedStrings.xml');
        if (ss) for (const si of xml(ss).getElementsByTagNameNS('*', 'si')) comp.push(textoDe(si));
        const hoja = z.nombres.filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))[0];
        if (!hoja) throw new Error('No se encontró ninguna hoja en el Excel.');
        const filas = [];
        for (const row of xml(await z.texto(hoja)).getElementsByTagNameNS('*', 'row')) {
            const fila = [];
            for (const c of row.getElementsByTagNameNS('*', 'c')) {
                const ref = c.getAttribute('r') || '', col = (ref.match(/^[A-Z]+/) || ['A'])[0].split('').reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0) - 1;
                const t = c.getAttribute('t'), vEl = c.getElementsByTagNameNS('*', 'v')[0];
                fila[col] = t === 's' ? comp[+(vEl && vEl.textContent)] || '' : t === 'inlineStr' ? textoDe(c) : vEl ? vEl.textContent : '';
            }
            filas.push(fila);
        }
        return filas;
    }
    async function filasWord(buf) {
        const z = await abrirZip(buf), doc = await z.texto('word/document.xml');
        if (!doc) throw new Error('No se pudo leer el documento de Word.');
        const d = xml(doc), filas = [];
        // Tablas: cada fila de la tabla es una fila; párrafos sueltos: cada párrafo es una fila
        for (const tr of d.getElementsByTagNameNS('*', 'tr')) filas.push([...tr.getElementsByTagNameNS('*', 'tc')].map(textoDe));
        for (const p of d.getElementsByTagNameNS('*', 'p')) { let a = p.parentNode, enTabla = false; while (a) { if (a.localName === 'tc') { enTabla = true; break } a = a.parentNode } if (!enTabla) filas.push([textoDe(p)]) }
        return filas;
    }
    function filasTexto(t) {
        const lineas = t.replace(/^﻿/, '').split(/\r?\n/), sep = (lineas.find(l => /[;\t]/.test(l)) || '').includes('\t') ? '\t' : lineas.some(l => l.includes(';')) ? ';' : ',';
        return lineas.map(l => l.split(sep).map(c => c.replace(/^"(.*)"$/, '$1').trim()));
    }

    // De filas y columnas a una lista limpia de nombres
    function nombresDeFilas(filas) {
        filas = filas.map(f => (f || []).map(c => String(c ?? '').trim()));
        let col = -1, colAp = -1, desde = 0;
        for (let i = 0; i < Math.min(5, filas.length); i++) { const k = filas[i].findIndex(c => COL_NOMBRE.test(c)); if (k > -1) { col = k; colAp = filas[i].findIndex(c => /^(primer )?apellidos?$/i.test(c)); desde = i + 1; break } }
        const vistos = new Set(), lista = [];
        for (const f of filas.slice(desde)) {
            let t = col > -1 ? [f[col], colAp > -1 ? f[colAp] : ''].filter(Boolean).join(' ') : f.find(c => /\p{L}{2}/u.test(c) && !/@/.test(c) && !ENCABEZADO.test(c));
            if (!t) continue;
            t = t.replace(/^\s*\d+\s*[.)\-–:]\s*/, '').replace(/\s+/g, ' ').trim();
            if (!/\p{L}{2}/u.test(t) || ENCABEZADO.test(t) || t.length > 60 || /[:.!?]$/.test(t)) continue;
            const clave = t.toLowerCase(); if (vistos.has(clave)) continue; vistos.add(clave); lista.push(t);
        }
        return lista;
    }

    return async function leer(archivo) {
        const ext = (archivo.name.split('.').pop() || '').toLowerCase();
        if (ext === 'xls' || ext === 'doc') throw new Error('Ese formato es antiguo. Ábralo y use «Guardar como» .xlsx (Excel) o .docx (Word), o .csv.');
        let filas;
        if (ext === 'xlsx' || ext === 'xlsm') filas = await filasExcel(await archivo.arrayBuffer());
        else if (ext === 'docx') filas = await filasWord(await archivo.arrayBuffer());
        else if (ext === 'csv' || ext === 'txt' || archivo.type.startsWith('text/')) filas = filasTexto(await archivo.text());
        else throw new Error('Use un archivo de Excel (.xlsx), Word (.docx), CSV (.csv) o texto (.txt).');
        const nombres = nombresDeFilas(filas);
        if (!nombres.length) throw new Error('No se encontraron nombres en el archivo. Revise que la lista tenga un nombre por fila.');
        return nombres;
    };
})();

// Bloque reutilizable: botón «Subir lista», vista previa de los nombres y confirmación
window.montarSubidaLista = (contenedor, alConfirmar) => {
    const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e };
    const caja = el('div', 'subir-lista');
    const input = el('input'); input.type = 'file'; input.accept = '.xlsx,.xlsm,.docx,.csv,.txt,text/plain,text/csv'; input.hidden = true; input.style.setProperty('display', 'none', 'important');
    const boton = el('button', 'btn ghost subir-btn', '📄 Subir lista de asistentes'); boton.type = 'button';
    const ayuda = el('p', 'small', 'Excel (.xlsx), Word (.docx), CSV o texto. Un nombre por fila.');
    const vista = el('div', 'subir-vista'); vista.hidden = true;
    boton.onclick = () => input.click();
    input.onchange = async () => {
        const f = input.files[0]; input.value = ''; if (!f) return;
        vista.hidden = false; vista.className = 'subir-vista'; vista.replaceChildren(el('p', null, '⏳ Leyendo «' + f.name + '»…'));
        try {
            const nombres = await window.leerNombresDeArchivo(f);
            const lista = el('ul', 'subir-nombres'), elegidos = new Set(nombres);
            const si = el('button', 'btn'); si.type = 'button';
            const textoSi = () => { si.textContent = '✔ Agregar ' + elegidos.size + (elegidos.size === 1 ? ' nombre' : ' nombres') + ' a la ruleta'; si.disabled = !elegidos.size };
            // Cada nombre tiene una × para descartarlo si el archivo trajo algo que no es un nombre
            nombres.forEach(n => {
                const li = el('li'), x = el('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'No agregar a ' + n);
                x.onclick = () => { const fuera = li.classList.toggle('fuera'); fuera ? elegidos.delete(n) : elegidos.add(n); x.textContent = fuera ? '↺' : '×'; x.setAttribute('aria-label', (fuera ? 'Volver a incluir a ' : 'No agregar a ') + n); textoSi() };
                li.append(el('span', null, n), x); lista.append(li);
            });
            textoSi();
            const no = el('button', 'btn ghost', 'Cancelar'); no.type = 'button';
            si.onclick = async () => { si.disabled = true; await alConfirmar(nombres.filter(n => elegidos.has(n))); vista.className = 'subir-vista bien'; vista.replaceChildren(el('p', null, '✔ Listo: se agregaron los nombres de «' + f.name + '». Los que ya estaban no se repiten.')) };
            no.onclick = () => { vista.hidden = true; vista.replaceChildren() };
            const b = el('div', 'btns'); b.append(si, no);
            vista.replaceChildren(el('p', null, '📋 Encontré ' + nombres.length + (nombres.length === 1 ? ' nombre' : ' nombres') + ' en «' + f.name + '». Revíselos; toque × para quitar alguno:'), lista, b);
        } catch (e) { vista.className = 'subir-vista mal'; vista.replaceChildren(el('p', null, '⚠ ' + e.message)) }
    };
    caja.append(input, boton, ayuda, vista); contenedor.append(caja);
};
