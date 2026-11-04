import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("leads with the role and one prominent LinkedIn action", async ({ page }) => {
  const hero = page.locator(".hero");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Member of Technical Staff at Microsoft Robotics");
  await expect(hero.locator(".hero-actions a")).toHaveCount(1);
  const connect = hero.getByRole("link", { name: "Connect on LinkedIn" });
  await expect(connect).toHaveAttribute("href", "https://www.linkedin.com/in/george-liza/");
  await expect(connect).toBeVisible();
  await expect(hero.locator(".quick-facts, .portrait-note, .hero-description")).toHaveCount(0);
  if (page.viewportSize().width <= 760) {
    await expect(hero.locator(".hero-socials")).toBeHidden();
  } else {
    await expect(hero.locator(".hero-socials")).toBeVisible();
  }
});

test("uses plain numbered section headings and only a back-to-top footer", async ({ page }) => {
  await expect(page.locator("main h2")).toHaveText([
    "01 / Experience",
    "02 / Projects",
    "03 / Toolkit",
    "04 / Education",
    "05 / Contact",
  ]);
  await expect(page.locator("main h2 em")).toHaveCount(0);
  const sectionHeading = page.locator("main h2").first();
  await expect(sectionHeading).toHaveCSS("font-family", /Source Serif/);
  await expect(sectionHeading).toHaveCSS("font-style", "normal");
  expect(await sectionHeading.evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize))).toBeGreaterThanOrEqual(36);
  await expect(page.locator("#projects .section-heading > p")).toHaveText(
    "A few things I’ve built and can share, from hackathons and coursework to my first internship.",
  );
  const footer = page.locator("footer");
  await expect(footer.locator(":scope > *")).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "#top");
});

test("LinkedIn links open a new tab without leaving the portfolio", async ({ page, context }) => {
  const links = page.locator('a[href="https://www.linkedin.com/in/george-liza/"]');
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await context.route("https://www.linkedin.com/**", (route) => route.fulfill({
    contentType: "text/html",
    body: "<title>LinkedIn</title>",
  }));
  const portfolioURL = page.url();
  const popupPromise = page.waitForEvent("popup");
  await page.locator(".hero-actions").getByRole("link", { name: "Connect on LinkedIn" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await expect(popup).toHaveURL("https://www.linkedin.com/in/george-liza/");
  expect(page.url()).toBe(portfolioURL);
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
});

test("loads local assets without browser or network errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(`${request.method()} ${request.url()}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  const externalRequests = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173/")) {
      externalRequests.push(request.url());
    }
  });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Expand all", exact: false }).click();
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  const images = await page.locator("img").evaluateAll((elements) =>
    elements.map((image) => ({ src: image.currentSrc, loaded: image.complete && image.naturalWidth > 0 })),
  );
  expect(images.every((image) => image.loaded), JSON.stringify(images)).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("keeps every resume section, substantive experience, and original projects", async ({ page }) => {
  await page.getByRole("button", { name: "Expand all", exact: false }).click();
  const body = page.locator("main");
  await expect(page.getByRole("heading", { name: "Coursework & campus life" })).toBeVisible();
  await expect(page.locator("#education details")).toHaveCount(0);
  await expect(page.locator(".education-coursework")).toContainText("Students for Environmental Concerns");
  await expect(page.getByText("Graduated with honors (B.S.)", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Earlier experiences" })).toBeVisible();
  await expect(page.locator(".experience-stories > .experience-story").first()).toHaveAttribute("id", "teaching");
  await expect(page.locator("#experience #teaching")).toContainText("Teaching Assistant / Lead Course Assistant");
  await expect(page.locator("section#teaching")).toHaveCount(0);
  await expect(page.locator(".story-company").filter({ hasText: "UIUC NCSA" })).toBeVisible();
  await expect(page.locator("#toolkit .section-heading > p")).toHaveText("Prioritizing continuous learning, even after university.");
  await expect(page.locator("#toolkit .learning-note, #toolkit a")).toHaveCount(0);
  await expect(body).not.toContainText("helping others build");
  await expect(body).not.toContainText("Good engineering");
  await expect(body).not.toContainText(/chapter/i);
  await expect(body).not.toContainText("✳");
  await expect(page.locator(".circle-mark")).toHaveCount(1);
  for (const text of [
    "architecture decision records", "frontier model performance on physical AI tasks",
    "security and governance controls", "secure and trusted deployments",
    "sample applications", "knowledge-sharing sessions", "senior engineers",
    "Professor Kaiyu Guan", "Bin Peng", "Colombian social scientists", "caused by conflict",
    "adopted and refined", "codebase from scratch", "Code Yellow", "Bazel",
    "Protobuf", "several times faster", "product outages", "Centipede",
    "personally mentored four teams", "hundreds of students each semester", "seven semesters",
    "January 2023", "Angular", "Rust", "Illinois Engineering Outstanding Scholarship",
    "3.79/4.00", "3.90/4.00", "Ethics", "ML Compilers", "Students for Environmental Concerns",
    "Stanford University", "Data Structures and Algorithms", "AI Evals for Engineers",
    "Hamel Husain", "Feb 2026", "Model Context Protocol", "vision-language-action",
    "CodeQL", "OAuth", "Docker", "SQL", "C++",
    "Ligo", "MapReduce", "Assignment Aggregator", "Notion", "Todoist",
    "Uber Invoice Explorer", "BoilerMake 2023", "Seattle, WA",
  ]) {
    await expect(body).toContainText(text);
  }
  expect(await page.locator(".experience-story[open]").count()).toBe(6);
  await expect(page.locator(".project-card")).toHaveCount(4);
});

test("experience stories and project filters are usable", async ({ page }) => {
  const expand = page.getByRole("button", { name: "Expand all", exact: false });
  await expand.click();
  await expect(page.locator(".experience-story[open]")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Collapse all", exact: false })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Collapse all", exact: false }).click();
  await expect(page.locator(".experience-story[open]")).toHaveCount(0);
  const firstStory = page.locator(".experience-story").first();
  await firstStory.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(firstStory).toHaveAttribute("open", "");
  const webFilter = page.getByRole("button", { name: "Web applications", exact: true });
  await webFilter.click();
  await expect(page.locator(".project-card:visible")).toHaveCount(2);
  await expect(webFilter).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveText("Showing 2 of 4 projects.");
  await page.getByRole("button", { name: "Tools & systems", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Assignment Aggregator", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All projects", exact: true }).click();
  await expect(page.locator(".project-card:visible")).toHaveCount(4);
});

test("theme persists and follows the system until explicitly chosen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(248, 246, 240)");
  await expect(page.locator(".button-primary")).toHaveCSS("background-color", "rgb(107, 41, 53)");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(27, 16, 18)");
  await expect(page.locator(".hero h1 em")).toHaveCSS("color", "rgb(216, 184, 170)");
  await expect(page.locator(".button-primary")).toHaveCSS("background-color", "rgb(114, 39, 59)");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#1b1012");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("navigation handles keyboard, mobile closing, and active sections", async ({ page }) => {
  const menuToggle = page.getByRole("button", { name: "Open navigation" });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuToggle).toBeFocused();
    await expect(page.getByRole("navigation")).toBeHidden();
    await menuToggle.click();
  }
  await page.getByRole("navigation").getByRole("link", { name: "Education" }).click();
  await expect(page.locator('.navigation a[href="#education"]')).toHaveAttribute("aria-current", "location");
  if (await menuToggle.isVisible()) {
    await expect(page.getByRole("navigation")).toBeHidden();
    await expect(page.locator("#education")).toBeFocused();
  }
});

test("has no horizontal overflow at narrow, tablet, or desktop widths", async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 375, 600, 768, 900, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px`).toBe(true);
  }
});

test("light and dark themes meet automated accessibility checks", async ({ page }) => {
  await page.getByRole("button", { name: "Expand all", exact: false }).click();
  for (const colorScheme of ["light", "dark"]) {
    await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, colorScheme);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  }
});

test("remains readable and navigable without JavaScript", async ({ browser, baseURL }, testInfo) => {
  for (const colorScheme of ["light", "dark"]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: testInfo.project.use.viewport,
      colorScheme,
    });
    const page = await context.newPage();
    await page.goto(baseURL);
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Member of Technical Staff", exact: true })).toBeVisible();
    await expect(page.locator(".project-card:visible")).toHaveCount(4);
    await expect(page.locator("body")).toHaveCSS("background-color", colorScheme === "light" ? "rgb(248, 246, 240)" : "rgb(27, 16, 18)");
    await page.locator(".experience-story").first().locator("summary").click();
    await expect(page.getByText("I helped plan and administer courses", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toHaveCount(0);
    await context.close();
  }
});

test("serves the real resume and resolves all local links", async ({ page, request }) => {
  const links = await page.locator('a[href]:not([href^="http"]):not([href^="mailto:"]):not([href^="tel:"])').evaluateAll((elements) =>
    [...new Set(elements.map((element) => element.getAttribute("href")))],
  );
  for (const href of links) {
    if (href.startsWith("#")) {
      expect(await page.locator(href).count(), href).toBe(1);
    } else {
      const response = await request.get(href);
      expect(response.ok(), href).toBe(true);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
    }
  }
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".resume-link").click();
  expect((await downloadPromise).suggestedFilename()).toBe("Liza_George_Resume.pdf");
});

test("honors reduced motion and includes full text when printing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(page.locator("details:not([open])")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(page.locator(".experience-story[open]")).toHaveCount(0);
});
