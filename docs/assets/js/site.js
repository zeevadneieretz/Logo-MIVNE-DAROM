/* ===== מבנה דרום — site.js ===== */
(function () {
  'use strict';

  var doc = document;

  /* ---------- Sticky header ---------- */
  var header = doc.querySelector('.site-header');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || doc.documentElement.scrollTop;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      /* hide on scroll down (mobile), show on scroll up */
      if (window.innerWidth < 1024) {
        header.classList.toggle('is-hidden', y > 320 && y > lastY);
      } else {
        header.classList.remove('is-hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var burger = doc.querySelector('.nav-toggle');
  var mobileNav = doc.querySelector('.mobile-nav');
  var navOverlay = doc.querySelector('.nav-overlay');

  function closeNav() {
    doc.body.classList.remove('nav-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = doc.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (navOverlay) navOverlay.addEventListener('click', closeNav);
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* Mobile accordion submenus */
  doc.querySelectorAll('.mobile-nav .has-sub > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var li = btn.parentElement;
      var wasOpen = li.classList.contains('open');
      li.parentElement.querySelectorAll(':scope > .has-sub.open').forEach(function (o) {
        o.classList.remove('open');
        var b = o.querySelector(':scope > button');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      li.classList.toggle('open', !wasOpen);
      btn.setAttribute('aria-expanded', !wasOpen ? 'true' : 'false');
    });
  });

  /* ---------- Reveal-on-scroll animations ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    doc.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    doc.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- Animated counters ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count') || '0');
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600;
    var start = null;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = val.toLocaleString('he-IL') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    if (reduceMotion) {
      el.textContent = target.toLocaleString('he-IL') + suffix;
    } else {
      requestAnimationFrame(frame);
    }
  }
  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    doc.querySelectorAll('[data-count]').forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------- Accordions (FAQ / specs) ---------- */
  doc.querySelectorAll('.accordion-item > .accordion-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var item = head.parentElement;
      var open = item.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- Tabs ---------- */
  doc.querySelectorAll('[data-tabs]').forEach(function (tabs) {
    var buttons = tabs.querySelectorAll('[role="tab"]');
    var panels = tabs.querySelectorAll('[role="tabpanel"]');
    buttons.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-selected', 'false'); b.classList.remove('active'); });
        panels.forEach(function (p) { p.hidden = true; });
        btn.setAttribute('aria-selected', 'true');
        btn.classList.add('active');
        if (panels[i]) panels[i].hidden = false;
      });
    });
  });

  /* ---------- Lightbox for gallery images ---------- */
  var lightbox = null;
  function openLightbox(src, alt) {
    if (!lightbox) {
      lightbox = doc.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = '<button class="lightbox-close" aria-label="סגירה">&times;</button><img alt="" />';
      doc.body.appendChild(lightbox);
      lightbox.addEventListener('click', function (e) {
        if (e.target !== lightbox.querySelector('img')) closeLightbox();
      });
      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLightbox();
      });
    }
    var img = lightbox.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    lightbox.classList.add('open');
    doc.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('open');
      doc.body.style.overflow = '';
    }
  }
  doc.querySelectorAll('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var img = a.querySelector('img');
      openLightbox(a.getAttribute('href') || (img && img.src), img && img.alt);
    });
  });

  /* ---------- Contact form (mailto-free AJAX via FormSubmit) ---------- */
  var form = doc.querySelector('form.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type="submit"]');
      /* honeypot */
      var hp = form.querySelector('input[name="_honey"]');
      if (hp && hp.value) return;

      var required = form.querySelectorAll('[required]');
      var valid = true;
      required.forEach(function (f) {
        f.classList.remove('field-error');
        if (!f.value.trim()) { f.classList.add('field-error'); valid = false; }
      });
      var phone = form.querySelector('input[name="phone"]');
      if (phone && phone.value && !/^[\d\s+-]{8,15}$/.test(phone.value.trim())) {
        phone.classList.add('field-error'); valid = false;
      }
      if (!valid) {
        if (status) { status.textContent = 'נא למלא את כל שדות החובה'; status.className = 'form-status error'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.orig = btn.textContent; btn.textContent = 'שולח…'; }
      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('send failed');
        form.reset();
        form.classList.add('sent');
        if (status) { status.textContent = 'תודה! פנייתכם התקבלה — ניצור קשר בהקדם.'; status.className = 'form-status success'; }
      }).catch(function () {
        if (status) {
          status.innerHTML = 'שליחה נכשלה. אפשר לפנות ישירות בטלפון <a href="tel:086408517">08-6408517</a> או במייל <a href="mailto:marketing@mivnedarom.co.il">marketing@mivnedarom.co.il</a>';
          status.className = 'form-status error';
        }
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.orig; }
      });
    });
  }

  /* ---------- Hero video: load only where it pays off ---------- */
  var heroVideo = doc.querySelector('.hero-media video[data-video]');
  if (heroVideo) {
    var conn = navigator.connection || {};
    var wantVideo = window.matchMedia('(min-width: 768px)').matches &&
      !reduceMotion && !conn.saveData &&
      ['slow-2g', '2g'].indexOf(conn.effectiveType) === -1;
    if (wantVideo) {
      var src = doc.createElement('source');
      src.src = heroVideo.getAttribute('data-video');
      src.type = 'video/mp4';
      heroVideo.appendChild(src);
      heroVideo.load();
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  /* ---------- Panel selection wizard ---------- */
  var wizard = doc.querySelector('.wizard');
  if (wizard) {
    var results = {};
    try { results = JSON.parse(wizard.getAttribute('data-wizard') || '{}'); } catch (e) {}
    var answers = {};
    function showStep(n) {
      wizard.querySelectorAll('.wizard-step').forEach(function (s) {
        s.hidden = s.getAttribute('data-step') !== String(n);
      });
      wizard.querySelector('.wizard-result').hidden = true;
    }
    wizard.querySelectorAll('.wizard-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = btn.getAttribute('data-q');
        answers[q] = btn.getAttribute('data-v');
        if (q === '1') { showStep(2); }
        else if (q === '2') { showStep(3); }
        else {
          var key = answers['1'] + '-' + answers['2'] + '-' + answers['3'];
          var r = results[key];
          if (r) {
            wizard.querySelectorAll('.wizard-step').forEach(function (s) { s.hidden = true; });
            var res = wizard.querySelector('.wizard-result');
            res.hidden = false;
            res.querySelector('.wizard-product').textContent = r.title;
            res.querySelector('.wizard-link').setAttribute('href', '/' + encodeURIComponent(r.slug) + '/');
          }
        }
      });
    });
    var restart = wizard.querySelector('.wizard-restart');
    if (restart) restart.addEventListener('click', function () { answers = {}; showStep(1); });
  }

  /* ---------- Current year in footer ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Back to top ---------- */
  var toTop = doc.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', (window.scrollY || 0) > 700);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
})();
