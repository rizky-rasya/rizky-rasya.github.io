// ============================================
// WEDDING ALBUM - KONFIGURASI GLOBAL
// ============================================

const CONFIG = {
  // Google Apps Script URL (GANTI DENGAN URL DEPLOYMENT ANDA)
  API_URL: 'https://script.google.com/macros/s/AKfycbwanTSkndUEuo99UE6qnKAyixepALQk-wgEbPXxRDnwO9t1HE8-Y95t_l1Sotdf93Zg/exec',
  
  // Default wedding ID (bisa di-override via URL parameter)
  DEFAULT_WEDDING_ID: 'demo',
  
  // Versi aplikasi
  VERSION: '1.0.0',
  APP_NAME: 'Wedding Album Digital',
  
  // Pengaturan upload
  UPLOAD: {
    PHOTO_MAX_WIDTH: 1920,
    PHOTO_MAX_HEIGHT: 1920,
    PHOTO_QUALITY: 0.85,
    VIDEO_MAX_DURATION: 60, // detik
    VOICE_MAX_DURATION: 60, // detik
  },
  
  // Animasi & UI
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
  
  // Local Storage keys
  STORAGE_KEYS: {
    GUEST_NAME: 'wedding_album_guest_name',
    WEDDING_ID: 'wedding_album_wedding_id',
    ADMIN_TOKEN: 'wedding_album_admin_token',
    ADMIN_WEDDING_ID: 'wedding_album_admin_wedding_id',
  }
};

// Ambil wedding ID dari URL parameter
function getWeddingId() {
  const urlParams = new URLSearchParams(window.location.search);
  const weddingId = urlParams.get('wedding_id') || 
                    localStorage.getItem(CONFIG.STORAGE_KEYS.WEDDING_ID) || 
                    CONFIG.DEFAULT_WEDDING_ID;
  
  localStorage.setItem(CONFIG.STORAGE_KEYS.WEDDING_ID, weddingId);
  return weddingId;
}

// Ambil nama tamu dari localStorage
function getGuestName() {
  return localStorage.getItem(CONFIG.STORAGE_KEYS.GUEST_NAME) || '';
}

// Simpan nama tamu
function setGuestName(name) {
  localStorage.setItem(CONFIG.STORAGE_KEYS.GUEST_NAME, name);
}

// Cek apakah user adalah admin
function isAdmin() {
  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
  const weddingId = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_WEDDING_ID);
  return !!(token && weddingId);
}

// Logout admin
function adminLogout() {
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_WEDDING_ID);
  window.location.href = 'login.html';
}
