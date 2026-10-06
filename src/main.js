import './style.css';
import { removeBackground } from '@imgly/background-removal';
import confetti from 'canvas-confetti';

/* ==========================================================================
   State Management
   ========================================================================== */
const state = {
  originalFile: null,
  originalUrl: null,
  resultBlob: null,
  resultUrl: null,
  imgWidth: 0,
  imgHeight: 0,
  
  viewMode: 'split', // 'split' | 'side' | 'result'
  splitPercent: 50,
  isDraggingSlider: false,
  
  bgType: 'transparent', // 'transparent' | 'solid' | 'gradient' | 'image'
  solidColor: '#ffffff',
  gradientVal: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  customBgUrl: null,
  
  shadowEnabled: false,
  shadowBlur: 20,
  shadowOffsetY: 15,
  shadowOpacity: 0.35,
  outlineEnabled: false,
  
  activeTab: 'tab-bg',
  brushMode: 'erase', // 'erase' | 'restore'
  brushSize: 25,
  isPainting: false,
  touchupHistory: [],
  maxHistory: 10,
  
  isPeeking: false,
};

/* ==========================================================================
   DOM Element Selectors
   ========================================================================== */
const els = {
  // Views
  viewUpload: document.getElementById('view-upload'),
  viewProcessing: document.getElementById('view-processing'),
  viewStudio: document.getElementById('view-studio'),
  
  // Upload elements
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  btnSelectFile: document.getElementById('btn-select-file'),
  sampleBtns: document.querySelectorAll('.sample-card'),
  btnHeaderNew: document.getElementById('btn-header-new'),
  
  // Processing elements
  processingPreviewImg: document.getElementById('processing-preview-img'),
  processingTitle: document.getElementById('processing-status-title'),
  processingSub: document.getElementById('processing-status-sub'),
  progressFill: document.getElementById('processing-progress-fill'),
  progressPhaseLabel: document.getElementById('progress-phase-label'),
  progressPercentLabel: document.getElementById('progress-percentage-label'),
  
  // Studio stage elements
  comparisonSlider: document.getElementById('comparison-slider-element'),
  sliderBackdrop: document.getElementById('slider-custom-backdrop'),
  sliderCheckerboard: document.getElementById('slider-checkerboard'),
  cutoutImg: document.getElementById('cutout-img'),
  originalImg: document.getElementById('original-img'),
  originalClip: document.getElementById('original-clip-wrapper'),
  sliderDivider: document.getElementById('slider-divider-line'),
  sliderThumb: document.getElementById('slider-thumb-handle'),
  
  // Side by Side
  sideWrapper: document.getElementById('side-by-side-wrapper'),
  sideOriginalImg: document.getElementById('side-original-img'),
  sideResultImg: document.getElementById('side-result-img'),
  sideCustomBg: document.getElementById('side-custom-bg'),
  
  // View mode buttons
  modeSplitBtn: document.getElementById('mode-split-btn'),
  modeSideBtn: document.getElementById('mode-side-btn'),
  modeResultBtn: document.getElementById('mode-result-btn'),
  btnPeekOriginal: document.getElementById('btn-peek-original'),
  btnFitScreen: document.getElementById('btn-fit-screen'),
  
  // Canvas metadata
  imgDimLabel: document.getElementById('img-dim-label'),
  executionTimeLabel: document.getElementById('execution-time-label'),
  
  // Sidebar tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  
  // Background controls
  bgTypeChips: document.querySelectorAll('[data-bg-type]'),
  bgPanelTransparent: document.getElementById('bg-panel-transparent'),
  bgPanelSolid: document.getElementById('bg-panel-solid'),
  bgPanelGradient: document.getElementById('bg-panel-gradient'),
  bgPanelImage: document.getElementById('bg-panel-image'),
  colorSwatches: document.querySelectorAll('.color-swatch'),
  customColorPicker: document.getElementById('custom-solid-color-picker'),
  gradientSwatches: document.querySelectorAll('.gradient-swatch'),
  customBgFileInput: document.getElementById('custom-bg-file-input'),
  btnUploadCustomBg: document.getElementById('btn-upload-custom-bg'),
  
  // Shadow controls
  shadowToggle: document.getElementById('shadow-toggle'),
  shadowControlsBody: document.getElementById('shadow-controls-body'),
  shadowBlurSlider: document.getElementById('shadow-blur'),
  shadowBlurVal: document.getElementById('shadow-blur-val'),
  shadowOffsetYSlider: document.getElementById('shadow-offsety'),
  shadowOffsetYVal: document.getElementById('shadow-offsety-val'),
  shadowOpacitySlider: document.getElementById('shadow-opacity'),
  shadowOpacityVal: document.getElementById('shadow-opacity-val'),
  outlineToggle: document.getElementById('outline-toggle'),
  
  // Touchup / Brush
  touchupCanvas: document.getElementById('touchup-canvas'),
  btnBrushErase: document.getElementById('btn-brush-erase'),
  btnBrushRestore: document.getElementById('btn-brush-restore'),
  brushSizeSlider: document.getElementById('brush-size'),
  brushSizeVal: document.getElementById('brush-size-val'),
  btnBrushUndo: document.getElementById('btn-brush-undo'),
  btnBrushReset: document.getElementById('btn-brush-reset'),
  
  // Export buttons
  exportFormatSelect: document.getElementById('export-format-select'),
  btnDownloadResult: document.getElementById('btn-download-result'),
  btnCopyClipboard: document.getElementById('btn-copy-clipboard'),
  btnResetWorkspace: document.getElementById('btn-reset-workspace'),
  exportCanvas: document.getElementById('export-canvas'),
  
  // Toasts
  toastContainer: document.getElementById('toast-container'),
};

/* ==========================================================================
   Navigation & View Switching
   ========================================================================== */
function switchView(viewName) {
  els.viewUpload.classList.remove('active');
  els.viewProcessing.classList.remove('active');
  els.viewStudio.classList.remove('active');

  if (viewName === 'upload') {
    els.viewUpload.classList.add('active');
    els.btnHeaderNew.classList.add('hidden');
  } else if (viewName === 'processing') {
    els.viewProcessing.classList.add('active');
    els.btnHeaderNew.classList.remove('hidden');
  } else if (viewName === 'studio') {
    els.viewStudio.classList.add('active');
    els.btnHeaderNew.classList.remove('hidden');
  }
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconSvg = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.25s forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

/* ==========================================================================
   Core AI Inference Handler
   ========================================================================== */
async function processImage(imageSource, filenameHint = 'photo.png') {
  const startTime = performance.now();
  
  // Set preview in processing view
  if (typeof imageSource === 'string') {
    state.originalUrl = imageSource;
    els.processingPreviewImg.src = imageSource;
  } else if (imageSource instanceof Blob) {
    if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
    state.originalUrl = URL.createObjectURL(imageSource);
    els.processingPreviewImg.src = state.originalUrl;
  }
  
  switchView('processing');
  els.progressFill.style.width = '10%';
  els.progressPercentLabel.textContent = '10%';
  els.progressPhaseLabel.textContent = 'Menginisialisasi model AI...';

  try {
    const config = {
      progress: (key, current, total) => {
        let percent = 20;
        if (total && total > 0) {
          percent = Math.min(95, Math.round(20 + (current / total) * 75));
        }
        els.progressFill.style.width = `${percent}%`;
        els.progressPercentLabel.textContent = `${percent}%`;
        
        if (key.includes('fetch')) {
          els.progressPhaseLabel.textContent = 'Mengunduh model neural network (~40MB)...';
        } else if (key.includes('compute') || key.includes('inference')) {
          els.progressPhaseLabel.textContent = 'Menganalisis & memotong latar belakang...';
        } else {
          els.progressPhaseLabel.textContent = 'Memproses piksel gambar...';
        }
      },
      output: {
        format: 'image/png',
        quality: 0.95,
      }
    };

    const blob = await removeBackground(imageSource, config);
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    
    // Process successful result
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultBlob = blob;
    state.resultUrl = URL.createObjectURL(blob);
    
    // Load metadata and dimensions
    const probeImg = new Image();
    probeImg.onload = () => {
      state.imgWidth = probeImg.naturalWidth;
      state.imgHeight = probeImg.naturalHeight;
      els.imgDimLabel.textContent = `${state.imgWidth} × ${state.imgHeight} px`;
      els.executionTimeLabel.textContent = `${duration} dtk`;
      
      initStudioView();
      switchView('studio');
      
      // Trigger subtle celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#06b6d4', '#10b981']
      });
      showToast('Latar belakang berhasil dihapus dengan presisi tinggi!');
    };
    probeImg.src = state.originalUrl;
    
  } catch (err) {
    console.error('Error removing background:', err);
    switchView('upload');
    showToast('Gagal memproses gambar. Pastikan koneksi internet stabil untuk unduhan model awal.', 'error');
  }
}

/* ==========================================================================
   Studio Initialization & Split Slider
   ========================================================================== */
function initStudioView() {
  els.cutoutImg.src = state.resultUrl;
  els.originalImg.src = state.originalUrl;
  els.sideOriginalImg.src = state.originalUrl;
  els.sideResultImg.src = state.resultUrl;

  setSplitPosition(50);
  setViewMode('split');
  updateBackdrop();
  applyFilters();
  initTouchupCanvas();
}

function setSplitPosition(percent) {
  state.splitPercent = Math.max(0, Math.min(100, percent));
  els.originalClip.style.width = `${state.splitPercent}%`;
  els.sliderDivider.style.left = `${state.splitPercent}%`;
  
  // Keep original image at full width inside the clip container
  const containerWidth = els.comparisonSlider.clientWidth;
  if (containerWidth > 0) {
    els.originalImg.style.width = `${containerWidth}px`;
  }
}

function setViewMode(mode) {
  state.viewMode = mode;
  els.modeSplitBtn.classList.toggle('active', mode === 'split');
  els.modeSideBtn.classList.toggle('active', mode === 'side');
  els.modeResultBtn.classList.toggle('active', mode === 'result');

  if (mode === 'split') {
    els.comparisonSlider.classList.remove('hidden');
    els.sideWrapper.classList.add('hidden');
    els.originalClip.classList.remove('hidden');
    els.sliderDivider.classList.remove('hidden');
    setSplitPosition(50);
  } else if (mode === 'result') {
    els.comparisonSlider.classList.remove('hidden');
    els.sideWrapper.classList.add('hidden');
    els.originalClip.classList.add('hidden');
    els.sliderDivider.classList.add('hidden');
  } else if (mode === 'side') {
    els.comparisonSlider.classList.add('hidden');
    els.sideWrapper.classList.remove('hidden');
  }
}

/* Draggable Slider Handle */
function initSplitSliderEvents() {
  const slider = els.comparisonSlider;

  function updateDrag(clientX) {
    const rect = slider.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percent = (offsetX / rect.width) * 100;
    setSplitPosition(percent);
  }

  slider.addEventListener('mousedown', (e) => {
    state.isDraggingSlider = true;
    updateDrag(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.isDraggingSlider) return;
    updateDrag(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    state.isDraggingSlider = false;
  });

  // Touch Support
  slider.addEventListener('touchstart', (e) => {
    state.isDraggingSlider = true;
    if (e.touches.length > 0) updateDrag(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!state.isDraggingSlider) return;
    if (e.touches.length > 0) updateDrag(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    state.isDraggingSlider = false;
  });

  // Window resize to maintain clip alignment
  window.addEventListener('resize', () => {
    setSplitPosition(state.splitPercent);
  });
}

/* ==========================================================================
   Background Customization Engine
   ========================================================================== */
function updateBackdrop() {
  const backdrop = els.sliderBackdrop;
  const sideBg = els.sideCustomBg;
  const checkerboard = els.sliderCheckerboard;

  if (state.bgType === 'transparent') {
    backdrop.style.background = 'transparent';
    sideBg.style.background = 'transparent';
    checkerboard.style.opacity = '1';
  } else if (state.bgType === 'solid') {
    backdrop.style.background = state.solidColor;
    sideBg.style.background = state.solidColor;
    checkerboard.style.opacity = '0';
  } else if (state.bgType === 'gradient') {
    backdrop.style.background = state.gradientVal;
    sideBg.style.background = state.gradientVal;
    checkerboard.style.opacity = '0';
  } else if (state.bgType === 'image' && state.customBgUrl) {
    backdrop.style.background = `url(${state.customBgUrl}) center / cover no-repeat`;
    sideBg.style.background = `url(${state.customBgUrl}) center / cover no-repeat`;
    checkerboard.style.opacity = '0';
  }
}

/* ==========================================================================
   Shadow & Glow Filters
   ========================================================================== */
function applyFilters() {
  let filterStr = '';

  if (state.shadowEnabled) {
    filterStr += `drop-shadow(0px ${state.shadowOffsetY}px ${state.shadowBlur}px rgba(0, 0, 0, ${state.shadowOpacity})) `;
  }

  if (state.outlineEnabled) {
    filterStr += `drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 6px #ffffff) `;
  }

  els.cutoutImg.style.filter = filterStr.trim();
  els.sideResultImg.style.filter = filterStr.trim();
}

/* ==========================================================================
   Touch-Up / Manual Brush Tool
   ========================================================================== */
function initTouchupCanvas() {
  const canvas = els.touchupCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  const img = els.cutoutImg;
  if (!img.complete || img.naturalWidth === 0) {
    img.onload = () => initTouchupCanvas();
    return;
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  saveHistorySnapshot();
}

function saveHistorySnapshot() {
  const canvas = els.touchupCanvas;
  const ctx = canvas.getContext('2d');
  const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  state.touchupHistory.push(snapshot);
  if (state.touchupHistory.length > state.maxHistory) {
    state.touchupHistory.shift();
  }
}

function setupTouchupEvents() {
  const canvas = els.touchupCanvas;
  const ctx = canvas.getContext('2d');

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startPainting(e) {
    if (state.activeTab !== 'tab-touchup') return;
    state.isPainting = true;
    paint(e);
  }

  function paint(e) {
    if (!state.isPainting || state.activeTab !== 'tab-touchup') return;
    const { x, y } = getCanvasCoords(e);

    ctx.save();
    if (state.brushMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, state.brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.brushMode === 'restore') {
      // Paint from original image
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, state.brushSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(els.originalImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    ctx.restore();
  }

  function stopPainting() {
    if (!state.isPainting) return;
    state.isPainting = false;
    saveHistorySnapshot();
    
    // Sync canvas to cutoutImg
    canvas.toBlob((blob) => {
      if (blob) {
        if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
        state.resultBlob = blob;
        state.resultUrl = URL.createObjectURL(blob);
        els.cutoutImg.src = state.resultUrl;
        els.sideResultImg.src = state.resultUrl;
      }
    }, 'image/png');
  }

  canvas.addEventListener('mousedown', startPainting);
  canvas.addEventListener('mousemove', paint);
  window.addEventListener('mouseup', stopPainting);

  // Undo button
  els.btnBrushUndo.addEventListener('click', () => {
    if (state.touchupHistory.length > 1) {
      state.touchupHistory.pop(); // Remove current
      const prev = state.touchupHistory[state.touchupHistory.length - 1];
      ctx.putImageData(prev, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          state.resultBlob = blob;
          state.resultUrl = URL.createObjectURL(blob);
          els.cutoutImg.src = state.resultUrl;
          els.sideResultImg.src = state.resultUrl;
          showToast('Perubahan dibatalkan (Undo)');
        }
      }, 'image/png');
    } else {
      showToast('Tidak ada goresan sebelumnya', 'error');
    }
  });

  // Reset to initial AI result
  els.btnBrushReset.addEventListener('click', () => {
    initTouchupCanvas();
    showToast('Kuas direset kembali ke hasil AI awal');
  });
}

/* ==========================================================================
   Export & Download Engine
   ========================================================================== */
async function generateFinalImage(format = 'png') {
  const canvas = els.exportCanvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = state.imgWidth;
  canvas.height = state.imgHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw Background
  if (state.bgType === 'solid') {
    ctx.fillStyle = state.solidColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (state.bgType === 'gradient') {
    // Parse gradient or draw temporary representation
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (state.gradientVal.includes('#667eea')) {
      grad.addColorStop(0, '#667eea');
      grad.addColorStop(1, '#764ba2');
    } else if (state.gradientVal.includes('#ff9a9e')) {
      grad.addColorStop(0, '#ff9a9e');
      grad.addColorStop(1, '#fecfef');
    } else if (state.gradientVal.includes('#0ba360')) {
      grad.addColorStop(0, '#0ba360');
      grad.addColorStop(1, '#3cba92');
    } else if (state.gradientVal.includes('#f093fb')) {
      grad.addColorStop(0, '#f093fb');
      grad.addColorStop(1, '#f5576c');
    } else if (state.gradientVal.includes('#2b5876')) {
      grad.addColorStop(0, '#2b5876');
      grad.addColorStop(1, '#4e4376');
    } else {
      grad.addColorStop(0, '#141e30');
      grad.addColorStop(1, '#243b55');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (state.bgType === 'image' && state.customBgUrl) {
    const bgImg = new Image();
    bgImg.src = state.customBgUrl;
    await new Promise((res) => { bgImg.onload = res; });
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  }

  // 2. Draw Shadow & Outline if enabled
  if (state.shadowEnabled || state.outlineEnabled) {
    ctx.save();
    if (state.shadowEnabled) {
      ctx.shadowColor = `rgba(0, 0, 0, ${state.shadowOpacity})`;
      ctx.shadowBlur = state.shadowBlur * 1.5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = state.shadowOffsetY * 1.5;
    }
    ctx.drawImage(els.cutoutImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 3. Draw Cutout Subject
  ctx.drawImage(els.cutoutImg, 0, 0, canvas.width, canvas.height);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, 0.95);
  });
}

async function handleDownload() {
  const format = els.exportFormatSelect.value;
  const blob = await generateFinalImage(format);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clearcut-ai-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 }
  });
  showToast(`Gambar berhasil diunduh sebagai ${format.toUpperCase()}!`);
}

async function handleCopyClipboard() {
  try {
    const blob = await generateFinalImage('png');
    if (!blob) return;

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('Gambar disalin ke clipboard! Siap dipaste ke Canva/WA/Photoshop.');
    } else {
      showToast('Clipboard API tidak didukung browser ini.', 'error');
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Gagal menyalin gambar ke clipboard.', 'error');
  }
}

/* ==========================================================================
   Event Listeners Setup
   ========================================================================== */
function setupEventListeners() {
  // File Input & Dropzone
  els.btnSelectFile.addEventListener('click', (e) => {
    e.stopPropagation();
    els.fileInput.click();
  });

  els.dropZone.addEventListener('click', () => {
    els.fileInput.click();
  });

  els.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0], e.target.files[0].name);
    }
  });

  // Drag and Drop
  ['dragenter', 'dragover'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      els.dropZone.classList.remove('dragover');
    });
  });

  els.dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImage(files[0], files[0].name);
    }
  });

  // Paste Event Listener (Ctrl + V from anywhere!)
  window.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        processImage(file, 'clipboard-image.png');
        showToast('Foto dari clipboard terdeteksi!');
        break;
      }
    }
  });

  // Sample Buttons
  els.sampleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sampleUrl = btn.getAttribute('data-sample');
      processImage(sampleUrl, 'sample.jpg');
    });
  });

  // Header and Reset Buttons
  els.btnHeaderNew.addEventListener('click', () => switchView('upload'));
  els.btnResetWorkspace.addEventListener('click', () => switchView('upload'));

  // View Mode Switchers
  els.modeSplitBtn.addEventListener('click', () => setViewMode('split'));
  els.modeSideBtn.addEventListener('click', () => setViewMode('side'));
  els.modeResultBtn.addEventListener('click', () => setViewMode('result'));

  // Peek Original Button (Hold to Peek)
  function startPeeking() {
    state.isPeeking = true;
    els.originalClip.style.width = '100%';
    els.sliderDivider.style.opacity = '0';
  }
  function stopPeeking() {
    if (!state.isPeeking) return;
    state.isPeeking = false;
    setSplitPosition(state.splitPercent);
    els.sliderDivider.style.opacity = '1';
  }

  els.btnPeekOriginal.addEventListener('mousedown', startPeeking);
  window.addEventListener('mouseup', stopPeeking);
  els.btnPeekOriginal.addEventListener('touchstart', startPeeking, { passive: true });
  window.addEventListener('touchend', stopPeeking);

  // Keyboard Shortcuts (Space to peek, Esc to reset)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      startPeeking();
    } else if (e.code === 'Escape') {
      if (els.viewStudio.classList.contains('active')) {
        switchView('upload');
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      stopPeeking();
    }
  });

  // Fit Screen Button
  els.btnFitScreen.addEventListener('click', () => {
    setSplitPosition(50);
    showToast('Tampilan kembali ke posisi default');
  });

  // Sidebar Tabs Navigation
  els.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      state.activeTab = tabId;

      els.tabBtns.forEach((b) => b.classList.remove('active'));
      els.tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      // Enable touchup canvas overlay only on touchup tab
      if (tabId === 'tab-touchup') {
        els.touchupCanvas.classList.remove('hidden');
      } else {
        els.touchupCanvas.classList.add('hidden');
      }
    });
  });

  // Background Type Chips
  els.bgTypeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      els.bgTypeChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const bgType = chip.getAttribute('data-bg-type');
      state.bgType = bgType;

      els.bgPanelTransparent.classList.add('hidden');
      els.bgPanelSolid.classList.add('hidden');
      els.bgPanelGradient.classList.add('hidden');
      els.bgPanelImage.classList.add('hidden');

      if (bgType === 'transparent') els.bgPanelTransparent.classList.remove('hidden');
      else if (bgType === 'solid') els.bgPanelSolid.classList.remove('hidden');
      else if (bgType === 'gradient') els.bgPanelGradient.classList.remove('hidden');
      else if (bgType === 'image') els.bgPanelImage.classList.remove('hidden');

      updateBackdrop();
    });
  });

  // Solid Color Swatches
  els.colorSwatches.forEach((swatch) => {
    if (swatch.classList.contains('custom-picker-swatch')) return;
    swatch.addEventListener('click', () => {
      els.colorSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      state.solidColor = swatch.getAttribute('data-color');
      updateBackdrop();
    });
  });

  els.customColorPicker.addEventListener('input', (e) => {
    state.solidColor = e.target.value;
    els.colorSwatches.forEach((s) => s.classList.remove('active'));
    updateBackdrop();
  });

  // Gradient Swatches
  els.gradientSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      els.gradientSwatches.forEach((s) => s.classList.remove('active'));
      swatch.classList.add('active');
      state.gradientVal = swatch.getAttribute('data-gradient');
      updateBackdrop();
    });
  });

  // Custom Background Upload
  els.btnUploadCustomBg.addEventListener('click', () => els.customBgFileInput.click());
  els.customBgFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      if (state.customBgUrl) URL.revokeObjectURL(state.customBgUrl);
      state.customBgUrl = URL.createObjectURL(e.target.files[0]);
      updateBackdrop();
      showToast('Latar belakang kustom berhasil diterapkan!');
    }
  });

  // Shadow Controls
  els.shadowToggle.addEventListener('change', (e) => {
    state.shadowEnabled = e.target.checked;
    els.shadowControlsBody.classList.toggle('disabled', !state.shadowEnabled);
    applyFilters();
  });

  els.shadowBlurSlider.addEventListener('input', (e) => {
    state.shadowBlur = e.target.value;
    els.shadowBlurVal.textContent = `${state.shadowBlur}px`;
    applyFilters();
  });

  els.shadowOffsetYSlider.addEventListener('input', (e) => {
    state.shadowOffsetY = e.target.value;
    els.shadowOffsetYVal.textContent = `${state.shadowOffsetY}px`;
    applyFilters();
  });

  els.shadowOpacitySlider.addEventListener('input', (e) => {
    state.shadowOpacity = (e.target.value / 100).toFixed(2);
    els.shadowOpacityVal.textContent = `${e.target.value}%`;
    applyFilters();
  });

  els.outlineToggle.addEventListener('change', (e) => {
    state.outlineEnabled = e.target.checked;
    applyFilters();
  });

  // Touchup Brush Mode
  els.btnBrushErase.addEventListener('click', () => {
    state.brushMode = 'erase';
    els.btnBrushErase.classList.add('active');
    els.btnBrushRestore.classList.remove('active');
  });

  els.btnBrushRestore.addEventListener('click', () => {
    state.brushMode = 'restore';
    els.btnBrushRestore.classList.add('active');
    els.btnBrushErase.classList.remove('active');
  });

  els.brushSizeSlider.addEventListener('input', (e) => {
    state.brushSize = parseInt(e.target.value, 10);
    els.brushSizeVal.textContent = `${state.brushSize}px`;
  });

  // Download & Copy
  els.btnDownloadResult.addEventListener('click', handleDownload);
  els.btnCopyClipboard.addEventListener('click', handleCopyClipboard);

  // Initialize Split Slider & Touchup Events
  initSplitSliderEvents();
  setupTouchupEvents();
}

/* ==========================================================================
   Application Bootstrap
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  switchView('upload');
});
