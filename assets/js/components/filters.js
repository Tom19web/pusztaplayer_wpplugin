/**
 * filters.js
 * Csoport/kategória szűrés + Pagination kezelés (Live, Film, Sorozat).
 */

import { getAllLiveChannels }                          from '../views/live.js';
import { getAllMovies }                                from '../views/movies.js';
import { getAllSeries }                                from '../views/series.js';
import { renderChannelListHTML, renderChannelItemHTML,
         renderMovieListHTML,   renderMovieCardHTML,
         renderSeriesListHTML,  renderSeriesCardHTML }  from './card-renderers.js';
import { isFavorite }                                  from '../store/actions.js';

/* ═════════════════════════════════════════
   SZŰRÉS
   ═════════════════════════════════════════ */

export function bindGroupFilter(bindLiveInteractions, bindRouteEvents, bindFavoriteButtons) {
  const groupButtons  = [...document.querySelectorAll('[data-group-filter]')];
  const listEl        = document.getElementById('live-channel-list');
  if (!groupButtons.length || !listEl) return;
  const masterChannels = getAllLiveChannels();
  if (!masterChannels.length) return;

  groupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      groupButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter   = btn.dataset.groupFilter;
      const filtered = !filter
        ? masterChannels
        : masterChannels.filter(ch => ch.group === filter);

      listEl._filteredChannels = filtered;
      listEl.innerHTML = renderChannelListHTML(filtered, 0);
      bindLiveInteractions();
      bindRouteEvents();
      bindFavoriteButtons();
    });
  });
}

export function bindMoviesFilter(bindMovieCards, bindRouteEvents, bindFavoriteButtons) {
  const groupButtons = [...document.querySelectorAll('[data-movies-filter]')];
  const listEl       = document.getElementById('vod-movies-list');
  if (!groupButtons.length || !listEl) return;
  const masterMovies = getAllMovies();
  if (!masterMovies.length) return;

  groupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      groupButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter   = btn.dataset.moviesFilter;
      const filtered = !filter
        ? masterMovies
        : masterMovies.filter(m => m.group === filter);

      listEl._filteredMovies = filtered;
      listEl.innerHTML = renderMovieListHTML(filtered, 0);
      bindMovieCards();
      bindRouteEvents();
      bindFavoriteButtons();
    });
  });
}

export function bindSeriesFilter(bindSeriesDetailPanel, bindSeriesCards, bindRouteEvents, bindFavoriteButtons) {
  const groupButtons = [...document.querySelectorAll('[data-series-filter]')];
  const listEl       = document.getElementById('vod-series-list');
  if (!groupButtons.length || !listEl) return;
  const masterSeries = getAllSeries();
  if (!masterSeries.length) return;

  groupButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      groupButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter   = btn.dataset.seriesFilter;
      const filtered = !filter
        ? masterSeries
        : masterSeries.filter(s => s.group === filter);

      listEl._filteredSeries = filtered;
      listEl.innerHTML = renderSeriesListHTML(filtered, 0);
      bindSeriesDetailPanel();
      bindSeriesCards();
      bindRouteEvents();
      bindFavoriteButtons();
    });
  });
}

/* ═════════════════════════════════════════
   PAGINATION
   ═════════════════════════════════════════ */

export function bindPagination(bindLiveInteractions, bindRouteEvents, bindFavoriteButtons) {
  const listEl = document.getElementById('live-channel-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
    const btn = e.target.closest('.pag-btn');
    if (!btn || btn.disabled) return;
    const offset = parseInt(btn.dataset.pagOffset, 10);
    if (isNaN(offset)) return;
    const source = listEl._filteredChannels || getAllLiveChannels();
    listEl.innerHTML = renderChannelListHTML(source, offset);
    bindLiveInteractions();
    bindRouteEvents();
    bindFavoriteButtons();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function bindMoviesPagination(bindMovieCards, bindRouteEvents, bindFavoriteButtons) {
  const listEl = document.getElementById('vod-movies-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
    const btn = e.target.closest('.pag-btn');
    if (!btn || btn.disabled) return;
    const offset = parseInt(btn.dataset.pagOffset, 10);
    if (isNaN(offset)) return;
    const source = listEl._filteredMovies || getAllMovies();
    listEl.innerHTML = renderMovieListHTML(source, offset);
    bindMovieCards();
    bindRouteEvents();
    bindFavoriteButtons();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function bindSeriesPagination(bindSeriesDetailPanel, bindSeriesCards, bindRouteEvents, bindFavoriteButtons) {
  const listEl = document.getElementById('vod-series-list');
  if (!listEl) return;
  listEl.addEventListener('click', e => {
    const btn = e.target.closest('.pag-btn');
    if (!btn || btn.disabled) return;
    const offset = parseInt(btn.dataset.pagOffset, 10);
    if (isNaN(offset)) return;
    const source = listEl._filteredSeries || getAllSeries();
    listEl.innerHTML = renderSeriesListHTML(source, offset);
    bindSeriesDetailPanel();
    bindSeriesCards();
    bindRouteEvents();
    bindFavoriteButtons();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ═════════════════════════════════════════
   LOAD MORE (örökölt — card-renderers által használt
   külső szűrőknél visszafelé kompatibilis stub)
   ═════════════════════════════════════════ */
// Megtartjuk a neveket hogy régi importok ne törjenek,
// de a logika már a bindPagination*-ban van.
export const bindLoadMore        = bindPagination;
export const bindMoviesLoadMore  = bindMoviesPagination;
export const bindSeriesLoadMore  = bindSeriesPagination;
