// Shared helpers for every page. Loaded after config.js.
window.Site830 = (() => {
  const C = window.UPLOAD_CONFIG || {};

  // "Smith Wedding" → "smith-wedding". Event codes match Drive folder names.
  const slugify = s => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const event = slugify(new URLSearchParams(location.search).get('event'));

  const link = (page, slug) => `${page}?event=${encodeURIComponent(slug || event)}`;

  async function api(action, slug, fresh) {
    const url = `${C.SCRIPT_URL}?action=${action}&event=${encodeURIComponent(slug || event)}` + (fresh ? `&t=${Date.now()}` : '');
    const r = await fetch(url);
    return r.json();
  }

  // The Drive folder description is the title: "Sarah & Mike · June 14, 2027".
  // The first part becomes the headline; anything after the dot becomes the tracked line under it.
  function showTitle(title, headingEl, metaEl) {
    const parts = String(title || '').split(/\s*[·•|]\s*/).filter(Boolean);
    headingEl.textContent = parts[0] || title;
    if (metaEl) {
      metaEl.textContent = parts.slice(1).join(' · ');
      metaEl.hidden = parts.length < 2;
    }
  }

  return { config: C, event, slugify, link, api, showTitle };
})();
