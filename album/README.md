# Wedding Album v17 — Panduan Lengkap

Album momen pernikahan: tamu memotret / merekam video / merekam voice note langsung dari HP **atau upload dari galeri**, mempelai memoderasi, semua tampil di album.
Backend: Google Apps Script + Google Sheets + Google Drive. Frontend: 5 halaman HTML statis.

---

## 1. Berkas

| Berkas | Fungsi |
|---|---|
| `Code.gs` | Backend (tempel di Apps Script) — **tidak berubah sejak v15** |
| `FolderSetup.gs` | Setup folder Drive per wedding (opsional, terpisah dari Code.gs) |
| `index.html` | Halaman tamu: kamera & kirim momen (rekam langsung) |
| `galeri.html` | **BARU di v17** — Halaman tamu: upload foto/video dari galeri + rekam suara |
| `album.html` | Album publik |
| `admin-login.html` | Masuk mempelai |
| `admin-dashboard.html` | Dashboard mempelai |

**Hapus dari hosting (sisa versi lama, tidak dipakai, memanggil fungsi yang sudah tidak ada). Sejak v9 tidak ada file CSS/JS terpisah: semua gaya dan skrip sudah ada di dalam setiap HTML:**
`admin.js`, `album.js`, `api.js`, `camera.html`, `camera.js`, `config.js`, `preview.html`, `style.css`, `login.html`.

---

## 2. Pasang (±5 menit)

1. Buka spreadsheet → **Extensions → Apps Script**. Hapus semua isi lama, tempel seluruh `Code.gs`, simpan.
2. (Opsional) Tambah file baru `FolderSetup.gs` — tempel isinya. Bisa dipanggil manual dari editor untuk membuat folder `PHOTO/VIDEO/VOICE/FRAMES` per wedding **sebelum** acara. Lihat bagian 3-Folder di bawah.
3. Pilih fungsi **`setupSecretKey`** → Run (sekali saja; lewati jika sudah pernah).
4. Pilih fungsi **`setupSheets`** → Run (sekali). Menambah kolom baru `allow_photo` tanpa menghapus data; wedding lama otomatis aktif untuk foto. Aman diulang.
5. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy.** Pengaturan: *Execute as* **Me**, *Who has access* **Anyone**. Izinkan akses jika diminta.
6. Upload **kelima** file HTML ke hosting statis (Netlify / Vercel / GitHub Pages / Firebase), satu folder, timpa yang lama:
   - `index.html`
   - `galeri.html` (**BARU**)
   - `album.html`
   - `admin-login.html`
   - `admin-dashboard.html`
7. Cek: buka `…/exec?action=ping` → harus muncul `"version":"v15-2026-10-21-direct-all"` (backend tetap v15, tidak perlu deploy ulang).
8. Uji cepat:
   - Buka `index.html?w=KODE-UNDANGAN` → kirim satu foto
   - Buka `galeri.html?w=KODE-UNDANGAN` → upload satu foto dari galeri → cek frame tidak blur
   - Buka `album.html?w=KODE-UNDANGAN` → cek foto tampil

Kalau URL deployment berubah, ganti `APPS_SCRIPT_URL` di kelima file HTML.

---

## 3. Yang baru di v17

### Frame tidak lagi blur
**Masalah lama:** frame custom (PNG) yang diunggah admin selalu dikompres jadi ≤ 250 KB di dashboard — baik file besar maupun kecil. Saat dibakar ke foto/video/VN resolusi 1080p+, PNG 250 KB sangat blur karena di-upscale.

**Perbaikan:**
- Compress **hanya aktif kalau file asli > 5 MB**.
- File ≤ 5 MB dipakai **apa adanya (kualitas 100%)**.
- File > 5 MB tetap dikompres otomatis (kualitas sedikit turun, tapi tidak blur parah).

**⚠️ Penting:** frame lama di Drive (yang terlanjur terkompres 250 KB di versi sebelumnya) **tetap blur** sampai admin **upload ulang** dengan file baru < 5 MB. Buka Dashboard → Tema → Unggah Bingkai → pilih file PNG asli.

### Orientasi frame otomatis
Foto/video dari galeri bisa portrait atau landscape. Frame custom yang portrait akan **diputar 90° otomatis** saat dibakar ke media landscape (dan sebaliknya), supaya **tidak gepeng**.

Berlaku di:
- `galeri.html` (upload foto/video baru)
- `album.html` (download berbingkai)
- `index.html` (rekaman kamera langsung)
- Voice note berbingkai (rekam atau dari galeri)

Frame yang **kotak** tidak diputar (rotasi 90° tidak mengubah tampilan). Frame orientation di-deteksi dari `naturalWidth > naturalHeight`.

### Fitur baru: `galeri.html` — Kirim dari Galeri
Halaman baru untuk **upload foto/video dari galeri HP**, atau **rekam suara langsung**, dengan **bingkai otomatis**.

**Akses dari album:** di samping tombol "Kirim Momen" sekarang ada tombol **"Kirim dari Galeri"**.

**Akses langsung:** `galeri.html?w=KODE-UNDANGAN` (link bisa disalin dari Dashboard → Bagikan).

**Fitur per mode:**

**📷 FOTO:**
- Pilih JPG / PNG / WebP dari galeri HP
- Otomatis dibingkai di browser (max 2560 px, JPEG quality 0.92)
- Preview dengan info **dimensi** (contoh: 1920×1080 px) dan **orientasi** (Potret/Lanskap/Kotak)
- Frame dirotasi otomatis kalau orientasi beda
- Upload lewat **Direct Drive** (jalur v15: `initUpload → PUT → finalizeUpload`)

**🎥 VIDEO:**
- Pilih MP4 / WebM / MOV dari galeri HP
- **Preview dulu** dengan info durasi & orientasi
- Kalau durasi > max_video_seconds → ada warning akan dipotong
- Saat kirim: video diproses **real-time** untuk dibakar frame (durasi video = waktu proses). Progress bar menunjukkan "%"
- Frame dirotasi otomatis sesuai orientasi video
- Video otomatis dipotong ke `max_video_seconds` (dari sheet WEDDINGS)
- Upload lewat Direct Drive

**🎤 SUARA:**
- Rekam langsung (maks dari `max_voice_seconds`)
- Otomatis berhenti di batas durasi
- Audiogram + frame digambar real-time
- Preview video hasil sebelum kirim
- Upload lewat Direct Drive

**Flow:** upload → preview → isi nama → kirim

**Batas mengikuti sheet WEDDINGS:**
- `max_video_seconds` (default 60 detik) — video yang lebih panjang otomatis dipotong
- `max_voice_seconds` (default 60 detik) — rekaman otomatis berhenti
- `max_photo` (tidak dipakai di galeri, hanya di index.html untuk multi-shot)
- `allow_photo`, `allow_video`, `allow_voice` — tab yang tidak aktif disembunyikan
- Kualitas foto/video/voice dari `ui_config.quality`
- Frame, audiogram, warna dari `ui_config.frames` dan `ui_config.*`

**UX/UI** sama dengan `index.html`: warna tema, font, tombol, hasil modal, toast.

### Link "Kirim dari Galeri" di Dashboard
Dashboard → Bagikan → **link baru "Kirim dari Galeri"** (bisa disalin). Berguna untuk dibagikan langsung ke tamu via WhatsApp / undangan digital.

### File yang berubah di v17
| File | Status |
|---|---|
| `admin-dashboard.html` | **Revisi** — compress frame hanya > 5MB, link galeri baru di tab Bagikan |
| `album.html` | **Revisi** — tombol "Kirim dari Galeri" + `drawFrameForMedia` (rotasi orientasi) |
| `index.html` | **Revisi** — `drawFrameForMedia` dipakai di `drawFrame`, `drawCaptureFrameOverlay`, dan `startVoiceRecordingWithFrame` |
| `galeri.html` | **BARU** |
| `Code.gs` | **Tidak berubah** (tetap v15) |
| `FolderSetup.gs` | **Tidak berubah** (tetap v15.1) |
| `admin-login.html` | **Tidak berubah** |

**Tidak perlu deploy ulang Code.gs.** Cukup upload 4 file HTML ke hosting.

### Batasan v17
- **Video upload dari galeri** butuh waktu proses = durasi video (karena canvas playback real-time via `MediaRecorder`). Video 60 detik butuh ~60 detik untuk dibakar frame. Ini tidak bisa dipercepat karena browser tidak punya video encoder hardware.
- **Format video** yang dihasilkan: MP4 (H.264) di Chrome/Safari modern, WebM di Firefox. Otomatis disesuaikan.
- **HEIC (foto iPhone)** belum bisa dibaca browser. Kalau tamu punya HEIC, simpan dulu sebagai JPG/PNG.

---

## 3-Folder. Setup Folder Drive (FolderSetup.gs)

Opsional, tapi disarankan sebelum acara. Setiap wedding punya 4 subfolder wajib di Drive: