/* ==========================================================================
   OVERDOZED — clothing rail
   Tees hang side-on from a sagging rail and loop endlessly. Hover (or focus)
   turns one to face you and nudges its neighbours aside; dragging swings the
   hangers. Click opens a close-up with sizes and add to cart.
   Depends on window.OD (main.js) and window.OD_PRODUCTS (products.js).
   ========================================================================== */
(() => {
  'use strict';
  const OD = window.OD;
  const stage = document.getElementById('rackStage');
  if (!OD || !stage) return;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const { RM, FINE, inr, cart } = OD;

  // Tees with transparent cut-outs in assets/cutout (made from the flat-lay mockups).
  const IDS = ['parashurama', 'maa-kali', 'hanuman', 'radha-krishna', 'shiva-parvati', 'mandala', 'murugan', 'adiyogi',
    'maa-durga', 'vishnu', 'natya', 'murugan-vel', 'krishna-timeless', 'karna', 'ravana'];
  const PRODUCTS = IDS.map((id) => window.OD_PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  const list = $('#rackItems');
  const path = $('#rackPath');
  const svg = $('#rackBar');

  /* ---------- layout ---------- */
  let W = 0, H = 0, S = 110, items = [], L = 0;
  const top = () => 46;
  const sag = () => Math.min(80, W * 0.055);
  const railY = (x) => {
    const u = Math.max(-1.2, Math.min(1.2, (x - W / 2) / (W / 2)));
    return top() + sag() * (1 - u * u);
  };

  function build() {
    W = stage.clientWidth || document.documentElement.clientWidth;
    H = stage.clientHeight || 400;
    if (!W) return; // not laid out yet; the ResizeObserver will call build() again
    S = W >= 900 ? 112 : 84;
    // Repeat the line-up until it's wider than the stage so the loop never shows a gap.
    const reps = Math.max(1, Math.ceil((W + 3 * S) / (PRODUCTS.length * S)));
    const lineup = Array.from({ length: reps }, () => PRODUCTS).flat();
    L = lineup.length * S;

    list.innerHTML = lineup.map((p, i) => `
      <li class="rack__item" data-i="${i}">
        <button class="rack__btn" data-id="${p.id}" data-cursor="view" ${i >= PRODUCTS.length ? 'tabindex="-1" aria-hidden="true"' : ''}
          aria-label="${p.name}, ${p.color} tee, ${inr(p.price)}. Open close-up.">
          <span class="rack__swing">
            <svg class="rack__hook" viewBox="0 0 60 40" aria-hidden="true">
              <path d="M30 0 V9 Q30 14 25 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <path d="M4 36 Q30 12 56 36" fill="none" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/>
            </svg>
            <span class="rack__tag mono">${inr(p.price)}</span>
            <span class="rack__garment"><img src="assets/cutout/${p.id}.webp" alt="" loading="lazy" decoding="async" draggable="false"></span>
          </span>
        </button>
      </li>`).join('');
    items = $$('.rack__item', list).map((el, i) => ({ el, swing: $('.rack__swing', el), i, push: 0, ang: 0, av: 0 }));

    // Draw the bar a little wider than the stage so its ends fall off-screen.
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // A quadratic Bézier is a parabola, so pick the control point that makes it match railY().
    const y0 = railY(-40), cy = 2 * railY(W / 2) - y0;
    path.setAttribute('d', `M -40 ${y0} Q ${W / 2} ${cy} ${W + 40} ${y0}`);
  }

  /* ---------- motion state ---------- */
  let offset = 0, vel = 0, active = -1, hovering = false, dragging = false, visible = true;
  const mod = (a, n) => ((a % n) + n) % n;
  const slotX = (i) => mod(i * S + offset, L) - S;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !items.length) return;

    // Drift slowly unless someone is looking or dragging; momentum otherwise.
    if (!dragging) {
      const drift = RM || hovering || active >= 0 ? 0 : -0.35;
      vel += (drift - vel) * 0.04;
      offset += vel;
    }

    const n = items.length;
    for (const it of items) {
      // Neighbours of the active tee slide away from it.
      let target = 0;
      if (active >= 0 && it.i !== active) {
        let d = it.i - active;
        d = mod(d + n / 2, n) - n / 2;
        const strength = Math.max(0, 1 - (Math.abs(d) - 1) * 0.4);
        target = Math.sign(d) * 46 * strength;
      }
      it.push += (target - it.push) * 0.14;

      const x = slotX(it.i) + it.push;
      const y = railY(x);
      it.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      // Pendulum: hangers lag behind the rail's movement.
      if (!RM) {
        const want = Math.max(-16, Math.min(16, -vel * 1.6));
        it.av += (want - it.ang) * 0.03;
        it.av *= 0.9;
        it.ang += it.av;
        it.swing.style.transform = `rotate(${it.ang.toFixed(2)}deg)`;
      }
    }
  }

  function setActive(i) {
    if (active === i) return;
    if (active >= 0) items[active]?.el.classList.remove('is-active');
    active = i;
    if (i >= 0) items[i].el.classList.add('is-active');
  }

  /* ---------- pointer: hover, drag, click ---------- */
  let startX = 0, lastX = 0, moved = 0, pid = null;
  stage.addEventListener('pointerenter', () => (hovering = true));
  stage.addEventListener('pointerleave', () => { hovering = false; if (!dragging) setActive(-1); });
  stage.addEventListener('pointerover', (e) => {
    if (!FINE || dragging) return;
    const li = e.target.closest('.rack__item');
    if (li) setActive(+li.dataset.i);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; moved = 0; startX = lastX = e.clientX; pid = e.pointerId;
  });
  addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    if (moved > 6) {
      stage.classList.add('is-dragging');
      setActive(-1);
      offset += dx; vel = dx;
    }
  });
  const release = () => { dragging = false; stage.classList.remove('is-dragging'); };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  // Horizontal wheel / trackpad swipes move the rail; vertical scroll still scrolls the page.
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    offset -= e.deltaX; vel = -e.deltaX * 0.3;
  }, { passive: false });

  list.addEventListener('click', (e) => {
    const b = e.target.closest('.rack__btn');
    if (!b) return;
    if (moved > 6) { e.preventDefault(); return; }
    open(PRODUCTS.findIndex((p) => p.id === b.dataset.id));
  });

  /* ---------- keyboard ---------- */
  list.addEventListener('focusin', (e) => {
    const li = e.target.closest('.rack__item');
    if (!li) return;
    const i = +li.dataset.i;
    setActive(i);
    // Bring the focused tee towards the middle.
    const x = slotX(i);
    if (x < S * 1.5 || x > W - S * 1.5) offset += W / 2 - x;
  });
  list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget)) setActive(-1); });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const btns = $$('.rack__btn:not([tabindex="-1"])', list);
    const i = btns.indexOf(document.activeElement);
    btns[mod(i + (e.key === 'ArrowRight' ? 1 : -1), btns.length)]?.focus();
  });

  /* ---------- close-up dialog ---------- */
  const dlg = $('#hang');
  let cur = 0, size = null, busy = false;

  function render() {
    const p = PRODUCTS[cur];
    size = null;
    $('#hangCount').textContent = `${String(cur + 1).padStart(2, '0')} / ${PRODUCTS.length}`;
    $('#hangName').textContent = p.name;
    $('#hangPrice').textContent = inr(p.price);
    $('#hangLine').textContent = `${p.category} · ${p.color}`;
    $('#hangImg').src = `assets/cutout/${p.id}.webp`;
    $('#hangImg').alt = `${p.name} tee on a wooden hanger`;
    $('#hangMsg').textContent = '';
    setView('full');
    $('#hangSizes').innerHTML = window.OD_SIZES.map((s) => {
      const ok = p.sizes.includes(s);
      return `<button class="size" data-size="${s}" aria-pressed="false" ${ok ? '' : `disabled aria-label="${s}, sold out"`}>${s}</button>`;
    }).join('');
    // Re-trigger the swing-in.
    const h = $('#hangHanger');
    h.classList.remove('is-swinging'); void h.offsetWidth; h.classList.add('is-swinging');
  }
  function setView(v) {
    $$('.hang__views [role=tab]', dlg).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === v)));
    dlg.classList.toggle('is-print', v === 'print');
  }
  function open(i) {
    if (i < 0) return;
    cur = i; render();
    dlg.showModal();
    OD.lenis?.stop();
  }
  function close() { dlg.close(); }
  dlg.addEventListener('close', () => { OD.lenis?.start(); setActive(-1); });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-hang-close]')) return close();
    const step = e.target.closest('[data-hang-step]');
    if (step) { cur = mod(cur + +step.dataset.hangStep, PRODUCTS.length); render(); return; }
    const tab = e.target.closest('[data-view]');
    if (tab) return setView(tab.dataset.view);
    const sz = e.target.closest('.size:not(:disabled)');
    if (sz) {
      size = sz.dataset.size;
      $$('.size', dlg).forEach((b) => b.setAttribute('aria-pressed', String(b === sz)));
      $('#hangMsg').textContent = '';
    }
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.target.closest('input, [role=tab]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      cur = mod(cur + (e.key === 'ArrowRight' ? 1 : -1), PRODUCTS.length); render();
    }
  });
  $('#hangMore').addEventListener('click', () => { const id = PRODUCTS[cur].id; close(); OD.openPDP(id); });

  $('#hangAdd').addEventListener('click', () => {
    if (busy) return;
    const btn = $('#hangAdd');
    if (!size) {
      $('#hangMsg').textContent = 'Pick a size first.';
      const g = $('#hangSizes'); g.classList.remove('pdp__shake'); void g.offsetWidth; g.classList.add('pdp__shake');
      return;
    }
    busy = true;
    btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true');
    $('.hang__label', btn).textContent = 'Adding';
    setTimeout(() => {
      const p = PRODUCTS[cur];
      cart.add(p.id, size, p.color === 'White' ? 'Bone white' : 'Ink black');
      btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy');
      $('.hang__label', btn).textContent = 'Added ✓';
      setTimeout(() => {
        busy = false;
        $('.hang__label', btn).textContent = 'Add to cart';
        close(); cart.open();
      }, RM ? 0 : 550);
    }, RM ? 0 : 700);
  });

  /* ---------- boot ---------- */
  if (!FINE) document.querySelector('.rack__hint').textContent = 'Swipe the rail · Tap a tee';
  build();
  new ResizeObserver(() => { if (Math.abs(stage.clientWidth - W) > 2) build(); }).observe(stage);
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(stage);
  requestAnimationFrame(frame);
})();
