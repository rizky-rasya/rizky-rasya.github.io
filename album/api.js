// ============================================
// WEDDING ALBUM - API HANDLER
// ============================================

class WeddingAPI {
  constructor() {
    this.baseUrl = CONFIG.API_URL;
  }
  
  /**
   * Generic API call
   */
  async call(params, method = 'GET') {
    try {
      let url = this.baseUrl;
      let options = { method: method };
      
      if (method === 'GET') {
        // Build query string
        const queryString = Object.keys(params)
          .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');
        url += '?' + queryString;
      } else if (method === 'POST') {
        // Form data atau JSON
        if (params.file_data) {
          const formData = new FormData();
          Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
          });
          options.body = formData;
        } else {
          const formData = new URLSearchParams();
          Object.keys(params).forEach(key => {
            formData.append(key, params[key]);
          });
          options.body = formData;
          options.headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
          };
        }
      }
      
      const response = await fetch(url, options);
      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'Gagal terhubung ke server. Periksa koneksi internet Anda.' };
    }
  }
  
  /**
   * Ping API
   */
  async ping() {
    return await this.call({ action: 'ping' });
  }
  
  /**
   * Get wedding settings
   */
  async getSettings(weddingId) {
    return await this.call({ 
      action: 'getSettings', 
      wedding_id: weddingId 
    });
  }
  
  /**
   * Get photo filters
   */
  async getFilters(weddingId) {
    return await this.call({ 
      action: 'getFilters', 
      wedding_id: weddingId 
    });
  }
  
  /**
   * Get wedding album
   */
  async getAlbum(weddingId, page = 1, limit = 50, type = 'all') {
    return await this.call({
      action: 'getAlbum',
      wedding_id: weddingId,
      page: page,
      limit: limit,
      type: type
    });
  }
  
  /**
   * Admin login
   */
  async adminLogin(weddingId, username, password) {
    return await this.call({
      action: 'adminLogin',
      wedding_id: weddingId,
      username: username,
      password: password
    });
  }
  
  /**
   * Upload media via base64
   */
  async uploadMedia(weddingId, guestName, mediaType, base64Data, caption = '') {
    return await this.call({
      action: 'uploadMediaBase64',
      wedding_id: weddingId,
      guest_name: guestName,
      media_type: mediaType,
      file_data: base64Data,
      caption: caption
    }, 'POST');
  }
  
  /**
   * Get pending media (admin)
   */
  async getPendingMedia(weddingId, token) {
    return await this.call({
      action: 'getPendingMedia',
      wedding_id: weddingId,
      token: token
    });
  }
  
  /**
   * Approve media (admin)
   */
  async approveMedia(weddingId, token, mediaId) {
    return await this.call({
      action: 'approveMedia',
      wedding_id: weddingId,
      token: token,
      media_id: mediaId
    });
  }
  
  /**
   * Reject media (admin)
   */
  async rejectMedia(weddingId, token, mediaId) {
    return await this.call({
      action: 'rejectMedia',
      wedding_id: weddingId,
      token: token,
      media_id: mediaId
    });
  }
  
  /**
   * Delete media (admin)
   */
  async deleteMedia(weddingId, token, mediaId) {
    return await this.call({
      action: 'deleteMedia',
      wedding_id: weddingId,
      token: token,
      media_id: mediaId
    });
  }
  
  /**
   * Get statistics (admin)
   */
  async getStats(weddingId, token) {
    return await this.call({
      action: 'getStats',
      wedding_id: weddingId,
      token: token
    });
  }
  
  /**
   * Update settings (admin)
   */
  async updateSettings(weddingId, token, settings) {
    return await this.call({
      action: 'updateSettings',
      wedding_id: weddingId,
      token: token,
      ...settings
    });
  }
}

// Global API instance
const api = new WeddingAPI();