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
