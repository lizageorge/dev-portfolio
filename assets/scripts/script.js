const root = document.documentElement;
const navigation = document.querySelector(".navigation");
const menuToggle = document.querySelector(".menu-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const header = document.querySelector(".site-header");
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const mobileViewport = window.matchMedia("(max-width: 900px)");
const compactViewport = window.matchMedia("(max-width: 760px)");

root.classList.add("enhanced");
menuToggle.hidden = false;
themeToggle.hidden = false;

function closeMenu({ restoreFocus = false } = {}) {
  navigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  menuToggle.querySelector(".menu-label").textContent = "Menu";
  menuToggle.querySelector("path").setAttribute("d", "M4 8h16M4 16h16");
  if (restoreFocus) menuToggle.focus();
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  navigation.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  menuToggle.querySelector(".menu-label").textContent = isOpen ? "Close" : "Menu";
  menuToggle.querySelector("path").setAttribute("d", isOpen ? "M6 6l12 12M6 18 18 6" : "M4 8h16M4 16h16");
  if (isOpen) navigation.querySelector("a").focus({ preventScroll: true });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
    closeMenu({ restoreFocus: true });
  }
});

document.addEventListener("click", (event) => {
  if (menuToggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) {
    closeMenu({ restoreFocus: navigation.contains(document.activeElement) });
  }
});

document.addEventListener("focusin", (event) => {
  if (menuToggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) {
    closeMenu();
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

mobileViewport.addEventListener("change", ({ matches }) => {
  const focusInMenu = document.activeElement === menuToggle || navigation.contains(document.activeElement);
  closeMenu();
  if (focusInMenu) {
    const destination = matches ? menuToggle
      : navigation.querySelector('[aria-current="location"]') || navigation.querySelector("a");
    destination.focus({ preventScroll: true });
  }
});

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

function filterProjects(button, { announce = true } = {}) {
  const category = button.dataset.filter;
  let visibleCount = 0;
  projects.forEach((project) => {
    project.hidden = category !== "all" && project.dataset.category !== category;
    if (!project.hidden) visibleCount += 1;
  });
  filters.querySelectorAll("button").forEach((filter) => {
    filter.setAttribute("aria-pressed", String(filter === button));
  });
  if (announce) projectStatus.textContent = `Showing ${visibleCount} of ${projects.length} projects.`;
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (button) filterProjects(button);
});

let isPrinting = false;
const mobileDisclosures = [...document.querySelectorAll("[data-mobile-disclosure]")];

function syncMobileDisclosure(group) {
  const button = group.querySelector("[data-mobile-toggle]");
  const control = button.closest(".project-toggle-heading") || button;
  const expanded = button.getAttribute("aria-expanded") === "true";
  const collapsed = compactViewport.matches && !expanded && !isPrinting;
  group.querySelectorAll("[data-mobile-detail]").forEach((detail) => { detail.hidden = collapsed; });
  control.hidden = !compactViewport.matches || isPrinting;
  if (control.hidden && !isPrinting && document.activeElement === button) {
    const heading = group.querySelector(".project-copy h3") || group.querySelector("h3");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  if (button.classList.contains("mobile-read-more")) {
    const label = expanded ? "Show less" : button.dataset.moreLabel;
    button.textContent = label;
    button.setAttribute("aria-label", `${label}: ${group.querySelector("h3").textContent.trim()}`);
  }
}

mobileDisclosures.forEach((group) => {
  const button = group.querySelector("[data-mobile-toggle]");
  button.addEventListener("click", () => {
    button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true"));
    syncMobileDisclosure(group);
    scheduleScrollUpdate();
  });
});

function syncCompactLayout() {
  mobileDisclosures.forEach(syncMobileDisclosure);
  const filterWasFocused = filters.contains(document.activeElement);
  filters.hidden = compactViewport.matches;
  if (compactViewport.matches) {
    filterProjects(filters.querySelector('[data-filter="all"]'), { announce: false });
    projectStatus.textContent = "";
    if (filterWasFocused) {
      const heading = document.querySelector("#projects-title");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
}

compactViewport.addEventListener("change", syncCompactLayout);
syncCompactLayout();

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
  const sectionThreshold = Math.max(
    header.getBoundingClientRect().height,
    parseFloat(getComputedStyle(root).scrollPaddingTop),
  ) + 24;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= sectionThreshold) currentSection = section.id;
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
  isPrinting = true;
  mobileDisclosures.forEach(syncMobileDisclosure);
  closedBeforePrinting = [...document.querySelectorAll("details:not([open])")];
  closedBeforePrinting.forEach((details) => { details.open = true; });
});
window.addEventListener("afterprint", () => {
  isPrinting = false;
  mobileDisclosures.forEach(syncMobileDisclosure);
  closedBeforePrinting.forEach((details) => { details.open = false; });
  closedBeforePrinting = [];
});
