/**
 * PusztaPlay — Player Service (Optimalizált verzió)
 * FEAT: HLS és MP4/MKV (progresszív) lejátszás szétválasztása
 * PERF: Natív timeupdate események a setInterval helyett
 */

let hlsInstance = null;
let currentVideo = null;
let progressCallback = null;

function clearPlayer() {
  if (currentVideo) {
    // Eltávolítjuk a natív eseményfigyelőt
    currentVideo.removeEventListener('timeupdate', handleTimeUpdate);
    currentVideo.pause();
    currentVideo.removeAttribute('src');
    currentVideo.load();
  }
  if (hlsInstance) {
    hlsInstance.stopLoad();
    hlsInstance.detachMedia();
    hlsInstance.destroy();
    hlsInstance = null;
  }
  window.__hlsInstance = null;
}

function isHlsUrl(url) {
  return /\.m3u8?(\?.*)?$/i.test(url);
}

// A natív eseménykezelő, ami sokkal kíméletesebb a CPU-val
function handleTimeUpdate() {
  if (!currentVideo || !progressCallback) return;
  
  const duration = currentVideo.duration;
  const current  = currentVideo.currentTime || 0;
  
  // Élő adás (Infinity) vagy még be nem töltött videó védelme
  const isLive = !isFinite(duration) || duration === 0;
  const ratio  = isLive ? 0 : (current / duration) * 100;
  
  progressCallback({ 
    current, 
    duration: isLive ? 0 : duration, 
    ratio,
    isLive 
  });
}

export const playerService = {
  init(videoElement) {
    currentVideo = videoElement;
    return !!currentVideo;
  },

  async load(session) {
    if (!currentVideo) throw new Error('Nincs video elem.');
    if (!session?.streamUrl) throw new Error('Nincs stream URL.');

    clearPlayer();
    
    // Feliratkozunk a natív böngésző eseményre
    currentVideo.addEventListener('timeupdate', handleTimeUpdate);

    const url = session.streamUrl;
    const useHls = isHlsUrl(url);

    return new Promise((resolve, reject) => {
      const onReady = async () => {
        try {
          await currentVideo.play();
          resolve(session);
        } catch (err) {
          console.warn('Autoplay blokkolva vagy hiba történt:', err);
          // Itt resolve-olunk, mert az adatok betöltöttek, csak a play állt meg.
          // A UI tudni fogja, hogy paused állapotban van.
          resolve(session); 
        }
      };

      if (useHls) {
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
             maxBufferLength: 30, // Nem bufferelünk feleslegesen sokat a RAM-ba
             maxMaxBufferLength: 60
          });
          window.__hlsInstance = hlsInstance;
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(currentVideo);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, onReady);
          hlsInstance.on(window.Hls.Events.ERROR, (_, data) => {
            if (data?.fatal) reject(new Error('HLS fatal error: ' + data.type));
          });
        } else if (currentVideo.canPlayType('application/vnd.apple.mpegurl')) {
          // Natív Safari / iOS lejátszás
          currentVideo.src = url;
          currentVideo.addEventListener('loadedmetadata', onReady, { once: true });
          currentVideo.addEventListener('error', () => reject(new Error('Native HLS error')), { once: true });
        } else {
          reject(new Error('A böngésző nem támogatja a HLS lejátszást.'));
        }
      } else {
        // Progresszív MP4/MKV
        currentVideo.src = url;
        currentVideo.load();
        currentVideo.addEventListener('canplay', onReady, { once: true });
        currentVideo.addEventListener('error', () => {
          const code = currentVideo.error?.code;
          reject(new Error(`Videó betöltési hiba (kód: ${code}).`));
        }, { once: true });
      }
    });
  },

  play()  { currentVideo?.play()?.catch(() => {}); },
  pause() { currentVideo?.pause(); },

  setVolume(value) {
    if (currentVideo) currentVideo.volume = Math.min(1, Math.max(0, value));
  },

  seek(seconds) {
    if (!currentVideo) return;
    if (!Number.isFinite(seconds) || seconds < 0) return;
    
    // Ha HLS élő adás van, ne engedjük eltekergetni az időt a semmibe
    if (currentVideo.duration === Infinity) return;
    
    try { currentVideo.currentTime = seconds; } catch (_) {}
  },

  onProgress(cb) {
    // Eltároljuk a callbacket, amit a handleTimeUpdate fog hívni
    progressCallback = cb;
  },

  destroy() {
    clearPlayer();
    progressCallback = null;
    currentVideo = null;
  }
};