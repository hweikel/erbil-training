// CONNECTED MENA slide deck — navigation is intentionally layered:
//  1) Native CSS scroll-snap is the ground truth. Trackpad, mouse wheel,
//     touch, and a presenter remote's PageUp/PageDown all work even if this
//     script fails to load.
//  2) This script adds precise single-slide jumps for Arrow/Space/Home/End,
//     which is how most wireless presenter clickers actually behave (they
//     emit PageUp/PageDown or Left/Right arrow key events).
//  3) A small HUD shows current position so you always know where you are
//     mid-talk, even if you jump around with Home/End.
(() => {
  const deck = document.querySelector(".deck");
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (!deck || slides.length === 0) return;

  slides.forEach((slide, i) => {
    const num = slide.querySelector(".slide-number");
    if (num) num.textContent = `${i + 1} / ${slides.length}`;
  });

  let current = 0;

  const hudCount = document.querySelector("[data-hud-count]");
  const hudBar = document.querySelector("[data-hud-bar]");
  function updateHud(index) {
    if (hudCount) hudCount.textContent = `${index + 1} / ${slides.length}`;
    if (hudBar) hudBar.style.width = `${((index + 1) / slides.length) * 100}%`;
  }

  // Track which slide is actually in view (covers wheel/touch/trackpad
  // scrolling, not just our own programmatic jumps).
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          current = slides.indexOf(entry.target);
          updateHud(current);
        }
      });
    },
    { root: deck, threshold: [0.6] }
  );
  slides.forEach((s) => observer.observe(s));

  function goTo(index) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    slides[clamped].scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  const NEXT_KEYS = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar"];
  const PREV_KEYS = ["ArrowLeft", "ArrowUp", "PageUp"];

  window.addEventListener("keydown", (e) => {
    // Don't hijack keys while the user is typing in a form field.
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (NEXT_KEYS.includes(e.key)) {
      e.preventDefault();
      goTo(current + 1);
    } else if (PREV_KEYS.includes(e.key)) {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(slides.length - 1);
    }
  });

  // Support direct deep-links (e.g. index.html#slide-8) with an instant,
  // reliable jump rather than depending on native anchor-scroll racing
  // against scroll-snap-type: mandatory.
  function jumpToHash() {
    const id = location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const index = slides.indexOf(target);
    if (index === -1) return;
    current = index;
    // "instant", not "auto" — "auto" defers to the CSS scroll-behavior
    // (smooth) on .deck, which would animate instead of jumping.
    target.scrollIntoView({ behavior: "instant", block: "start" });
    updateHud(index);
  }
  jumpToHash();
  window.addEventListener("hashchange", jumpToHash);

  updateHud(current);
})();
