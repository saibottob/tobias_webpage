import { animate as aAnimate, stagger as aStagger } from "animejs";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const M = window.Motion;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Navigation ---------- */
function initNav() {
  const burger = $("#burger-menu");
  const links = $("#nav-links");
  const nav = $("#main-nav");
  const setOpen = (open) => {
    links.classList.toggle("active", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Menü schliessen" : "Menü öffnen");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger?.addEventListener("click", () => setOpen(!links.classList.contains("active")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => window.innerWidth >= 768 && setOpen(false));

  const bar = $("#scroll-progress");
  const onScroll = () => {
    nav.classList.toggle("nav--scrolled", window.scrollY > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Theme toggle ---------- */
function initTheme() {
  $("#theme-toggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  });
}

/* ---------- Scroll reveals (Motion) ---------- */
function initReveals() {
  const items = $$("[data-reveal]");
  if (reduceMotion || !M) return;
  items.forEach((el, i) => {
    M.inView(
      el,
      () => {
        // stagger siblings that enter together (cards in a grid)
        const delay = (i % 3) * 0.08;
        M.animate(el, { opacity: [0, 1], transform: ["translateY(28px)", "translateY(0px)"] }, { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] });
      },
      { amount: 0.2 }
    );
  });
}

/* ---------- Hero text (Anime.js) ---------- */
function initHeroText() {
  const title = $("#hero-title");
  if (!title || reduceMotion) return;
  const lines = $$(".line", title);
  lines.forEach((l) => {
    l.innerHTML = `<span style="display:inline-block">${l.innerHTML}</span>`;
  });
  const inner = lines.map((l) => l.firstElementChild);
  inner.forEach((el) => (el.style.transform = "translateY(110%)"));
  aAnimate(inner, { translateY: ["110%", "0%"], duration: 1100, delay: aStagger(120, { start: 150 }), ease: "outExpo" });
  const rest = $$("[data-hero-in]");
  rest.forEach((el) => (el.style.opacity = 0));
  aAnimate(rest, { opacity: [0, 1], translateY: [20, 0], duration: 900, delay: aStagger(120, { start: 500 }), ease: "outQuart" });
}

/* ---------- Timeline line draws with scroll ---------- */
function initTimeline() {
  const tl = $("#timeline");
  const fill = tl && $(".timeline-line i", tl);
  if (!fill) return;
  if (reduceMotion || !M) {
    fill.style.transform = "scaleY(1)";
    return;
  }
  M.scroll(M.animate(fill, { transform: ["scaleY(0)", "scaleY(1)"] }, { ease: "linear" }), {
    target: tl,
    offset: ["start 80%", "end 60%"],
  });
}

/* ---------- Pillar cursor glow ---------- */
function initGlow() {
  $$(".pillar").forEach((el) =>
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );
}

/* ---------- Blog filter + search ---------- */
function initBlogFilter() {
  const grid = $("#blog-post-grid");
  if (!grid) return;
  const pills = $$(".blog-pill");
  const cards = $$(".blog-card", grid);
  const empty = $("#blog-empty-state");
  const search = $("#blog-search");
  let category = "all";

  const apply = () => {
    const q = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const okCat = category === "all" || card.dataset.category.toLowerCase() === category.toLowerCase();
      const okQ = !q || card.dataset.search.toLowerCase().includes(q);
      const show = okCat && okQ;
      card.hidden = !show;
      card.style.display = show ? "" : "none";
      if (show) {
        visible++;
        card.classList.toggle("blog-card--featured", visible === 1 && category === "all" && !q);
        if (!reduceMotion) aAnimate(card, { opacity: [0, 1], translateY: [16, 0], duration: 500, ease: "outQuart" });
      }
    });
    empty.hidden = visible !== 0;
  };

  pills.forEach((p) =>
    p.addEventListener("click", () => {
      category = p.dataset.category;
      pills.forEach((x) => x.classList.toggle("active", x === p));
      apply();
    })
  );
  search?.addEventListener("input", apply);
}

/* ---------- Boot ---------- */
try {
  initNav();
  initTheme();
  initReveals();
  initHeroText();
  initTimeline();
  initGlow();
  initBlogFilter();

  const canvas = $("#hero-canvas");
  if (canvas && !reduceMotion) {
    import("/js/hero.js").then((m) => m.initHero(canvas)).catch(() => document.documentElement.classList.add("no-webgl"));
  }
} catch (err) {
  console.error(err);
  document.documentElement.classList.remove("js"); // never leave content hidden
}
