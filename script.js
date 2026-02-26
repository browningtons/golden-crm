const revealItems = Array.from(document.querySelectorAll('.reveal'));
const counters = Array.from(document.querySelectorAll('[data-target]'));
const themeToggle = document.getElementById('theme-toggle');
const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeStorageKey = 'golden-crm-theme';

let counterRan = false;

const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.documentElement.toggleAttribute('data-theme', isDark);

  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
};

const getStoredTheme = () => localStorage.getItem(themeStorageKey);

const initializeTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme === 'dark' || storedTheme === 'light') {
    applyTheme(storedTheme);
    return;
  }

  applyTheme(themeQuery.matches ? 'dark' : 'light');
};

initializeTheme();

themeToggle?.addEventListener('click', () => {
  const isDark = document.documentElement.hasAttribute('data-theme');
  const nextTheme = isDark ? 'light' : 'dark';
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});

themeQuery.addEventListener('change', (event) => {
  if (getStoredTheme()) return;
  applyTheme(event.matches ? 'dark' : 'light');
});

const runCounters = () => {
  if (counterRan) return;
  counterRan = true;

  counters.forEach((item) => {
    const target = Number(item.getAttribute('data-target'));
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));

    const tick = () => {
      current = Math.min(target, current + step);
      item.textContent = String(current);
      if (current < target) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');

      if (entry.target.classList.contains('metrics')) {
        runCounters();
      }

      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item, idx) => {
  item.style.transitionDelay = `${Math.min(idx * 80, 560)}ms`;
  observer.observe(item);
});
