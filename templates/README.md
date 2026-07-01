# Templates

Copy-paste starting points for every type of content on the site. Each file
has step-by-step instructions in its comments.

| I want to add… | Use this template | Where the content lives |
|----------------|-------------------|-------------------------|
| A **blog post** | [`post.template.html`](./post.template.html) | `data/posts.json` |
| A **portfolio prototype / project** | [`prototype.template.html`](./prototype.template.html) | `data/prototypes.json` |
| An **"Areas of Expertise" card** | [`service.template.html`](./service.template.html) | `components/about.html` |
| A **resume entry** (education / experience) | [`timeline.template.html`](./timeline.template.html) | `components/resume.html` |
| A **whole new page / nav tab** | [`page-section.template.html`](./page-section.template.html) | new file in `components/` + `index.html` + `components/navbar.html` |

## Two ways content is added

**1. Data-driven (posts & prototypes) — the easy path.**
Just add one entry to a JSON file in [`../data`](../data). The card is rendered
automatically by `assets/js/render.js` from the `<template>` inside the matching
component. No HTML to touch.

**2. Direct markup (expertise cards, resume entries, new pages).**
Paste the template block into the relevant component in
[`../components`](../components).

## Building a new interactive prototype

The HR Analytics Dashboard (`../prototypes/hr-dashboard.html`) is a self-contained
page — its own HTML, `assets/css/dashboard.css`, and `assets/js/dashboard.js`, with
no external libraries. Copy it as a starting point for a new interactive prototype,
then point a `data/prototypes.json` entry's `link` at your new page.

## Previewing locally

The site loads its components with `fetch()`, which browsers block on the
`file://` protocol. Run a tiny local server from the project root instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

On GitHub Pages everything is served over HTTPS, so it works with no setup.
