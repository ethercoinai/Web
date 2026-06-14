document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('header');
  const sections = document.querySelectorAll('.section, .cta-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(s => observer.observe(s));

  const cards = document.querySelectorAll('.step, .role-card, .stat-card, .tech-item, .content-card');
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  cards.forEach(c => {
    c.classList.add('animate');
    cardObserver.observe(c);
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
});
