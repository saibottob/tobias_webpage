document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.getElementById('nav-links');
  
    burgerMenu.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  });