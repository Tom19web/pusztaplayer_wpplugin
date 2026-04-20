/**
 * PusztaPlay — Filmek View
 * FEAT: kategória panel + detail panel (EPG-box stílus) + get_vod_info lazy loading
 * FEAT: Pagination (30 film/oldal)
 */

import { isFavorite }  from '../store/actions.js';

const PAGE_SIZE = 30;
let _allMovies  = [];

export function setAllMovies(movies)  { _allMovies = movies; }
export function getAllMovies()         { return _allMovies; }

/* ── VOD kártya ───────────────────────────────────────────────────── */
function renderVodCard(item) {
  const bg  = item.logo
    ? `background:url('${item.logo}') center/cover no-repeat`
    : 'background:linear-gradient(145deg,#1fd6e8,#ff5b63 55%,#1a1a1a)';
  const fav = isFavorite(item.key);
  return `<article class="card"
    data-movie-key="${item.key}"
    data-movie-stream-id="${item.streamId || ''}"
    data-movie-title="${item.title.replace(/"/g, '&quot;')}"
    data-movie-group="${(item.group || '').replace(/"/g, '&quot;')}"
    data-movie-logo="${(item.logo || '').replace(/"/g, '&quot;')}">
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
  if (total <= 1) return `<div class="pagination-info">Összes film: ${itemCount} db</div>`;
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
export function renderMoviePage(items, offset = 0) {
  const page        = items.slice(offset, offset + PAGE_SIZE);
  const totalPages  = Math.ceil(items.length / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);
  return `
    <div class="channel-grid">
      ${page.map(item => renderVodCard(item)).join('')}
    </div>
    ${renderPaginationBar(currentPage, totalPages, items.length, 'movies')}
  `;
}

/* ── Főnézet ─────────────────────────────────────────────────────── */
export function renderMoviesView(movies) {
  setAllMovies(movies);

  const groups = ['', ...new Set(movies.map(m => m.group).filter(Boolean))];
  const groupBtns = groups.map(g =>
    `<button class="filter-pill${!g ? ' active' : ''}" data-movies-filter="${g}">${g || 'Összes'}</button>`
  ).join('');

  return `
    <section class="section">
      <div class="category-filter-wrapper">
        <div class="category-filter-bar">${groupBtns}</div>
      </div>
      <div id="vod-movies-list">${renderMoviePage(movies, 0)}</div>
    </section>
  `;
}
