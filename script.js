/* =========================================================
   Visit Croatia — interactive components
   1. Mobile navigation toggle
   2. Carousel (autoplay + pause on hover, arrows, dots)
   3. Accordion (single-open)
   4. Contact form (client-side validation)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCarousel();
  initAccordion();
  initForm();
  initExperienceCards();
});

/* ---------------------------------------------------------
   Experience cards -> pre-fill the plan form's interests
   --------------------------------------------------------- */
function initExperienceCards() {
  const cards = document.querySelectorAll('.card[data-interest]');
  const interests = document.getElementById('interests');
  if (!cards.length || !interests) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      // The href="#plan" already scrolls to the form; just fill the field
      interests.value = card.dataset.interest;
    });
  });
}

/* ---------------------------------------------------------
   1. Mobile navigation
   --------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => {
    setOpen(nav.classList.contains('open') === false);
  });

  // Close the menu after tapping a link
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

/* ---------------------------------------------------------
   2. Carousel
   --------------------------------------------------------- */
function initCarousel() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const track = root.querySelector('[data-carousel-track]');
  const slides = Array.from(track.children);
  const prevBtn = root.querySelector('[data-carousel-prev]');
  const nextBtn = root.querySelector('[data-carousel-next]');
  const dotsWrap = root.querySelector('[data-carousel-dots]');
  const AUTOPLAY_MS = 5000;

  let index = 0;
  let timer = null;
  let isHovered = false;
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  // Build one dot per slide
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => {
      goTo(i);
      restart();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, d) =>
      dot.setAttribute('aria-selected', String(d === index)),
    );
  }

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  function start() {
    stop();
    // Don't autoplay for reduced-motion users, or while the pointer is hovering
    if (reduceMotion || isHovered) return;
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restart() {
    stop();
    start();
  }

  nextBtn.addEventListener('click', () => {
    next();
    restart();
  });
  prevBtn.addEventListener('click', () => {
    prev();
    restart();
  });

  // Pause autoplay while the pointer is over the carousel
  root.addEventListener('mouseenter', () => {
    isHovered = true;
    stop();
  });
  root.addEventListener('mouseleave', () => {
    isHovered = false;
    start();
  });

  // Keyboard support when the carousel has focus
  root.setAttribute('tabindex', '0');
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      next();
      restart();
    }
    if (e.key === 'ArrowLeft') {
      prev();
      restart();
    }
  });

  // Pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });

  goTo(0);
  start();
}

/* ---------------------------------------------------------
   3. Accordion (single-open)
   --------------------------------------------------------- */
function initAccordion() {
  const accordion = document.querySelector('[data-accordion]');
  if (!accordion) return;

  const triggers = Array.from(accordion.querySelectorAll('.accordion-trigger'));

  const close = (trigger) => {
    const panel = trigger.nextElementSibling;
    trigger.setAttribute('aria-expanded', 'false');
    panel.style.height = '0px';
  };

  const open = (trigger) => {
    const panel = trigger.nextElementSibling;
    trigger.setAttribute('aria-expanded', 'true');
    panel.style.height = panel.scrollHeight + 'px';
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      // Single-open: close everything first
      triggers.forEach(close);
      if (!isOpen) open(trigger);
    });
  });

  // Keep an open panel sized correctly on resize
  window.addEventListener('resize', () => {
    triggers.forEach((trigger) => {
      if (trigger.getAttribute('aria-expanded') === 'true') {
        const panel = trigger.nextElementSibling;
        panel.style.height = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ---------------------------------------------------------
   4. Form validation
   --------------------------------------------------------- */
function initForm() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const success = form.querySelector('[data-form-success]');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setError = (field, message) => {
    const wrapper = field.closest('.field');
    const errorEl = form.querySelector(`[data-error-for="${field.name}"]`);
    if (wrapper) wrapper.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) errorEl.textContent = message || '';
  };

  const validateField = (field) => {
    const value = field.value.trim();

    if (field.type === 'checkbox') {
      const msg = field.checked ? '' : 'Please check this box to continue.';
      setError(field, msg);
      return !msg;
    }
    if (field.required && !value) {
      setError(field, 'This field is required.');
      return false;
    }
    if (field.type === 'email' && !emailRe.test(value)) {
      setError(field, 'Please enter a valid email address.');
      return false;
    }
    if (field.type === 'number' && value) {
      const n = Number(value);
      const min = Number(field.min),
        max = Number(field.max);
      if (n < min || n > max) {
        setError(field, `Please enter a number between ${min} and ${max}.`);
        return false;
      }
    }
    setError(field, '');
    return true;
  };

  const fields = Array.from(
    form.querySelectorAll('input, select, textarea'),
  ).filter((el) => el.required || el.name === 'interests');

  // Live-clear errors as the user fixes them
  fields.forEach((field) => {
    const evt =
      field.type === 'checkbox' || field.tagName === 'SELECT'
        ? 'change'
        : 'input';
    field.addEventListener(evt, () => {
      if (
        field.closest('.field')?.classList.contains('invalid') ||
        field.name === 'consent'
      ) {
        validateField(field);
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.hidden = true;

    let firstInvalid = null;
    fields.forEach((field) => {
      const ok = validateField(field);
      if (!ok && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // No backend — simulate a successful submission
    form.reset();
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
