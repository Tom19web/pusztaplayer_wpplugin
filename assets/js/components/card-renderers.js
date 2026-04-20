/**
 * card-renderers.js
 * Megosztott HTML-generáló függvények: live csatorna, film, sorozat kártyalisták.
 * Importálja: app.js, filters.js
 */

import { isFavorite } from '../store/actions.js';

const PAGE_LIVE   = 30;
const PAGE_VOD    = 30;

/* ── Pagination helper ── */
function renderPaginationBar(current, total, itemCount, type, pageSize) {
  if (total <= 1) return `<div class="pagination-info">Összes elem: ${itemCount} db</div>`;
  const pages = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return `<div class="pagination-bar" data-pagination-type="${type}" data-total="${itemCount}" data-page-size="${pageSize}">
    <button class="pag-btn pag-prev" data-pag-offset="${(current - 1) * pageSize}" ${current === 0 ? 'disabled' : ''}>&lsaquo; Előző</button>
    <div class="pag-pages">${pages.map(p => p === '...'
      ? `<span class="pag-ellipsis">…</span>`
      : `<button class="pag-btn pag-num${p === current ? ' active' : ''}" data-pag-offset="${p * pageSize}">${p + 1}</button>`
    ).join('')}</div>
    <button class="pag-btn pag-next" data-pag-offset="${(current + 1) * pageSize}" ${current === total - 1 ? 'disabled' : ''}>Következő &rsaquo;</button>
  </div>`;
}

/* ── Live csatorna lista ── */
export function renderChannelListHTML(channels, offset = 0) {
  const page        = channels.slice(offset, offset + PAGE_LIVE);
  const totalPages  = Math.ceil(channels.length / PAGE_LIVE);
  const currentPage = Math.floor(offset / PAGE_LIVE);
  return `<div class="channel-grid">${
    page.map(c => renderChannelItemHTML(c)).join('')
  }</div>${renderPaginationBar(currentPage, totalPages, channels.length, 'live', PAGE_LIVE)}`;
}

/* Egyetlen channel-item gomb HTML-je */
export function renderChannelItemHTML(c) {
  return `<button class="channel-item"
    data-open-player="${c.key}"
    data-channel-key="${c.key}"
    data-channel-stream-id="${c.streamId || ''}"
    data-channel-title="${c.title.replace(/"/g, '&quot;')}"
    data-channel-group="${(c.group || 'Egyéb').replace(/"/g, '&quot;')}"
    data-channel-status="${(c.status || 'Élő').replace(/"/g, '&quot;')}"
    data-channel-logo="${(c.logo || '').replace(/"/g, '&quot;')}">
    ${c.logo ? `<img src="${c.logo}" alt="" class="channel-logo" loading="lazy" onerror="this.style.display='none'"/>` : ''}${c.title}
    <span class="sub">${c.status || c.group || 'Élő'}</span>
  </button>`;
}

/* ── Film kártyalista ── */
export function renderMovieListHTML(items, offset = 0) {
  const page        = items.slice(offset, offset + PAGE_VOD);
  const totalPages  = Math.ceil(items.length / PAGE_VOD);
  const currentPage = Math.floor(offset / PAGE_VOD);
  return `<div class="channel-grid" id="vod-movies-rail">${
    page.map(item => renderMovieCardHTML(item)).join('')
  }</div>${renderPaginationBar(currentPage, totalPages, items.length, 'movies', PAGE_VOD)}`;
}

/* Egyetlen film-kártya HTML-je */
export function renderMovieCardHTML(item) {
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

/* ── Sorozat kártyalista ── */
export function renderSeriesListHTML(items, offset = 0) {
  const page        = items.slice(offset, offset + PAGE_VOD);
  const totalPages  = Math.ceil(items.length / PAGE_VOD);
  const currentPage = Math.floor(offset / PAGE_VOD);
  return `<div class="channel-grid" id="vod-series-rail">${
    page.map(item => renderSeriesCardHTML(item)).join('')
  }</div>${renderPaginationBar(currentPage, totalPages, items.length, 'series', PAGE_VOD)}`;
}

/* Egyetlen sorozat-kártya HTML-je */
export function renderSeriesCardHTML(item) {
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
