/**
 * PusztaPlay — Live TV View
 * FIX: csatornalista JS memóriában tárolva (data-all-channels JSON parse hiba kikerülve)
 * FIX2: szívgomb hozzáadva minden csatorna-buttonhoz
 * FEAT: intelligens zapping bar – kedvencek ⭐ + legutóbb nézett 🕐 + fallback
 */

import { isFavorite }           from '../store/actions.js';
import { getHistory }           from '../store/history.js';

const PAGE_SIZE    = 30;
let   _allChannels = [];     // modul-szintű cache

/* ── Adathozzáférés ───────────────────────────────────────────────── */
export function setAllChannels(channels) { _allChannels = channels; }
export function getAllLiveChannels()      { return _allChannels; }

/* ── Csatorna-gomb HTML ───────────────────────────────────────────── */
function renderChannelButton(c, isActive = false) {
  const fav = isFavorite(c.key);
  return `<button
    class="channel-item${isActive ? ' active' : ''}"
    data-open-player="${c.key}"
    data-channel-key="${c.key}"
    data-channel-stream-id="${c.streamId || ''}"
    data-channel-title="${c.title.replace(/"/g, '&quot;')}"
    data-channel-group="${(c.group || 'Egyéb').replace(/"/g, '&quot;')}"
    data-channel-status="${(c.status || 'Élő').replace(/"/g, '&quot;')}"
    data-channel-logo="${(c.logo || '').replace(/"/g, '&quot;')}">
    ${c.logo ? `<img src="${c.logo}" alt="" class="channel-logo" loading="lazy" onerror="this.style.display='none'"/>` : ''}
    ${c.title}
    <span class="sub">${c.status || c.group || 'Élő'}</span>
    <button class="fav-heart${fav ? ' fav-heart--active' : ''}" data-fav-toggle="${c.key}"
      title="${fav ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}"
      aria-label="${fav ? 'Eltávolítás a kedvencekből' : 'Hozzáadás a kedvencekhez'}"
      aria-pressed="${fav}">${fav ? '♥' : '♡'}</button>
  </button>`;
}

/* ── Pagination helper ────────────────────────────────────────────── */
function renderPaginationBar(current, total, itemCount, type) {
  if (total <= 1) return `<div class="pagination-info">Összes csatorna: ${itemCount} db</div>`;
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
export function renderChannelPage(channels, offset = 0) {
  const page        = channels.slice(offset, offset + PAGE_SIZE);
  const totalPages  = Math.ceil(channels.length / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE);
  return `
    <div class="channel-grid">
      ${page.map((c, i) => renderChannelButton(c, offset === 0 && i === 0)).join('')}
    </div>
    ${renderPaginationBar(currentPage, totalPages, channels.length, 'live')}
  `;
}

/* ── Zapping-bar ──────────────────────────────────────────────────── */
function buildZapList(all) {
  const history = getHistory();
  const favKeys = all.filter(c => isFavorite(c.key)).map(c => c.key);
  const recKeys = history.filter(h => h.type === 'live').map(h => h.key);

  // Kedvencek először, majd legutóbb nézett (ha nincs kedvenc)
  const candidates = favKeys.length
    ? favKeys
    : recKeys.length
      ? recKeys
      : all.slice(0, 8).map(c => c.key);

  // Visszaadjuk az első 8 egyedi csatornát
  const seen = new Set();
  return candidates
    .filter(k => { if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 8)
    .map(k => all.find(c => c.key === k))
    .filter(Boolean);
}

function renderZapButton(c, isFav) {
  const badge = isFav ? '⭐' : '🕐';
  return `<button class="control-btn quick-zap" data-open-player="${c.key}" title="${c.title}">
    ${c.logo ? `<img src="${c.logo}" alt="" onerror="this.style.display='none'"/>` : ''}
    ${c.title}
    <span class="zap-badge">${badge}</span>
  </button>`;
}

export function renderLiveView(channels) {
  setAllChannels(channels);
  const zap    = buildZapList(channels);
  const favSet = new Set(channels.filter(c => isFavorite(c.key)).map(c => c.key));

  const groups = ['', ...new Set(channels.map(c => c.group).filter(Boolean))];
  const groupBtns = groups.map(g =>
    `<button class="filter-pill${!g ? ' active' : ''}" data-group-filter="${g}">${g || 'Összes'}</button>`
  ).join('');

  return `
    <section class="section live-section">
      <div class="category-filter-wrapper">
        <div class="category-filter-bar">${groupBtns}</div>
      </div>

      <div class="layout-live-full">

        <!-- Bal: csatornalista -->
        <div class="panel channels">
          <div id="live-channel-list">${renderChannelPage(channels, 0)}</div>
        </div>

        <!-- Jobb: részletek -->
        <div class="detail-card details">
          <!-- Quick-zap sáv -->
          <div class="controls" style="flex-wrap:wrap;margin-bottom:16px">
            ${zap.map(c => renderZapButton(c, favSet.has(c.key))).join('')}
          </div>

          <!-- EPG / részletek panel -->
          <div id="live-detail-logo"></div>
          <div id="live-detail-title"  style="font-family:Bangers,cursive;font-size:1.6rem;letter-spacing:1px;margin:8px 0 4px"></div>
          <div id="live-detail-status" style="font-size:.82rem;color:#888;margin-bottom:10px"></div>
          <div id="live-detail-epg"    style="font-size:.9rem;line-height:1.5"></div>
          <div style="margin-top:16px">
            <button class="btn btn-primary" id="live-detail-play" data-open-player="" style="width:100%">&#9654; Lejátszás</button>
          </div>
        </div>

      </div>
      <div class="empty-state hidden" data-empty-search>Nincs találat a csatornák között.</div>
    </section>
  `;
}
