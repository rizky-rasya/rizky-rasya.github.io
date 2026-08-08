// ============================================
// WEDDING ALBUM - ALBUM VIEWER
// ============================================

class AlbumViewer {
  constructor() {
    this.weddingId = getWeddingId();
    this.currentPage = 1;
    this.totalPages = 1;
    this.currentType = 'all';
    this.isLoading = false;
    this.lightboxOpen = false;
    this.currentMediaIndex = 0;
    this.allMedia = [];
    
    this.albumContainer = document.getElementById('albumContainer');
    this.loadMoreBtn = document.getElementById('loadMoreBtn');
    this.filterTabs = document.querySelectorAll('.filter-tab');
    
    this.init();
  }
  
  async init() {
    await this.loadWeddingInfo();
    this.bindEvents();
    await this.loadAlbum();
  }
  
  async loadWeddingInfo() {
    try {
      const result = await api.getSettings(this.weddingId);
      
      if (result.success && result.settings) {
        const settings = result.settings;
        
        // Update header
        const headerTitle = document.getElementById('headerTitle');
        if (headerTitle) {
          headerTitle.textContent = `${settings.groom_name} & ${settings.bride_name}`;
        }
        
        const headerDate = document.getElementById('headerDate');
        if (headerDate) {
          headerDate.textContent = this.formatDate(settings.date);
        }
        
        // Update theme colors
        if (settings.primary_color) {
          document.documentElement.style.setProperty('--primary-color', settings.primary_color);
        }
        if (settings.secondary_color) {
          document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
        }
      }
    } catch (error) {
      console.error('Gagal load wedding info:', error);
    }
  }
  
  bindEvents() {
    // Filter tabs
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.type;
        this.switchFilter(type);
      });
    });
    
    // Load more button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.loadMore();
      });
    }
    
    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (this.isLoading || this.currentPage >= this.totalPages) return;
      
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= pageHeight - 500) {
        this.loadMore();
      }
    });
    
    // Keyboard navigation untuk lightbox
    document.addEventListener('keydown', (e) => {
      if (!this.lightboxOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          this.navigateLightbox(-1);
          break;
        case 'ArrowRight':
          this.navigateLightbox(1);
          break;
      }
    });
  }
  
  switchFilter(type) {
    this.currentType = type;
    this.currentPage = 1;
    this.allMedia = [];
    
    // Update active tab
    this.filterTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });
    
    // Clear & reload
    if (this.albumContainer) {
      this.albumContainer.innerHTML = '';
    }
    
    this.loadAlbum();
  }
  
  async loadAlbum() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.showLoading();
    
    try {
      const result = await api.getAlbum(
        this.weddingId, 
        this.currentPage, 
        20, 
        this.currentType
      );
      
      if (result.success && result.data) {
        const { media, pagination } = result.data;
        this.totalPages = pagination.total_pages;
        this.allMedia = [...this.allMedia, ...media];
        
        this.renderMedia(media);
        this.updateLoadMoreButton();
      } else {
        this.showEmpty();
      }
    } catch (error) {
      console.error('Gagal load album:', error);
      this.showError('Gagal memuat album');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }
  
  async loadMore() {
    if (this.isLoading || this.currentPage >= this.totalPages) return;
    
    this.currentPage++;
    await this.loadAlbum();
  }
  
  renderMedia(mediaItems) {
    if (!this.albumContainer) return;
    
    mediaItems.forEach((media, index) => {
      const card = this.createMediaCard(media, this.allMedia.length - mediaItems.length + index);
      this.albumContainer.appendChild(card);
    });
  }
  
  createMediaCard(media, index) {
    const card = document.createElement('div');
    card.className = 'media-card fade-in';
    card.onclick = () => this.openLightbox(index);
    
    const guestName = media.guest_name || 'Anonim';
    const date = media.date || '';
    const time = media.time || '';
    const caption = media.caption || '';
    
    let mediaContent = '';
    
    switch (media.media_type) {
      case 'photo':
        mediaContent = `
          <div class="media-thumbnail">
            <img src="${media.thumbnail_url || media.file_url}" 
                 alt="Foto dari ${guestName}"
                 loading="lazy"
                 onerror="this.src='assets/placeholder.jpg'">
          </div>`;
        break;
        
      case 'video':
        mediaContent = `
          <div class="media-thumbnail video-thumbnail">
            <img src="${media.thumbnail_url || 'assets/video-placeholder.jpg'}" 
                 alt="Video dari ${guestName}"
                 loading="lazy">
            <div class="play-icon">▶</div>
          </div>`;
        break;
        
      case 'voice':
        mediaContent = `
          <div class="media-thumbnail voice-thumbnail">
            <div class="voice-icon">🎙️</div>
            <div class="voice-wave">〰️〰️〰️</div>
          </div>`;
        break;
    }
    
    card.innerHTML = `
      ${mediaContent}
      <div class="media-info">
        <div class="media-guest">${this.escapeHtml(guestName)}</div>
        <div class="media-date">${date} • ${time}</div>
        ${caption ? `<div class="media-caption">${this.escapeHtml(caption)}</div>` : ''}
      </div>
    `;
    
    return card;
  }
  
  openLightbox(index) {
    this.currentMediaIndex = index;
    this.lightboxOpen = true;
    
    const media = this.allMedia[index];
    if (!media) return;
    
    // Buat lightbox
    let lightbox = document.getElementById('mediaLightbox');
    
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'mediaLightbox';
      lightbox.className = 'lightbox';
      document.body.appendChild(lightbox);
    }
    
    let lightboxContent = '';
    
    switch (media.media_type) {
      case 'photo':
        lightboxContent = `
          <div class="lightbox-content">
            <button class="lightbox-close" onclick="event.stopPropagation(); albumViewer.closeLightbox()">✕</button>
            <button class="lightbox-nav lightbox-prev" onclick="event.stopPropagation(); albumViewer.navigateLightbox(-1)">‹</button>
            <img src="${media.file_url}" alt="Foto" class="lightbox-image">
            <button class="lightbox-nav lightbox-next" onclick="event.stopPropagation(); albumViewer.navigateLightbox(1)">›</button>
            <div class="lightbox-info">
              <span class="lightbox-guest">${this.escapeHtml(media.guest_name)}</span>
              <span class="lightbox-date">${media.date} • ${media.time}</span>
              ${media.caption ? `<p class="lightbox-caption">${this.escapeHtml(media.caption)}</p>` : ''}
            </div>
            <div class="lightbox-counter">${index + 1} / ${this.allMedia.length}</div>
          </div>`;
        break;
        
      case 'video':
        lightboxContent = `
          <div class="lightbox-content">
            <button class="lightbox-close" onclick="event.stopPropagation(); albumViewer.closeLightbox()">✕</button>
            <video controls autoplay class="lightbox-video">
              <source src="${media.file_url}" type="video/webm">
              Browser Anda tidak mendukung video.
            </video>
            <div class="lightbox-info">
              <span class="lightbox-guest">${this.escapeHtml(media.guest_name)}</span>
              <span class="lightbox-date">${media.date} • ${media.time}</span>
            </div>
          </div>`;
        break;
        
      case 'voice':
        lightboxContent = `
          <div class="lightbox-content lightbox-voice">
            <button class="lightbox-close" onclick="event.stopPropagation(); albumViewer.closeLightbox()">✕</button>
            <div class="voice-player">
              <div class="voice-avatar">🎙️</div>
              <div class="voice-guest-name">${this.escapeHtml(media.guest_name)}</div>
              <audio controls autoplay class="lightbox-audio">
                <source src="${media.file_url}" type="audio/webm">
              </audio>
              <div class="lightbox-date">${media.date} • ${media.time}</div>
            </div>
          </div>`;
        break;
    }
    
    lightbox.innerHTML = lightboxContent;
    lightbox.style.display = 'flex';
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox() {
    this.lightboxOpen = false;
    const lightbox = document.getElementById('mediaLightbox');
    if (lightbox) {
      lightbox.style.display = 'none';
    }
    document.body.style.overflow = '';
  }
  
  navigateLightbox(direction) {
    const newIndex = this.currentMediaIndex + direction;
    
    if (newIndex < 0 || newIndex >= this.allMedia.length) return;
    
    this.currentMediaIndex = newIndex;
    this.openLightbox(newIndex);
  }
  
  updateLoadMoreButton() {
    if (this.loadMoreBtn) {
      if (this.currentPage >= this.totalPages) {
        this.loadMoreBtn.style.display = 'none';
      } else {
        this.loadMoreBtn.style.display = 'block';
      }
    }
  }
  
  showLoading() {
    const loader = document.getElementById('albumLoader');
    if (loader) loader.style.display = 'block';
  }
  
  hideLoading() {
    const loader = document.getElementById('albumLoader');
    if (loader) loader.style.display = 'none';
  }
  
  showEmpty() {
    if (this.albumContainer && this.allMedia.length === 0) {
      this.albumContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📸</div>
          <h3>Belum ada momen</h3>
          <p>Jadilah yang pertama membagikan momen di sini!</p>
          <a href="index.html" class="btn btn-primary">Bagikan Momen</a>
        </div>
      `;
    }
  }
  
  showError(message) {
    console.error(message);
  }
  
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    this.closeLightbox();
  }
}