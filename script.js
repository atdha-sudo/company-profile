document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rupiah = (n) => 'Rp ' + n.toLocaleString('id-ID');

  /* ---------- Tahun footer ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Menu mobile & navbar ---------- */
  const navMenu = document.getElementById('navMenu');
  const menuToggle = document.getElementById('menuToggle');
  const navbar = document.getElementById('navbar');

  menuToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
  navMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navMenu.classList.remove('open'))
  );
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  /* ---------- Animasi muncul saat scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Hitung angka statistik ---------- */
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.floor(p * target).toLocaleString('id-ID');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  /* ---------- Toast ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------- Filter produk ---------- */
  const filters = document.querySelectorAll('.filter');
  const products = document.querySelectorAll('.product');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      products.forEach(p => {
        p.classList.toggle('hide', cat !== 'semua' && p.dataset.cat !== cat);
      });
    });
  });

  /* ---------- Keranjang ---------- */
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  let cart = []; // { name, price, emoji, qty }

  function retrigger(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth; // paksa animasi diulang
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  function renderCart() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalPrice = cart.reduce((s, i) => s + i.qty * i.price, 0);
    cartCount.textContent = totalQty;
    cartTotal.textContent = rupiah(totalPrice);

    if (cart.length === 0) {
      cartItems.innerHTML = '<li class="cart-empty"><span>🔮</span>Keranjang masih kosong.<br>Ayo pilih permainan favoritmu!</li>';
      return;
    }
    cartItems.innerHTML = cart.map((item, i) => `
      <li style="animation-delay:${i * 0.05}s">
        <span class="ci-emoji">${item.emoji}</span>
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div class="ci-sub">${item.qty} x ${rupiah(item.price)}</div>
        </div>
        <button class="ci-remove" data-index="${i}" aria-label="Hapus ${item.name}">✕</button>
      </li>`).join('');
  }

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('show');
    drawer.setAttribute('aria-hidden', 'false');
    renderCart(); // ulang agar animasi item muncul lagi
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
    drawer.setAttribute('aria-hidden', 'true');
  }

  // Animasi emoji terbang dari produk menuju ikon keranjang
  function flyToCart(sourceEl, emoji) {
    if (reduceMotion) return;
    const s = sourceEl.getBoundingClientRect();
    const t = cartBtn.getBoundingClientRect();
    const sx = s.left + s.width / 2, sy = s.top + s.height / 2;
    const fly = document.createElement('div');
    fly.className = 'fly';
    fly.textContent = emoji;
    fly.style.left = sx + 'px';
    fly.style.top = sy + 'px';
    document.body.appendChild(fly);
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${t.left + t.width / 2 - sx}px, ${t.top + t.height / 2 - sy}px) scale(0.25) rotate(360deg)`;
      fly.style.opacity = '0.4';
    });
    setTimeout(() => fly.remove(), 850);
  }

  document.querySelectorAll('.add').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product');
      const emoji = card.querySelector('.thumb').textContent;
      const name = btn.dataset.name;
      const price = +btn.dataset.price;

      const found = cart.find(i => i.name === name);
      if (found) found.qty++;
      else cart.push({ name, price, emoji, qty: 1 });

      // animasi: emoji terbang, lalu keranjang bergoyang dan badge membesar
      flyToCart(card.querySelector('.thumb'), emoji);
      setTimeout(() => {
        renderCart();
        retrigger(cartBtn, 'wiggle', 650);
        retrigger(cartCount, 'pop', 500);
      }, reduceMotion ? 0 : 750);

      // animasi tombol "ditambahkan"
      const label = btn.textContent;
      btn.textContent = '✓ Ditambahkan';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove('added');
      }, 1100);
    });
  });

  // Klik ikon keranjang: efek gelombang + panel keranjang meluncur masuk
  cartBtn.addEventListener('click', () => {
    retrigger(cartBtn, 'ripple', 650);
    retrigger(cartBtn, 'wiggle', 650);
    openDrawer();
  });
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  cartItems.addEventListener('click', (e) => {
    const btn = e.target.closest('.ci-remove');
    if (!btn) return;
    const item = cart[+btn.dataset.index];
    cart.splice(+btn.dataset.index, 1);
    renderCart();
    retrigger(cartCount, 'pop', 500);
    showToast(`${item.name} dihapus dari keranjang`);
  });

  document.getElementById('clearCart').addEventListener('click', () => {
    if (cart.length === 0) return showToast('Keranjang masih kosong');
    cart = [];
    renderCart();
    retrigger(cartCount, 'pop', 500);
    showToast('Keranjang dikosongkan');
  });

  renderCart();

  /* ---------- Partikel sihir di latar belakang ---------- */
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  const colors = ['#8b5cf6', '#22d3ee', '#fbbf24'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const total = Math.min(90, Math.floor(w / 18));
    particles = Array.from({ length: total }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.shadowColor = p.c;
      ctx.shadowBlur = 10;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  if (!reduceMotion) draw();
});