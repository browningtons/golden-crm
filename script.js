const revealItems = Array.from(document.querySelectorAll('.reveal'));
const counters = Array.from(document.querySelectorAll('[data-target]'));

let counterRan = false;

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
