document.addEventListener('DOMContentLoaded', function () {
  // Burger menu toggle
  const burgerMenu = document.getElementById('burger-menu');
  const navLinks = document.getElementById('nav-links');

  if (burgerMenu && navLinks) {
    burgerMenu.addEventListener('click', function () {
      navLinks.classList.toggle('active');
    });
  }

  // Nav scroll blur effect
  const nav = document.getElementById('main-nav');
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});
