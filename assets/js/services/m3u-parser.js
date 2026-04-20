/**
 * PusztaPlay v7 — M3U Parser (IndexedDB verzió)
 */
import { dbStorage } from './storage.js';

const STORAGE_KEY  = 'pusztaplay_m3u_channels';
const CHUNK_SIZE   = 500;
const YIELD_DELAY  = 0;

const RE_LIVE_URL  = /\.m3u8?(\?.*)?$/i;
const RE_VOD_URL   = /\.(mp4|avi|mkv|mov|wmv|flv|ts)(\?.*)?$/i;
const RE_EPISODE   = /S\d{1,2}E\d{1,2}/i;

function detectType(url, title) {
  if (RE_LIVE_URL.test(url)) return 'live';
  if (RE_VOD_URL.test(url)) {
    return RE_EPISODE.test(title) ? 'series' : 'movie';
  }
  if (RE_EPISODE.test(title)) return 'series';
  return 'live';
}

export function parseM3u(content) {
  return new Promise(resolve => {
    const lines = content.split(/\r?\n/);
    const all   = [];
    let current = null;
    let i = 0;

    function processChunk() {
      const end = Math.min(i + CHUNK_SIZE, lines.length);
      for (; i < end; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith('#EXTINF:')) {
          const extinf = parseExtinf(line);
          current = {
            key:       `m3u_${all.length}`,
            title:     extinf.name  || 'Ismeretlen',
            group:     extinf.group || 'Egyéb',
            logo:      extinf.logo  || '',
            tvgId:     extinf.tvgId || '',
            streamUrl: '',
            status:    '',
            epg:       [],
            type:      null
          };
        } else if (current && !line.startsWith('#')) {
          current.streamUrl = line;
          current.type      = detectType(line, current.title);
          current.status    = current.type === 'live' ? `Élő · ${current.group}` : current.group;
          all.push(current);
          current = null;
        }
      }
      if (i < lines.length) setTimeout(processChunk, YIELD_DELAY);
      else resolve(buildPlaylist(all));
    }
    processChunk();
  });
}

function buildPlaylist(all) {
  const liveChannels = all.filter(c => c.type === 'live');
  const movies       = all.filter(c => c.type === 'movie');
  const series       = all.filter(c => c.type === 'series');
  const toGroups = (arr, prefix) => [prefix, ...new Set(arr.map(c => c.group))];
  return {
    liveChannels, movies, series,
    groups: toGroups(liveChannels, 'Összes csatorna'),
    movieGroups: toGroups(movies, 'Összes film'),
    seriesGroups: toGroups(series, 'Összes sorozat'),
    channels: liveChannels
  };
}

function parseExtinf(line) {
  const result = { name: '', group: 'Egyéb', logo: '', tvgId: '' };
  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const [, key, value] = match;
    if      (key === 'group-title') result.group = value || 'Egyéb';
    else if (key === 'tvg-logo')    result.logo  = value;
    else if (key === 'tvg-id')      result.tvgId = value;
  }
  const ci = line.indexOf(',');
  if (ci !== -1) result.name = line.substring(ci + 1).trim();
  return result;
}

export async function savePlaylistToCache(playlist) {
  try {
    await dbStorage.setItem(STORAGE_KEY, playlist);
  } catch (e) { console.warn('Hiba a mentéskor:', e); }
}

export async function loadPlaylistFromCache() {
  try {
    const p = await dbStorage.getItem(STORAGE_KEY);
    if (!p) return null;
    p.channels = p.liveChannels || p.channels;
    return p;
  } catch (e) { return null; }
}

export async function clearPlaylistCache() {
  try { await dbStorage.removeItem(STORAGE_KEY); } catch (e) {}
}