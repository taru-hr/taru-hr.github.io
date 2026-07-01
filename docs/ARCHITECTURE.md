# Site architecture

This site was refactored from a single 890-line `index.html` into small,
reusable pieces so it is easy to grow over time. There is **no build step** —
everything runs as plain static files, which is exactly what GitHub Pages
serves.

## Folder map

```
index.html                 Thin shell. Lists which components to load; no content.
components/                Each page section as its own HTML partial.
  sidebar.html               Profile card (name, title, contacts, socials).
  navbar.html                Top navigation.
  about.html                 About page + "Areas of Expertise" cards.
  resume.html                Education & Experience timelines.
  portfolio.html             Project grid + filters (cards come from data/).
  blog.html                  Post grid (cards come from data/).
  contact.html               Map + contact form.
data/                      Content as data — add an entry to publish.
  posts.json                 Blog posts.
  prototypes.json            Portfolio projects.
posts/                     Full blog-post article pages.
  how-the-hr-dashboard-works.html   Beginner guide to the dashboard.
prototypes/                Full interactive prototype pages.
  hr-dashboard.html          Interactive HR analytics dashboard.
templates/                 Copy-paste starting points + how-to (see its README).
assets/
  css/style.css              Main site styles (unchanged from the original theme).
  css/dashboard.css          Styles for the HR dashboard prototype.
  css/article.css            Reading layout for full blog-post pages.
  js/script.js               Interactive behaviour, exposed as initApp().
  js/render.js               Renders posts/prototypes from JSON, renderCollections().
  js/include.js              Loads components, then boots the two functions above.
  js/dashboard.js            The dashboard's data + SVG charts.
docs/ARCHITECTURE.md       This file.
```

## How a page load works

1. The browser loads `index.html`. It contains only `<div data-include="…">`
   placeholders plus three `<script>` tags.
2. `include.js` runs `bootstrap()`:
   1. **Include** — every `[data-include]` placeholder is replaced with the
      contents of its component file (fetched in parallel).
   2. **Render** — `renderCollections()` reads `data/posts.json` and
      `data/prototypes.json` and builds cards using the `<template>` inside each
      component.
   3. **Init** — `initApp()` wires up navigation, the portfolio filter, the
      sidebar toggle and the contact form.
3. `document.body` gets an `is-ready` class once everything is in place.

Because the components don't exist until step 2.1, all event wiring lives inside
`initApp()` and is called *after* injection — not at parse time.

## Design decisions

- **Why client-side includes instead of a framework or Jekyll?** It keeps every
  file plain HTML/CSS/JS that anyone can edit, needs zero tooling to publish, and
  works on GitHub Pages as-is. The trade-off is that `fetch()` needs an HTTP
  origin, so local preview uses a tiny static server (see below).
- **Why data files for posts/prototypes?** Repeating content should be data, not
  copy-pasted markup. Adding a post or project is a one-object edit and the card
  is generated for you — that is the part that "scales with time".
- **Why is the dashboard dependency-free?** Charts are hand-drawn inline SVG, so
  there is no external chart library to load, version, or break.

## Previewing locally

```bash
python3 -m http.server 8000     # from the project root
# open http://localhost:8000
```

Opening `index.html` directly from disk (`file://`) will show a "could not load
component" message because browsers block `fetch()` on the file system. Use the
server above, or just view the published GitHub Pages site.

## Common tasks

| Task | Where |
|------|-------|
| Edit the intro / expertise cards | `components/about.html` |
| Add a job or qualification | `components/resume.html` |
| Publish a blog post (card only) | add an entry to `data/posts.json` |
| Publish a full article | copy `templates/article-page.template.html` into `posts/`, then point a `data/posts.json` entry's `link` at it |
| Add a portfolio project | add an entry to `data/prototypes.json` |
| Add a brand-new nav page | `templates/page-section.template.html` |
| Change contact map / form target | `components/contact.html` |
| Tweak the dashboard data | `assets/js/dashboard.js` (top of file) |
