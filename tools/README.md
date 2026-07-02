# tools/

Small, dependency-free helpers for this site. Nothing here is part of the
published website — these are utilities you run on your own machine.

## Convert-PptxToReveal.ps1

Turns a PowerPoint (`.pptx`) into a self-contained [Reveal.js](https://revealjs.com)
web deck, styled to match this site's dark-and-gold theme. It needs **nothing
installed** — just Windows PowerShell, which every Windows PC already has. (A
`.pptx` is secretly a `.zip` of XML, and the script reads that directly.)

### Run it

From the project root, in PowerShell:

```powershell
.\tools\Convert-PptxToReveal.ps1 -PptxPath ".\My Deck.pptx"
```

If Windows blocks the script the first time, run it this way instead:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\Convert-PptxToReveal.ps1 -PptxPath ".\My Deck.pptx"
```

Options:

| Option       | What it does                                            | Default                      |
|--------------|---------------------------------------------------------|------------------------------|
| `-PptxPath`  | The PowerPoint file to convert. **Required.**           | —                            |
| `-OutPath`   | Where to write the `.html`.                             | same name, `.html` extension |
| `-Title`     | Browser-tab title and title-slide heading.              | the file name                |

Example that writes straight into the blog folder:

```powershell
.\tools\Convert-PptxToReveal.ps1 -PptxPath ".\HR_Operations_Hub Taru HR.pptx" -OutPath ".\posts\my-deck.html" -Title "HR Operations Hub"
```

### What you get

One HTML file: a title slide, then **one slide per PowerPoint slide** —
each as a heading plus bullet points, already on-brand. Open it in any browser
(→ / Space to advance, `F` for full screen).

### Important: it's a starting point, not magic

The script reads **text**. It does **not** rebuild PowerPoint's columns,
tables, images, colours or exact positioning — no automatic tool does that
reliably. So the output is a clean scaffold you then refine by hand.

That refining is the real work: run the converter, then lay out each slide
(columns, cards, call-outs) so it matches your theme. The companion tutorial
[`posts/build-hr-slides-with-reveal-js.html`](../posts/build-hr-slides-with-reveal-js.html)
explains the editing part in plain English.

## Three ways to put a slide deck on the site — which to pick

| Approach | Effort | Matches the theme? | Best when… |
|----------|--------|--------------------|------------|
| **Embed the raw `.pptx`** (Microsoft Office viewer — see [`posts/hr-operations-hub-powerpoint.html`](../posts/hr-operations-hub-powerpoint.html)) | Lowest — paste one `<iframe>` | No (Microsoft's viewer) | You want it up in 2 minutes and will update the file often. |
| **Convert with this script, then tidy** | Medium | Yes | You want an on-brand deck without hand-building every slide. |
| **Hand-build in Reveal.js** (like the Expat guide) | Highest | Yes, pixel-perfect | The deck is a showcase piece worth the polish. |
