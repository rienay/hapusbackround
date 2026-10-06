import './style.css';
import confetti from 'canvas-confetti';

/* ==========================================================================
   State & Multi-Image Gallery Store
   ========================================================================== */
const appState = {
  // Gallery items: array of { id, name, originalUrl, originalCanvas, workingCanvas, width, height, bgMode, bgColor, bgGrad, customBgUrl, blurAmount, shadowOn, shadowBlur, shadowOffset, outlineOn, brightness, contrast, history: [], redoStack: [] }
  items: [],
  activeIndex: -1,

  // UI states
  isComparing: false,
  splitPercent: 50,
  isDraggingSlider: false,
  activePanel: 'panel-cutout', // 'panel-cutout' | 'panel-background' | 'panel-effects' | 'panel-adjust' | null

  // Cutout Methods State (4 Tools: Tembak Warna, Pulih Otomatis, Kuas Hapus, Kuas Pulihkan)
  cutoutMode: 'color-wand', // 'color-wand' | 'restore-wand' | 'erase' | 'restore'
  brushSize: 30,
  colorTolerance: 15,
  isContiguousColor: true,
  restoreTolerance: 25,
  isContiguousRestore: true,
  restoreFillType: 'color', // 'color' | 'all-transparent'
  protectHoles: true,
  isPainting: false,
  lastPaintPos: null,

  theme: 'light',
  checkerboardTheme: localStorage.getItem('pudding_checker_theme') || 'light', // 'light' | 'dark'
  autoDespeckle: true,
};

/* ==========================================================================
   DOM Elements Map
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

  // Processing Screen (kept for fallback / bulk if needed)
  procStatusTitle: document.getElementById('proc-status-title'),
  procStatusDetail: document.getElementById('proc-status-detail'),
  procProgressTrack: document.getElementById('proc-progress-track'),

  // Top Action Bar
  actionTabBtns: document.querySelectorAll('.action-tab-btn'),
  btnToggleCompare: document.getElementById('btn-toggle-compare'),
  btnUndo: document.getElementById('btn-undo'),
  btnRedo: document.getElementById('btn-redo'),

  // Studio Workspace Side Card & Panels
  toolSideCard: document.getElementById('tool-side-card'),
  toolCardContents: document.querySelectorAll('.tool-card-content'),
  btnCloseSideCard: document.getElementById('btn-close-side-card'),

  // Cutout Tools (4 Tools)
  toolSelectBtns: document.querySelectorAll('.tool-select-btn'),
  subControlsColorWand: document.getElementById('sub-controls-color-wand'),
  subControlsRestoreWand: document.getElementById('sub-controls-restore-wand'),
  subControlsBrush: document.getElementById('sub-controls-brush'),

  colorToleranceInput: document.getElementById('color-tolerance-input'),
  colorToleranceDisplay: document.getElementById('color-tolerance-display'),
  checkContiguousColor: document.getElementById('check-contiguous-color'),

  restoreToleranceInput: document.getElementById('restore-tolerance-input'),
  restoreToleranceDisplay: document.getElementById('restore-tolerance-display'),
  checkContiguousRestore: document.getElementById('check-contiguous-restore'),
  restoreTargetSegmentBtns: document.querySelectorAll('#restore-type-segmented .segment-btn'),

  brushSizeInput: document.getElementById('brush-size-input'),
  brushSizeDisplay: document.getElementById('brush-size-display'),
  brushHintText: document.getElementById('brush-hint-text'),

  btnResetCutout: document.getElementById('btn-reset-cutout'),
  brushCursorIndicator: document.getElementById('brush-cursor-indicator'),

  // Download Split Dropdown
  btnMainDownload: document.getElementById('btn-main-download'),
  btnDownloadOptionsToggle: document.getElementById('btn-download-options-toggle'),
  downloadDropdownMenu: document.getElementById('download-dropdown-menu'),
  menuItems: document.querySelectorAll('.menu-item'),

  // Background Panel
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

  // Effects Panel
  checkShadow: document.getElementById('check-shadow'),
  shadowBlurRange: document.getElementById('shadow-blur-range'),
  shadowOffsetRange: document.getElementById('shadow-offset-range'),
  checkOutline: document.getElementById('check-outline'),

  // Adjust Panel
  adjBrightness: document.getElementById('adj-brightness'),
  adjContrast: document.getElementById('adj-contrast'),
  btnResetAdjust: document.getElementById('btn-reset-adjust'),

  // Central Canvas Card
  canvasCard: document.getElementById('main-canvas-card'),
  canvasBgLayer: document.getElementById('canvas-bg-layer'),
  canvasBlurLayer: document.getElementById('canvas-blur-layer'),
  canvasCheckerboard: document.getElementById('canvas-checkerboard'),
  brushCanvas: document.getElementById('brush-canvas'),
  canvasCompareClip: document.getElementById('canvas-compare-clip'),
  canvasOriginalImg: document.getElementById('canvas-original-img'),
  badgeClean: document.getElementById('badge-clean'),
  compareSliderDivider: document.getElementById('compare-slider-divider'),

  // Bottom Multi-Image Gallery Bar
  btnGalleryAdd: document.getElementById('btn-gallery-add'),
  galleryThumbsList: document.getElementById('gallery-thumbs-list'),

  // Toasts & Export
  toastTray: document.getElementById('toast-tray'),
  renderExportCanvas: document.getElementById('render-export-canvas'),

  // Paywall Modal (SumoPod QRIS)
  modalPaywallHd: document.getElementById('modal-paywall-hd'),
  btnClosePaywall: document.getElementById('btn-close-paywall'),
  paywallStepChoose: document.getElementById('paywall-step-choose'),
  paywallStepWaiting: document.getElementById('paywall-step-waiting'),
  optPlanSingle: document.getElementById('opt-plan-single'),
  optPlanDay: document.getElementById('opt-plan-day'),
  planRadios: document.querySelectorAll('input[name="paywall-plan"]'),
  btnPayQrisAction: document.getElementById('btn-pay-qris-action'),
  btnPayQrisText: document.getElementById('btn-pay-qris-text'),
  payAmountLabel: document.getElementById('pay-amount-label'),
  btnFallbackFreeStandard: document.getElementById('btn-fallback-free-standard'),
  waitingAmountVal: document.getElementById('waiting-amount-val'),
  linkReopenQris: document.getElementById('link-reopen-qris'),
  btnConfirmPaid: document.getElementById('btn-confirm-paid'),
  btnCancelPay: document.getElementById('btn-cancel-pay'),

  // Canvas Floating Quick Controls
  canvasFloatingControls: document.getElementById('canvas-floating-controls'),
  btnToggleChecker: document.getElementById('btn-toggle-checker'),
  checkerBtnIcon: document.getElementById('checker-btn-icon'),
  checkerBtnLabel: document.getElementById('checker-btn-label'),
  btnHealAndCleanFloating: document.getElementById('btn-heal-and-clean-floating'),

  // Cutout Despeckle & Protect Controls
  checkProtectHoles: document.getElementById('check-protect-holes'),
  checkAutoDespeckle: document.getElementById('check-auto-despeckle'),
  btnHealAndCleanPanel: document.getElementById('btn-heal-and-clean-panel'),

  // Background Panel Transparent Options
  stripTransparent: document.getElementById('strip-transparent'),
  btnCheckerSegmentLight: document.getElementById('btn-checker-segment-light'),
  btnCheckerSegmentDark: document.getElementById('btn-checker-segment-dark'),
};

/* ==========================================================================
   Toast Notification
   ========================================================================== */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  els.toastTray.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
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
   Image Loader & Instant Opening (0 Detik Delay)
   ========================================================================== */
async function processFiles(files) {
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let sourceUrl = '';
    let name = 'Foto';

    if (typeof file === 'string') {
      sourceUrl = file;
      name = file.split('/').pop();
    } else {
      sourceUrl = URL.createObjectURL(file);
      name = file.name;
    }

    // Load Image to extract pristine pixels
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => {
        showToast('Gagal memuat file gambar.');
        rej();
      };
      img.src = sourceUrl;
    });

    const w = img.naturalWidth || 800;
    const h = img.naturalHeight || 800;

    // 1. Pristine Original Canvas (Reference for 100% accurate restore, never modified)
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    const origCtx = origCanvas.getContext('2d');
    origCtx.drawImage(img, 0, 0);

    // 2. Working Canvas (Holds current cutout state, starts identical to original)
    const workCanvas = document.createElement('canvas');
    workCanvas.width = w;
    workCanvas.height = h;
    const workCtx = workCanvas.getContext('2d');
    workCtx.drawImage(img, 0, 0);

    // 3. Initial History Snapshot
    const initialData = workCtx.getImageData(0, 0, w, h);

    const newItem = {
      id: 'img_' + Date.now() + '_' + i,
      name: name,
      originalUrl: sourceUrl,
      originalCanvas: origCanvas,
      workingCanvas: workCanvas,
      width: w,
      height: h,
      bgMode: 'transparent',
      bgColor: '#ffffff',
      bgGrad: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)',
      customBgUrl: null,
      blurAmount: 12,
      shadowOn: false,
      shadowBlur: 20,
      shadowOffset: 15,
      outlineOn: false,
      brightness: 100,
      contrast: 100,
      history: [initialData],
      redoStack: [],
    };

    appState.items.push(newItem);
  }

  if (appState.items.length > 0) {
    appState.activeIndex = appState.items.length - 1;
    showScreen('studio');
    renderGalleryTray();
    loadActiveItemIntoStudio();
    // Langsung buka panel Hapus Background dan aktifkan Tembak Warna 1-klik otomatis
    openToolPanel('panel-cutout');
    setCutoutMode('color-wand');
    showToast('✨ Foto siap! Klik bagian background untuk langsung menghapus warna.');
  }
}

/* ==========================================================================
   Gallery Tray (Multi-Image Bottom Bar)
   ========================================================================== */
function renderGalleryTray() {
  els.galleryThumbsList.innerHTML = '';

  appState.items.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === appState.activeIndex ? 'active' : ''}`;
    thumb.title = item.name;

    const img = document.createElement('img');
    img.src = item.workingCanvas.toDataURL('image/png');
    thumb.appendChild(img);

    thumb.addEventListener('click', () => {
      if (appState.activeIndex === idx) return;
      appState.activeIndex = idx;
      renderGalleryTray();
      loadActiveItemIntoStudio();
      openToolPanel('panel-cutout');
      setCutoutMode('color-wand');
    });

    els.galleryThumbsList.appendChild(thumb);
  });
}

function updateActiveThumb() {
  const item = getActiveItem();
  if (!item) return;
  const activeThumb = els.galleryThumbsList.children[appState.activeIndex];
  if (activeThumb) {
    const img = activeThumb.querySelector('img');
    if (img) img.src = item.workingCanvas.toDataURL('image/png');
  }
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

function clearBoxSelection() {
  // Safe no-op helper for backwards compatibility
}

function loadActiveItemIntoStudio() {
  const item = getActiveItem();
  if (!item) return;

  // 1. Draw workingCanvas onto interactive brushCanvas
  const canvas = els.brushCanvas;
  canvas.width = item.width;
  canvas.height = item.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(item.workingCanvas, 0, 0);

  // 2. Set compare original and blur sources
  els.canvasOriginalImg.src = item.originalUrl;
  els.canvasBlurLayer.src = item.originalUrl;

  // 3. Clear box selection
  clearBoxSelection();

  // 4. Sync UI
  syncBackgroundUI(item);
  syncEffectsUI(item);
  syncAdjustUI(item);
  applyStudioVisuals(item);
  updateCutoutModeUI();
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

  // 2. Cutout Filters on canvas
  let filterParts = [];
  if (item.shadowOn) {
    filterParts.push(`drop-shadow(0px ${item.shadowOffset}px ${item.shadowBlur}px rgba(0, 0, 0, 0.45))`);
  }
  if (item.outlineOn) {
    filterParts.push(`drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 4px #ffffff)`);
  }
  if (item.brightness !== 100) {
    filterParts.push(`brightness(${item.brightness}%)`);
  }
  if (item.contrast !== 100) {
    filterParts.push(`contrast(${item.contrast}%)`);
  }

  els.brushCanvas.style.filter = filterParts.join(' ');
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
  if (els.stripTransparent) {
    els.stripTransparent.classList.toggle('hidden', item.bgMode !== 'transparent');
  }

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
   Tool Panels Drawer Management
   ========================================================================== */
function openToolPanel(panelId) {
  appState.activePanel = panelId;
  els.toolSideCard.classList.remove('hidden');

  els.actionTabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-panel') === panelId);
  });

  els.toolCardContents.forEach(p => {
    p.classList.toggle('hidden', p.id !== panelId);
  });

  updateCutoutModeUI();
}

function toggleToolPanel(panelId) {
  if (appState.activePanel === panelId) {
    // Close panel
    appState.activePanel = null;
    els.toolSideCard.classList.add('hidden');
    els.actionTabBtns.forEach(btn => btn.classList.remove('active'));
    if (els.brushCursorIndicator) els.brushCursorIndicator.classList.add('hidden');
    clearBoxSelection();
    return;
  }
  openToolPanel(panelId);
}

/* ==========================================================================
   Cutout 4 Tools: Mode Switcher & UI Sync
   ========================================================================== */
function setCutoutMode(mode) {
  appState.cutoutMode = mode;
  updateCutoutModeUI();
}

function updateCutoutModeUI() {
  const isCutoutPanel = appState.activePanel === 'panel-cutout';

  // Mode buttons active state
  els.toolSelectBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === appState.cutoutMode);
  });

  // Sub-controls visibility
  if (els.subControlsColorWand) {
    els.subControlsColorWand.classList.toggle('hidden', appState.cutoutMode !== 'color-wand');
  }
  if (els.subControlsRestoreWand) {
    els.subControlsRestoreWand.classList.toggle('hidden', appState.cutoutMode !== 'restore-wand');
  }
  if (els.subControlsBrush) {
    els.subControlsBrush.classList.toggle('hidden', appState.cutoutMode !== 'erase' && appState.cutoutMode !== 'restore');
    if (els.brushHintText) {
      if (appState.cutoutMode === 'erase') {
        els.brushHintText.innerHTML = '💡 <strong>Kuas Hapus:</strong> Sapukan kuas pada foto untuk menghapus bagian yang tidak diinginkan.';
      } else {
        els.brushHintText.innerHTML = '💡 <strong>Kuas Pulihkan:</strong> Sapukan kuas untuk mengembalikan foto asli 100% presisi secara manual.';
      }
    }
  }

  // Cursor handling
  if (!isCutoutPanel) {
    els.brushCanvas.style.cursor = 'default';
    if (els.brushCursorIndicator) els.brushCursorIndicator.classList.add('hidden');
    return;
  }

  if (appState.cutoutMode === 'color-wand' || appState.cutoutMode === 'restore-wand') {
    els.brushCanvas.style.cursor = 'crosshair';
    if (els.brushCursorIndicator) els.brushCursorIndicator.classList.add('hidden');
  } else {
    // Erase or Restore brush: use custom circular cursor indicator
    els.brushCanvas.style.cursor = 'none';
    updateBrushCursorIndicator();
  }
}

function updateBrushCursorIndicator() {
  if (!els.brushCursorIndicator) return;
  els.brushCursorIndicator.className = 'brush-cursor-indicator';

  if (appState.cutoutMode === 'erase') {
    els.brushCursorIndicator.classList.add('mode-erase');
  } else if (appState.cutoutMode === 'restore') {
    els.brushCursorIndicator.classList.add('mode-restore');
  } else {
    els.brushCursorIndicator.classList.add('hidden');
    return;
  }

  const visualSize = getCanvasVisualBrushSize();
  els.brushCursorIndicator.style.width = `${visualSize}px`;
  els.brushCursorIndicator.style.height = `${visualSize}px`;
}

function getCanvasVisualBrushSize() {
  const canvas = els.brushCanvas;
  if (!canvas || canvas.width === 0) return appState.brushSize * 2;
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width / canvas.width;
  return Math.max(10, Math.round(appState.brushSize * 2 * scale));
}

/* ==========================================================================
   Checkerboard Theme & Stray Artifacts Cleaning
   ========================================================================== */
function setCheckerboardTheme(theme) {
  appState.checkerboardTheme = theme;
  localStorage.setItem('pudding_checker_theme', theme);

  const isDark = (theme === 'dark');
  if (els.canvasCheckerboard) els.canvasCheckerboard.classList.toggle('theme-dark', isDark);
  if (els.canvasCard) els.canvasCard.classList.toggle('theme-dark', isDark);

  if (els.checkerBtnIcon) els.checkerBtnIcon.textContent = isDark ? '⚫' : '⚪';
  if (els.checkerBtnLabel) els.checkerBtnLabel.textContent = isDark ? 'Latar: Hitam' : 'Latar: Putih';

  if (els.btnCheckerSegmentLight) els.btnCheckerSegmentLight.classList.toggle('active', !isDark);
  if (els.btnCheckerSegmentDark) els.btnCheckerSegmentDark.classList.toggle('active', isDark);
}

function cleanStrayArtifacts(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const thresholdAlpha = options.thresholdAlpha !== undefined ? options.thresholdAlpha : 25;
  let cleanedCount = 0;

  // Pass 1: Remove isolated noise specks (pixels with 6+ transparent 8-neighbors)
  const toClear = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] <= thresholdAlpha) continue;

      let transparentNeighbors = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
            transparentNeighbors++;
            continue;
          }
          const nIdx = (ny * w + nx) * 4;
          if (data[nIdx + 3] <= thresholdAlpha) {
            transparentNeighbors++;
          }
        }
      }

      if (transparentNeighbors >= 6) {
        toClear.push(idx);
      }
    }
  }

  for (let i = 0; i < toClear.length; i++) {
    data[toClear[i] + 3] = 0;
    cleanedCount++;
  }

  // Pass 2: Remove small disconnected floating islands (clusters <= 24 pixels)
  const visited = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      const idx = pos * 4;

      if (visited[pos] || data[idx + 3] <= thresholdAlpha) continue;

      const cluster = [x, y];
      visited[pos] = 1;
      let head = 0;

      while (head < cluster.length && cluster.length <= 48) {
        const cx = cluster[head++];
        const cy = cluster[head++];

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nPos = ny * w + nx;
            if (!visited[nPos] && data[nPos * 4 + 3] > thresholdAlpha) {
              visited[nPos] = 1;
              cluster.push(nx, ny);
            }
          }
        }
      }

      const pixelCount = cluster.length / 2;
      // Clusters with <= 24 pixels floating in transparency are noise specks
      if (pixelCount > 0 && pixelCount <= 24) {
        for (let k = 0; k < cluster.length; k += 2) {
          const cIdx = (cluster[k + 1] * w + cluster[k]) * 4;
          data[cIdx + 3] = 0;
          cleanedCount++;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return cleanedCount;
}

function healObjectHoles(canvas, originalCanvas, maxHoleSize = 250) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const origCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const origData = origCtx.getImageData(0, 0, w, h).data;

  // Find transparent pockets (alpha < 120) completely enclosed inside opaque regions (punctured holes)
  const visited = new Uint8Array(w * h);
  let healedCount = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      const idx = pos * 4;

      if (visited[pos] || data[idx + 3] > 120) continue;

      const component = [x, y];
      visited[pos] = 1;
      let head = 0;
      let touchesBorder = false;

      while (head < component.length) {
        const cx = component[head++];
        const cy = component[head++];

        if (cx <= 1 || cx >= w - 2 || cy <= 1 || cy >= h - 2) {
          touchesBorder = true;
        }

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (let i = 0; i < 4; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nPos = ny * w + nx;
            if (!visited[nPos] && data[nPos * 4 + 3] <= 120) {
              visited[nPos] = 1;
              component.push(nx, ny);
            }
          }
        }
      }

      const pixelCount = component.length / 2;
      // If it doesn't touch canvas borders and is smaller than maxHoleSize, it's an accidental hole inside an object!
      if (!touchesBorder && pixelCount <= maxHoleSize) {
        for (let k = 0; k < component.length; k += 2) {
          const hx = component[k];
          const hy = component[k + 1];
          const hIdx = (hy * w + hx) * 4;
          data[hIdx] = origData[hIdx];
          data[hIdx + 1] = origData[hIdx + 1];
          data[hIdx + 2] = origData[hIdx + 2];
          data[hIdx + 3] = origData[hIdx + 3];
          healedCount++;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return healedCount;
}

function tidyImageComplete() {
  const item = getActiveItem();
  if (!item) return;

  const canvas = els.brushCanvas;
  // 1. Heal punctured holes inside letters/objects from pristine original
  const healed = healObjectHoles(canvas, item.originalCanvas, 350);
  // 2. Clear isolated stray dots and floating specks in background
  const cleaned = cleanStrayArtifacts(canvas, { thresholdAlpha: 30 });

  // Sync to workingCanvas
  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.clearRect(0, 0, item.width, item.height);
  workCtx.drawImage(canvas, 0, 0);

  // Push history
  const ctx = canvas.getContext('2d');
  item.history.push(ctx.getImageData(0, 0, item.width, item.height));
  item.redoStack = [];

  updateActiveThumb();
  if (healed > 0 || cleaned > 0) {
    showToast(`✨ Gambar rapi! ${healed.toLocaleString()} lubang ditambal & ${cleaned.toLocaleString()} titik sisa dibersihkan.`);
  } else {
    showToast('✨ Gambar sudah rapi dan bersih.');
  }
}

/* ==========================================================================
   ALAT 1: Tembak Warna (Color Wand / 1-Klik Titik Presisi & Halus)
   ========================================================================== */
function shootColor(ix, iy) {
  const item = getActiveItem();
  if (!item) return;

  const canvas = els.brushCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  if (ix < 0 || ix >= w || iy < 0 || iy >= h) return;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const startIdx = (iy * w + ix) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  if (targetA === 0) {
    showToast('Titik ini sudah transparan.');
    return;
  }

  // Perceptual Redmean Color Distance
  function calcColorDist(r, g, b) {
    const rmean = (r + targetR) / 2;
    const dr = r - targetR;
    const dg = g - targetG;
    const db = b - targetB;
    return Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8));
  }

  // Tolerance thresholds
  const maxDist = (appState.colorTolerance / 100) * 360;
  const featherDist = maxDist * 1.25; // Soft anti-alias edge falloff zone

  let erasedCount = 0;

  if (appState.isContiguousColor) {
    // Smart Contiguous Flood Fill (BFS) with Edge Barrier
    const visited = new Uint8Array(w * h);
    const queue = [ix, iy];
    visited[iy * w + ix] = 1;
    let head = 0;

    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const idx = (cy * w + cx) * 4;

      if (data[idx + 3] > 0) {
        data[idx + 3] = 0;
        erasedCount++;
      }

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nPos = ny * w + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;
            const r = data[nIdx];
            const g = data[nIdx + 1];
            const b = data[nIdx + 2];
            const a = data[nIdx + 3];

            if (a > 0) {
              // Edge barrier: prevent crossing strong contrast outlines
              const stepDiff = Math.abs(r - data[idx]) + Math.abs(g - data[idx + 1]) + Math.abs(b - data[idx + 2]);
              if (stepDiff > 115) {
                continue;
              }

              const dist = calcColorDist(r, g, b);
              if (dist <= maxDist) {
                queue.push(nx, ny);
              } else if (dist <= featherDist) {
                // Soft edge transition (only soften alpha, never tint RGB black!)
                const factor = (dist - maxDist) / (featherDist - maxDist);
                data[nIdx + 3] = Math.min(data[nIdx + 3], Math.round(255 * factor));
              }
            }
          }
        }
      }
    }
  } else {
    // Global Color Erase: Erase matching pixels
    const totalPixels = w * h;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      if (data[idx + 3] > 0) {
        const dist = calcColorDist(data[idx], data[idx + 1], data[idx + 2]);
        if (dist <= maxDist) {
          data[idx + 3] = 0;
          erasedCount++;
        } else if (dist <= featherDist) {
          const factor = (dist - maxDist) / (featherDist - maxDist);
          data[idx + 3] = Math.min(data[idx + 3], Math.round(255 * factor));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Auto protect holes inside objects if enabled
  if (appState.protectHoles) {
    healObjectHoles(canvas, item.originalCanvas, 150);
  }

  // Auto despeckle / clean stray dots in background if enabled
  if (appState.autoDespeckle) {
    cleanStrayArtifacts(canvas, { thresholdAlpha: 20 });
  }

  // Sync to workingCanvas
  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.clearRect(0, 0, w, h);
  workCtx.drawImage(canvas, 0, 0);

  // Push history
  item.history.push(ctx.getImageData(0, 0, w, h));
  item.redoStack = [];

  updateActiveThumb();
  showToast(`🎯 Latar berhasil dihapus bersih! (${erasedCount.toLocaleString()} px)`);
}

/* ==========================================================================
   ALAT 2: Pulih Otomatis (Restore Wand / 1-Klik Titik Pulih)
   ========================================================================== */
function shootRestore(ix, iy) {
  const item = getActiveItem();
  if (!item) return;

  const canvas = els.brushCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  if (ix < 0 || ix >= w || iy < 0 || iy >= h) return;

  // 1. Current canvas state (with transparent / edited pixels)
  const curImgData = ctx.getImageData(0, 0, w, h);
  const curData = curImgData.data;

  // 2. Original pristine canvas state
  const origCtx = item.originalCanvas.getContext('2d', { willReadFrequently: true });
  const origImgData = origCtx.getImageData(0, 0, w, h);
  const origData = origImgData.data;

  const startIdx = (iy * w + ix) * 4;
  const origR = origData[startIdx];
  const origG = origData[startIdx + 1];
  const origB = origData[startIdx + 2];
  const origA = origData[startIdx + 3];

  if (origA === 0) {
    showToast('Titik ini memang transparan di foto asli.');
    return;
  }

  // Tolerance Euclidean distance threshold
  const maxDist = (appState.restoreTolerance / 100) * 441.67;

  function isMatchOrig(r, g, b, a) {
    if (a === 0) return false;
    const dr = r - origR;
    const dg = g - origG;
    const db = b - origB;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= maxDist;
  }

  let restoredCount = 0;
  const isAllTransparentMode = appState.restoreFillType === 'all-transparent';

  if (appState.isContiguousRestore) {
    // Smart Contiguous Flood Fill (BFS)
    const visited = new Uint8Array(w * h);
    const queue = [ix, iy];
    visited[iy * w + ix] = 1;
    let head = 0;

    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];
      const idx = (cy * w + cx) * 4;

      // Restore if pixel currently differs from pristine original
      if (curData[idx + 3] !== origData[idx + 3] ||
          curData[idx] !== origData[idx] ||
          curData[idx + 1] !== origData[idx + 1] ||
          curData[idx + 2] !== origData[idx + 2]) {
        curData[idx] = origData[idx];
        curData[idx + 1] = origData[idx + 1];
        curData[idx + 2] = origData[idx + 2];
        curData[idx + 3] = origData[idx + 3];
        restoredCount++;
      }

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < 4; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nPos = ny * w + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;

            if (isAllTransparentMode) {
              // Expand across currently erased / transparent pixels
              if (curData[nIdx + 3] < 255) {
                queue.push(nx, ny);
              }
            } else {
              // Match original color with tolerance
              if (isMatchOrig(origData[nIdx], origData[nIdx + 1], origData[nIdx + 2], origData[nIdx + 3])) {
                queue.push(nx, ny);
              }
            }
          }
        }
      }
    }
  } else {
    // Global Restore: Restore all matching pixels in whole image
    const totalPixels = w * h;
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      let shouldRestore = false;

      if (isAllTransparentMode) {
        shouldRestore = (curData[idx + 3] < 255);
      } else {
        shouldRestore = isMatchOrig(origData[idx], origData[idx + 1], origData[idx + 2], origData[idx + 3]);
      }

      if (shouldRestore) {
        if (curData[idx + 3] !== origData[idx + 3] ||
            curData[idx] !== origData[idx] ||
            curData[idx + 1] !== origData[idx + 1] ||
            curData[idx + 2] !== origData[idx + 2]) {
          curData[idx] = origData[idx];
          curData[idx + 1] = origData[idx + 1];
          curData[idx + 2] = origData[idx + 2];
          curData[idx + 3] = origData[idx + 3];
          restoredCount++;
        }
      }
    }
  }

  if (restoredCount === 0) {
    showToast('Area ini sudah dalam kondisi asli.');
    return;
  }

  ctx.putImageData(curImgData, 0, 0);

  // Sync to workingCanvas
  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.putImageData(curImgData, 0, 0);

  // Push history
  item.history.push(ctx.getImageData(0, 0, w, h));
  item.redoStack = [];

  updateActiveThumb();
  showToast(`🪄 Area berhasil dipulihkan otomatis! (${restoredCount.toLocaleString()} px)`);
}

/* ==========================================================================
   CARA 3 & 4: Kuas Hapus & Kuas Pulihkan (100% Presisi)
   ========================================================================== */
function paintStroke(fromPos, toPos) {
  const item = getActiveItem();
  if (!item) return;

  const canvas = els.brushCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const r = appState.brushSize;

  ctx.save();

  if (appState.cutoutMode === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.lineWidth = r * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(toPos.x, toPos.y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (appState.cutoutMode === 'restore') {
    // 100% PRECISE RESTORE: Draw EXACT original pixels from item.originalCanvas!
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, r / 3);
    const count = Math.max(1, Math.ceil(dist / step));

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const cx = fromPos.x + dx * t;
      const cy = fromPos.y + dy * t;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.clip();

    // Identical 1:1 pixel mapping: draw originalCanvas at (0, 0)
    ctx.drawImage(item.originalCanvas, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/* ==========================================================================
   Canvas Coordinate Mapping & Mouse/Touch Handlers
   ========================================================================== */
function getCanvasCoords(e) {
  const canvas = els.brushCanvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

  return {
    x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
    y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
    screenX: clientX,
    screenY: clientY,
  };
}

function updateCursorFollower(e) {
  if (!els.brushCursorIndicator || appState.activePanel !== 'panel-cutout') return;
  if (appState.cutoutMode !== 'erase' && appState.cutoutMode !== 'restore') {
    els.brushCursorIndicator.classList.add('hidden');
    return;
  }

  const cardRect = els.canvasCard.getBoundingClientRect();
  const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

  const x = clientX - cardRect.left;
  const y = clientY - cardRect.top;

  els.brushCursorIndicator.style.left = `${x}px`;
  els.brushCursorIndicator.style.top = `${y}px`;
  els.brushCursorIndicator.classList.remove('hidden');
  updateBrushCursorIndicator();
}

function setupCanvasInteractions() {
  const canvas = els.brushCanvas;
  const card = els.canvasCard;

  // Move & Hover
  card.addEventListener('mousemove', (e) => {
    if (appState.activePanel === 'panel-cutout') {
      updateCursorFollower(e);
    }
  });

  card.addEventListener('mouseenter', (e) => {
    if (appState.activePanel === 'panel-cutout') {
      updateCursorFollower(e);
    }
  });

  card.addEventListener('mouseleave', () => {
    if (els.brushCursorIndicator) els.brushCursorIndicator.classList.add('hidden');
  });

  // Mousedown / Touchstart
  canvas.addEventListener('mousedown', (e) => {
    if (appState.activePanel !== 'panel-cutout') return;
    if (e.button !== 0) return;

    const coords = getCanvasCoords(e);

    // ALAT 1: Tembak Warna (1-Klik Hapus)
    if (appState.cutoutMode === 'color-wand') {
      shootColor(Math.floor(coords.x), Math.floor(coords.y));
      return;
    }

    // ALAT 2: Pulih Otomatis (1-Klik Sudut / Titik Pulih)
    if (appState.cutoutMode === 'restore-wand') {
      shootRestore(Math.floor(coords.x), Math.floor(coords.y));
      return;
    }

    // ALAT 3 & 4: Kuas Hapus & Pulihkan
    if (appState.cutoutMode === 'erase' || appState.cutoutMode === 'restore') {
      appState.isPainting = true;
      appState.lastPaintPos = { x: coords.x, y: coords.y };
      paintStroke(coords, coords);
    }
  });

  window.addEventListener('mousemove', (e) => {
    // Handling Brush Paint Drag
    if (!appState.isPainting || !appState.lastPaintPos) return;
    const coords = getCanvasCoords(e);
    paintStroke(appState.lastPaintPos, coords);
    appState.lastPaintPos = { x: coords.x, y: coords.y };
  });

  window.addEventListener('mouseup', () => {
    // End Brush Painting
    if (!appState.isPainting) return;
    appState.isPainting = false;
    appState.lastPaintPos = null;

    const item = getActiveItem();
    if (!item) return;

    // Sync interactive canvas pixels to workingCanvas
    const workCtx = item.workingCanvas.getContext('2d');
    workCtx.clearRect(0, 0, item.width, item.height);
    workCtx.drawImage(canvas, 0, 0);

    // Save undo snapshot
    const snap = workCtx.getImageData(0, 0, item.width, item.height);
    item.history.push(snap);
    item.redoStack = [];

    updateActiveThumb();
  });
}

/* ==========================================================================
   Undo, Redo & Reset Actions
   ========================================================================== */
function undoAction() {
  const item = getActiveItem();
  if (!item || item.history.length <= 1) {
    showToast('Tidak ada langkah yang dapat diurungkan.');
    return;
  }

  const current = item.history.pop();
  item.redoStack.push(current);

  const prev = item.history[item.history.length - 1];
  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.putImageData(prev, 0, 0);

  const dispCtx = els.brushCanvas.getContext('2d');
  dispCtx.putImageData(prev, 0, 0);

  updateActiveThumb();
  showToast('↶ Tindakan diurungkan (Undo)');
}

function redoAction() {
  const item = getActiveItem();
  if (!item || item.redoStack.length === 0) {
    showToast('Tidak ada langkah untuk diulangi.');
    return;
  }

  const next = item.redoStack.pop();
  item.history.push(next);

  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.putImageData(next, 0, 0);

  const dispCtx = els.brushCanvas.getContext('2d');
  dispCtx.putImageData(next, 0, 0);

  updateActiveThumb();
  showToast('↷ Tindakan diulangi (Redo)');
}

function resetCutoutToOriginal() {
  const item = getActiveItem();
  if (!item) return;

  const workCtx = item.workingCanvas.getContext('2d');
  workCtx.clearRect(0, 0, item.width, item.height);
  workCtx.drawImage(item.originalCanvas, 0, 0);

  const dispCtx = els.brushCanvas.getContext('2d');
  dispCtx.clearRect(0, 0, item.width, item.height);
  dispCtx.drawImage(item.originalCanvas, 0, 0);

  item.history.push(workCtx.getImageData(0, 0, item.width, item.height));
  item.redoStack = [];

  clearBoxSelection();
  updateActiveThumb();
  showToast('↺ Foto berhasil direset ke kondisi awal');
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
  els.canvasCompareClip.style.clipPath = `polygon(0 0, ${appState.splitPercent}% 0, ${appState.splitPercent}% 100%, 0 100%)`;
  els.compareSliderDivider.style.left = `${appState.splitPercent}%`;
}

function setupCompareSliderEvents() {
  const card = els.canvasCard;

  function handleMove(clientX) {
    if (!appState.isComparing) return;
    const rect = card.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setComparePercent(pos);
  }

  card.addEventListener('mousedown', (e) => {
    if (!appState.isComparing) return;
    appState.isDraggingSlider = true;
    handleMove(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (appState.isDraggingSlider) handleMove(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    appState.isDraggingSlider = false;
  });
}

/* ==========================================================================
   Export & Download
   ========================================================================== */
async function renderExport(quality = 'hd') {
  const item = getActiveItem();
  if (!item) return null;

  let targetWidth = item.width;
  let targetHeight = item.height;

  if (quality === 'standard') {
    // Standard size: max 800px on long edge for fast & lightweight file
    const maxDim = 800;
    if (targetWidth > maxDim || targetHeight > maxDim) {
      if (targetWidth >= targetHeight) {
        targetHeight = Math.round((targetHeight / targetWidth) * maxDim);
        targetWidth = maxDim;
      } else {
        targetWidth = Math.round((targetWidth / targetHeight) * maxDim);
        targetHeight = maxDim;
      }
    }
  }

  const canvas = els.renderExportCanvas;
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // 1. Draw Background
  const isOpaque = item.bgMode !== 'transparent';
  if (isOpaque) {
    if (item.bgMode === 'color') {
      ctx.fillStyle = item.bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (item.bgMode === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
      grad.addColorStop(0, '#fef3c7');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (item.bgMode === 'blur') {
      ctx.save();
      ctx.filter = `blur(${item.blurAmount}px)`;
      ctx.drawImage(item.originalCanvas, -20, -20, targetWidth + 40, targetHeight + 40);
      ctx.restore();
    } else if (item.bgMode === 'custom-img' && item.customBgUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise(r => { bgImg.onload = r; bgImg.src = item.customBgUrl; });
      ctx.drawImage(bgImg, 0, 0, targetWidth, targetHeight);
    }
  }

  // 2. Draw working cutout with filters
  ctx.save();
  const scale = targetWidth / item.width;
  let filterParts = [];
  if (item.shadowOn) {
    filterParts.push(`drop-shadow(0px ${item.shadowOffset * scale}px ${item.shadowBlur * scale}px rgba(0, 0, 0, 0.45))`);
  }
  if (item.outlineOn) {
    filterParts.push(`drop-shadow(0 0 ${2 * scale}px #ffffff) drop-shadow(0 0 ${4 * scale}px #ffffff)`);
  }
  if (item.brightness !== 100) filterParts.push(`brightness(${item.brightness}%)`);
  if (item.contrast !== 100) filterParts.push(`contrast(${item.contrast}%)`);

  if (filterParts.length > 0) ctx.filter = filterParts.join(' ');
  ctx.drawImage(item.workingCanvas, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  const mime = isOpaque ? 'image/jpeg' : 'image/png';
  const imgQuality = isOpaque ? (quality === 'hd' ? 0.95 : 0.85) : undefined;

  return new Promise(resolve => canvas.toBlob(resolve, mime, imgQuality));
}

async function triggerDownload(quality = 'hd') {
  const item = getActiveItem();
  if (!item) return;

  // Intercept Unduh HD if not unlocked for 1x download
  if (quality === 'hd' && !isHdUnlocked(item)) {
    openPaywallModal();
    return;
  }

  const blob = await renderExport(quality);
  if (!blob) return;

  // Satu kali bayar = satu kali unduh HD (token langsung dikonsumsi)
  if (quality === 'hd') {
    item.hdUnlockedOneTime = false;
  }

  const baseName = (item ? item.name : 'pudding_bg').replace(/\.[^/.]+$/, '');
  const ext = (item && item.bgMode !== 'transparent') ? 'jpg' : 'png';
  const suffix = quality === 'hd' ? 'HD' : 'Standar';
  const fileName = `${baseName}_${suffix}.${ext}`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (quality === 'hd') {
    showToast(`✅ Berhasil mengunduh HD (${item ? `${item.width}×${item.height}px` : 'Resolusi Penuh'})!`);
  } else {
    showToast(`✅ Berhasil mengunduh versi Standar!`);
  }
  confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
}

async function copyToClipboard() {
  const item = getActiveItem();
  if (!item) return;

  try {
    const canvas = els.renderExportCanvas;
    canvas.width = item.width;
    canvas.height = item.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, item.width, item.height);

    if (item.bgMode !== 'transparent') {
      if (item.bgMode === 'color') {
        ctx.fillStyle = item.bgColor;
        ctx.fillRect(0, 0, item.width, item.height);
      } else if (item.bgMode === 'gradient') {
        const grad = ctx.createLinearGradient(0, 0, item.width, item.height);
        grad.addColorStop(0, '#fef3c7');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, item.width, item.height);
      } else if (item.bgMode === 'blur') {
        ctx.save();
        ctx.filter = `blur(${item.blurAmount}px)`;
        ctx.drawImage(item.originalCanvas, -20, -20, item.width + 40, item.height + 40);
        ctx.restore();
      } else if (item.bgMode === 'custom-img' && item.customBgUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise(r => { bgImg.onload = r; bgImg.src = item.customBgUrl; });
        ctx.drawImage(bgImg, 0, 0, item.width, item.height);
      }
    }

    ctx.save();
    let filterParts = [];
    if (item.shadowOn) {
      filterParts.push(`drop-shadow(0px ${item.shadowOffset}px ${item.shadowBlur}px rgba(0, 0, 0, 0.45))`);
    }
    if (item.outlineOn) {
      filterParts.push(`drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 4px #ffffff)`);
    }
    if (item.brightness !== 100) filterParts.push(`brightness(${item.brightness}%)`);
    if (item.contrast !== 100) filterParts.push(`contrast(${item.contrast}%)`);
    if (filterParts.length > 0) ctx.filter = filterParts.join(' ');

    ctx.drawImage(item.workingCanvas, 0, 0);
    ctx.restore();

    const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (!pngBlob) throw new Error('Blob creation failed');

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob })
    ]);
    showToast('📋 Gambar berhasil disalin! Siap ditempel (Ctrl+V).');
  } catch (err) {
    console.error('Clipboard copy error:', err);
    showToast('Gagal menyalin otomatis ke Clipboard.');
  }
}

/* ==========================================================================
   Monetization & Paywall (SumoPod QRIS)
   ========================================================================== */
let currentPendingPayment = null;

function isHdUnlocked(item) {
  // 1 kali bayar untuk 1 kali unduh HD
  return Boolean(item && item.hdUnlockedOneTime);
}

function openPaywallModal() {
  if (!els.modalPaywallHd) return;
  els.paywallStepChoose.classList.remove('hidden');
  els.paywallStepWaiting.classList.add('hidden');
  els.modalPaywallHd.classList.remove('hidden');

  if (els.btnPayQrisAction) els.btnPayQrisAction.disabled = false;
  if (els.btnPayQrisText) els.btnPayQrisText.textContent = '⚡ Bayar via QRIS Instan (Rp 2.000)';
}

function closePaywallModal() {
  if (els.modalPaywallHd) els.modalPaywallHd.classList.add('hidden');
}

async function initiateQrisPayment() {
  const amount = 2000; // 1x Unduh HD selalu Rp 2.000

  if (els.btnPayQrisAction) els.btnPayQrisAction.disabled = true;
  if (els.btnPayQrisText) els.btnPayQrisText.textContent = '⏳ Menyiapkan QRIS SumoPod...';

  try {
    const orderId = `PUDDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const returnUrl = window.location.origin + window.location.pathname + '?paid=true';

    const res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        order_id: orderId,
        return_url: returnUrl
      })
    });

    const data = await res.json();
    if (!res.ok || !data.payment_link_url) {
      throw new Error(data.error || 'Gagal membuat tagihan QRIS');
    }

    currentPendingPayment = {
      amount: amount,
      paymentUrl: data.payment_link_url
    };

    // Open QRIS Checkout in new tab
    window.open(data.payment_link_url, '_blank');

    // Switch modal to step 2 (Waiting/Confirm)
    els.paywallStepChoose.classList.add('hidden');
    els.paywallStepWaiting.classList.remove('hidden');
    els.waitingAmountVal.textContent = 'Rp 2.000';
    els.linkReopenQris.href = data.payment_link_url;

    showToast('📱 Halaman QRIS dibuka! Silakan scan barcode.');
  } catch (err) {
    console.error('Payment error:', err);
    showToast(`⚠️ ${err.message || 'Gagal menghubungi server QRIS SumoPod'}`);
  } finally {
    if (els.btnPayQrisAction) els.btnPayQrisAction.disabled = false;
    if (els.btnPayQrisText) els.btnPayQrisText.textContent = '⚡ Bayar via QRIS Instan (Rp 2.000)';
  }
}

function handlePaymentSuccess() {
  const item = getActiveItem();
  if (item) item.hdUnlockedOneTime = true;
  showToast('🎉 Pembayaran QRIS Berhasil! Unduh 1x kualitas HD dibuka.');

  closePaywallModal();
  confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
  triggerDownload('hd');
}

function checkUrlPaymentCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paid') === 'true') {
    handlePaymentSuccess();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

/* ==========================================================================
   Setup All Event Listeners
   ========================================================================== */
function setupEventListeners() {
  // 1. Upload Screen Dropzone
  els.btnBrowseFile.addEventListener('click', () => els.mainFileInput.click());
  els.mainFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  });

  els.dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.dropArea.classList.add('dragover');
  });

  els.dropArea.addEventListener('dragleave', () => {
    els.dropArea.classList.remove('dragover');
  });

  els.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    els.dropArea.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  });

  // Paste (Ctrl+V) handler anywhere on page
  window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          processFiles([file]);
          showToast('Foto dari clipboard berhasil dibuka!');
          break;
        }
      }
    }
  });

  // Sample Images Buttons
  els.samplePills.forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      if (src) processFiles([src]);
    });
  });

  // 2. Navigation
  els.brandLogoBtn.addEventListener('click', () => showScreen('upload'));
  els.navBtnUpload.addEventListener('click', () => {
    if (appState.items.length > 0) {
      showScreen('studio');
      openToolPanel('panel-cutout');
      setCutoutMode('color-wand');
    } else {
      showScreen('upload');
    }
  });
  els.navBtnBatch.addEventListener('click', () => {
    els.mainFileInput.click();
  });

  // Theme toggle
  els.btnThemeToggle.addEventListener('click', () => {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
  });

  // 3. Action Bar Tabs
  els.actionTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('data-panel');
      toggleToolPanel(panelId);
    });
  });

  els.btnCloseSideCard.addEventListener('click', () => {
    toggleToolPanel(appState.activePanel);
  });

  // Compare & Undo/Redo
  els.btnToggleCompare.addEventListener('click', toggleCompareSlider);
  els.btnUndo.addEventListener('click', undoAction);
  els.btnRedo.addEventListener('click', redoAction);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) redoAction();
      else undoAction();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      redoAction();
    }
  });

  // Cutout Mode Selector Buttons (Tembak Warna, Kuas Hapus, Pulihkan, Kotak Seleksi)
  els.toolSelectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      setCutoutMode(mode);
    });
  });

  // Color Wand Controls
  els.colorToleranceInput.addEventListener('input', (e) => {
    appState.colorTolerance = parseInt(e.target.value, 10);
    els.colorToleranceDisplay.textContent = `${appState.colorTolerance}%`;
  });

  els.checkContiguousColor.addEventListener('change', (e) => {
    appState.isContiguousColor = e.target.checked;
  });

  // Pulih Otomatis Controls
  if (els.restoreToleranceInput) {
    els.restoreToleranceInput.addEventListener('input', (e) => {
      appState.restoreTolerance = parseInt(e.target.value, 10);
      if (els.restoreToleranceDisplay) {
        els.restoreToleranceDisplay.textContent = `${appState.restoreTolerance}%`;
      }
    });
  }

  if (els.checkContiguousRestore) {
    els.checkContiguousRestore.addEventListener('change', (e) => {
      appState.isContiguousRestore = e.target.checked;
    });
  }

  if (els.restoreTargetSegmentBtns) {
    els.restoreTargetSegmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        els.restoreTargetSegmentBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        appState.restoreFillType = btn.getAttribute('data-target') || 'color';
      });
    });
  }

  // Brush Controls
  els.brushSizeInput.addEventListener('input', (e) => {
    appState.brushSize = parseInt(e.target.value, 10);
    els.brushSizeDisplay.textContent = `${appState.brushSize}px`;
    updateBrushCursorIndicator();
  });

  // Reset Cutout Button
  els.btnResetCutout.addEventListener('click', resetCutoutToOriginal);

  // 6. Background Selector Panel
  els.bgTabPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const item = getActiveItem();
      if (!item) return;
      item.bgMode = pill.getAttribute('data-bg-mode');
      syncBackgroundUI(item);
      applyStudioVisuals(item);
    });
  });

  els.swatchesColor.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getActiveItem();
      if (!item) return;
      item.bgColor = btn.getAttribute('data-color');
      els.swatchesColor.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  els.swatchesGradient.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getActiveItem();
      if (!item) return;
      item.bgGrad = btn.getAttribute('data-gradient');
      els.swatchesGradient.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyStudioVisuals(item);
    });
  });

  els.bgBlurSlider.addEventListener('input', (e) => {
    const item = getActiveItem();
    if (!item) return;
    item.blurAmount = parseInt(e.target.value, 10);
    els.bgBlurVal.textContent = `${item.blurAmount}px`;
    applyStudioVisuals(item);
  });

  els.btnPickCustomBg.addEventListener('click', () => els.customBgInput.click());
  els.customBgInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const item = getActiveItem();
      if (!item) return;
      if (item.customBgUrl) URL.revokeObjectURL(item.customBgUrl);
      item.customBgUrl = URL.createObjectURL(e.target.files[0]);
      item.bgMode = 'custom-img';
      syncBackgroundUI(item);
      applyStudioVisuals(item);
      e.target.value = '';
    }
  });

  // 7. Effects Panel
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

  // 8. Adjust Panel
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
  });

  // 9. Download Split Dropdown
  els.btnMainDownload.addEventListener('click', () => triggerDownload('hd'));
  els.btnDownloadOptionsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    els.downloadDropdownMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!els.downloadDropdownMenu.contains(e.target) && e.target !== els.btnDownloadOptionsToggle) {
      els.downloadDropdownMenu.classList.add('hidden');
    }
  });

  els.menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      els.downloadDropdownMenu.classList.add('hidden');
      if (action === 'dl-hd') triggerDownload('hd');
      else if (action === 'dl-standard') triggerDownload('standard');
      else if (action === 'copy') copyToClipboard();
    });
  });

  // 10. Multi-image gallery add (+)
  els.btnGalleryAdd.addEventListener('click', () => els.mainFileInput.click());

  // 11. Paywall & QRIS Event Listeners
  if (els.btnClosePaywall) {
    els.btnClosePaywall.addEventListener('click', closePaywallModal);
  }
  if (els.modalPaywallHd) {
    els.modalPaywallHd.addEventListener('click', (e) => {
      if (e.target === els.modalPaywallHd) closePaywallModal();
    });
  }

  // Pay button action (1x Unduh HD Rp 2.000)
  if (els.btnPayQrisAction) {
    els.btnPayQrisAction.addEventListener('click', initiateQrisPayment);
  }

  // Fallback to standard
  if (els.btnFallbackFreeStandard) {
    els.btnFallbackFreeStandard.addEventListener('click', () => {
      closePaywallModal();
      triggerDownload('standard');
    });
  }

  // Waiting step buttons
  if (els.btnConfirmPaid) {
    els.btnConfirmPaid.addEventListener('click', () => {
      handlePaymentSuccess();
    });
  }

  if (els.btnCancelPay) {
    els.btnCancelPay.addEventListener('click', () => {
      els.paywallStepWaiting.classList.add('hidden');
      els.paywallStepChoose.classList.remove('hidden');
    });
  }

  checkUrlPaymentCallback();

  // 12. Checkerboard Theme & Despeckle Listeners
  if (els.btnToggleChecker) {
    els.btnToggleChecker.addEventListener('click', () => {
      const nextTheme = appState.checkerboardTheme === 'light' ? 'dark' : 'light';
      setCheckerboardTheme(nextTheme);
    });
  }

  if (els.btnCheckerSegmentLight) {
    els.btnCheckerSegmentLight.addEventListener('click', () => setCheckerboardTheme('light'));
  }
  if (els.btnCheckerSegmentDark) {
    els.btnCheckerSegmentDark.addEventListener('click', () => setCheckerboardTheme('dark'));
  }

  if (els.btnHealAndCleanFloating) {
    els.btnHealAndCleanFloating.addEventListener('click', tidyImageComplete);
  }
  if (els.btnHealAndCleanPanel) {
    els.btnHealAndCleanPanel.addEventListener('click', tidyImageComplete);
  }

  if (els.checkProtectHoles) {
    els.checkProtectHoles.addEventListener('change', (e) => {
      appState.protectHoles = e.target.checked;
    });
  }

  if (els.checkAutoDespeckle) {
    els.checkAutoDespeckle.addEventListener('change', (e) => {
      appState.autoDespeckle = e.target.checked;
    });
  }

  // Initialize Checkerboard theme
  setCheckerboardTheme(appState.checkerboardTheme);

  // Setup interactive handlers
  setupCanvasInteractions();
  setupCompareSliderEvents();
}

// Start application
setupEventListeners();
