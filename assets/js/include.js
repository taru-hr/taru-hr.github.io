'use strict';

/**
 * Lightweight client-side component loader.
 *
 * Each element with a `data-include="path/to/file.html"` attribute is replaced
 * by the contents of that HTML partial. This lets the site be split into small,
 * reusable components (see /components) without any build step — it works on
 * GitHub Pages out of the box.
 *
 * Boot order (see bootstrap):
 *   1. inject the structural components
 *   2. render data-driven collections (posts, prototypes) from /data/*.json
 *   3. initialise interactive behaviour (navigation, filters, form)
 *
 * NOTE: fetch() needs an HTTP(S) origin. Opening index.html straight from the
 * file system (file://) will be blocked by the browser — use a local server
 * such as `python3 -m http.server` or view the published GitHub Pages site.
 */

async function loadInclude(el) {
  const url = el.getAttribute('data-include');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const html = await res.text();
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    el.replaceWith(tpl.content);
  } catch (err) {
    console.error('[include] Could not load component: ' + url, err);
    el.innerHTML =
      '<p style="color:#e0a458;padding:15px;font-size:14px">Could not load <code>' +
      url +
      '</code>.<br>If you opened this page directly from disk, serve it over ' +
      'HTTP instead (e.g. <code>python3 -m http.server</code>) or view it on ' +
      'GitHub Pages.</p>';
  }
}

async function includeAll() {
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  // Placeholders are replaced in place, so parallel loading keeps DOM order.
  await Promise.all(nodes.map(loadInclude));
}

async function bootstrap() {
  await includeAll();

  if (typeof window.renderCollections === 'function') {
    await window.renderCollections();
  }

  if (typeof window.initApp === 'function') {
    window.initApp();
  }

  document.body.classList.add('is-ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
