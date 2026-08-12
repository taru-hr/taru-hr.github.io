'use strict';

/* ---------------------------------------------------------------------------
   site.js — renders the data-driven sections of the landing page and wires up
   the light interactions (scroll reveal + active nav). Content still lives in
   /data, so adding a project/post/certificate means editing JSON only.
--------------------------------------------------------------------------- */

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var ICON_RIBBON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="5"/><path d="M8.5 12.5 7 21l5-3 5 3-1.5-8.5"/></svg>';
var ICON_ARROW  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6l6 6-6 6"/></svg>';

/* ---- WORK (data/prototypes.json) ---- */
async function renderWork() {
  var el = document.querySelector('[data-work]');
  if (!el) return;
  try {
    var res = await fetch('./data/prototypes.json');
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    var items = await res.json();
    el.innerHTML = items.map(function (p) {
      var ext = p.target === '_blank';
      var attrs = ext ? ' target="_blank" rel="noopener"' : '';
      var live = ext ? '<span class="live-badge"><i></i> LIVE</span>' : '';
      return '<a class="wcard" href="' + esc(p.link) + '"' + attrs + '>' +
          '<div class="wcard-img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy">' + live + '</div>' +
          '<div class="wcard-body">' +
            '<span class="wcard-cat">' + esc(p.categoryLabel || '') + '</span>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<span class="go">' + (ext ? 'Open live' : 'Open project') + ' &rarr;</span>' +
          '</div>' +
        '</a>';
    }).join('');
  } catch (err) {
    el.innerHTML = '';
    console.error('[work] could not render from ./data/prototypes.json', err);
  }
}

/* ---- INSIGHTS (data/posts.json) ---- */
async function renderInsights() {
  var el = document.querySelector('[data-insights]');
  if (!el) return;
  try {
    var res = await fetch('./data/posts.json');
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    var posts = await res.json();
    el.innerHTML = posts.map(function (p) {
      return '<a class="icard" href="' + esc(p.link) + '">' +
          '<div class="icard-img"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy"></div>' +
          '<div class="icard-body">' +
            '<span class="icard-meta">' + esc(p.category || '') + ' &middot; ' + esc(p.date || '') + '</span>' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<p>' + esc(p.excerpt || '') + '</p>' +
            '<span class="go">Read &rarr;</span>' +
          '</div>' +
        '</a>';
    }).join('');
  } catch (err) {
    el.innerHTML = '';
    console.error('[insights] could not render from ./data/posts.json', err);
  }
}

/* ---- CERTIFICATIONS + STATS (data/development.json) ---- */
async function renderDev() {
  var certsEl = document.querySelector('[data-certs]');
  var statsEl = document.querySelector('[data-stats]');
  var roadmapEl = document.querySelector('[data-roadmap]');
  if (!certsEl && !statsEl && !roadmapEl) return;
  try {
    var res = await fetch('./data/development.json');
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    var data = await res.json();
    var paths = data.paths || [];
    var pathCerts = paths.reduce(function (a, p) { return a.concat(p.certificates || []); }, []);
    var others = data.otherCertificates || [];
    var all = pathCerts.concat(others);

    if (certsEl) {
      certsEl.innerHTML = all.map(function (c) {
        var provider = c.provider || c.issuer || '';
        var when = c.date || c.year || '';
        var meta = [provider, when].filter(Boolean).map(esc).join(' &middot; ');
        var flag = c.lang ? '<span class="flag">' + esc(c.lang) + '</span>' : '';
        var link = c.pdf ? ' href="' + esc(c.pdf) + '" target="_blank" rel="noopener"' : ' href="#"';
        return '<li><a class="certi"' + link + '>' +
            '<span class="badge">' + ICON_RIBBON + '</span>' +
            '<span class="body"><h4>' + esc(c.title) + '</h4><span class="meta">' + meta + flag + '</span></span>' +
            '<span class="arr">' + ICON_ARROW + '</span>' +
          '</a></li>';
      }).join('');
    }

    if (statsEl) {
      var modules = all.reduce(function (a, c) { return a + (Number(c.modules) || 0); }, 0);
      var minutes = all.reduce(function (a, c) { return a + (Number(c.minutes) || 0); }, 0);
      var hours = Math.round(minutes / 60);
      var stats = [
        [String(all.length), 'Professional certifications'],
        [String(modules), 'Learning modules completed'],
        [hours + 'h', 'Focused study'],
        ['3', 'HRIS platforms worked with']
      ];
      statsEl.innerHTML = stats.map(function (s) {
        return '<div class="metric"><div class="n">' + s[0] + '</div><div class="l">' + s[1] + '</div></div>';
      }).join('');
    }

    if (roadmapEl) {
      var roadmap = data.roadmap || [];
      roadmapEl.innerHTML = roadmap.map(function (r, i) {
        var num = ('0' + (i + 1)).slice(-2);
        return '<div class="rmap">' +
            '<span class="rnum">' + num + '</span>' +
            '<div class="rbody"><h4>' + esc(r.title) + '</h4><p>' + esc(r.text) + '</p></div>' +
          '</div>';
      }).join('');
    }
  } catch (err) {
    if (certsEl) certsEl.innerHTML = '';
    if (roadmapEl) roadmapEl.innerHTML = '';
    console.error('[development] could not render from ./data/development.json', err);
  }
}

/* ---- scroll reveal ---- */
function setupReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (e) { io.observe(e); });
}

/* ---- active nav on scroll ---- */
function setupNav() {
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav] a'));
  var map = links.map(function (a) {
    var href = a.getAttribute('href') || '';
    // only in-page anchors participate in scroll-spy; cross-page links (./x.html) are skipped
    var sec = href.charAt(0) === '#' && href.length > 1 ? document.querySelector(href) : null;
    return { a: a, sec: sec };
  }).filter(function (x) { return x.sec; });
  if (!map.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        links.forEach(function (l) { l.classList.remove('active'); });
        var m = map.find(function (x) { return x.sec === en.target; });
        if (m) m.a.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach(function (x) { io.observe(x.sec); });
}

document.addEventListener('DOMContentLoaded', function () {
  renderWork();
  renderInsights();
  renderDev();
  setupReveal();
  setupNav();
});
