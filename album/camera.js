// ============================================
// WEDDING ALBUM - CAMERA MODULE
// ============================================

class CameraModule {
  constructor() {
    this.stream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentMode = 'photo'; // 'photo', 'video', 'voice'
    this.isRecording = false;
    this.recordingTimer = null;
    this.recordingSeconds = 0;
    this.currentFilter = 'none';
    this.photos = [];
    this.maxPhotos = 5;
    this.maxVideoDuration = 60;
    this.maxVoiceDuration = 60;
    this.facingMode = 'environment'; // 'user' untuk selfie
    
    // DOM Elements
    this.videoElement = document.getElementById('cameraPreview');
    this.canvasElement = document.getElementById('photoCanvas');
    this.photoCountElement = document.getElementById('photoCount');
    this.recordingTimerElement = document.getElementById('recordingTimer');
    this.filterSelect = document.getElementById('filterSelect');
    
    this.init();
  }
  
  async init() {
    // Bind events
    this.bindEvents();
    
    // Load filter list
    await this.loadFilters();
    
    // Start camera
    await this.startCamera();
  }
  
  async loadFilters() {
    try {
      const weddingId = getWeddingId();
      const result = await api.getFilters(weddingId);
      
      if (result.success && result.filters && this.filterSelect) {
        this.filterSelect.innerHTML = '';
        result.filters.forEach(filter => {
          const option = document.createElement('option');
          option.value = filter.css_filter;
          option.textContent = filter.name;
          if (filter.css_filter === 'none') {
            option.selected = true;
          }
          this.filterSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.log('Gagal load filter, gunakan default');
    }
  }
  
  async loadSettings() {
    try {
      const weddingId = getWeddingId();
      const result = await api.getSettings(weddingId);
      
      if (result.success && result.settings) {
        this.maxPhotos = parseInt(result.settings.max_photo) || 5;
        this.maxVideoDuration = parseInt(result.settings.max_video_seconds) || 60;
        this.maxVoiceDuration = parseInt(result.settings.max_voice_seconds) || 60;
      }
    } catch (error) {
      console.log('Gagal load settings, gunakan default');
    }
  }
  
  bindEvents() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });
    
    // Capture button
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        if (this.currentMode === 'photo') {
          this.takePhoto();
        } else if (this.currentMode === 'video' || this.currentMode === 'voice') {
          this.toggleRecording();
        }
      });
    }
    
    // Switch camera
    const switchBtn = document.getElementById('switchCameraBtn');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        this.switchCamera();
      });
    }
    
    // Filter change
    if (this.filterSelect) {
      this.filterSelect.addEventListener('change', () => {
        this.currentFilter = this.filterSelect.value;
        this.applyFilter();
      });
    }
    
    // Done button
    const doneBtn = document.getElementById('doneBtn');
    if (doneBtn) {
      doneBtn.addEventListener('click', () => {
        this.finishCapture();
      });
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetPhotos();
      });
    }
  }
  
  async startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }
      
      console.log('Kamera siap');
    } catch (error) {
      console.error('Gagal akses kamera:', error);
      this.showError('Tidak dapat mengakses kamera. Mohon izinkan akses kamera.');
    }
  }
  
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
  
  switchCamera() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    this.stopCamera();
    this.startCamera();
  }
  
  switchMode(mode) {
    this.currentMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const captureBtn = document.getElementById('captureBtn');
    const videoContainer = document.getElementById('videoContainer');
    const voiceContainer = document.getElementById('voiceContainer');
    const photoControls = document.getElementById('photoControls');
    
    // Sembunyikan semua
    if (videoContainer) videoContainer.style.display = 'none';
    if (voiceContainer) voiceContainer.style.display = 'none';
    if (photoControls) photoControls.style.display = 'none';
    
    switch (mode) {
      case 'photo':
        if (captureBtn) captureBtn.innerHTML = '📷 Ambil Foto';
        if (videoContainer) videoContainer.style.display = 'block';
        if (photoControls) photoControls.style.display = 'block';
        break;
        
      case 'video':
        if (captureBtn) captureBtn.innerHTML = '🎥 Mulai Rekam';
        if (videoContainer) videoContainer.style.display = 'block';
        break;
        
      case 'voice':
        if (captureBtn) captureBtn.innerHTML = '🎙️ Mulai Rekam';
        if (voiceContainer) voiceContainer.style.display = 'block';
        break;
    }
  }
  
  takePhoto() {
    if (!this.videoElement || !this.canvasElement) return;
    
    // Set canvas size
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;
    
    // Draw video ke canvas
    const ctx = this.canvasElement.getContext('2d');
    ctx.save();
    
    // Mirror untuk selfie camera
    if (this.facingMode === 'user') {
      ctx.scale(-1, 1);
      ctx.drawImage(this.videoElement, -this.canvasElement.width, 0, 
                    this.canvasElement.width, this.canvasElement.height);
    } else {
      ctx.drawImage(this.videoElement, 0, 0, 
                    this.canvasElement.width, this.canvasElement.height);
    }
    
    // Apply filter
    if (this.currentFilter && this.currentFilter !== 'none') {
      ctx.filter = this.currentFilter;
      ctx.drawImage(this.canvasElement, 0, 0);
      ctx.filter = 'none';
    }
    
    ctx.restore();
    
    // Convert ke data URL
    const dataUrl = this.canvasElement.toDataURL('image/jpeg', CONFIG.UPLOAD.PHOTO_QUALITY);
    
    // Simpan foto
    this.photos.push(dataUrl);
    this.updatePhotoCount();
    
    // Flash effect
    this.flashEffect();
    
    // Auto finish jika sudah max
    if (this.photos.length >= this.maxPhotos) {
      setTimeout(() => this.finishCapture(), 500);
    }
  }
  
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  
  startRecording() {
    if (!this.stream) return;
    
    this.recordedChunks = [];
    this.recordingSeconds = 0;
    this.isRecording = true;
    
    // Setup MediaRecorder
    const options = {
      mimeType: 'video/webm;codecs=vp9,opus'
    };
    
    if (this.currentMode === 'voice') {
      // Audio only
      const audioStream = new MediaStream(this.stream.getAudioTracks());
      this.mediaRecorder = new MediaRecorder(audioStream, options);
    } else {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    }
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      const blob = new Blob(this.recordedChunks, { 
        type: this.currentMode === 'voice' ? 'audio/webm' : 'video/webm' 
      });
      
      // Convert ke base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        this.handleRecordingComplete(base64data, blob);
      };
      reader.readAsDataURL(blob);
    };
    
    this.mediaRecorder.start(1000); // Chunk setiap 1 detik
    
    // Update UI
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
      captureBtn.innerHTML = this.currentMode === 'video' ? '⏹️ Stop Rekam' : '⏹️ Stop';
      captureBtn.classList.add('recording');
    }
    
    // Start timer
    const maxDuration = this.currentMode === 'video' ? this.maxVideoDuration : this.maxVoiceDuration;
    this.startTimer(maxDuration);
  }
  
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.stopTimer();
      
      const captureBtn = document.getElementById('captureBtn');
      if (captureBtn) {
        captureBtn.innerHTML = this.currentMode === 'video' ? '🎥 Mulai Rekam' : '🎙️ Mulai Rekam';
        captureBtn.classList.remove('recording');
      }
    }
  }
  
  startTimer(maxSeconds) {
    this.recordingSeconds = 0;
    this.updateTimerDisplay();
    
    this.recordingTimer = setInterval(() => {
      this.recordingSeconds++;
      this.updateTimerDisplay();
      
      if (this.recordingSeconds >= maxSeconds) {
        this.stopRecording();
      }
    }, 1000);
  }
  
  stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }
  
  updateTimerDisplay() {
    if (this.recordingTimerElement) {
      const minutes = Math.floor(this.recordingSeconds / 60);
      const seconds = this.recordingSeconds % 60;
      this.recordingTimerElement.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }
  
  handleRecordingComplete(base64data, blob) {
    // Simpan hasil rekaman
    this.photos = [{
      type: this.currentMode,
      data: base64data,
      blob: blob,
      isRecording: true
    }];
    
    // Tampilkan preview
    this.finishCapture();
  }
  
  updatePhotoCount() {
    if (this.photoCountElement) {
      this.photoCountElement.textContent = `${this.photos.length}/${this.maxPhotos}`;
    }
  }
  
  resetPhotos() {
    this.photos = [];
    this.updatePhotoCount();
  }
  
  applyFilter() {
    // Filter diterapkan saat takePhoto()
  }
  
  flashEffect() {
    const flash = document.createElement('div');
    flash.className = 'camera-flash';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.remove();
    }, 300);
  }
  
  finishCapture() {
    if (this.photos.length === 0) {
      this.showError('Ambil foto atau rekam video terlebih dahulu');
      return;
    }
    
    // Stop camera
    this.stopCamera();
    this.stopTimer();
    
    // Simpan data ke sessionStorage untuk preview
    const captureData = {
      mode: this.currentMode,
      photos: this.photos,
      count: this.photos.length,
      filter: this.currentFilter,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('wedding_album_capture', JSON.stringify(captureData));
    
    // Redirect ke preview page
    window.location.href = 'preview.html';
  }
  
  showError(message) {
    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
  }
  
  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
  }
  
  destroy() {
    this.stopCamera();
    this.stopTimer();
  }
}