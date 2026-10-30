/* ==========================================================================
   OVERDOZED — interactions
   Sections: env · utils · intro · lenis/gsap · split text · cursor · magnetic
             marquee · drop rail · bento · grid + filters · card tilt · pdp
             cart · lookbook · manifesto · countdown · signup · theme · 3D
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- env ---------- */
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const P = window.OD_PRODUCTS;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- utils ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const inr = (n) => '₹' + n.toLocaleString('en-IN');
  const byId = (id) => P.find((p) => p.id === id);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  };
  const vt = (fn) => {
    if (!document.startViewTransition || RM || document.hidden || document.body.classList.contains('is-loading')) return fn();
    const t = document.startViewTransition(fn);
    t.ready.catch(() => {}); // a skipped transition is fine; the DOM update still runs
  };
  $('#year').textContent = new Date().getFullYear();

  /* ---------- split text: wrap words for mask reveals ---------- */
  function splitWords(el) {
    $$('.line', el).forEach((line) => {
      line.innerHTML = line.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    });
  }
  $$('.split').forEach(splitWords);

  /* ---------- intro: counter 0 → 100, curtain wipe ---------- */
  function runIntro() {
    const intro = $('.intro');
    const count = $('#introCount');
    document.body.classList.add('is-loading');
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true; intro.remove(); document.body.classList.remove('is-loading'); resolve();
      };
      if (RM || !hasGSAP) return finish();
      // Safety net: never let the loader trap the page if animation frames stall.
      setTimeout(finish, 5000);
      const obj = { v: 0 };
      gsap.timeline({ onComplete: finish })
        .to(obj, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(obj.v)) })
        .add(() => document.body.classList.remove('is-loading'))
        .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' });
    });
  }

  /* ---------- Lenis smooth scroll wired into GSAP ticker ---------- */
  let lenis = null;
  if (window.Lenis && !RM) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  // Anchor links go through Lenis so they glide.
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -60 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- text reveals ---------- */
  function heroReveal() {
    if (!hasGSAP || RM) return;
    gsap.from('.hero__title .w', { yPercent: 110, duration: 1.1, stagger: 0.08, ease: 'expo.out' });
    gsap.from(['.hero .eyebrow', '.hero__lede', '.hero__cta'], { y: 24, opacity: 0, duration: 0.9, stagger: 0.1, delay: 0.3, ease: 'power3.out' });
  }
  function scrollReveals() {
    if (!hasGSAP || RM) return;
    $$('.split').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from($$('.w', el), {
        yPercent: 110, duration: 1, stagger: 0.06, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
  }

  /* ---------- custom cursor (desktop only) ---------- */
  if (FINE && !RM) {
    document.documentElement.classList.add('has-cursor');
    const c = $('.cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
    (function loop() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor], a, button, img, .swatch');
      c.classList.toggle('is-view', !!(t && t.dataset.cursor === 'view'));
      c.classList.toggle('is-big', !!t && t.dataset.cursor !== 'view');
    });
  }

  /* ---------- magnetic buttons ---------- */
  function magnetize(root = document) {
    if (!FINE || RM) return;
    $$('.magnetic', root).forEach((el) => {
      if (el.dataset.mag) return;
      el.dataset.mag = '1';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.4}px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
  }

  /* ---------- marquee: speed follows scroll velocity ---------- */
  (function marquee() {
    const track = $('.marquee__track');
    track.innerHTML += track.innerHTML; // seamless loop
    if (RM) return;
    let x = 0, dir = -1, lastY = scrollY;
    (function tick() {
      const vel = lenis ? lenis.velocity : scrollY - lastY;
      lastY = scrollY;
      if (Math.abs(vel) > 0.5) dir = vel > 0 ? -1 : 1;
      x += dir * (0.6 + Math.min(Math.abs(vel) * 0.6, 14));
      const half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    })();
  })();

  /* ---------- New drop rail ---------- */
  const drops = P.filter((p) => p.isNew);
  $('#dropCount').textContent = String(drops.length).padStart(2, '0');
  $('#dropRail').innerHTML = drops.map((p, i) => `
    <article class="rail-card">
      <button data-open="${p.id}" data-cursor="view" aria-label="View ${p.name}, ${inr(p.price)}">
        <div class="rail-card__img"><img src="${p.img}" alt="${p.name} tee — ${p.line}" loading="lazy" decoding="async" width="900" height="844"></div>
        <div class="rail-card__meta">
          <span class="rail-card__name">${p.name}</span>
          <span class="mono"><span class="rail-card__no">${String(i + 1).padStart(2, '0')}</span> · ${inr(p.price)}</span>
        </div>
      </button>
    </article>`).join('');

  function pinRail() {
    if (!hasGSAP || RM || !FINE || innerWidth < 900) return; // touch: native swipe + snap
    const section = $('.drop');
    const rail = $('#dropRail');
    section.classList.add('is-pinned');
    const dist = () => rail.scrollWidth - innerWidth;
    gsap.to(rail, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.drop__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
    });
  }

  /* ---------- Bento collections ---------- */
  const covers = { Shiva: '35-shiva', Krishna: '28-krishna', Shakti: '13-maa-durga', Devas: '03-lord-hanuman', Warriors: '25-karna', Art: '20-nritya' };
  $('#bento').innerHTML = window.OD_CATEGORIES.map((c) => {
    const n = P.filter((p) => p.category === c).length;
    return `<button class="bento__tile" data-cat="${c}" aria-label="Shop ${c} collection, ${n} tees">
      <img src="assets/img/${covers[c]}.jpg" alt="" loading="lazy" decoding="async">
      <span class="bento__label"><strong>${c}</strong><span class="mono">${n} tees →</span></span>
    </button>`;
  }).join('');
  $('#bento').addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat]');
    if (!t) return;
    state.cats = new Set([t.dataset.cat]);
    syncChips(); renderGrid();
    const shop = $('#shop');
    lenis ? lenis.scrollTo(shop, { offset: -40 }) : shop.scrollIntoView();
  });

  /* ---------- Product grid + filters ---------- */
  const state = { cats: new Set(), colors: new Set(), sizes: new Set() };
  const chip = (group, value) => `<label class="chip"><input type="checkbox" name="${group}" value="${value}"><span>${value}</span></label>`;
  $('#catChips').insertAdjacentHTML('beforeend', window.OD_CATEGORIES.map((c) => chip('cats', c)).join(''));
  $('#colorChips').insertAdjacentHTML('beforeend', ['Black', 'White'].map((c) => chip('colors', c)).join(''));
  $('#sizeChips').insertAdjacentHTML('beforeend', window.OD_SIZES.map((s) => chip('sizes', s)).join(''));

  function syncChips() {
    $$('#filters input').forEach((i) => (i.checked = state[i.name].has(i.value)));
  }
  $('#filters').addEventListener('change', (e) => {
    const i = e.target;
    i.checked ? state[i.name].add(i.value) : state[i.name].delete(i.value);
    renderGrid();
  });
  $('#filters').addEventListener('reset', () => {
    Object.values(state).forEach((s) => s.clear());
    requestAnimationFrame(renderGrid);
  });

  function renderGrid() {
    const list = P.filter((p) =>
      (!state.cats.size || state.cats.has(p.category)) &&
      (!state.colors.size || state.colors.has(p.color)) &&
      (!state.sizes.size || [...state.sizes].every((s) => p.sizes.includes(s))));
    $('#resultCount').textContent = list.length;
    $('#emptyState').hidden = list.length > 0;
    const html = list.map((p) => `
      <li class="card">
        <button class="card__btn" data-open="${p.id}" data-cursor="view" aria-label="View ${p.name}, ${p.color} tee, ${inr(p.price)}">
          <div class="card__media">
            <img class="card__main" src="${p.img}" alt="${p.name} — ${p.color.toLowerCase()} oversized tee" loading="lazy" decoding="async" width="900" height="844">
            <img class="card__alt" src="${p.img}" alt="" loading="lazy" decoding="async" aria-hidden="true">
            <span class="card__glare"></span>
            ${p.isNew ? '<span class="card__tag">NEW</span>' : ''}
            <span class="card__view">PRINT DETAIL</span>
          </div>
          <div class="card__meta"><span class="card__name">${p.name}</span><span class="card__price">${inr(p.price)}</span></div>
          <p class="card__sub">${p.category} · ${p.color}</p>
        </button>
      </li>`).join('');
    vt(() => { $('#grid').innerHTML = html; bindTilt(); });
  }

  /* ---------- card tilt + glare ---------- */
  function bindTilt() {
    if (!FINE || RM) return;
    $$('.card').forEach((card) => {
      const media = $('.card__media', card);
      card.addEventListener('pointermove', (e) => {
        const r = media.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        media.style.setProperty('--ry', `${(px - 0.5) * 14}deg`);
        media.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
        media.style.setProperty('--gx', `${px * 100}%`);
        media.style.setProperty('--gy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        media.style.setProperty('--rx', '0deg'); media.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Product detail dialog ---------- */
  const COLORWAYS = [
    { name: 'Ink black', hex: '#111111', ink: '#EFE8DC' },
    { name: 'Bone white', hex: '#EFE8DC', ink: '#111111' },
    { name: 'Blood red', hex: '#8E1B14', ink: '#EFE8DC' },
    { name: 'Neel blue', hex: '#2B3A55', ink: '#E8B931' },
    { name: 'Ash olive', hex: '#4A4B3A', ink: '#EFE8DC' },
  ];
  const pdp = $('#pdp');
  let current = null, chosenSize = null, chosenColor = null;

  function openPDP(id) {
    const p = byId(id);
    if (!p) return;
    current = p; chosenSize = null;
    chosenColor = p.color === 'White' ? COLORWAYS[1] : COLORWAYS[0];
    $('#pdpImg').src = p.img;
    $('#pdpImg').alt = `${p.name} tee, ${p.color.toLowerCase()}, photographed flat`;
    $('#pdpCat').textContent = `${p.category} collection`;
    $('#pdpName').textContent = p.name;
    $('#pdpPrice').textContent = inr(p.price);
    $('#pdpLine').textContent = p.line;
    $('#mockText').textContent = p.name.split(/[\s/]/)[0].slice(0, 9).toUpperCase();
    $('#pdpSwatches').innerHTML = COLORWAYS.map((c, i) => `<button class="swatch" role="radio" data-i="${i}" style="--c:${c.hex}" aria-label="${c.name}" aria-checked="${c === chosenColor}"></button>`).join('');
    $('#pdpSizes').innerHTML = window.OD_SIZES.map((s) => {
      const ok = p.sizes.includes(s);
      return `<button class="size" data-size="${s}" aria-pressed="false" ${ok ? '' : 'disabled aria-label="' + s + ', sold out"'}>${s}</button>`;
    }).join('');
    applyColorway();
    vt(() => pdp.showModal());
    magnetize(pdp);
  }
  function applyColorway() {
    const mock = $('.pdp__mock');
    mock.style.setProperty('--mock', chosenColor.hex);
    mock.style.setProperty('--mock-ink', chosenColor.ink);
    $('#pdpColorName').textContent = '· ' + chosenColor.name;
    $$('#pdpSwatches .swatch').forEach((b) => b.setAttribute('aria-checked', String(COLORWAYS[b.dataset.i] === chosenColor)));
  }
  function closePDP() { vt(() => pdp.close()); }

  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]');
    if (o) openPDP(o.dataset.open);
  });
  pdp.addEventListener('click', (e) => {
    if (e.target === pdp || e.target.closest('[data-close]')) closePDP();
    const sw = e.target.closest('#pdpSwatches .swatch');
    if (sw) { chosenColor = COLORWAYS[sw.dataset.i]; applyColorway(); }
    const sz = e.target.closest('.size:not(:disabled)');
    if (sz) {
      chosenSize = sz.dataset.size;
      $$('.size', pdp).forEach((b) => b.setAttribute('aria-pressed', String(b === sz)));
    }
  });
  pdp.addEventListener('cancel', (e) => { e.preventDefault(); closePDP(); });
  $('#pdpAdd').addEventListener('click', () => {
    if (!chosenSize) {
      const g = $('#pdpSizes');
      g.classList.remove('pdp__shake'); void g.offsetWidth; g.classList.add('pdp__shake');
      $('.size:not(:disabled)', g)?.focus();
      return;
    }
    cart.add(current.id, chosenSize, chosenColor.name);
    closePDP();
    setTimeout(() => cart.open(), RM ? 0 : 350);
  });

  /* ---------- Cart (localStorage) ---------- */
  const cart = {
    items: store.get('od-cart', []),
    key: (i) => `${i.id}|${i.size}|${i.color}`,
    save() { store.set('od-cart', this.items); this.render(); },
    add(id, size, color) {
      const hit = this.items.find((i) => i.id === id && i.size === size && i.color === color);
      hit ? hit.qty++ : this.items.push({ id, size, color, qty: 1 });
      this.save();
      const b = $('.cart-btn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    },
    change(k, d) {
      const it = this.items.find((i) => this.key(i) === k);
      if (!it) return;
      it.qty += d;
      if (it.qty < 1) this.items = this.items.filter((i) => i !== it);
      this.save();
    },
    remove(k) { this.items = this.items.filter((i) => this.key(i) !== k); this.save(); },
    subtotal() { return this.items.reduce((s, i) => s + (byId(i.id)?.price || 0) * i.qty, 0); },
    render() {
      this.items = this.items.filter((i) => byId(i.id));
      const n = this.items.reduce((s, i) => s + i.qty, 0);
      $('.cart-btn__count').textContent = n;
      $('#cartEmpty').hidden = n > 0;
      $('#checkout').disabled = n === 0;
      $('#cartSubtotal').textContent = inr(this.subtotal());
      $('#cartList').innerHTML = this.items.map((i) => {
        const p = byId(i.id), k = this.key(i);
        return `<li class="cart__item">
          <img src="${p.img}" alt="" width="72" height="72">
          <div>
            <h3>${p.name}</h3>
            <p class="mono">${i.size} · ${i.color} · ${inr(p.price)}</p>
            <div class="qty" role="group" aria-label="Quantity for ${p.name}">
              <button data-dec="${k}" aria-label="Decrease quantity">−</button>
              <output>${i.qty}</output>
              <button data-inc="${k}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <button class="cart__remove" data-rm="${k}" aria-label="Remove ${p.name}">Remove</button>
        </li>`;
      }).join('');
    },
    open() {
      const c = $('#cart');
      c.inert = false; c.setAttribute('aria-hidden', 'false'); c.classList.add('is-open');
      lenis?.stop();
      setTimeout(() => $('.cart__head .icon-btn').focus(), 50);
    },
    close() {
      const c = $('#cart');
      c.classList.remove('is-open'); c.setAttribute('aria-hidden', 'true'); c.inert = true;
      lenis?.start();
      $('.cart-btn').focus();
    },
  };
  cart.render();
  $('.cart-btn').addEventListener('click', () => cart.open());
  $('#cart').addEventListener('click', (e) => {
    if (e.target.closest('[data-close-cart]')) return cart.close();
    const t = e.target.closest('[data-inc],[data-dec],[data-rm]');
    if (!t) return;
    if (t.dataset.inc) cart.change(t.dataset.inc, 1);
    if (t.dataset.dec) cart.change(t.dataset.dec, -1);
    if (t.dataset.rm) cart.remove(t.dataset.rm);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cart').classList.contains('is-open')) cart.close(); });
  // Checkout = copy the order and open an Instagram DM (the brand sells via DM).
  $('#checkout').addEventListener('click', async () => {
    const lines = cart.items.map((i) => `• ${byId(i.id).name} — ${i.size} / ${i.color} × ${i.qty}`);
    const msg = `Hi OVERDOZED! I'd like to order:\n${lines.join('\n')}\nSubtotal: ${inr(cart.subtotal())}`;
    let copied = false;
    try { await navigator.clipboard.writeText(msg); copied = true; } catch { /* clipboard blocked */ }
    $('#checkoutMsg').textContent = copied ? 'Order copied. Paste it into the DM that just opened.' : 'Opening DM. Tell us the items listed above.';
    window.open(`https://ig.me/m/${window.OD_INSTAGRAM}`, '_blank', 'noopener');
  });

  /* ---------- Lookbook: parallax + ripple ---------- */
  function lookbook() {
    if (hasGSAP && !RM) {
      $$('.lb__item').forEach((el) => {
        gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    if (!FINE || RM) return;
    const disp = $('#rippleDisp'), turb = $('#rippleTurb');
    let raf = 0, t = 0, amp = 0, target = 0, active = null;
    const step = () => {
      amp += (target - amp) * 0.12; t += 0.02;
      disp.setAttribute('scale', amp.toFixed(1));
      turb.setAttribute('baseFrequency', `${(0.012 + Math.sin(t) * 0.004).toFixed(4)} ${(0.02 + Math.cos(t) * 0.006).toFixed(4)}`);
      if (target === 0 && amp < 0.3) { active?.classList.remove('is-rippling'); active = null; raf = 0; return; }
      raf = requestAnimationFrame(step);
    };
    $$('.lb__item').forEach((el) => {
      el.dataset.cursor = 'view';
      el.addEventListener('pointerenter', () => {
        active?.classList.remove('is-rippling');
        active = el; el.classList.add('is-rippling'); target = 28;
        if (!raf) raf = requestAnimationFrame(step);
      });
      el.addEventListener('pointerleave', () => { target = 0; if (!raf) raf = requestAnimationFrame(step); });
    });
  }

  /* ---------- Manifesto: word-by-word reveal ---------- */
  function manifesto() {
    const el = $('#manifesto');
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    if (RM || !hasGSAP) return;
    const words = $$('.w', el);
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: (s) => {
        const n = Math.round(s.progress * words.length);
        words.forEach((w, i) => w.classList.toggle('is-on', i < n));
      },
    });
  }

  /* ---------- Countdown ---------- */
  (function countdown() {
    const target = new Date(window.OD_NEXT_DROP).getTime();
    const units = Object.fromEntries($$('#clock [data-u]').map((s) => [s.dataset.u, s]));
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      let d = Math.max(0, target - Date.now()) / 1000;
      const days = Math.floor(d / 86400); d -= days * 86400;
      const h = Math.floor(d / 3600); d -= h * 3600;
      const m = Math.floor(d / 60); const s = Math.floor(d - m * 60);
      units.d.textContent = pad(days); units.h.textContent = pad(h); units.m.textContent = pad(m); units.s.textContent = pad(s);
      if (target <= Date.now()) $('#cdTitle').textContent = 'The drop is live';
    };
    tick(); setInterval(tick, 1000);
  })();

  /* ---------- Email signup (client-side; wire to your ESP) ---------- */
  $$('[data-signup]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', f), msg = $('.signup__msg', f);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    msg.className = 'signup__msg mono ' + (ok ? 'is-ok' : 'is-err');
    if (!ok) { msg.textContent = 'That email looks off. Try again.'; input.focus(); return; }
    const list = store.get('od-signups', []);
    if (!list.includes(input.value.trim())) list.push(input.value.trim());
    store.set('od-signups', list);
    msg.textContent = "You're on the list. First dibs on Drop 08.";
    f.reset();
  }));

  /* ---------- Theme toggle with circular reveal ---------- */
  const savedTheme = store.get('od-theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('.theme-toggle').addEventListener('click', (e) => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    const apply = () => { document.documentElement.dataset.theme = next; store.set('od-theme', next); };
    if (!document.startViewTransition || RM) return apply();
    const x = e.clientX || innerWidth - 40, y = e.clientY || 30;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(.2,.7,.1,1)', pseudoElement: '::view-transition-new(root)' });
    });
  });

  /* ---------- 3D tee: lazy-load when the hero is on screen ---------- */
  function load3D() {
    const canvas = $('#tee3d');
    const io = new IntersectionObserver(async ([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      try {
        const { initTee } = await import('./tee3d.js');
        const tee = initTee(canvas, { reducedMotion: RM });
        $('.hero__stage').classList.add('is-3d');
        $$('.hero .swatch').forEach((b) => b.addEventListener('click', () => {
          $$('.hero .swatch').forEach((s) => { s.classList.toggle('is-active', s === b); s.setAttribute('aria-checked', String(s === b)); });
          tee.setColor(b.dataset.color);
        }));
      } catch (err) {
        console.warn('3D tee unavailable, showing photo instead.', err);
      }
    });
    io.observe(canvas);
  }

  /* ---------- boot ---------- */
  renderGrid();
  magnetize();
  manifesto();
  runIntro().then(() => {
    heroReveal();
    scrollReveals();
    pinRail();
    lookbook();
    load3D();
    if (hasGSAP) ScrollTrigger.refresh();
  });
})();
