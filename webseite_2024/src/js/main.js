document.addEventListener('DOMContentLoaded', function () {
  // Burger menu toggle
  const burgerMenu = document.getElementById('burger-menu');
  const navLinks = document.getElementById('nav-links');

  if (burgerMenu && navLinks) {
    burgerMenu.addEventListener('click', function () {
      const isActive = navLinks.classList.toggle('active');

      // Disable/enable scroll when menu is open
      if (isActive) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
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
