# Wedding Album v16 — Panduan Lengkap

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
6. Cek: buka `…/exec?action=ping` → harus muncul `"version":"v15-2026-10-21-direct-all"`.
7. Uji cepat: buka `index.html?w=KODE-UNDANGAN`, kirim satu foto, lalu cek sheet `MEDIA` dan folder Drive.

Kalau URL deployment berubah, ganti `APPS_SCRIPT_URL` di keempat file HTML.

---

## 3. Yang baru di v16

Hanya `index.html` dan `album.html` yang berubah. `Code.gs` tetap v15 (`ping` tetap menampilkan `v15-2026-10-21-direct-all`, tidak perlu deploy ulang).

- **Bar hijau "selesai" kini penuh 100%.** Sebelumnya lebar sisa dari progres terakhir menimpa gaya CSS.
- **Logo di header album.** `https://rasya-rizky.online/album/crest-red.png` tampil di kanan; tingginya otomatis sama dengan judul + tanggal (di HP lebih kecil). Ganti ukuran lewat variabel `--crest-w` di `.hero`.
- **Layar Voice note rapi.** Petunjuk naik dan tidak menabrak kolom nama; pemutar video tidak terpotong (mengikuti tinggi header & panel bawah, termasuk di HP layar pendek).
- **Bug kontrol voice bocor ke menu lain diperbaiki.** Tombol Ulang/Putar/Kirim Suara tidak lagi muncul di menu Foto/Video. Saat sedang merekam, atau rekaman voice/video belum dikirim, pindah menu ditahan dengan pesan singkat, jadi rekaman tidak hilang dan tidak ada dua set kontrol.

## 3-1. Yang baru di v15

### Foto & voice note kini lewat jalur yang sama dengan video
**Masalah lama (v14):** video lancar, tapi **foto dan voice note sering gagal**. Penyebab: video (>1,5 MB) dikirim **langsung ke Google Drive** (tanpa lewat Apps Script), sedangkan foto & voice note kecil dikirim **base64 lewat Apps Script**. Jalur base64 rawan:
- **Timeout Apps Script** (~30 detik) saat payload 1–2 MB + lock contention.
- **Lock Service** ditahan 3–6 detik per upload — saat 5 foto dikirim bersamaan, antreannya jadi sangat panjang.
- **Retry mengirim ulang seluruh base64**, memperparah timeout.

**Perbaikan v15:**
- **Semua media (foto, voice, video)** lewat **jalur Direct Drive** yang sudah terbukti lancar untuk video: `initUpload` (POST ~1 KB) → `PUT` ke Google Drive CDN → `finalizeUpload` (POST ~40 KB thumbnail).
- **Tidak ada lagi payload 1–2 MB ke Apps Script** untuk foto/voice.
- **Tidak ada lagi decode base64** di Apps Script (hemat memori & kuota).
- **Retry tidak mengirim ulang file** — jika PUT sudah berhasil dan finalize gagal, percobaan berikutnya hanya memanggil finalize (file yang sudah di Drive tidak di-upload ulang).
- **Jalur base64 tetap ada sebagai cadangan** (otomatis dipakai jika Direct Drive bermasalah) — tapi tidak lagi jadi jalur utama.

### CORS preflight dihilangkan dari sumbernya
**Masalah lama (v13):** `xhrSend` menyetel `Content-Type: text/plain;charset=utf-8`. Di sebagian Chrome/WebView Android, header ini tetap memicu preflight (`OPTIONS`) — yang tidak bisa dipenuhi Apps Script karena platform tidak mengizinkan header `Access-Control-Allow-Origin` kustom.

**Perbaikan v15:**
- `xhrSend` **tidak menyetel** `Content-Type` untuk URL `script.google.com`. Browser otomatis memakai `text/plain;charset=UTF-8` (browser-set, bukan script-set) — **bebas preflight**.
- `callServer` memanggil `xhrSend` dengan `headers = null` (tanpa header apa pun).
- `PUT` ke Google Drive tetap menyetel `Content-Type: job.mime` (Drive butuh itu & CORS-nya aman).
- `doOptions()` ditambahkan di `Code.gs` sebagai lapisan pertahanan (defensif).

### Lock contention dikurangi ~1–2 detik per upload
**Perbaikan v15 di `saveMediaRow_`:**
- `SpreadsheetApp.openById()` + `getSheetByName('MEDIA')` dipindah ke **luar** `withLock_()`. Sheet dibuka sekali di awal, lalu lock hanya melindungi cek duplikat + `appendRow` + cache. Waktu tahan lock turun drastis.
- Efeknya: saat 5 foto dikirim bersamaan, mereka tidak lagi saling mengunci selama ~15–30 detik. Antrean lock lebih cepat selesai.

### Catatan deploy
Aksi baru `checkUpload` (sudah ada sejak v13) tetap dipertahankan. `doOptions` baru. **Wajib deploy New version** agar `ping` menampilkan v15.

## 3a. Yang baru di v13

### Tidak lagi "macet di 95%" saat sinyal lemah
Masalah lama: file sudah sampai dan tersimpan di server, tapi balasan "sukses" tidak kembali ke HP karena sinyal lemah. Progres jadi berhenti (mis. 166 / 174 KB), lalu ditandai gagal, padahal fotonya sudah ada di album.
- Setelah seluruh isi file terkirim, HP **tidak hanya menunggu balasan**. Ia **bertanya ke server** ("momen ini sudah tercatat?") dengan jeda makin jarang. Begitu server menjawab sudah, status langsung jadi **Terkirim**.
- Selama menunggu, baris di popup menampilkan **Menyimpan di album…** (bukan angka yang menggantung). Kalau tidak ada kemajuan 10 detik, tertulis **Sinyal lemah, masih mencoba…**.
- Foto berikutnya langsung mulai dikirim begitu isi foto sebelumnya sampai, tidak menunggu konfirmasi.
- **Kirim ulang** kini selalu cek dulu ke server. Kalau ternyata sudah masuk, tidak ada unggah ulang (tidak dobel, tidak macet).
- Kiriman yang sempat ditandai gagal dicek otomatis tiap 10 detik, saat sinyal kembali, dan saat tamu kembali ke halaman. Kalau ternyata sudah masuk, status berubah jadi Terkirim dan popup "Terkirim" muncul.

### Pindah ke album saat masih mengirim
Daftar kiriman yang belum selesai disimpan di HP tamu (hanya ID, bukan fotonya). Di halaman album muncul pesan "Mengecek kiriman kamu…", lalu popup **"Semua momen sudah terupload"** begitu semuanya terkonfirmasi, dan album dimuat ulang otomatis. Kalau 4 menit belum ada kabar, tamu diberi tahu jujur berapa yang sudah masuk dan ada tombol **Kirim Lagi**. Catatan: foto yang belum sempat terkirim penuh saat halaman ditinggalkan memang tidak bisa dilanjutkan dari album, jadi sebaiknya tamu menunggu sampai tombol progres hilang.

## 3b. Yang baru di v12

### Progres kirim lebih jelas (halaman tamu)
- Bar di atas layar dihapus. Sebagai gantinya ada **tombol progres di sebelah kanan tombol kamera** (di mode Suara: di sebelah kanan tombol rekam). Tombol ini **hanya muncul setelah tamu menekan Kirim** dan **hilang sendiri** setelah semuanya terkirim.
- Cincin di tombol menunjukkan kemajuan total, angka kecil menunjukkan jumlah yang sedang dikirim. Kalau ada yang gagal, cincin berubah kuning dengan tanda "!".
- Ketuk tombol → **popup daftar kiriman**: Foto 1, Foto 2, dst. lengkap dengan thumbnail, ukuran, dan progres dalam ukuran file (contoh `120 / 480 KB`, atau `0,6 / 1,4 MB`), bukan persen. Foto yang selesai ditandai **centang hijau**, lalu lanjut ke foto berikutnya. Status per foto: Menunggu giliran, Mengirim, Sinyal lemah/antre (mencoba lagi), Terkirim, Belum terkirim (ada tombol Kirim Ulang).
- Popup ditutup lewat tombol ✕ kanan atas, ketuk di luar popup, atau tombol Esc. Pengiriman tetap jalan di latar belakang.

### Album
- Tombol **Kirim Momen** kini di tengah.
- Nama mempelai, footer, dan semua teks yang tadinya hitam kini memakai **warna utama tema** (sama dengan tombol). Warna diatur di Dashboard → Tema. Kalau warna yang dipilih terlalu terang, sistem menggelapkannya otomatis agar teks tetap terbaca.

## 3c. Yang baru di v11

### Album: halaman & penampil foto
- **Tampilkan 25 / 50 / Semua** (pilihan diingat di HP tamu). Bawaan 25.
- **Sebelumnya / Selanjutnya** + info "Halaman 2 dari 5" dan "26–50 dari 120 momen". Pindah halaman otomatis kembali ke atas. Pilihan ukuran disembunyikan kalau momen ≤ 25.
- **Semua** = gulir terus, dimuat 50 per kali (bukan sekaligus, supaya HP RAM kecil tidak berat).
- **Penampil foto**: tombol kiri/kanan, geser jari, atau tombol panah keyboard. Di ujung halaman otomatis lanjut ke halaman sebelah. Foto ukuran penuh baru diambil kalau tamu berhenti sekitar 0,35 detik, jadi geser cepat tidak membebani server.
- Halaman berikutnya disiapkan diam-diam (dilewati di HP RAM kecil / hemat data).

### Lebih kuat saat banyak tamu
- Server menahan kunci tulis lebih singkat (v15 memperkuat lagi dengan buka sheet di luar lock).
- Album membaca thumbnail sekali jalan, bukan per foto.
- Saat server antre, HP menunggu lebih lama dengan jeda acak (tidak menyerbu bersamaan) dan tamu melihat "Lagi ramai nih, antre sebentar ya…". Percobaan ulang otomatis naik jadi 5×.

### Batas yang perlu dipahami
- Apps Script maksimal sekitar 30 permintaan berjalan bersamaan per akun. Di atas itu sebagian permintaan ditolak sementara; HP mencoba lagi sendiri, jadi tamu hanya menunggu, bukan kehilangan foto.
- Ada kuota harian Google (panggilan URL Fetch, dll). Kalau habis, kiriman gagal sampai kuota di-reset. Untuk acara besar, pakai akun Google khusus acara (atau Workspace).
- **Video, foto, dan voice note** kini sama-sama masuk langsung ke Drive (tidak lewat Apps Script), jadi tidak membebani batas di atas. Pastikan ruang Drive cukup (gratis 15 GB, maks 25 MB per file).
- Uji dulu sebelum hari-H: kirim dari 5–10 HP sekaligus dan pantau menu **Executions** di Apps Script.

## 3d. Yang baru di v10

### Tidak ada lagi foto dobel / "gagal kirim" palsu
- Setiap foto/video/VN punya **ID unik** yang ikut di semua percobaan. Server mengenali ID yang sama dan **hanya menyimpan sekali**, lalu membalas "sudah tercatat". Berlaku juga kalau dua kiriman ulang datang bersamaan (cek dan simpan dilakukan dalam satu kunci).
- Kalau file sudah sampai di Drive tapi pencatatan gagal, percobaan berikutnya **hanya mencatat ulang**, tidak mengunggah file lagi. Salinan file kembar otomatis dibuang.
- Ketukan ganda pada tombol Kirim diabaikan.
- Popup hasil kini muncul lagi setelah "Kirim Ulang" selesai.
- Pesan "Server sedang ramai" kini benar-benar tampil saat antrean penuh.

### Bingkai custom: semua format gambar
Dashboard → Tema → **Unggah Bingkai** menerima **JPG, JPEG, PNG, WebP, AVIF, SVG, GIF, BMP**. Apa pun formatnya otomatis diubah jadi PNG ringan (≤250 KB, transparansi tetap). HEIC (foto iPhone) belum bisa dibaca browser: simpan dulu sebagai JPG/PNG.

### Footer album
Ucapan terima kasih bernada santai + tombol Instagram `@rizky.hanifudin`. Teks ada di bagian `<footer class="site-footer">` di `album.html`.

### Popup admin
Gaya popup dashboard disamakan dengan popup hasil di halaman tamu (kartu krem, ikon bulat, tombol "Oke").

### Tampilan
Font Fraunces (judul), Plus Jakarta Sans (isi), JetBrains Mono (data). Warna krem, marun, emas; sudut kartu 4 px; bayangan hangat; tanpa emoji di judul/menu. Label suara default "Ucapan & Doa". Font dimuat dari Google Fonts (perlu internet).

## 3e. Yang ada sejak v9

### Saklar Foto / Video / Voice note
Dashboard → **Pengaturan Umum → Jenis Momen yang Boleh Dikirim**. Berlaku di tiga tempat sekaligus:
- **Halaman kirim:** tombol mode hanya untuk jenis yang ON. Satu jenis ON → tombol mode disembunyikan. Semua OFF → layar "Pengiriman Sedang Ditutup" + tombol Lihat Album.
- **Server:** upload jenis yang OFF ditolak, meski ada yang mencoba lewat jalur lain.
- **Album:** tab dan isi hanya jenis yang ON. Satu jenis ON → tab disembunyikan.

Minimal satu jenis harus aktif (dashboard menolak menyimpan jika semuanya mati).

### Upload cepat & ringan
- Tamu **tidak menunggu**: setelah menekan Kirim, kamera langsung bisa dipakai lagi; file terkirim di latar belakang dengan indikator progres kecil.
- **Semua media** (foto, video, voice) dikirim **langsung ke Google Drive** (tanpa base64, tanpa lewat Apps Script), lalu dicatat. Jika jalur langsung gagal, otomatis pakai jalur biasa.
- Coba ulang otomatis 5× saat sinyal putus; lanjut sendiri saat online kembali; tombol **Kirim ulang** jika tetap gagal.
- **Popup hasil** setelah semua selesai: berhasil (dengan info langsung tampil atau menunggu persetujuan), sebagian berhasil, atau gagal.
- Peringatan jika tamu menutup halaman saat file masih terkirim.

### HP RAM kecil & sinyal lambat (otomatis)
- HP RAM ≤2 GB / ≤4 core atau sinyal 2G/3G: resolusi foto & video dibatasi, bitrate lebih rendah, 24 fps, kamera dilepas saat meninjau video, hanya satu upload berjalan sekaligus.
- Pratinjau foto memakai thumbnail kecil (bukan foto penuh); kanvas besar dilepas setelah jepret.
- Video tanpa filter/bingkai dari kamera belakang direkam **langsung dari kamera** (tanpa digambar ulang per frame) → jauh lebih hemat CPU dan baterai.
- Preset kualitas "Maksimal" dibatasi (foto 2560 px, video 1080p).

### Album cepat
- Halaman pertama langsung tampil dari penyimpanan sementara lalu diperbarui (lihat v11 untuk pilihan 25/50/Semua).
- Thumbnail disimpan di sheet (≤45.000 karakter per sel), dikirim bersama daftar album.
- Tap foto → lihat ukuran penuh. Video/VN dimuat hanya saat diputar. Unduhan penuh diambil paralel 3 potongan.
- Maksimal 4 berkas penuh disimpan di memori sekaligus.

### Backend
- **Cache** (CacheService): pengaturan 5 menit, album 10 menit; otomatis dibuang saat ada upload disetujui / moderasi / ubah pengaturan.
- **Kunci antrean** (LockService): tulis ke sheet dilakukan satu per satu → tidak ada baris tertimpa saat banyak tamu bersamaan.
- Update pengaturan ditulis sekali (bukan per kolom). Folder Drive di-cache (tidak dicari ulang tiap upload).
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
| Foto muncul dobel di album | Pastikan `Code.gs` v10+ sudah di-deploy (**New version**) dan keempat HTML terbaru sudah di hosting. Foto dobel lama dihapus manual dari sheet `MEDIA` (baris) dan Drive. |
| **Foto/voice sering gagal padahal video lancar** | **Sudah diperbaiki di v15.** Pastikan `index.html` v15 dan `Code.gs` v15 sudah di-deploy. Cek `ping` → versi harus `v15-2026-10-21-direct-all`. |
| **CORS error: No 'Access-Control-Allow-Origin'** | **Sudah diperbaiki di v15.** `index.html` v15 tidak menyetel `Content-Type` untuk Apps Script. Jika masih muncul, hard-refresh browser (clear cache) setelah update file. |
| Upload gagal / tidak masuk sheet | Cek `…/exec?action=ping` (versi harus v15). Cek *Execute as: Me* dan *Anyone*. Buka `…/exec?action=diagnoseDrive` untuk uji akses Drive. |
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