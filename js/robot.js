// Robot de ADEP Aprende: la cabeza y los ojos siguen el puntero, parpadea y habla.
// Además hay un robot guía flotante que aparece al bajar y reacciona en las actividades (Robot.say).
(function () {
    const R = document.documentElement, head = document.getElementById('head'), eyes = document.getElementById('eyes'), stage = document.getElementById('stage');
    const bubble = document.getElementById('bubble'), svg = document.getElementById('robot');
    if (!head || !eyes || !stage || !svg) return;
    const quieto = () => R.classList.contains('no-anim');

    // Mirada que sigue el puntero, con reposo suave
    let tx = 0, ty = 0, cx = 0, cy = 0, last = -9999;
    if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / innerWidth * 2.2));
        ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / innerHeight * 2.2));
        last = performance.now();
    }, { passive: true });
    function draw(t) {
        if (!quieto() && !document.hidden) {
            if (t - last > 4000) { tx = Math.sin(t / 2500) * .35; ty = Math.cos(t / 3200) * .15 }
            cx += (tx - cx) * .08; cy += (ty - cy) * .08;
            head.style.transform = 'rotate(' + (cx * 4) + 'deg)';
            stage.style.transform = 'rotateY(' + (cx * 14) + 'deg) rotateX(' + (-cy * 10) + 'deg)';
            eyes.style.transform = 'translate(' + (cx * 14) + 'px,' + (cy * 10) + 'px)';
        }
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    // Parpadeo de los dos robots
    setInterval(() => {
        if (quieto()) return;
        document.querySelectorAll('.eye').forEach(e => { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; e.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' }], { duration: 220 }) });
    }, 4500);

    // Mensajes de bienvenida que se turnan
    const msgs = ['¡Bienvenido! Vamos a aprender juntos.', 'No tenga miedo de hacer preguntas.', 'Aquí nadie se equivoca: todos aprendemos.', 'Antes de confiar en un mensaje, compruebe que sea verdadero.'];
    let mi = 0;
    setInterval(() => { if (quieto() || bubble.dataset.busy) return; mi = (mi + 1) % msgs.length; cambiar(bubble, msgs[mi]) }, 8000);
    function cambiar(b, txt) { b.classList.remove('pop'); void b.offsetWidth; b.textContent = txt; b.classList.add('pop') }

    // Robot guía flotante: copia del robot con ids propios
    const comp = document.getElementById('companion'), cbot = document.getElementById('companionBot'), cmsg = document.getElementById('companionMsg');
    const clone = svg.cloneNode(true); clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(el => el.id = 'c-' + el.id);
    clone.querySelectorAll('[fill^="url(#"],[stroke^="url(#"]').forEach(el => ['fill', 'stroke'].forEach(a => { const v = el.getAttribute(a); if (v && v.startsWith('url(#')) el.setAttribute(a, v.replace('url(#', 'url(#c-')) }));
    cbot.append(clone);
    cbot.onclick = () => { const min = comp.classList.toggle('min'); cbot.setAttribute('aria-expanded', !min) };

    const SECC = [
        ['video', '¡Dele play cuando esté listo! 🎬'],
        ['basico', 'Cuatro ideas y ya sabe lo más importante. 💡'],
        ['seguridad', 'Recuerde: deténgase, verifique y después decida. ✋'],
        ['actividades', '¡Ahora a practicar! Toque los botones grandes. 👆'],
        ['act2', 'Pregúnteme lo que quiera. No escriba datos privados. 🔒'],
        ['act3', '¡Gire la ruleta y compartamos experiencias! 🎡'],
        ['reto', '¡Llegó el reto final! Mucha suerte. 🏆']
    ];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const m = SECC.find(x => x[0] === e.target.id); if (m && !cmsg.dataset.busy) cambiar(cmsg, m[1]) } }), { threshold: .3 });
    SECC.forEach(([id]) => { const s = document.getElementById(id); if (s) io.observe(s) });
    const hero = document.getElementById('inicio');
    new IntersectionObserver(([e]) => comp.classList.toggle('on', !e.isIntersecting), { threshold: .15 }).observe(hero);

    // Reacciones: Robot.say('texto', 'feliz' | 'alerta' | 'pensando')
    let tm;
    window.Robot = {
        say(txt, mood) {
            const enHero = !comp.classList.contains('on'), b = enHero ? bubble : cmsg, st = enHero ? stage : cbot;
            comp.classList.remove('min'); cbot.setAttribute('aria-expanded', 'true');
            b.dataset.busy = 1; cambiar(b, txt);
            [stage, cbot].forEach(x => x.classList.remove('feliz', 'alerta', 'pensando'));
            if (mood) { void st.offsetWidth; st.classList.add(mood) }
            clearTimeout(tm); tm = setTimeout(() => {
                delete bubble.dataset.busy; delete cmsg.dataset.busy;[stage, cbot].forEach(x => x.classList.remove('alerta', 'pensando'));
                // En pantallas pequeñas el mensaje se esconde solo para no tapar el contenido
                if (innerWidth < 640) { comp.classList.add('min'); cbot.setAttribute('aria-expanded', 'false') }
            }, 5000);
        }
    };
})();
