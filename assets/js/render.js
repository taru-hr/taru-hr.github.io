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
    })
  ]);
}

window.renderCollections = renderCollections;
