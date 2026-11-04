// ============================================
// WEDDING ALBUM - ADMIN MODULE
// ============================================

class AdminPanel {
  constructor() {
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    this.weddingId = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_WEDDING_ID);
    this.pendingMedia = [];
    this.approvedMedia = [];
    
    if (!this.token || !this.weddingId) {
      window.location.href = 'login.html';
      return;
    }
    
    this.init();
  }
  
  async init() {
    this.bindEvents();
    await this.loadStats();
    await this.loadPendingMedia();
    await this.loadSettings();
  }
  
  bindEvents() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        adminLogout();
      });
    }
    
    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }
    
    // Tab navigation
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Refresh buttons
    const refreshPending = document.getElementById('refreshPending');
    if (refreshPending) {
      refreshPending.addEventListener('click', () => this.loadPendingMedia());
    }
    
    const refreshAlbum = document.getElementById('refreshAlbum');
    if (refreshAlbum) {
      refreshAlbum.addEventListener('click', () => this.loadApprovedMedia());
    }
  }
  
  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Show/hide panels
    document.querySelectorAll('.admin-panel').forEach(panel => {
      panel.style.display = panel.id === `panel-${tabName}` ? 'block' : 'none';
    });
    
    // Load data sesuai tab
    switch (tabName) {
      case 'pending':
        this.loadPendingMedia();
        break;
      case 'album':
        this.loadApprovedMedia();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }
  
  async loadStats() {
    try {
      const result = await api.getStats(this.weddingId, this.token);
      
      if (result.success && result.stats) {
        const stats = result.stats;
        
        this.updateStatElement('statPhotos', stats.total_photos);
        this.updateStatElement('statVideos', stats.total_videos);
        this.updateStatElement('statVoices', stats.total_voices);
        this.updateStatElement('statPending', stats.total_pending);
        this.updateStatElement('statGuests', stats.unique_guest_count);
      }
    } catch (error) {
      console.error('Gagal load stats:', error);
    }
  }
  
  updateStatElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value || 0;
    }
  }
  
  async loadPendingMedia() {
    const container = document.getElementById('pendingContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Memuat...</div>';
    
    try {
      const result = await api.getPendingMedia(this.weddingId, this.token);
      
      if (result.success && result.data) {
        this.pendingMedia = result.data.media || [];
        this.renderPendingMedia(container);
      } else {
        container.innerHTML = `
          <div class="empty-state">
            <p>✅ Tidak ada media yang perlu direview</p>
          </div>`;
      }
    } catch (error) {
      container.innerHTML = '<p class="error">Gagal memuat data</p>';
    }
  }
  
  renderPendingMedia(container) {
    if (this.pendingMedia.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>✅ Semua media sudah direview</p>
        </div>`;
      return;
    }
    
    container.innerHTML = '';
    
    this.pendingMedia.forEach(media => {
      const card = this.createPendingCard(media);
      container.appendChild(card);
    });
  }
  
  createPendingCard(media) {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.id = `pending-${media.media_id}`;
    
    let previewContent = '';
    
    switch (media.media_type) {
      case 'photo':
        previewContent = `<img src="${media.thumbnail_url || media.file_url}" 
                               alt="Foto" class="pending-preview">`;
        break;
      case 'video':
        previewContent = `
          <video controls class="pending-preview">
            <source src="${media.file_url}" type="video/webm">
          </video>`;
        break;
      case 'voice':
        previewContent = `
          <audio controls class="pending-audio">
            <source src="${media.file_url}" type="audio/webm">
          </audio>`;
        break;
    }
    
    card.innerHTML = `
      <div class="pending-preview-container">
        ${previewContent}
      </div>
      <div class="pending-info">
        <div class="pending-guest">👤 ${this.escapeHtml(media.guest_name)}</div>
        <div class="pending-type">📁 ${media.media_type.toUpperCase()}</div>
        <div class="pending-date">📅 ${media.date} • ${media.time}</div>
        ${media.caption ? `<div class="pending-caption">💬 ${this.escapeHtml(media.caption)}</div>` : ''}
      </div>
      <div class="pending-actions">
        <button class="btn btn-success btn-sm" onclick="adminPanel.approveMedia('${media.media_id}')">
          ✅ Setujui
        </button>
        <button class="btn btn-danger btn-sm" onclick="adminPanel.rejectMedia('${media.media_id}')">
          ❌ Tolak
        </button>
      </div>
    `;
    
    return card;
  }
  
  async approveMedia(mediaId) {
    if (!confirm('Setujui media ini?')) return;
    
    try {
      const result = await api.approveMedia(this.weddingId, this.token, mediaId);
      
      if (result.success) {
        // Hapus card dari tampilan
        const card = document.getElementById(`pending-${mediaId}`);
        if (card) {
          card.classList.add('fade-out');
          setTimeout(() => card.remove(), 300);
        }
        
        // Refresh stats
        this.loadStats();
        
        this.showToast('Media berhasil disetujui', 'success');
      } else {
        this.showToast(result.error || 'Gagal menyetujui', 'error');
      }
    } catch (error) {
      this.showToast('Gagal memproses', 'error');
    }
  }
  
  async rejectMedia(mediaId) {
    if (!confirm('Tolak dan hapus media ini?')) return;
    
    try {
      const result = await api.rejectMedia(this.weddingId, this.token, mediaId);
      
      if (result.success) {
        const card = document.getElementById(`pending-${mediaId}`);
        if (card) {
          card.classList.add('fade-out');
          setTimeout(() => card.remove(), 300);
        }
        
        this.loadStats();
        this.showToast('Media ditolak dan dihapus', 'success');
      } else {
        this.showToast(result.error || 'Gagal menolak', 'error');
      }
    } catch (error) {
      this.showToast('Gagal memproses', 'error');
    }
  }
  
  async deleteMedia(mediaId) {
    if (!confirm('Hapus permanen media ini?')) return;
    
    try {
      const result = await api.deleteMedia(this.weddingId, this.token, mediaId);
      
      if (result.success) {
        this.loadApprovedMedia();
        this.loadStats();
        this.showToast('Media dihapus', 'success');
      }
    } catch (error) {
      this.showToast('Gagal menghapus', 'error');
    }
  }
  
  async loadApprovedMedia() {
    const container = document.getElementById('albumManageContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Memuat...</div>';
    
    try {
      const result = await api.getAlbum(this.weddingId, 1, 100, 'all');
      
      if (result.success && result.data) {
        this.approvedMedia = result.data.media || [];
        this.renderApprovedMedia(container);
      }
    } catch (error) {
      container.innerHTML = '<p class="error">Gagal memuat</p>';
    }
  }
  
  renderApprovedMedia(container) {
    if (this.approvedMedia.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Album kosong</p></div>';
      return;
    }
    
    container.innerHTML = '<div class="media-grid-manage"></div>';
    const grid = container.querySelector('.media-grid-manage');
    
    this.approvedMedia.forEach(media => {
      const item = document.createElement('div');
      item.className = 'manage-media-item';
      
      let thumbnail = '';
      if (media.media_type === 'photo') {
        thumbnail = `<img src="${media.thumbnail_url || media.file_url}" alt="Foto">`;
      } else if (media.media_type === 'video') {
        thumbnail = `<div class="video-thumb">▶ Video</div>`;
      } else {
        thumbnail = `<div class="voice-thumb">🎙️ Voice</div>`;
      }
      
      item.innerHTML = `
        ${thumbnail}
        <div class="manage-media-info">
          <small>${this.escapeHtml(media.guest_name)}</small>
          <small>${media.date}</small>
          <button class="btn btn-danger btn-xs" onclick="adminPanel.deleteMedia('${media.media_id}')">🗑️</button>
        </div>
      `;
      
      grid.appendChild(item);
    });
  }
  
  async loadSettings() {
    try {
      const result = await api.getSettings(this.weddingId);
      
      if (result.success && result.settings) {
        const s = result.settings;
        
        // Isi form settings
        this.setFormValue('settingGroomName', s.groom_name);
        this.setFormValue('settingBrideName', s.bride_name);
        this.setFormValue('settingDate', s.date);
        this.setFormValue('settingMaxPhoto', s.max_photo);
        this.setFormValue('settingMaxVideo', s.max_video_seconds);
        this.setFormValue('settingMaxVoice', s.max_voice_seconds);
        this.setFormValue('settingTheme', s.theme);
        this.setFormValue('settingPrimaryColor', s.primary_color);
        this.setFormValue('settingSecondaryColor', s.secondary_color);
        this.setFormCheckbox('settingAllowVideo', s.allow_video);
        this.setFormCheckbox('settingAllowVoice', s.allow_voice);
        this.setFormCheckbox('settingModeration', s.moderation);
      }
    } catch (error) {
      console.error('Gagal load settings:', error);
    }
  }
  
  setFormValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || '';
    }
  }
  
  setFormCheckbox(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.checked = (value === 'TRUE' || value === true);
    }
  }
  
  async saveSettings() {
    const settings = {
      groom_name: document.getElementById('settingGroomName')?.value,
      bride_name: document.getElementById('settingBrideName')?.value,
      date: document.getElementById('settingDate')?.value,
      max_photo: document.getElementById('settingMaxPhoto')?.value,
      max_video_seconds: document.getElementById('settingMaxVideo')?.value,
      max_voice_seconds: document.getElementById('settingMaxVoice')?.value,
      theme: document.getElementById('settingTheme')?.value,
      primary_color: document.getElementById('settingPrimaryColor')?.value,
      secondary_color: document.getElementById('settingSecondaryColor')?.value,
      allow_video: document.getElementById('settingAllowVideo')?.checked ? 'TRUE' : 'FALSE',
      allow_voice: document.getElementById('settingAllowVoice')?.checked ? 'TRUE' : 'FALSE',
      moderation: document.getElementById('settingModeration')?.checked ? 'TRUE' : 'FALSE',
    };
    
    // Update password jika diisi
    const newPassword = document.getElementById('settingNewPassword')?.value;
    if (newPassword) {
      settings.new_password = newPassword;
    }
    
    try {
      const result = await api.updateSettings(this.weddingId, this.token, settings);
      
      if (result.success) {
        this.showToast('✅ Setting berhasil disimpan', 'success');
        // Clear password field
        const passField = document.getElementById('settingNewPassword');
        if (passField) passField.value = '';
      } else {
        this.showToast('❌ ' + (result.error || 'Gagal menyimpan'), 'error');
      }
    } catch (error) {
      this.showToast('❌ Gagal menyimpan', 'error');
    }
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}