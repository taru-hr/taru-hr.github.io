'use strict';

/**
 * Data-driven rendering.
 *
 * Repeating content (blog posts and portfolio prototypes) lives as JSON in
 * /data. Each collection has a matching <template> in its component. This file
 * fills the template's {{placeholders}} for every item and injects the result.
 *
 * To add content you only edit the JSON file — never the markup.
 */

// Escape a value so it is safe inside both text nodes and "double-quoted" attrs.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Replace {{key}} tokens in a <template> with escaped values from `data`.
function fillTemplate(template, data) {
  const html = template.innerHTML.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, key) {
    return key in data && data[key] != null ? escapeHtml(data[key]) : '';
  });
  const holder = document.createElement('template');
  holder.innerHTML = html.trim();
  return holder.content;
}

async function renderList(config) {
  const list = document.querySelector(config.listSelector);
  const template = document.querySelector(config.templateSelector);
  if (!list || !template) return;

  try {
    const res = await fetch(config.dataUrl);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const items = await res.json();

    const fragment = document.createDocumentFragment();
    items.forEach(function (item) {
      fragment.appendChild(fillTemplate(template, item));
    });
    list.appendChild(fragment);
  } catch (err) {
    console.error('[render] Could not render from ' + config.dataUrl, err);
  }
}

// Renders the Personal Development section (rolled-up stats, a learning-path
// journey, and the law areas covered) from data/development.json. Everything is
// data-driven: add a certificate to that file and it appears here automatically.
async function renderDevelopment() {
  const statsEl = document.querySelector('[data-dev-stats]');
  const journeyEl = document.querySelector('[data-dev-journey]');
  const topicsEl = document.querySelector('[data-dev-topics]');
  if (!statsEl || !journeyEl || !topicsEl) return; // section not on this page

  try {
    const res = await fetch('./data/development.json');
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const data = await res.json();

    const esc = escapeHtml;
    const paths = data.paths || [];
    // Count every certificate on the page: the showcased path cards AND the "Other certificates" list.
    const allCerts = paths.reduce(function (a, p) { return a.concat(p.certificates || []); }, [])
      .concat(data.otherCertificates || []);

    // ---- rolled-up stats ----
    const totalModules = allCerts.reduce(function (a, c) { return a + (Number(c.modules) || 0); }, 0);
    const totalMinutes = allCerts.reduce(function (a, c) { return a + (Number(c.minutes) || 0); }, 0);
    const stats = [
      { num: String(allCerts.length), label: 'Certificates earned' },
      { num: String(totalModules), label: 'Modules completed' },
      { num: Math.round(totalMinutes / 60) + '<span class="dev-stat-unit">h</span>', label: 'Hours of study' },
      { num: String((data.topics || []).length), label: 'Law areas covered' }
    ];
    statsEl.innerHTML = stats.map(function (s) {
      return '<li class="dev-stat"><span class="dev-stat-num">' + s.num +
        '</span><span class="dev-stat-label">' + s.label + '</span></li>';
    }).join('');

    // ---- one completed-certificate node ----
    function certNode(c) {
      return '' +
        '<li class="dev-node is-done">' +
          '<span class="dev-node-dot"><ion-icon name="ribbon-outline"></ion-icon></span>' +
          '<div class="dev-node-body">' +
            '<p class="dev-node-tag">' + esc(c.level) + ' &middot; Completed &middot; ' + esc(c.date) + '</p>' +
            '<div class="credential">' +
              '<a class="credential-media" href="' + esc(c.pdf) + '" target="_blank" rel="noopener" ' +
                 'aria-label="Open the ' + esc(c.title) + ' certificate (PDF)">' +
                '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + ' certificate from ' + esc(c.provider) + '" loading="lazy">' +
                '<span class="credential-media-hint"><ion-icon name="expand-outline"></ion-icon> View certificate</span>' +
              '</a>' +
              '<div class="credential-info">' +
                '<h4 class="credential-title">' + esc(c.title) + '</h4>' +
                '<p class="credential-sub">' + esc(c.titleFi) + '</p>' +
                '<p class="credential-provider"><ion-icon name="school-outline"></ion-icon> ' +
                  esc(c.provider) + ' &nbsp;&middot;&nbsp; ' + esc(c.levelLabel) + ' &nbsp;&middot;&nbsp; ' + esc(c.duration) + '</p>' +
                '<p class="credential-desc">' + esc(c.desc) + '</p>' +
                '<ul class="credential-meta">' +
                  (c.lang ? '<li class="cert-lang"><ion-icon name="language-outline"></ion-icon> ' + esc(c.lang) + '</li>' : '') +
                  (c.modules ? '<li><ion-icon name="albums-outline"></ion-icon> ' + esc(c.modules) + ' modules</li>' : '') +
                  '<li><ion-icon name="time-outline"></ion-icon> ' + esc(c.duration) + '</li>' +
                  (c.pht ? '<li><ion-icon name="ribbon-outline"></ion-icon> ' + esc(c.pht) + ' PHT</li>' : '') +
                  '<li><ion-icon name="finger-print-outline"></ion-icon> ID ' + esc(c.certId) + '</li>' +
                '</ul>' +
                '<a class="dev-btn" href="' + esc(c.pdf) + '" target="_blank" rel="noopener">' +
                  '<ion-icon name="document-text-outline"></ion-icon> View certificate</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</li>';
    }

    // ---- journey: one group per learning path, then the roadmap ----
    let html = '';
    paths.forEach(function (p) {
      html += '<section class="dev-path">' +
        '<p class="dev-path-label"><ion-icon name="git-branch-outline"></ion-icon> ' +
          esc(p.path) + ' &middot; ' + esc(p.pathFi) + '</p>' +
        '<ol class="dev-path-nodes">' + (p.certificates || []).map(certNode).join('') + '</ol>' +
      '</section>';
    });
    if (data.roadmap && data.roadmap.length) {
      html += '<section class="dev-path dev-path--roadmap">' +
        '<p class="dev-path-label"><ion-icon name="rocket-outline"></ion-icon> On the roadmap</p>' +
        '<ol class="dev-path-nodes">' + data.roadmap.map(function (r) {
          return '<li class="dev-node is-planned"><span class="dev-node-dot"></span>' +
            '<div class="dev-node-body"><h4 class="dev-node-title">' + esc(r.title) +
            '</h4><p class="dev-node-text">' + esc(r.text) + '</p></div></li>';
        }).join('') + '</ol>' +
      '</section>';
    }
    journeyEl.innerHTML = html;

    // ---- law areas ----
    topicsEl.innerHTML = (data.topics || []).map(function (t) {
      return '<li class="dev-topic"><ion-icon name="' + esc(t.icon) + '"></ion-icon>' +
        '<div><p class="dev-topic-en">' + esc(t.en) + '</p>' +
        '<p class="dev-topic-fi">' + esc(t.fi) + '</p></div></li>';
    }).join('');

    // ---- other certificates: a simple list (optional, hidden if none) ----
    const othersSection = document.querySelector('[data-dev-others-section]');
    const othersEl = document.querySelector('[data-dev-others]');
    if (othersSection && othersEl) {
      const others = data.otherCertificates || [];
      if (others.length) {
        othersEl.innerHTML = others.map(function (o) {
          const meta = [o.issuer, o.year].filter(Boolean).map(esc).join(' &middot; ');
          const title = o.pdf
            ? '<a href="' + esc(o.pdf) + '" target="_blank" rel="noopener">' + esc(o.title) + '</a>'
            : esc(o.title);
          return '<li class="other-cert"><ion-icon name="ribbon-outline"></ion-icon>' +
            '<div class="other-cert-body"><p class="other-cert-title">' + title + '</p>' +
            (meta ? '<p class="other-cert-meta">' + meta + '</p>' : '') +
            '</div>' +
            (o.lang ? '<span class="cert-lang"><ion-icon name="language-outline"></ion-icon> ' + esc(o.lang) + '</span>' : '') +
            '</li>';
        }).join('');
        othersSection.removeAttribute('hidden');
      }
    }

  } catch (err) {
    console.error('[development] Could not render from ./data/development.json', err);
  }
}

// Called by the bootstrap (include.js) after components are injected and
// before interactive behaviour is initialised.
async function renderCollections() {
  await Promise.all([
    renderList({
      dataUrl: './data/prototypes.json',
      listSelector: '[data-project-list]',
      templateSelector: '[data-project-template]'
    }),
    renderList({
      dataUrl: './data/posts.json',
      listSelector: '[data-blog-list]',
      templateSelector: '[data-blog-template]'
    }),
    renderDevelopment()
  ]);
}

window.renderCollections = renderCollections;
