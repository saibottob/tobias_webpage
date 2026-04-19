document.addEventListener('DOMContentLoaded', function () {
  const pills = document.querySelectorAll('.blog-pill');
  const cards = document.querySelectorAll('.blog-card');
  const emptyState = document.getElementById('blog-empty-state');

  let activeCategory = 'all';

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      activeCategory = this.getAttribute('data-category') || 'all';

      pills.forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');

      filterCards();
    });
  });

  function filterCards() {
    let visible = 0;

    cards.forEach(function (card) {
      const category = card.getAttribute('data-category');
      const show = activeCategory === 'all' || category === activeCategory;

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (emptyState) {
      emptyState.style.display = visible === 0 ? 'block' : 'none';
    }
  }
});
