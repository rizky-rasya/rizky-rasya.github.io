# Wedding Album v2 — Panduan Setup & Perbaikan

## 🔴 Kenapa kamu dapat error "Parameter action diperlukan"?

Pesan error yang kamu screenshot: `{success: false, error: "Parameter action diperlukan"}`

Perhatikan key-nya **`error`**. Kode yang saya berikan tidak pernah memakai key `error` — selalu `message`. Ini artinya **script yang benar-benar berjalan di balik Web App URL kamu bukan `Code.gs` yang saya berikan**, atau ada isi lama yang masih tercampur di project Apps Script kamu (dua fungsi `doPost`/`doGet` terdefinisi, dan Apps Script memakai salah satu tanpa peringatan).

**Solusi — bersih-bersih total (wajib, sekali saja):**

1. Buka spreadsheet → **Extensions → Apps Script**.
2. Di panel kiri, **hapus semua file `.gs` yang ada** kecuali satu file kosong.
3. Pastikan file itu **kosong total** (select all → delete), lalu paste **seluruh isi `Code.gs`** yang saya berikan di sini. Jangan ditambahkan ke isi lama — harus menggantikan semuanya.
4. Simpan (ikon disket).
5. Jalankan fungsi `setupSecretKey` sekali (lihat Langkah 3 di bawah).
6. Klik **Deploy → Manage deployments** → ikon pensil pada deployment aktif → Version: **New version** → **Deploy**.
7. Uji lewat browser, buka:
   `https://script.google.com/macros/s/AKfycbwEdQ_sM7Uh3nGXuMWtDSByiMvbbkL8Z2SlmM1elMbeiJkLbfVrbfiHAt4s5x9KioIt/exec?action=ping`
   Kalau muncul `{"success":true,"version":"v2-2026-08-09",...}` — deployment kamu sudah bersih dan versi terbaru. Kalau muncul error lain, ulangi langkah 2–4 dengan teliti.

`admin-login.html` versi baru otomatis memanggil `?action=ping` saat halaman dibuka, dan akan menampilkan peringatan kuning kalau backend belum merespons dengan benar — jadi kamu tidak perlu menebak-nebak lagi.

## 🔴 Kenapa upload gagal terus?

Kemungkinan besar penyebabnya **sama seperti di atas** (script lama yang berjalan tidak punya endpoint `uploadMedia` versi baru, atau strukturnya beda). Setelah bersih-bersih di atas, upload akan mengembalikan pesan error yang jelas kalau memang masih gagal (bukan lagi "Parameter action diperlukan"), misalnya soal folder Drive atau format data — jadi lebih mudah dilacak.

Dua hal lain yang tetap perlu dicek:
- **"Who has access"** pada deployment harus **Anyone**, dan **"Execute as"** harus **Me** — supaya tamu tanpa akun Google tetap bisa mengunggah, dan script berjalan pakai izin Drive kamu (folder tidak perlu dibagikan ke publik, cukup akun kamu yang punya akses).
- Setelah bersih-bersih, jalankan `setupSheets()` sekali (Langkah 4 di bawah) supaya kolom-kolom baru yang dipakai v2 (`active_filter_id`, `frame_style`, `ui_config`) otomatis ditambahkan ke sheet `WEDDINGS`.

---

## Struktur Spreadsheet (sudah disesuaikan dengan Excel kamu)

Sistem ini sekarang memakai persis nama kolom dari `Album-RasyaRizky.xlsx` yang kamu kirim:

**Sheet `WEDDINGS`:** `wedding_id, groom_name, bride_name, date, admin_username, admin_password, theme, primary_color, secondary_color, max_photo, max_video_seconds, max_voice_seconds, allow_video, allow_voice, allow_filter, moderation, created_date`
— ditambah 3 kolom baru otomatis oleh `setupSheets()`: `active_filter_id, frame_style, ui_config`

**Sheet `MEDIA`:** `wedding_id, media_id, guest_name, media_type, file_id, file_url, thumbnail_url, date, time, status, moderated_by, moderated_date, caption`

**Sheet `FILTERS`:** `filter_id, name, css_filter, active, wedding_id` — kamu sudah punya 7 filter bawaan, tidak perlu diubah.

`admin_password` kamu **sudah dalam bentuk hash** (`1dd79e8c...`) — itu sudah benar sesuai sistem ini, jangan diganti ke plaintext.

## Langkah Setup dari Awal

### 1. Pasang Code.gs
Ikuti "bersih-bersih total" di atas.

### 2. Jalankan setupSecretKey (wajib, sekali)
Di Apps Script Editor, pilih fungsi `setupSecretKey` di dropdown atas → Run. Ini membuat kunci rahasia untuk menandatangani token login (disimpan di Script Properties, bukan di spreadsheet).

### 3. Password admin
Kalau mau ganti password, pakai fungsi `hashPasswordForSheet()`: ubah nilai `PASSWORD_MENTAH`, Run, copy hasil di Logger, paste ke kolom `admin_password`. **Jangan pernah simpan password mentah di sheet.**

### 4. Jalankan setupSheets (wajib, sekali)
Pilih fungsi `setupSheets` → Run. Ini otomatis menambahkan kolom `active_filter_id`, `frame_style`, `ui_config` ke sheet `WEDDINGS` tanpa menghapus data yang sudah ada, dan mengisi filter bawaan kalau sheet `FILTERS` masih kosong.

### 5. Deploy ulang
Deploy → Manage deployments → edit → New version → Deploy. Cek dengan `?action=ping` seperti dijelaskan di atas.

### 6. Upload 5 file HTML
Upload `index.html`, `admin-login.html`, `admin-dashboard.html`, `album.html` ke hosting statis yang sama (Netlify/Vercel/GitHub Pages/Firebase Hosting), dalam satu folder.

---

## Apa yang Berubah dari Revisi Kamu

### Kamera langsung terbuka (bukan pilih file)
`index.html` sekarang langsung meminta izin kamera dan menampilkan live preview begitu halaman dibuka. Ada 3 mode (Foto / Video / Suara) yang bisa digeser tamu, masing-masing dengan tombolnya sendiri — termasuk voice note dengan alur **Rekam → Putar → Ulang → Kirim** sesuai permintaan kamu.

### Kode Undangan otomatis, tidak bisa diisi manual
Field input Wedding ID **sudah dihapus total**. Begitu tamu membuka `index.html?w=rizky-amanda`, sistem membaca `w` dari URL dan menyimpannya di `localStorage`. Selama tamu tetap di browser yang sama:
- Pindah ke `album.html` lewat tombol "Lihat Album" → ID ikut terbawa.
- Balik lagi ke `index.html` lewat tombol "Kirim Momen" → ID tetap terbaca, tidak perlu buka link asli lagi.
- Kalau memang belum pernah membuka link manapun, halaman akan menampilkan pesan "Tautan Tidak Lengkap" — bukan kolom isian.

### Filter seragam, ditentukan admin
Tab **Filter Kamera** di dashboard menampilkan semua filter dari sheet `FILTERS`, admin pilih **satu** sebagai filter aktif. Filter ini otomatis diterapkan ke live preview kamera tamu maupun hasil foto/video — semua tamu memakai filter yang sama persis, tidak bisa pilih sendiri.

### Bingkai aesthetic saat download + audiogram untuk voice note
Tab **Tema & Frame** di dashboard: atur warna utama/sekunder dan pilih 1 dari 4 gaya bingkai (Elegant, Modern, Floral, Minimalist), dengan pratinjau langsung di kanvas. Saat tamu menekan tombol **Unduh** di album:
- **Foto** → dibingkai dengan nama mempelai & tanggal, diunduh sebagai JPG.
- **Video** → direkam ulang di browser dengan bingkai yang sama terbakar ke videonya, diunduh sebagai WebM.
- **Voice note** → dikonversi otomatis menjadi **video** berisi animasi audiogram melingkar yang bereaksi ke suara, dengan bingkai yang sama, diunduh sebagai WebM. Prosesnya berjalan real-time mengikuti durasi rekaman (voice note 30 detik = proses ±30 detik), jadi akan ada indikator "Memproses..." saat tombol ditekan.

Album juga sudah punya tombol **Play/Pause** khusus untuk video dan voice note (tidak perlu pakai kontrol bawaan browser).

### Pengaturan tema tersimpan di Google Sheets
Semua pengaturan tema (warna, gaya bingkai, judul halaman) disimpan di sheet `WEDDINGS` — warna di kolom `primary_color`/`secondary_color` yang sudah ada, gaya bingkai di kolom baru `frame_style`, dan judul halaman index/album di kolom baru `ui_config` (berbentuk JSON supaya fleksibel untuk pengembangan lanjutan tanpa perlu menambah kolom terus-menerus).

### Moderasi bisa dimatikan
Toggle **"Moderasi manual sebelum tampil di album"** di tab Pengaturan Umum. Kalau dimatikan, upload tamu langsung `approved` dan tampil di album tanpa menunggu persetujuan — sesuai kolom `moderation` yang sudah ada di Excel kamu.

---

## Catatan Teknis Penting

- **Kompatibilitas browser:** fitur kamera, MediaRecorder, dan konversi audiogram butuh browser modern (Chrome/Safari/Edge versi baru). Safari iOS versi lama kadang membatasi `captureStream()` — kalau ada laporan gagal dari iPhone lama, itu penyebabnya.
- **Ukuran file:** batas upload tetap 15MB (`MAX_FILE_MB` di `Code.gs`), sudah cukup untuk foto dan video pendek 30–60 detik.
- **Unduhan dengan bingkai** memakai fitur `getMediaFile` di `Code.gs` yang mengambil file dari Drive lewat server (menghindari masalah CORS yang lazim terjadi kalau canvas menggambar gambar/video dari Google Drive langsung).
- **Preview kamera terbalik (mirror) di kamera depan** sudah ditangani otomatis saat difoto/direkam, supaya hasilnya tidak terbalik seperti cermin.

## Troubleshooting Cepat

| Masalah | Kemungkinan Penyebab |
|---|---|
| `{"error":"Parameter action diperlukan"}` | Script lama masih tercampur — lakukan "bersih-bersih total" di atas |
| Login gagal terus padahal hash sudah benar | Sama seperti di atas, atau `SECRET_KEY` belum dibuat — jalankan `setupSecretKey()` |
| Upload gagal, pesan tidak jelas | Pastikan sudah redeploy versi terbaru dan cek `?action=ping` |
| Kolom `active_filter_id`/`frame_style` tidak ada | Jalankan `setupSheets()` di editor |
| Kamera tidak muncul / diminta izin terus | Pastikan situs diakses lewat **https** (kamera diblokir di http biasa), dan izin kamera browser diaktifkan |
| Unduhan voice note lama sekali | Wajar — proses konversi ke video butuh waktu sama dengan durasi rekamannya |
