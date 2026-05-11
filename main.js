// =====================
// CUSTOM CURSOR — runs first
// =====================
const isTouchDevice = window.matchMedia('(hover: none)').matches;

if (!isTouchDevice) {
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  let cursorVisible = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Use transform instead of left/top for the dot — much more reliable
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

    if (!cursorVisible) {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      cursorVisible = true;
    }
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    cursorVisible = false;
  });

  // Smooth ring follow via RAF
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover grow effect
  function addHoverListeners() {
    document.querySelectorAll('a, button, .division-card, .roster-card, .work-item, .partner-card, .service-row, .filter-btn, .gallery-tab').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }
  addHoverListeners();
  // Re-run after DOM changes
  window.addEventListener('load', addHoverListeners);
}

// =====================
// PAGE TRANSITION
// =====================
const transition = document.createElement('div');
transition.className = 'page-transition';
document.body.appendChild(transition);

// Ensure transition is hidden on load
window.addEventListener('pageshow', () => {
  transition.classList.remove('active');
  transition.style.opacity = '0';
  transition.style.pointerEvents = 'none';
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (
    link &&
    link.href &&
    !link.href.startsWith('mailto') &&
    !link.href.startsWith('tel') &&
    !link.target &&
    !link.href.includes('#') &&
    link.hostname === window.location.hostname
  ) {
    e.preventDefault();
    const dest = link.href;
    transition.style.opacity = '1';
    transition.style.pointerEvents = 'all';
    setTimeout(() => { window.location.href = dest; }, 380);
  }
});

// =====================
// NAV SCROLL
// =====================
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

const menuToggle = document.getElementById('menuToggle');
const navOverlay = document.getElementById('navOverlay');
const navClose = document.getElementById('navClose');

if (menuToggle && navOverlay && navClose) {
  menuToggle.addEventListener('click', () => {
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  navClose.addEventListener('click', () => {
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
}

// =====================
// SCROLL REVEAL
// =====================
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

document.querySelectorAll('.divisions-grid, .work-grid, .work-full-grid, .roster-grid, .partners-section-grid, .stats-grid').forEach(grid => {
  grid.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
  });
});

// =====================
// STATS COUNTER
// =====================
document.querySelectorAll('.stat-number').forEach(el => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(el.dataset.target);
        const duration = 1400;
        const start = performance.now();
        function update(now) {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target);
          if (p < 1) requestAnimationFrame(update);
          else el.textContent = target;
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  observer.observe(el);
});

// =====================
// FILTER BUTTONS
// =====================
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.work-full-grid .work-item').forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.category === filter) ? 'block' : 'none';
    });
  });
});

// =====================
// CONTACT FORM
// =====================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.btn-primary');
    btn.textContent = 'Sent ✓';
    btn.style.background = '#4a7a4a';
    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.style.background = '';
      contactForm.reset();
    }, 3000);
  });
}

// =====================
// ROSTER HOVER OVERLAYS
// =====================
document.querySelectorAll('.roster-card').forEach(card => {
  const name = card.querySelector('h4')?.textContent || '';
  const genre = card.querySelector('span')?.textContent || '';
  const thumb = card.querySelector('.roster-thumb');
  if (name && thumb && !thumb.querySelector('.roster-card-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'roster-card-overlay';
    overlay.innerHTML = `<p class="roster-overlay-genre">${genre}</p><p class="roster-overlay-name">${name}</p>`;
    thumb.appendChild(overlay);
  }
});
