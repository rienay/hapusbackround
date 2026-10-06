import './style.css';
import { removeBackground } from '@imgly/background-removal';
import confetti from 'canvas-confetti';

/* ==========================================================================
   State & Multi-Image Gallery Store
   ========================================================================== */
const appState = {
  // Gallery list: array of image objects
  // { id, name, originalUrl, resultBlob, resultUrl, width, height, bgMode, bgColor, bgGrad, customBgUrl, blurAmount, shadowOn, shadowBlur, shadowOffset, outlineOn, brightness, contrast, history: [] }
  items: [],
  activeIndex: -1,
  
  // UI states
  isComparing: false,
  splitPercent: 50,
  isDraggingSlider: false,
  activePanel: null, // 'panel-cutout' | 'panel-background' | 'panel-effects' | 'panel-adjust' | null
  
  // Brush state
  brushMode: 'erase', // 'erase' | 'restore'
  brushSize: 25,
  isPainting: false,
  
  theme: 'light',
};

/* ==========================================================================
   DOM Elements
   ========================================================================== */
const els = {
  // Screens
  screenUpload: document.getElementById('upload-screen'),
  screenProcessing: document.getElementById('processing-screen'),
  screenStudio: document.getElementById('studio-screen'),

  // Navbar & Branding
  brandLogoBtn: document.getElementById('brand-logo-btn'),
  navBtnUpload: document.getElementById('nav-btn-upload'),
  navBtnBatch: document.getElementById('nav-btn-batch'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),

  // Upload Screen
  dropArea: document.getElementById('drop-area'),
  mainFileInput: document.getElementById('main-file-input'),
  btnBrowseFile: document.getElementById('btn-browse-file'),
  samplePills: document.querySelectorAll('.sample-pill-btn'),

  // Processing Screen
  procStatusTitle: document.getElementById('proc-status-title'),
  procStatusDetail: document.getElementById('proc-status-detail'),
  procProgressTrack: document.getElementById('proc-progress-track'),

  // Top Action Bar
  actionTabBtns: document.querySelectorAll('.action-tab-btn'),
  toolPopover: document.getElementById('tool-popover'),
  popoverContents: document.querySelectorAll('.popover-content'),
  btnToggleCompare: document.getElementById('btn-toggle-compare'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),

  // Download Split Dropdown
  btnMainDownload: document.getElementById('btn-main-download'),
  btnDownloadOptionsToggle: document.getElementById('btn-download-options-toggle'),
  downloadDropdownMenu: document.getElementById('download-dropdown-menu'),
  menuItems: document.querySelectorAll('.menu-item'),

  // Popover Panels: Brush
  btnBrushEraseMode: document.getElementById('btn-brush-erase-mode'),
  btnBrushRestoreMode: document.getElementById('btn-brush-restore-mode'),
  brushSizeInput: document.getElementById('brush-size-input'),
  brushSizeDisplay: document.getElementById('brush-size-display'),
  btnResetCutout: document.getElementById('btn-reset-cutout'),

  // Popover Panels: Background
  bgTabPills: document.querySelectorAll('.bg-tab-pill'),
  stripColor: document.getElementById('strip-color'),
  stripGradient: document.getElementById('strip-gradient'),
  stripBlur: document.getElementById('strip-blur'),
  stripCustomImg: document.getElementById('strip-custom-img'),
  swatchesColor: document.querySelectorAll('#strip-color .swatch-btn[data-color]'),
  nativeColorPicker: document.getElementById('native-color-picker'),
  swatchesGradient: document.querySelectorAll('#strip-gradient .swatch-btn[data-gradient]'),
  bgBlurSlider: document.getElementById('bg-blur-slider'),
  bgBlurVal: document.getElementById('bg-blur-val'),
  customBgInput: document.getElementById('custom-bg-input'),
  btnPickCustomBg: document.getElementById('btn-pick-custom-bg'),

  // Popover Panels: Effects
  checkShadow: document.getElementById('check-shadow'),
  shadowBlurRange: document.getElementById('shadow-blur-range'),
  shadowOffsetRange: document.getElementById('shadow-offset-range'),
  checkOutline: document.getElementById('check-outline'),

  // Popover Panels: Stiker WhatsApp
  btnToolSticker: document.getElementById('btn-tool-sticker'),
  checkStickerMode: document.getElementById('check-sticker-mode'),
  stickerStrokeRange: document.getElementById('sticker-stroke-range'),
  stickerStrokeVal: document.getElementById('sticker-stroke-val'),
  swatchesStickerColor: document.querySelectorAll('[data-sticker-color]'),
  btnQuickDlSticker: document.getElementById('btn-quick-dl-sticker'),

  // Popover Panels: Adjust
  adjBrightness: document.getElementById('adj-brightness'),
  adjContrast: document.getElementById('adj-contrast'),
  btnResetAdjust: document.getElementById('btn-reset-adjust'),

  // Central Canvas Card
  canvasCard: document.getElementById('main-canvas-card'),
  canvasBgLayer: document.getElementById('canvas-bg-layer'),
  canvasBlurLayer: document.getElementById('canvas-blur-layer'),
  canvasCheckerboard: document.getElementById('canvas-checkerboard'),
  canvasCutoutImg: document.getElementById('canvas-cutout-img'),
  brushCanvas: document.getElementById('brush-canvas'),
  canvasCompareClip: document.getElementById('canvas-compare-clip'),
  canvasOriginalImg: document.getElementById('canvas-original-img'),
  badgeClean: document.getElementById('badge-clean'),
  compareSliderDivider: document.getElementById('compare-slider-divider'),

  // Bottom Multi-Image Gallery Bar
  btnGalleryAdd: document.getElementById('btn-gallery-add'),
  galleryThumbsList: document.getElementById('gallery-thumbs-list'),

  // Toasts
  toastTray: document.getElementById('toast-tray'),
  renderExportCanvas: document.getElementById('render-export-canvas'),
};

/* ==========================================================================
   Toast Notification
   ========================================================================== */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  els.toastTray.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ==========================================================================
   Screen Switcher
   ========================================================================== */
function showScreen(screenId) {
  els.screenUpload.classList.remove('active');
  els.screenProcessing.classList.remove('active');
  els.screenStudio.classList.remove('active');

  if (screenId === 'upload') els.screenUpload.classList.add('active');
  else if (screenId === 'processing') els.screenProcessing.classList.add('active');
  else if (screenId === 'studio') els.screenStudio.classList.add('active');
}

/* ==========================================================================
   Processing Handler
   ========================================================================== */
async function processFiles(files) {
  if (!files || files.length === 0) return;

  showScreen('processing');
  els.procProgressTrack.style.width = '15%';
  els.procStatusTitle.textContent = 'Memuat model AI di browser...';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let sourceUrl = '';
    let name = 'Gambar';

    if (typeof file === 'string') {
      sourceUrl = file;
      name = file.split('/').pop();
    } else {
      sourceUrl = URL.createObjectURL(file);
      name = file.name;
    }

    els.procStatusTitle.textContent = `Menghapus latar belakang (${i + 1}/${files.length})...`;

    try {
      const config = {
        progress: (key, current, total) => {
          let percent = 20;
          if (total && total > 0) percent = Math.min(95, Math.round(20 + (current / total) * 75));
          els.procProgressTrack.style.width = `${percent}%`;
        },
        output: {
          format: 'image/png',
          quality: 0.95
        }
      };

      const resultBlob = await removeBackground(file, config);
      const resultUrl = URL.createObjectURL(resultBlob);

      // Measure dimensions
      const img = new Image();
      await new Promise((res) => {
        img.onload = res;
        img.src = sourceUrl;
      });

      const newItem = {
        id: 'img_' + Date.now() + '_' + i,
        name: name,
        originalUrl: sourceUrl,
        resultBlob: resultBlob,
        resultUrl: resultUrl,
        width: img.naturalWidth,
        height: img.naturalHeight,
        bgMode: 'transparent',
        bgColor: '#ffffff',
        bgGrad: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        customBgUrl: null,
        blurAmount: 12,
        shadowOn: false,
        shadowBlur: 20,
        shadowOffset: 15,
        outlineOn: false,
        stickerMode: false,
        stickerStroke: 12,
        stickerColor: '#ffffff',
        brightness: 100,
        contrast: 100,
        history: [],
      };

      appState.items.push(newItem);
    } catch (err) {
      console.error('Failed to process image:', err);
      showToast('Gagal memproses salah satu gambar. Coba lagi.');
    }
  }

  if (appState.items.length > 0) {
    appState.activeIndex = appState.items.length - 1;
    renderGalleryTray();
    loadActiveItemIntoStudio();
    showScreen('studio');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#2563eb', '#38bdf8', '#10b981']
    });
    showToast('Latar belakang berhasil dihapus!');
  } else {
    showScreen('upload');
  }
}

/* ==========================================================================
   Multi-Image Gallery Bottom Tray
   ========================================================================== */
function renderGalleryTray() {
  els.galleryThumbsList.innerHTML = '';

  appState.items.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === appState.activeIndex ? 'active' : ''}`;
    thumb.title = item.name;

    const img = document.createElement('img');
    img.src = item.resultUrl;
    thumb.appendChild(img);

    thumb.addEventListener('click', () => {
      if (appState.activeIndex === idx) return;
      appState.activeIndex = idx;
      renderGalleryTray();
      loadActiveItemIntoStudio();
    });

    els.galleryThumbsList.appendChild(thumb);
  });
}

/* ==========================================================================
   Studio View Synchronizer
   ========================================================================== */
function getActiveItem() {
  if (appState.activeIndex >= 0 && appState.activeIndex < appState.items.length) {
    return appState.items[appState.activeIndex];
  }
  return null;
}

function loadActiveItemIntoStudio() {
  const item = getActiveItem();
  if (!item) return;

  // Set images
  els.canvasCutoutImg.src = item.resultUrl;
  els.canvasOriginalImg.src = item.originalUrl;
  els.canvasBlurLayer.src = item.originalUrl;

  // Sync UI controls
  syncBackgroundUI(item);
  syncEffectsUI(item);
  syncStickerUI(item);
  syncAdjustUI(item);

  // Apply visuals
  applyStudioVisuals(item);

  // Init brush canvas
  initBrushCanvas(item);
}

function applyStudioVisuals(item) {
  // 1. Background layer
  if (item.bgMode === 'transparent') {
    els.canvasBgLayer.style.background = 'transparent';
    els.canvasBlurLayer.classList.add('hidden');
    els.canvasCheckerboard.classList.remove('hidden');
  } else if (item.bgMode === 'blur') {
    els.canvasBgLayer.style.background = 'transparent';
    els.canvasBlurLayer.style.filter = `blur(${item.blurAmount}px)`;
    els.canvasBlurLayer.classList.remove('hidden');
    els.canvasCheckerboard.classList.add('hidden');
  } else if (item.bgMode === 'color') {
    els.canvasBgLayer.style.background = item.bgColor;
    els.canvasBlurLayer.classList.add('hidden');
    els.canvasCheckerboard.classList.add('hidden');
  } else if (item.bgMode === 'gradient') {
    els.canvasBgLayer.style.background = item.bgGrad;
    els.canvasBlurLayer.classList.add('hidden');
    els.canvasCheckerboard.classList.add('hidden');
  } else if (item.bgMode === 'custom-img' && item.customBgUrl) {
    els.canvasBgLayer.style.background = `url(${item.customBgUrl}) center / cover no-repeat`;
    els.canvasBlurLayer.classList.add('hidden');
    els.canvasCheckerboard.classList.add('hidden');
  }

  // 2. Cutout Filters (Shadow, Outline, Sticker, Brightness, Contrast)
  let filterParts = [];
  
  if (item.stickerMode) {
    const s = item.stickerStroke || 12;
    const col = item.stickerColor || '#ffffff';
    const diag = Math.round(s * 0.707);
    filterParts.push(
      `drop-shadow(${s}px 0 0 ${col}) ` +
      `drop-shadow(-${s}px 0 0 ${col}) ` +
      `drop-shadow(0 ${s}px 0 ${col}) ` +
      `drop-shadow(0 -${s}px 0 ${col}) ` +
      `drop-shadow(${diag}px ${diag}px 0 ${col}) ` +
      `drop-shadow(-${diag}px ${diag}px 0 ${col}) ` +
      `drop-shadow(${diag}px -${diag}px 0 ${col}) ` +
      `drop-shadow(-${diag}px -${diag}px 0 ${col}) ` +
      `drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35))`
    );
  } else {
    if (item.shadowOn) {
      filterParts.push(`drop-shadow(0px ${item.shadowOffset}px ${item.shadowBlur}px rgba(0, 0, 0, 0.45))`);
    }
    if (item.outlineOn) {
      filterParts.push(`drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 4px #ffffff)`);
    }
  }

  if (item.brightness !== 100) {
    filterParts.push(`brightness(${item.brightness}%)`);
  }
  if (item.contrast !== 100) {
    filterParts.push(`contrast(${item.contrast}%)`);
  }

  els.canvasCutoutImg.style.filter = filterParts.join(' ');
}

function syncStickerUI(item) {
  if (!els.checkStickerMode) return;
  els.checkStickerMode.checked = item.stickerMode;
  els.stickerStrokeRange.value = item.stickerStroke;
  els.stickerStrokeVal.textContent = `${item.stickerStroke}px`;
  els.swatchesStickerColor.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-sticker-color') === item.stickerColor);
  });
}

/* ==========================================================================
   Action Bar & Popover Drawer Management
   ========================================================================== */
function toggleToolPanel(panelId) {
  if (appState.activePanel === panelId) {
    // Close panel
    appState.activePanel = null;
    els.toolPopover.classList.add('hidden');
    els.actionTabBtns.forEach(btn => btn.classList.remove('active'));
    els.brushCanvas.classList.add('hidden');
    return;
  }

  appState.activePanel = panelId;
  els.toolPopover.classList.remove('hidden');

  els.actionTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-panel') === panelId);
  });

  els.popoverContents.forEach(p => {
    p.classList.toggle('hidden', p.id !== panelId);
  });

  // Automatically enable sticker mode when opening sticker panel
  if (panelId === 'panel-sticker') {
    const item = getActiveItem();
    if (item && !item.stickerMode) {
      item.stickerMode = true;
      syncStickerUI(item);
      applyStudioVisuals(item);
      showToast('Garis tepi stiker WhatsApp aktif');
    }
  }

  // Enable brush overlay only when in cutout mode
  if (panelId === 'panel-cutout') {
    els.brushCanvas.classList.remove('hidden');
  } else {
    els.brushCanvas.classList.add('hidden');
  }
}

/* Background UI Synchronization */
function syncBackgroundUI(item) {
  els.bgTabPills.forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-bg-mode') === item.bgMode);
  });

  els.stripColor.classList.toggle('hidden', item.bgMode !== 'color');
  els.stripGradient.classList.toggle('hidden', item.bgMode !== 'gradient');
  els.stripBlur.classList.toggle('hidden', item.bgMode !== 'blur');
  els.stripCustomImg.classList.toggle('hidden', item.bgMode !== 'custom-img');

  els.bgBlurSlider.value = item.blurAmount;
  els.bgBlurVal.textContent = `${item.blurAmount}px`;
}

/* Effects UI Synchronization */
function syncEffectsUI(item) {
  els.checkShadow.checked = item.shadowOn;
  els.shadowBlurRange.value = item.shadowBlur;
  els.shadowOffsetRange.value = item.shadowOffset;
  els.checkOutline.checked = item.outlineOn;
}

/* Adjust UI Synchronization */
function syncAdjustUI(item) {
  els.adjBrightness.value = item.brightness;
  els.adjContrast.value = item.contrast;
}

/* ==========================================================================
   Compare (Before / After Split Slider)
   ========================================================================== */
function toggleCompareSlider() {
  appState.isComparing = !appState.isComparing;
  els.btnToggleCompare.classList.toggle('active', appState.isComparing);

  els.canvasCompareClip.classList.toggle('hidden', !appState.isComparing);
  els.compareSliderDivider.classList.toggle('hidden', !appState.isComparing);
  els.badgeClean.classList.toggle('hidden', !appState.isComparing);

  if (appState.isComparing) {
    setComparePercent(50);
  }
}

function setComparePercent(percent) {
  appState.splitPercent = Math.max(0, Math.min(100, percent));
  els.canvasCompareClip.style.width = `${appState.splitPercent}%`;
  els.compareSliderDivider.style.left = `${appState.splitPercent}%`;

  const cardWidth = els.canvasCard.clientWidth;
  if (cardWidth > 0) {
    els.canvasOriginalImg.style.width = `${cardWidth}px`;
  }
}

function initCompareSliderEvents() {
  const card = els.canvasCard;

  function handleMove(clientX) {
    if (!appState.isComparing || !appState.isDraggingSlider) return;
    const rect = card.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setComparePercent(percent);
  }

  card.addEventListener('mousedown', (e) => {
    if (!appState.isComparing) return;
    appState.isDraggingSlider = true;
    handleMove(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    handleMove(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    appState.isDraggingSlider = false;
  });

  // Touch Support
  card.addEventListener('touchstart', (e) => {
    if (!appState.isComparing) return;
    appState.isDraggingSlider = true;
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    appState.isDraggingSlider = false;
  });
}

/* ==========================================================================
   Brush (Potongan: Erase / Restore Canvas)
   ========================================================================== */
function initBrushCanvas(item) {
  const canvas = els.brushCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = els.canvasCutoutImg;

  if (!img.complete || img.naturalWidth === 0) {
    img.onload = () => initBrushCanvas(item);
    return;
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  // Push initial snapshot
  if (item.history.length === 0) {
    item.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }
}

function setupBrushEvents() {
  const canvas = els.brushCanvas;
  const ctx = canvas.getContext('2d');

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function paint(e) {
    if (!appState.isPainting || appState.activePanel !== 'panel-cutout') return;
    const item = getActiveItem();
    if (!item) return;

    const { x, y } = getCoords(e);

    ctx.save();
    if (appState.brushMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, appState.brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (appState.brushMode === 'restore') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, appState.brushSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(els.canvasOriginalImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    ctx.restore();
  }

  canvas.addEventListener('mousedown', (e) => {
    if (appState.activePanel !== 'panel-cutout') return;
    appState.isPainting = true;
    paint(e);
  });

  canvas.addEventListener('mousemove', paint);

  window.addEventListener('mouseup', () => {
    if (!appState.isPainting) return;
    appState.isPainting = false;

    const item = getActiveItem();
    if (!item) return;

    // Save snapshot
    item.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    // Update active item blob and img
    canvas.toBlob((blob) => {
      if (blob) {
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        item.resultBlob = blob;
        item.resultUrl = URL.createObjectURL(blob);
        els.canvasCutoutImg.src = item.resultUrl;
        renderGalleryTray();
      }
    }, 'image/png');
  });

  // Reset Cutout
  els.btnResetCutout.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item) return;
    initBrushCanvas(item);
    showToast('Potongan direset ke awal');
  });
}

/* ==========================================================================
   Export & Download
   ========================================================================== */
async function renderExport(format = 'png') {
  const item = getActiveItem();
  if (!item) return null;

  const canvas = els.renderExportCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = item.width;
  canvas.height = item.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Background
  if (item.bgMode === 'blur') {
    ctx.save();
    ctx.filter = `blur(${item.blurAmount * 2}px)`;
    ctx.drawImage(els.canvasOriginalImg, -20, -20, canvas.width + 40, canvas.height + 40);
    ctx.restore();
  } else if (item.bgMode === 'color') {
    ctx.fillStyle = item.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (item.bgMode === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (item.bgGrad.includes('#667eea')) {
      grad.addColorStop(0, '#667eea'); grad.addColorStop(1, '#764ba2');
    } else if (item.bgGrad.includes('#ff9a9e')) {
      grad.addColorStop(0, '#ff9a9e'); grad.addColorStop(1, '#fecfef');
    } else if (item.bgGrad.includes('#0ba360')) {
      grad.addColorStop(0, '#0ba360'); grad.addColorStop(1, '#3cba92');
    } else if (item.bgGrad.includes('#f093fb')) {
      grad.addColorStop(0, '#f093fb'); grad.addColorStop(1, '#f5576c');
    } else {
      grad.addColorStop(0, '#141e30'); grad.addColorStop(1, '#243b55');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (item.bgMode === 'custom-img' && item.customBgUrl) {
    const bg = new Image();
    bg.src = item.customBgUrl;
    await new Promise(r => { bg.onload = r; });
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  }

  // 2. Draw Shadow / Outline
  if (item.shadowOn) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = item.shadowBlur * 1.5;
    ctx.shadowOffsetY = item.shadowOffset * 1.5;
    ctx.drawImage(els.canvasCutoutImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 3. Draw Cutout Subject with adjustments
  ctx.save();
  if (item.brightness !== 100 || item.contrast !== 100) {
    ctx.filter = `brightness(${item.brightness}%) contrast(${item.contrast}%)`;
  }
  ctx.drawImage(els.canvasCutoutImg, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return new Promise(res => canvas.toBlob(b => res(b), mime, 0.95));
}

async function triggerDownload(format = 'png') {
  const blob = await renderExport(format);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `remove-ai-${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
  showToast('Gambar berhasil diunduh!');
}

async function triggerCopyClipboard() {
  try {
    const blob = await renderExport('png');
    if (!blob) return;
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Gambar disalin ke clipboard!');
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Gagal menyalin gambar');
  }
}

/* ==========================================================================
   WhatsApp Sticker Renderer (512x512 WebP Official Standard)
   ========================================================================== */
async function renderWhatsAppSticker() {
  const item = getActiveItem();
  if (!item) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);

  // Standard WhatsApp sticker specs: 512x512 with 16px safety margins (max 480x480)
  const maxDim = 480;
  const scale = Math.min(maxDim / item.width, maxDim / item.height);
  const dw = Math.round(item.width * scale);
  const dh = Math.round(item.height * scale);
  const dx = Math.round((512 - dw) / 2);
  const dy = Math.round((512 - dh) / 2);

  const strokeSize = item.stickerStroke || 12;
  const strokeColor = item.stickerColor || '#ffffff';

  // Scaled offscreen cutout
  const offCanvas = document.createElement('canvas');
  offCanvas.width = dw;
  offCanvas.height = dh;
  const octx = offCanvas.getContext('2d');
  octx.drawImage(els.canvasCutoutImg, 0, 0, dw, dh);

  // Mask silhouette for solid die-cut border
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = dw;
  maskCanvas.height = dh;
  const mctx = maskCanvas.getContext('2d');
  mctx.drawImage(offCanvas, 0, 0);
  mctx.globalCompositeOperation = 'source-in';
  mctx.fillStyle = strokeColor;
  mctx.fillRect(0, 0, dw, dh);

  // 1. Draw soft drop-shadow behind sticker outline
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Multi-angle thick stroke outline
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const ox = Math.cos(angle) * strokeSize;
    const oy = Math.sin(angle) * strokeSize;
    ctx.drawImage(maskCanvas, dx + ox, dy + oy);
  }
  ctx.restore();

  // Solid stroke interior filling
  for (let r = 1; r < strokeSize; r += 2) {
    for (let i = 0; i < 12; i++) {
      const angle = (i * 2 * Math.PI) / 12;
      ctx.drawImage(maskCanvas, dx + Math.cos(angle) * r, dy + Math.sin(angle) * r);
    }
  }

  // 2. Draw cutout subject on top
  ctx.drawImage(offCanvas, dx, dy);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.9);
  });
}

async function triggerStickerDownload() {
  const blob = await renderWhatsAppSticker();
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stiker-whatsapp-${Date.now()}.webp`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  confetti({ particleCount: 70, spread: 65, origin: { y: 0.8 }, colors: ['#22c55e', '#16a34a', '#86efac'] });
  showToast('Stiker WhatsApp (.webp 512×512) berhasil diunduh!');
}

/* ==========================================================================
   Wire Up All Events
   ========================================================================== */
function initEvents() {
  // Brand logo click returns to upload
  els.brandLogoBtn.addEventListener('click', () => showScreen('upload'));
  els.navBtnUpload.addEventListener('click', () => showScreen('upload'));
  els.navBtnBatch.addEventListener('click', () => els.mainFileInput.click());

  // Theme toggle
  els.btnThemeToggle.addEventListener('click', () => {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
  });

  // Browse file button & dropzone
  els.btnBrowseFile.addEventListener('click', () => els.mainFileInput.click());
  els.dropArea.addEventListener('click', () => els.mainFileInput.click());

  els.mainFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  });

  // Drag and drop
  ['dragenter', 'dragover'].forEach(ev => {
    els.dropArea.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      els.dropArea.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(ev => {
    els.dropArea.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      els.dropArea.classList.remove('dragover');
    });
  });
  els.dropArea.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  });

  // Paste handler (Ctrl+V)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        processFiles([file]);
        break;
      }
    }
  });

  // Sample pill buttons
  els.samplePills.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = btn.getAttribute('data-src');
      processFiles([src]);
    });
  });

  // Top action bar tabs
  els.actionTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-panel');
      toggleToolPanel(panelId);
    });
  });

  // Compare split toggle
  els.btnToggleCompare.addEventListener('click', toggleCompareSlider);

  // Undo / Redo
  els.btnUndo.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item || item.history.length <= 1) return;
    item.history.pop();
    const prev = item.history[item.history.length - 1];
    const ctx = els.brushCanvas.getContext('2d');
    ctx.putImageData(prev, 0, 0);
    els.brushCanvas.toBlob(blob => {
      if (blob) {
        item.resultBlob = blob;
        item.resultUrl = URL.createObjectURL(blob);
        els.canvasCutoutImg.src = item.resultUrl;
        renderGalleryTray();
        showToast('Perubahan diurungkan');
      }
    });
  });

  // Download split buttons & menu
  els.btnMainDownload.addEventListener('click', () => triggerDownload('png'));
  els.btnDownloadOptionsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    els.downloadDropdownMenu.classList.toggle('hidden');
  });

  window.addEventListener('click', () => {
    els.downloadDropdownMenu.classList.add('hidden');
  });

  els.menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (action === 'dl-sticker') triggerStickerDownload();
      else if (action === 'dl-png') triggerDownload('png');
      else if (action === 'dl-jpg') triggerDownload('jpeg');
      else if (action === 'copy') triggerCopyClipboard();
      els.downloadDropdownMenu.classList.add('hidden');
    });
  });

  // Brush controls
  els.btnBrushEraseMode.addEventListener('click', () => {
    appState.brushMode = 'erase';
    els.btnBrushEraseMode.classList.add('active');
    els.btnBrushRestoreMode.classList.remove('active');
  });
  els.btnBrushRestoreMode.addEventListener('click', () => {
    appState.brushMode = 'restore';
    els.btnBrushRestoreMode.classList.add('active');
    els.btnBrushEraseMode.classList.remove('active');
  });
  els.brushSizeInput.addEventListener('input', (e) => {
    appState.brushSize = parseInt(e.target.value, 10);
    els.brushSizeDisplay.textContent = `${appState.brushSize}px`;
  });

  // Background Mode Tabs
  els.bgTabPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const mode = pill.getAttribute('data-bg-mode');
      const item = getActiveItem();
      if (!item) return;

      item.bgMode = mode;
      syncBackgroundUI(item);
      applyStudioVisuals(item);
    });
  });

  // Color Swatches
  els.swatchesColor.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      const item = getActiveItem();
      if (!item) return;
      item.bgColor = color;
      els.swatchesColor.forEach(b => b.classList.toggle('active', b === btn));
      applyStudioVisuals(item);
    });
  });

  els.nativeColorPicker.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.bgColor = e.target.value;
    els.swatchesColor.forEach(b => b.classList.remove('active'));
    applyStudioVisuals(item);
  });

  // Gradient Swatches
  els.swatchesGradient.forEach(btn => {
    btn.addEventListener('click', () => {
      const grad = btn.getAttribute('data-gradient');
      const item = getActiveItem();
      if (!item) return;
      item.bgGrad = grad;
      els.swatchesGradient.forEach(b => b.classList.toggle('active', b === btn));
      applyStudioVisuals(item);
    });
  });

  // Background Blur Slider
  els.bgBlurSlider.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.blurAmount = parseInt(e.target.value, 10);
    els.bgBlurVal.textContent = `${item.blurAmount}px`;
    applyStudioVisuals(item);
  });

  // Custom Background Image Picker
  els.btnPickCustomBg.addEventListener('click', () => els.customBgInput.click());
  els.customBgInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const item = getActiveItem();
      if (!item) return;
      item.customBgUrl = URL.createObjectURL(e.target.files[0]);
      applyStudioVisuals(item);
      showToast('Latar belakang foto kustom terpasang!');
    }
  });

  // Effects (Shadow & Outline)
  els.checkShadow.addEventListener('change', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.shadowOn = e.target.checked;
    applyStudioVisuals(item);
  });
  els.shadowBlurRange.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.shadowBlur = parseInt(e.target.value, 10);
    applyStudioVisuals(item);
  });
  els.shadowOffsetRange.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.shadowOffset = parseInt(e.target.value, 10);
    applyStudioVisuals(item);
  });
  els.checkOutline.addEventListener('change', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.outlineOn = e.target.checked;
    applyStudioVisuals(item);
  });

  // WhatsApp Sticker Controls
  els.checkStickerMode.addEventListener('change', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.stickerMode = e.target.checked;
    applyStudioVisuals(item);
  });

  els.stickerStrokeRange.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.stickerStroke = parseInt(e.target.value, 10);
    els.stickerStrokeVal.textContent = `${item.stickerStroke}px`;
    applyStudioVisuals(item);
  });

  els.swatchesStickerColor.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getActiveItem();
      if (!item) return;
      item.stickerColor = btn.getAttribute('data-sticker-color');
      els.swatchesStickerColor.forEach(b => b.classList.toggle('active', b === btn));
      applyStudioVisuals(item);
    });
  });

  els.btnQuickDlSticker.addEventListener('click', triggerStickerDownload);

  // Adjustments (Brightness & Contrast)
  els.adjBrightness.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.brightness = parseInt(e.target.value, 10);
    applyStudioVisuals(item);
  });
  els.adjContrast.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.contrast = parseInt(e.target.value, 10);
    applyStudioVisuals(item);
  });
  els.btnResetAdjust.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item) return;
    item.brightness = 100;
    item.contrast = 100;
    syncAdjustUI(item);
    applyStudioVisuals(item);
    showToast('Penyesuaian direset');
  });

  // Bottom gallery add button (+)
  els.btnGalleryAdd.addEventListener('click', () => els.mainFileInput.click());

  // Initialize Split Slider & Brush Events
  initCompareSliderEvents();
  setupBrushEvents();
}

/* ==========================================================================
   Start Application
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  showScreen('upload');
});
