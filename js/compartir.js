// Compartir: arma los enlaces y el QR a partir de la dirección donde está publicada la página.
(() => {
    const $ = s => document.querySelector(s);
    const base = location.href.replace(/[^/]*([?#].*)?$/, '');
    const charla = base, registro = base + 'registro.html';
    $('#linkCharla').value = charla; $('#linkRegistro').value = registro;
    $('#abrirCharla').href = charla; $('#abrirRegistro').href = registro;
    $('#urlQr').textContent = charla.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (location.protocol === 'file:' || /^(localhost|127\.|\[::1\])/.test(location.hostname)) $('#aviso').hidden = false;

    // QR en SVG para la pantalla y en imagen PNG para descargar
    const qr = qrcode(0, 'M'); qr.addData(charla); qr.make();
    $('#qr').innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    function imagen() {
        const n = qr.getModuleCount(), cel = 16, margen = 4 * cel, lado = n * cel + margen * 2, alto = lado + 150;
        const c = document.createElement('canvas'); c.width = lado; c.height = alto; const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, lado, alto); x.fillStyle = '#1f2a3d';
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect(margen + k * cel, margen + r * cel, cel, cel);
        x.textAlign = 'center'; x.font = '700 44px Lexend, Arial, sans-serif'; x.fillText('IA para todos', lado / 2, lado + 50);
        x.font = '28px Arial, sans-serif'; x.fillStyle = '#4d5768'; x.fillText('Escanee con la cámara de su celular', lado / 2, lado + 100);
        return c;
    }
    $('#descargar').onclick = () => { const a = document.createElement('a'); a.download = 'qr-ia-para-todos.png'; a.href = imagen().toDataURL('image/png'); a.click() };
    $('#imprimir').onclick = () => print();

    document.querySelectorAll('[data-copia]').forEach(b => b.onclick = async () => {
        const inp = $('#' + b.dataset.copia), o = b.textContent;
        try { await navigator.clipboard.writeText(inp.value) } catch { inp.select(); document.execCommand('copy') }
        b.textContent = '¡Copiado! ✔'; setTimeout(() => b.textContent = o, 1600);
    });
})();
