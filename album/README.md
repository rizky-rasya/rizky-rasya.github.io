# Wedding Album v12 — Panduan Lengkap

Album momen pernikahan: tamu memotret / merekam video / merekam voice note langsung dari HP, mempelai memoderasi, semua tampil di album.
Backend: Google Apps Script + Google Sheets + Google Drive. Frontend: 4 halaman HTML statis.

---

## 1. Berkas

| Berkas | Fungsi |
|---|---|
| `Code.gs` | Backend (tempel di Apps Script) |
| `index.html` | Halaman tamu: kamera & kirim momen |
| `album.html` | Album publik |
| `admin-login.html` | Masuk mempelai |
| `admin-dashboard.html` | Dashboard mempelai |

**Hapus dari hosting (sisa versi lama, tidak dipakai, memanggil fungsi yang sudah tidak ada). Sejak v9 tidak ada file CSS/JS terpisah: semua gaya dan skrip sudah ada di dalam keempat HTML:**
`admin.js`, `album.js`, `api.js`, `camera.html`, `camera.js`, `config.js`, `preview.html`, `style.css`, `login.html`.

---

## 2. Pasang (±5 menit)

1. Buka spreadsheet → **Extensions → Apps Script**. Hapus semua isi lama, tempel seluruh `Code.gs`, simpan.
2. Pilih fungsi **`setupSecretKey`** → Run (sekali saja; lewati jika sudah pernah).
3. Pilih fungsi **`setupSheets`** → Run (sekali). Menambah kolom baru `allow_photo` tanpa menghapus data; wedding lama otomatis aktif untuk foto. Aman diulang.
4. **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy.** Pengaturan: *Execute as* **Me**, *Who has access* **Anyone**. Izinkan akses jika diminta.
5. Upload keempat file HTML ke hosting statis (Netlify / Vercel / GitHub Pages / Firebase), satu folder, timpa yang lama.
6. Cek: buka `…/exec?action=ping` → harus muncul `"version":"v11-2026-10-21-paged"`.
7. Uji cepat: buka `index.html?w=KODE-UNDANGAN`, kirim satu foto, lalu cek sheet `MEDIA` dan folder Drive.

Kalau URL deployment berubah, ganti `APPS_SCRIPT_URL` di keempat file HTML.

---

## 3. Yang baru di v12

### Progres kirim lebih jelas (halaman tamu)
- Bar di atas layar dihapus. Sebagai gantinya ada **tombol progres di sebelah kanan tombol kamera** (di mode Suara: di sebelah kanan tombol rekam). Tombol ini **hanya muncul setelah tamu menekan Kirim** dan **hilang sendiri** setelah semuanya terkirim.
- Cincin di tombol menunjukkan kemajuan total, angka kecil menunjukkan jumlah yang sedang dikirim. Kalau ada yang gagal, cincin berubah kuning dengan tanda "!".
- Ketuk tombol → **popup daftar kiriman**: Foto 1, Foto 2, dst. lengkap dengan thumbnail, ukuran, dan progres dalam ukuran file (contoh `120 / 480 KB`, atau `0,6 / 1,4 MB`), bukan persen. Foto yang selesai ditandai **centang hijau**, lalu lanjut ke foto berikutnya. Status per foto: Menunggu giliran, Mengirim, Sinyal lemah/antre (mencoba lagi), Terkirim, Belum terkirim (ada tombol Kirim Ulang).
- Popup ditutup lewat tombol ✕ kanan atas, ketuk di luar popup, atau tombol Esc. Pengiriman tetap jalan di latar belakang.

### Album
- Tombol **Kirim Momen** kini di tengah.
- Nama mempelai, footer, dan semua teks yang tadinya hitam kini memakai **warna utama tema** (sama dengan tombol). Warna diatur di Dashboard → Tema. Kalau warna yang dipilih terlalu terang, sistem menggelapkannya otomatis agar teks tetap terbaca.

## 3. Yang baru di v11 (sebelumnya)

### Album: halaman & penampil foto
- **Tampilkan 25 / 50 / Semua** (pilihan diingat di HP tamu). Bawaan 25.
- **Sebelumnya / Selanjutnya** + info "Halaman 2 dari 5" dan "26–50 dari 120 momen". Pindah halaman otomatis kembali ke atas. Pilihan ukuran disembunyikan kalau momen ≤ 25.
- **Semua** = gulir terus, dimuat 50 per kali (bukan sekaligus, supaya HP RAM kecil tidak berat).
- **Penampil foto**: tombol kiri/kanan, geser jari, atau tombol panah keyboard. Di ujung halaman otomatis lanjut ke halaman sebelah. Foto ukuran penuh baru diambil kalau tamu berhenti sekitar 0,35 detik, jadi geser cepat tidak membebani server.
- Halaman berikutnya disiapkan diam-diam (dilewati di HP RAM kecil / hemat data).

### Lebih kuat saat banyak tamu
- Server menahan kunci tulis lebih singkat (cek duplikat 400 baris hanya untuk kiriman ulang).
- Album membaca thumbnail sekali jalan, bukan per foto.
- Saat server antre, HP menunggu lebih lama dengan jeda acak (tidak menyerbu bersamaan) dan tamu melihat "Lagi ramai nih, antre sebentar ya…". Percobaan ulang otomatis naik jadi 5×.

### Batas yang perlu dipahami
- Apps Script maksimal sekitar 30 permintaan berjalan bersamaan per akun. Di atas itu sebagian permintaan ditolak sementara; HP mencoba lagi sendiri, jadi tamu hanya menunggu, bukan kehilangan foto.
- Ada kuota harian Google (panggilan URL Fetch, dll). Kalau habis, kiriman gagal sampai kuota di-reset. Untuk acara besar, pakai akun Google khusus acara (atau Workspace).
- Video/VN besar masuk langsung ke Drive (tidak lewat Apps Script), jadi tidak membebani batas di atas. Pastikan ruang Drive cukup (gratis 15 GB, maks 25 MB per file).
- Uji dulu sebelum hari-H: kirim dari 5–10 HP sekaligus dan pantau menu **Executions** di Apps Script.

## 3a. Yang baru di v10

### Tidak ada lagi foto dobel / "gagal kirim" palsu
Masalah lama: foto sebenarnya sudah masuk album, tapi balasan server tidak sampai ke HP (sinyal putus, server ramai). HP mengira gagal lalu mengirim ulang, jadi foto tercatat dua kali atau lebih.
- Setiap foto/video/VN punya **ID unik** yang ikut di semua percobaan. Server mengenali ID yang sama dan **hanya menyimpan sekali**, lalu membalas "sudah tercatat". Berlaku juga kalau dua kiriman ulang datang bersamaan (cek dan simpan dilakukan dalam satu kunci).
- Kalau file sudah sampai di Drive tapi pencatatan gagal, percobaan berikutnya **hanya mencatat ulang**, tidak mengunggah file lagi. Salinan file kembar otomatis dibuang.
- Ketukan ganda pada tombol Kirim diabaikan.
- Popup hasil kini muncul lagi setelah "Kirim Ulang" selesai (sebelumnya tidak).
- Pesan "Server sedang ramai" kini benar-benar tampil saat antrean penuh (dulu berubah jadi error umum).

### Bingkai custom: semua format gambar
Dashboard → Tema → **Unggah Bingkai** menerima **JPG, JPEG, PNG, WebP, AVIF, SVG, GIF, BMP** dan format gambar lain yang bisa dibuka browser. Apa pun formatnya otomatis diubah jadi PNG ringan (≤250 KB, transparansi tetap). HEIC (foto iPhone) belum bisa dibaca browser: simpan dulu sebagai JPG/PNG. Catatan: JPG tidak punya bagian transparan, jadi untuk bingkai berlubang pakai PNG/WebP/AVIF/SVG.

### Footer album
Ucapan terima kasih bernada santai + tombol Instagram `@rizky.hanifudin`. Teks ada di bagian `<footer class="site-footer">` di `album.html`.

### Popup admin
Gaya popup dashboard disamakan dengan popup hasil di halaman tamu (kartu krem, ikon bulat, tombol "Oke").

### Tampilan (DESIGN.md)
Font Fraunces (judul), Plus Jakarta Sans (isi), JetBrains Mono (data). Warna krem, marun, emas; sudut kartu 4 px; bayangan hangat; tanpa emoji di judul/menu. Label suara default "Ucapan & Doa". Font dimuat dari Google Fonts (perlu internet).

## 3b. Yang ada sejak v9

### Saklar Foto / Video / Voice note
Dashboard → **Pengaturan Umum → Jenis Momen yang Boleh Dikirim**. Berlaku di tiga tempat sekaligus:
- **Halaman kirim:** tombol mode hanya untuk jenis yang ON. Satu jenis ON → tombol mode disembunyikan. Semua OFF → layar "Pengiriman Sedang Ditutup" + tombol Lihat Album.
- **Server:** upload jenis yang OFF ditolak, meski ada yang mencoba lewat jalur lain.
- **Album:** tab dan isi hanya jenis yang ON. Satu jenis ON → tab disembunyikan.

Minimal satu jenis harus aktif (dashboard menolak menyimpan jika semuanya mati).

### Upload cepat & ringan
- Tamu **tidak menunggu**: setelah menekan Kirim, kamera langsung bisa dipakai lagi; file terkirim di latar belakang dengan indikator progres kecil.
- **Foto kecil** (≤1,5 MB): sekali kirim. **Video / VN besar:** dikirim **langsung ke Google Drive** (tanpa base64, tanpa lewat Apps Script), lalu dicatat. Jika jalur langsung gagal, otomatis pakai jalur biasa.
- Coba ulang otomatis 4× saat sinyal putus; lanjut sendiri saat online kembali; tombol **Kirim ulang** jika tetap gagal.
- **Popup hasil** setelah semua selesai: berhasil (dengan info langsung tampil atau menunggu persetujuan), sebagian berhasil, atau gagal.
- Peringatan jika tamu menutup halaman saat file masih terkirim.

### HP RAM kecil & sinyal lambat (otomatis)
- HP RAM ≤2 GB / ≤4 core atau sinyal 2G/3G: resolusi foto & video dibatasi, bitrate lebih rendah, 24 fps, kamera dilepas saat meninjau video, hanya satu upload berjalan sekaligus.
- Pratinjau foto memakai thumbnail kecil (bukan foto penuh); kanvas besar dilepas setelah jepret.
- Video tanpa filter/bingkai dari kamera belakang direkam **langsung dari kamera** (tanpa digambar ulang per frame) → jauh lebih hemat CPU dan baterai.
- Preset kualitas "Maksimal" dibatasi (foto 2560 px, video 1080p) agar tidak membuat HP kehabisan memori. Pengaturan kualitas admin tetap berlaku di bawah batas itu.

### Album cepat
- Halaman pertama langsung tampil dari penyimpanan sementara lalu diperbarui (lihat v11 untuk pilihan 25/50/Semua).
- Thumbnail disimpan di sheet (≤45.000 karakter per sel), dikirim bersama daftar album.
- Tap foto → lihat ukuran penuh. Video/VN dimuat hanya saat diputar. Unduhan penuh diambil paralel 3 potongan.
- Maksimal 4 berkas penuh disimpan di memori sekaligus.

### Backend
- **Cache** (CacheService): pengaturan 5 menit, album 10 menit; otomatis dibuang saat ada upload disetujui / moderasi / ubah pengaturan.
- **Kunci antrean** (LockService): tulis ke sheet dilakukan satu per satu → tidak ada baris tertimpa saat banyak tamu bersamaan. Jika sangat ramai, tamu melihat pesan ramah dan sistem mencoba lagi sendiri.
- Update pengaturan ditulis sekali (bukan per kolom). Folder Drive di-cache (tidak dicari ulang tiap upload). Tidak lagi memanggil `setSharing` tiap upload.
- Health check ringan (tidak membuat file uji di Drive).

### Perbaikan bug
- Thumbnail album tidak tampil (Apps Script tidak bisa menyajikan file mentah lewat `serveFile`).
- Tanggal pernikahan bergeser mundur sehari tiap disimpan dari dashboard.
- Nama tamu berisi tanda kutip merusak tombol di album.
- Moderasi memuat semua video penuh sekaligus; kini thumbnail dulu, video/suara dimuat saat diketuk.
- Dua tamu mengunggah bersamaan bisa menimpa baris sheet.

---

## 4. Struktur Spreadsheet

**WEDDINGS:** `wedding_id, groom_name, bride_name, date, admin_username, admin_password, theme, primary_color, secondary_color, max_photo, max_video_seconds, max_voice_seconds, allow_video, allow_voice, allow_filter, moderation, created_date, active_filter_id, frame_style, ui_config, allow_photo`
- `allow_photo` ditambah otomatis oleh `setupSheets()`.
- `max_photo` harus **angka 1–20** (jumlah foto per kiriman). Isi lain (mis. `TRUE`) dianggap 5.
- `admin_password` berbentuk hash. Buat dengan `hashPasswordForSheet()` (ubah `PASSWORD_MENTAH`, Run, salin hasil di Logger). Jangan simpan password mentah.

**MEDIA:** `wedding_id, media_id, guest_name, media_type, file_id, file_url, thumbnail_url, date, time, status, moderated_by, moderated_date, caption`
- `thumbnail_url` kini berisi data gambar kecil (bukan tautan). Jangan diedit manual.

**FILTERS:** `filter_id, name, css_filter, active, wedding_id, params`

Di Drive, tiap wedding punya subfolder `PHOTO`, `VIDEO`, `VOICE`, `FRAMES`.

---

## 5. Fitur lain (tetap)

- **Kode undangan otomatis:** tamu membuka `index.html?w=kode-undangan`; kode tersimpan di browser dan terbawa ke album.
- **Filter seragam:** admin memilih satu filter aktif (bawaan atau Filter Custom 15 parameter) yang terbakar ke foto & video tamu.
- **Bingkai & tema:** 4 gaya bawaan atau PNG custom per jenis media; opsi "bakar bingkai otomatis saat rekam"; audiogram VN bisa diatur bentuk, warna, dan fontnya.
- **Unduhan:** "Unduh Asli" (cepat) dan "Unduh Berbingkai ✨" (diproses ulang di browser; VN/video butuh waktu setara durasinya).
- **Moderasi bisa dimatikan:** jika OFF, momen langsung tampil di album.
- **Kualitas media** (Standar / Tinggi / Maksimal / Custom) diatur dari dashboard.
- Kontrol album: tampil/sembunyikan pratinjau, izinkan/larang unduhan.
- Zoom tidak sengaja dicegah (viewport + blokir pinch & double-tap).

---

## 6. Troubleshooting

| Masalah | Penyebab / solusi |
|---|---|
| `{"error":"Parameter action diperlukan"}` | Script lama masih tercampur. Hapus semua isi editor Apps Script, tempel `Code.gs` baru saja, deploy **New version**. |
| Login gagal terus padahal password benar | `SECRET_KEY` belum dibuat → jalankan `setupSecretKey()`. |
| Dashboard menampilkan "Kolom allow_photo belum ada" | Jalankan `setupSheets()` sekali. |
| Tombol Foto/Video/Suara tidak berubah setelah disimpan | Pastikan sudah deploy **New version**; muat ulang halaman tamu. Perubahan pengaturan berlaku maksimal beberapa detik. |
| Foto muncul dobel di album | Pastikan `Code.gs` v10 sudah di-deploy (**New version**) dan keempat HTML terbaru sudah di hosting. Foto dobel lama dihapus manual dari sheet `MEDIA` (baris) dan Drive. |
| Upload gagal / tidak masuk sheet | Cek `…/exec?action=ping` (versi harus v11 atau lebih baru; v12 tidak mengubah Code.gs). Cek *Execute as: Me* dan *Anyone*. Buka `…/exec?action=diagnoseDrive` untuk uji akses Drive. |
| Video besar terasa lambat dikirim | Kemungkinan jalur langsung ke Drive ditolak dan sistem memakai jalur biasa (tetap berhasil, hanya lebih lambat). Turunkan Kualitas Video ke Standar di dashboard. |
| Pesan "Server sedang ramai" | Terlalu banyak tulis bersamaan; sistem mencoba lagi otomatis, tamu cukup menunggu. |
| Album kosong padahal ada kiriman | Moderasi ON → setujui dulu di tab Moderasi. Atau jenis media itu sedang OFF di Pengaturan Umum. |
| Foto lama tidak punya thumbnail | Dibuat otomatis saat album pertama dibuka (maksimal 4 per muat). |
| Kamera tidak muncul / izin terus diminta | Situs harus **https**; aktifkan izin kamera & mikrofon di browser. |
| Unduhan VN berbingkai lama | Wajar: prosesnya real-time seukuran durasi rekaman. Aktifkan "Bakar bingkai otomatis" agar unduhan instan. |
| iPhone lama gagal merekam video berbingkai | `captureStream()` terbatas di Safari lama; perbarui iOS atau matikan bingkai otomatis. |

## 7. Catatan teknis

- Batas ukuran file: 25 MB (`MAX_FILE_MB` di `Code.gs`).
- Format rekaman dipilih otomatis sesuai perangkat (iPhone: mp4/m4a, Android: WebM).
- Kuota Apps Script gratis terbatas; cache dan unggah langsung ke Drive dirancang agar ratusan tamu bersamaan tetap ringan. Untuk acara sangat besar, pertimbangkan akun Google Workspace (kuota lebih tinggi).
