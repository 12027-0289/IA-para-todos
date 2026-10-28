// Efectos visuales: red animada en la portada, aparición al bajar, barra de progreso, confeti
// y botón para detener todas las animaciones (también respeta la preferencia del sistema).
(() => {
    const R = document.documentElement, btn = document.getElementById('anim');
    let guardado = null; try { guardado = localStorage.getItem('anim') } catch { }
    let on = guardado ? guardado === '1' : !matchMedia('(prefers-reduced-motion: reduce)').matches;
    R.classList.add('js');
    function set(v) {
        on = v; R.classList.toggle('no-anim', !on);
        if (btn) { btn.setAttribute('aria-pressed', String(!on)); btn.setAttribute('aria-label', on ? 'Detener animaciones' : 'Activar animaciones'); btn.querySelector('svg').innerHTML = on ? '<path d="M9 6v12M15 6v12"/>' : '<path d="M8 5l11 7-11 7z"/>' }
        try { localStorage.setItem('anim', on ? '1' : '0') } catch { }
        if (on) loop();
    }
    if (btn) btn.onclick = () => set(!on);

    // Red de puntos conectados en la portada
    const cv = document.getElementById('red'), cx = cv && cv.getContext && cv.getContext('2d');
    let W, H, pts = [], raf = 0;
    const COL = ['47,94,200', '47,94,200', '31,138,122', '47,94,200'];
    function size() {
        if (!cx) return; const r = cv.parentElement.getBoundingClientRect(), d = devicePixelRatio || 1;
        W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
        pts = Array.from({ length: W < 700 ? 22 : 48 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, c: COL[i % 4] }));
    }
    function frame() {
        if (!on || document.hidden || !cx) { raf = 0; return }
        cx.clearRect(0, 0, W, H);
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
            const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 140) { cx.strokeStyle = 'rgba(' + a.c + ',' + (.12 * (1 - d / 140)) + ')'; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke() }
        }
        for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; cx.fillStyle = 'rgba(' + p.c + ',.55)'; cx.beginPath(); cx.arc(p.x, p.y, 2.6, 0, 6.3); cx.fill() }
        raf = requestAnimationFrame(frame);
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame) }
    addEventListener('resize', size); document.addEventListener('visibilitychange', loop);
    size();

    // Aparición suave de los bloques al bajar
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .12 });
    document.querySelectorAll('.sec-head, .idea, .rule, .voice-tip, .activity, .reto, .video-grid > *, .uses li, .illu, .charla-robot, .charla-lado').forEach((e, i) => {
        e.classList.add('rv'); e.style.transitionDelay = ((i % 3) * 90) + 'ms'; io.observe(e);
    });

    // Barra de progreso de lectura
    const sb = document.createElement('div'); sb.id = 'sbar'; sb.setAttribute('aria-hidden', 'true'); document.body.append(sb);
    addEventListener('scroll', () => { sb.style.transform = 'scaleX(' + (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) + ')' }, { passive: true });

    // Confeti de celebración
    window.confeti = (origen) => {
        if (!on) return;
        const r = origen ? origen.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
        const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, cols = ['#2449b8', '#0b8a7c', '#7c4dff', '#d9573b', '#f2b84b', '#e0457b'];
        for (let i = 0; i < 70; i++) {
            const s = document.createElement('i'); s.className = 'confeti'; s.style.cssText = `left:${x0}px;top:${y0}px;background:${cols[i % cols.length]}`;
            document.body.append(s);
            const ang = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
            s.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * v}px,${Math.sin(ang) * v - 120}px) rotate(${Math.random() * 720}deg)`, opacity: 1, offset: .6 }, { transform: `translate(${Math.cos(ang) * v * 1.2}px,${Math.sin(ang) * v + 260}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 }],
                { duration: 1600 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => s.remove();
        }
    };

    set(on);
})();
