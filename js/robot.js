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
    function copiar(pre) {
        const c = svg.cloneNode(true); c.removeAttribute('id');
        c.querySelectorAll('[id]').forEach(el => el.id = pre + el.id);
        c.querySelectorAll('[fill^="url(#"],[stroke^="url(#"]').forEach(el => ['fill', 'stroke'].forEach(a => { const v = el.getAttribute(a); if (v && v.startsWith('url(#')) el.setAttribute(a, v.replace('url(#', 'url(#' + pre)) }));
        return c;
    }
    cbot.append(copiar('c-'));
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
        },

        // Escena de la ruleta: el robot entra, mira el nombre y luego se acerca a la pantalla
        // como si mirara al público desde el otro lado del vidrio (romper la cuarta pared).
        presentar(nombre, op = {}) {
            if (quieto()) return Promise.resolve();
            document.querySelector('.show')?.remove();
            const E = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e };
            const show = E('div', 'show'), cartel = E('div', 'show-nombre'), bot = E('div', 'show-bot'), dice = E('div', 'show-burbuja');
            const vaho = E('div', 'show-vaho'), vidrio = E('div', 'show-vidrio'), toc = E('div', 'show-toc'), cerrar = E('button', 'show-cerrar', 'Continuar ✕');
            show.setAttribute('role', 'dialog'); show.setAttribute('aria-label', 'Le toca a ' + nombre);
            cartel.append(E('small', null, '🎤 ¡Le toca a…'), E('b', null, nombre));
            const r = copiar('p-'); bot.append(r);
            // Bracitos solo para el robot de la escena (para poder bailar)
            const NS = 'http://www.w3.org/2000/svg', brazos = [[80, -1], [220, 1]].map(([x, lado]) => {
                const g = document.createElementNS(NS, 'g'), b = document.createElementNS(NS, 'rect'), m = document.createElementNS(NS, 'circle');
                Object.entries({ x: lado < 0 ? x - 52 : x, y: 262, width: 52, height: 16, rx: 8, fill: '#c9d5ee' }).forEach(([k, v]) => b.setAttribute(k, v));
                Object.entries({ cx: x + lado * 56, cy: 270, r: 12, fill: '#22d3ee' }).forEach(([k, v]) => m.setAttribute(k, v));
                g.append(b, m); g.style.transformBox = 'view-box'; g.style.transformOrigin = x + 'px 270px';
                g.style.transform = 'rotate(' + (lado * 70) + 'deg)'; r.insertBefore(g, r.querySelector('#p-head')); return g;
            });
            const notas = E('div', 'show-notas'); show.append(notas);
            show.append(cartel, bot, vidrio, vaho, toc, dice, cerrar); document.body.append(show); comp.style.visibility = 'hidden';
            const ojos = r.querySelector('#p-eyes'), cabeza = r.querySelector('#p-head');
            [ojos, cabeza].forEach(x => { x.style.transformBox = 'fill-box'; x.style.transformOrigin = 'center'; x.style.transition = 'transform .45s cubic-bezier(.3,1.4,.5,1)' });
            const mirar = (x, y, z = 1, giro = 0) => { ojos.style.transform = `translate(${x}px,${y}px) scale(${z})`; cabeza.style.transform = `rotate(${giro}deg)` };
            const parpadeo = () => r.querySelectorAll('.eye').forEach(e => { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; e.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }, { transform: 'scaleY(1)' }], { duration: 200 }) });
            const calla = () => { dice.getAnimations().forEach(a => a.cancel()); dice.style.opacity = 0 };
            const habla = t => { dice.style.opacity = ''; dice.textContent = t; dice.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'cubic-bezier(.2,1.5,.4,1)', fill: 'forwards' }) };
            const mover = (de, a, ms, ease = 'cubic-bezier(.3,1.2,.4,1)') => bot.animate([{ transform: de }, { transform: a }], { duration: ms, easing: ease, fill: 'forwards' }).finished.catch(() => { });
            const espera = ms => new Promise(ok => setTimeout(ok, ms));
            let fuera = false, listo;
            const fin = new Promise(ok => listo = ok);
            const salir = () => { if (fuera) return; fuera = true; show.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.then(() => { show.remove(); comp.style.visibility = ''; listo() }) };
            cerrar.onclick = salir; show.addEventListener('keydown', e => { if (e.key === 'Escape') salir() });
            // Coreografía de 8 tiempos (4 s a 120 pulsos por minuto)
            async function bailar() {
                const T = 500, brazo = (g, lado, pasos, dur) => g.animate(pasos.map(a => ({ transform: 'rotate(' + (lado * a) + 'deg)' })), { duration: dur, easing: 'ease-in-out' });
                show.classList.add('baila'); op.alBailar && op.alBailar(8 * T / 1000);
                dice.classList.add('centro'); habla('¡A bailar! 🎶'); setTimeout(() => { calla(); dice.classList.remove('centro') }, 1300);
                ['♪', '♫', '♬', '♩', '♪', '♫'].forEach((n, i) => { const x = E('span', null, n); x.style.left = (12 + i * 15) + '%'; x.style.animationDelay = (i * .45) + 's'; notas.append(x) });
                ojos.style.transform = 'scale(1.1, .55)';
                // Tiempos 1-4: rebote, balanceo y brazos alternados
                r.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-22px) rotate(-7deg)' }, { transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-22px) rotate(7deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 4 * T, easing: 'ease-in-out' });
                brazo(brazos[0], -1, [70, -40, 70, -40, 70], 4 * T); brazo(brazos[1], 1, [70, 70, -40, 70, -40], 4 * T);
                cabeza.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 4 * T });
                await espera(4 * T); if (fuera) return;
                // Tiempos 5-6: pasitos de lado con los brazos arriba
                r.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-46px) rotate(-5deg)' }, { transform: 'translateX(0)' }, { transform: 'translateX(46px) rotate(5deg)' }, { transform: 'translateX(0)' }], { duration: 2 * T, easing: 'ease-in-out' });
                brazazos(-30, 2 * T);
                await espera(2 * T); if (fuera) return;
                // Tiempos 7-8: salto con vuelta completa y brazos arriba
                r.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-70px) rotate(180deg) scale(1.05)', offset: .45 }, { transform: 'translateY(-50px) rotate(360deg)', offset: .7 }, { transform: 'translateY(0) rotate(360deg)' }], { duration: 2 * T, easing: 'cubic-bezier(.3,.7,.4,1)' });
                brazazos(-60, 2 * T);
                await espera(2 * T);
                show.classList.remove('baila'); ojos.style.transform = '';
                function brazazos(a, d) { brazos.forEach((g, i) => brazo(g, i ? 1 : -1, [70, a, a + 30, a, 70], d)) }
            }
            const LADO = 'translate(calc(-50% - 26vw), 0) scale(.62)', CENTRO = 'translate(-50%, -8%) scale(.95)', CERCA = 'translate(-50%, 34%) scale(2.3)';
            (async () => {
                show.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' }); cerrar.focus();
                // 1. Entra desde la izquierda mirando el nombre
                mirar(16, -12, 1, 7);
                await mover('translate(calc(-50% - 80vw), 0) scale(.62)', LADO, 900); if (fuera) return;
                // 2. Lee el nombre
                habla('Mmm… veamos…'); parpadeo(); await espera(900); if (fuera) return;
                mirar(20, -14, 1.15, 9); habla('¡' + nombre + '!'); await espera(1000); if (fuera) return;
                // 3. ¡A bailar! Va al centro y baila con música y luces de discoteca
                calla(); mirar(0, 0, 1, 0);
                await mover(LADO, CENTRO, 600); if (fuera) return;
                await bailar(); if (fuera) return;
                // 4. Voltea hacia el público y se acerca a la pantalla
                mirar(0, 0, 1, 0); await espera(200);
                cartel.animate([{ opacity: 1 }, { opacity: innerWidth < 640 ? 0 : .9, transform: 'scale(.8)' }], { duration: 600, fill: 'forwards' });
                mirar(0, 4, 1.35, 0);
                await mover(CENTRO, CERCA, 1100, 'cubic-bezier(.5,0,.3,1.15)'); if (fuera) return;
                // 5. Pegado al vidrio: se empaña la pantalla, toca el vidrio y saluda
                show.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-5px,3px)' }, { transform: 'translate(4px,-3px)' }, { transform: 'translate(0,0)' }], { duration: 260 });
                vidrio.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' });
                vaho.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: .8, transform: 'translate(-50%,-50%) scale(1.05)', offset: .7 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.15)' }], { duration: 3600, easing: 'ease-out', fill: 'forwards' });
                toc.textContent = 'toc, toc'; toc.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: .2 }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 1400, fill: 'forwards' });
                parpadeo(); await espera(250); parpadeo();
                dice.classList.add('cerca'); habla('¡Le toca a usted, ' + nombre + '! 👀');
                mirar(-8, 2, 1.35, -3); await espera(700); mirar(8, 2, 1.35, 3); await espera(700); mirar(0, 4, 1.35, 0);
                await espera(1300); if (fuera) return;
                // 6. Se despide y vuelve a su lugar
                calla(); vidrio.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
                await mover(CERCA, 'translate(-50%, 120%) scale(.8)', 700, 'ease-in');
                salir();
            })();
            return fin;
        }
    };
})();
