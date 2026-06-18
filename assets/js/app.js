/** Shared site utilities */
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
  }

  // "Book a call" links use Calendly when configured, else keep the mailto fallback.
  const calendly = window.SD_CONFIG && window.SD_CONFIG.calendlyUrl;
  if (calendly) {
    document.querySelectorAll('[data-book-call]').forEach((el) => {
      el.href = calendly;
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }

  document.querySelectorAll('[data-scroll]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-scroll');
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();