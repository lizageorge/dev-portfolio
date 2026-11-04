const root = document.documentElement;
const navigation = document.querySelector(".navigation");
const menuToggle = document.querySelector(".menu-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const mobileViewport = window.matchMedia("(max-width: 900px)");

root.classList.add("enhanced");
menuToggle.hidden = false;
themeToggle.hidden = false;

function closeMenu({ restoreFocus = false } = {}) {
  navigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  if (restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  navigation.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    closeMenu({ restoreFocus: true });
  }
});

navigation.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link || !mobileViewport.matches) return;
  const section = document.querySelector(link.hash);
  closeMenu();
  // Keep keyboard focus in the destination rather than in the now-hidden menu.
  section.setAttribute("tabindex", "-1");
  section.focus({ preventScroll: true });
});

mobileViewport.addEventListener("change", () => closeMenu());

function updateThemeControl() {
  const isDark = root.dataset.theme === "dark"
    || (!root.dataset.theme && systemTheme.matches);
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  root.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--paper").trim();
}

let hasSavedTheme = false;
try {
  hasSavedTheme = ["light", "dark"].includes(localStorage.getItem("portfolio-theme"));
} catch (error) {
  console.warn("Theme preferences are unavailable; changes will last for this visit.", error);
}

updateThemeControl();
themeToggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  hasSavedTheme = true;
  updateThemeControl();
  try {
    localStorage.setItem("portfolio-theme", root.dataset.theme);
  } catch (error) {
    console.warn("Could not save your theme preference; the current theme is still applied.", error);
  }
});

systemTheme.addEventListener("change", () => {
  if (hasSavedTheme) return;
  delete root.dataset.theme;
  updateThemeControl();
});

const stories = [...document.querySelectorAll(".experience-story")];
const expandStories = document.querySelector(".expand-stories");
expandStories.hidden = false;

function updateExpandControl() {
  const allOpen = stories.every((story) => story.open);
  expandStories.setAttribute("aria-pressed", String(allOpen));
  expandStories.replaceChildren(
    document.createTextNode(allOpen ? "Collapse all " : "Expand all "),
    Object.assign(document.createElement("span"), {
      textContent: allOpen ? "−" : "+",
    }),
  );
  expandStories.lastElementChild.setAttribute("aria-hidden", "true");
}

expandStories.addEventListener("click", () => {
  const shouldOpen = !stories.every((story) => story.open);
  stories.forEach((story) => { story.open = shouldOpen; });
  updateExpandControl();
});
stories.forEach((story) => story.addEventListener("toggle", updateExpandControl));

const filters = document.querySelector(".project-filters");
const projects = [...document.querySelectorAll(".project-card")];
const projectStatus = document.querySelector(".project-status");
filters.hidden = false;
filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  const category = button.dataset.filter;
  let visibleCount = 0;
  projects.forEach((project) => {
    project.hidden = category !== "all" && project.dataset.category !== category;
    if (!project.hidden) visibleCount += 1;
  });
  filters.querySelectorAll("button").forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter === button));
  });
  projectStatus.textContent = `Showing ${visibleCount} of ${projects.length} projects.`;
});

const navigationLinks = [...navigation.querySelectorAll("a")];
const sections = navigationLinks.map((link) => document.querySelector(link.hash));
const progress = document.querySelector(".reading-progress");
let scrollFrame = null;

function updateScrollState() {
  scrollFrame = null;
  const maxScroll = root.scrollHeight - window.innerHeight;
  const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  progress.style.transform = `scaleX(${fraction})`;
  let currentSection = null;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) currentSection = section.id;
  }
  if (maxScroll > 0 && window.scrollY >= maxScroll - 2) {
    currentSection = sections.at(-1).id;
  }
  navigationLinks.forEach((link) => {
    if (link.hash === `#${currentSection}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function scheduleScrollUpdate() {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateScrollState);
}
window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
window.addEventListener("load", scheduleScrollUpdate);
updateScrollState();

// Browsers that don't print closed details still need the complete story.
let closedBeforePrinting = [];
window.addEventListener("beforeprint", () => {
  closedBeforePrinting = [...document.querySelectorAll("details:not([open])")];
  closedBeforePrinting.forEach((details) => { details.open = true; });
});
window.addEventListener("afterprint", () => {
  closedBeforePrinting.forEach((details) => { details.open = false; });
  closedBeforePrinting = [];
});
