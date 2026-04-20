/**
 * PusztaPlay — Sorozatok View
 * FEAT: kategória panel + detail panel (EPG-box stílus) + get_series lazy loading
 * FEAT: Pagination (30 sorozat/oldal)
 */

import { isFavorite }  from '../store/actions.js';

const PAGE_SIZE = 30;
let _allSeries  = [];

export function setAllSeries(series)  { _allSeries = series; }
export function getAllSeries()         { return _allSeries; }

/* ── Sorozat kártya ───────────────────────────────────────────────── */
function renderSeriesCard(item) {
  const bg  = item.logo
    ? `background:url('${item.logo}') center/cover no-repeat`
    : 'background:linear-gradient(145deg,#f6c800,#ff5b63 55%,#1a1a1a)';
  const fav = isFavorite(item.key);
  return `<article class="card"
    data-open-series="${item.seriesId}"
    data-series-key="${item.key}"
    data-series-title="${item.title.replace(/"/g, '&quot;')}"
    data-series-group="${(item.group || '').replace(/"/g, '&quot;')}"
    data-series-logo="${(item.logo || '').replace(/"/g, '&quot;')}" style="cursor:pointer">
    <div class="thumb" style="${bg}">
      ${!item.logo ? `<span>${item.title.replace(/ /g, '<br>')}</span>` : ''}
      <button class="fav-heart${fav ? ' fav-heart--active' : ''}" data-fav-toggle="${item.key}"
        title="${fav ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}"
        aria-label="${fav ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}"
        aria-pressed="${fav}">${fav ? '♥' : '♡'}</button>
    </div>
    <div class="meta"><strong>${item.title}</strong><small>${item.group || ''}</small></div>
  </article>`;
}

/* ── Pagination helper ────────────────────────────────────────────── */
function renderPaginationBar(current, total, itemCount, type) {
  if (total <= 1) return `<div class="pagination-info">Összes sorozat: ${itemCount} db</div>`;
  const pages = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return `<div class="pagination-bar" data-pagination-type="${type}" data-total="${itemCount}">
    <button class="pag-btn pag-prev" data-pag-offset="${(current - 1) * PAGE_SIZE}" ${current === 0 ? 'disabled' : ''}>&lsaquo; Előző</button>
    <div class="pag-pages">${pages.map(p => p === '...'
      ? `<span class="pag-ellipsis">…</span>`
      : `<button class="pag-btn pag-num${p === current ? ' active' : ''}" data-pag-offset="${p * PAGE_SIZE}">${p + 1}</button>`
    ).join('')}</div>
    <button class="pag-btn pag-next" data-pag-offset="${(current + 1) * PAGE_SIZE}" ${current === total - 1 ? 'disabled' : ''}>Következő &rsaquo;</button>
  </div>`;
}

/* ── Oldal renderelése ────────────────────────────────────────────── */
export function renderSeriesPage(items, offset = 0) {
  const page        = items.slice(offset, offset + PAGE_SIZE);
  const totalPages  = Math.ceil(items.length / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);
  return `
    <div class="channel-grid" id="vod-series-rail">
      ${page.map(item => renderSeriesCard(item)).join('')}
    </div>
    ${renderPaginationBar(currentPage, totalPages, items.length, 'series')}
  `;
}

/* ── Főnézet ─────────────────────────────────────────────────────── */
export function renderSeriesView(series) {
  setAllSeries(series);

  const groups = ['', ...new Set(series.map(s => s.group).filter(Boolean))];
  const groupBtns = groups.map(g =>
    `<button class="filter-pill${!g ? ' active' : ''}" data-series-filter="${g}">${g || 'Összes'}</button>`
  ).join('');

  return `
    <section class="section">
      <div class="category-filter-wrapper">
        <div class="category-filter-bar">${groupBtns}</div>
      </div>
      <div id="vod-series-list">${renderSeriesPage(series, 0)}</div>
    </section>
  `;
}
