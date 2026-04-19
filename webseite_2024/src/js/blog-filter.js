// Blog Filter & Search Functionality
document.addEventListener("DOMContentLoaded", function () {
  const filterBtns = document.querySelectorAll(".blog-filter-btn");
  const searchInput = document.querySelector(".blog-search-input");
  const blogCards = document.querySelectorAll(".blog-card");
  const blogCategories = document.querySelectorAll(".blog-category");
  const emptyState = document.querySelector(".blog-empty-state");

  let activeCategory = "all";
  let searchTerm = "";

  // Category filtering
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      activeCategory = this.getAttribute("data-category") || "all";

      // Update active button state
      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // Apply filters
      filterCards();
    });
  });

  // Search filtering with debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTerm = this.value.toLowerCase();

      searchTimeout = setTimeout(() => {
        filterCards();
      }, 100);
    });
  }

  // Filter cards based on category and search term
  function filterCards() {
    let visibleCount = 0;
    const isFiltered = activeCategory !== "all" || searchTerm;

    blogCards.forEach((card) => {
      const category = card.getAttribute("data-category");
      const title = card.getAttribute("data-title").toLowerCase();
      const description = card.getAttribute("data-description").toLowerCase();

      // Check category match
      const categoryMatch =
        activeCategory === "all" || category === activeCategory;

      // Check search match
      const searchMatch =
        !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm);

      // Show or hide card
      if (categoryMatch && searchMatch) {
        card.style.display = "";
        card.classList.add("visible");
        visibleCount++;
      } else {
        card.style.display = "none";
        card.classList.remove("visible");
      }
    });

    // Hide empty category sections when filtering
    blogCategories.forEach((section) => {
      const categoryTitle = section
        .querySelector(".blog-category-title")
        .textContent.trim();
      const cards = section.querySelectorAll(".blog-card");
      let visibleInCategory = 0;

      cards.forEach((card) => {
        if (card.style.display !== "none") {
          visibleInCategory++;
        }
      });

      // Hide section if no visible cards and filtering is active
      if (isFiltered && visibleInCategory === 0) {
        section.style.display = "none";
      } else {
        section.style.display = "";
      }
    });

    // Show/hide empty state
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.style.display = "block";
      } else {
        emptyState.style.display = "none";
      }
    }
  }

  // Initialize with first category active
  if (filterBtns.length > 0) {
    filterBtns[0].classList.add("active");
  }
});

