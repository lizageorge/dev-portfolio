# Dev Portfolio

A responsive, single-page portfolio built with semantic HTML, custom CSS, and
small progressive enhancements in vanilla JavaScript. No framework, production
dependencies, CDN assets, tracking, or build step.

## Local preview

From the repository root, with Node.js 18+ installed:

```sh
npm run dev
```

Open <http://127.0.0.1:4173>. Stop the server with Ctrl+C and refresh the browser
after editing. The local-only server uses Node's built-in modules and needs no
package installation. It serves only the website assets and the resume PDF,
not the repository's private configuration or development files.

## Editing the site

- `index.html` contains all public content, including experience stories,
  projects, skills, teaching, education, and contact information. Content and
  navigation work without JavaScript.
- `assets/css/style.css` defines the responsive layout, light/dark themes, print
  styling, and reduced-motion behavior.
- `assets/scripts/` adds persistent theme selection, a keyboard-accessible mobile
  menu, active navigation, reading progress, expandable stories, and project
  filters. A system theme is used until a preference is explicitly selected.
- On phones, a labeled Menu opens a single-column section list. A compact
  portrait, smaller serif headings, a shorter role preview, and collapsed
  project title rows reduce scrolling without deleting content. Tapping a
  project reveals its image, full description, and links. Desktop keeps the
  full role/project descriptions, as do no-JavaScript and printed versions.
  Education coursework stays visible. Project filters are omitted on phones.
- `assets/images/liza-george-*.webp` contains optimized sizes of the new portrait.
  The project images are WebP versions of the existing screenshots.
- `assets/fonts/` contains official Adobe Source Sans 3 and Source Serif 4 webfonts.
  Their SIL Open Font Licenses are included alongside the files.

Keep Microsoft descriptions at the approved public level. Public job listings
are disclosure references, not evidence of personal contributions. Do not add
internal project names, framework names, architecture, partner identities, or
internal metrics.

## Browser checks

With Node.js 18+ installed:

```sh
npm ci
npx playwright install chromium
npm test
```

The suite starts a local server if needed and checks desktop/mobile layouts,
content coverage, keyboard navigation, themes, filters, no-JavaScript behavior,
reduced motion, PDF downloads, local assets, and automated WCAG AA accessibility.
It does not deploy or publish the site.

## Resume

[View the resume PDF](resume/Liza_George_Resume.pdf). Editable content, fonts, and
instructions for regenerating it are in [`resume/`](resume/).
