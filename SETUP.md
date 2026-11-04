# Panduan Setup — Undangan Pernikahan Digital

Sistem ini terdiri dari 4 bagian yang saling terhubung:

1. **Google Sheet** — tempat Anda mengedit semua data (tanpa perlu sentuh kode).
2. **Google Apps Script** (`Code.gs`) — API yang menjembatani Sheet dengan kedua halaman web di bawah, sekaligus tempat memvalidasi login admin.
3. **`index.html` + `config.js`** (di-hosting di GitHub Pages) — halaman undangan **publik** yang dilihat tamu.
4. **`dashboard.html`** — dashboard admin: statistik kehadiran, daftar tamu, kirim undangan via WhatsApp, pengaturan template pesan. **Hanya untuk Anda**, dilindungi login.

```
Google Sheet  <—>  Apps Script (Web App)  <—┬—>  index.html (GitHub Pages, publik)
                                             └—>  dashboard.html (admin, login diperlukan)
```

## Bagaimana dashboard diamankan?

**Tidak ada username/password yang ditulis di file HTML mana pun.** Kredensial login disimpan di sheet **`AkunAdmin`**, dan setiap kali seseorang login lewat `dashboard.html`, kredensial itu dikirim ke server (Apps Script) untuk dicocokkan dengan sheet — baru setelah cocok, server mengeluarkan **token sesi** (berlaku 6 jam) yang disimpan di browser.

Yang membuat ini aman bukan cuma layar login di `dashboard.html`, tapi validasi di **server**: setiap permintaan data sensitif (`action=guests`, ubah status kirim, ubah template) **wajib** menyertakan token itu, dan `Code.gs` selalu mengecek ulang token tersebut sebelum membalas apa pun. Artinya:
- Kalau `dashboard.html` ini bocor/ke-upload ke tempat publik, orang yang membukanya tetap tidak bisa masuk tanpa username & password yang benar dari sheet `AkunAdmin`.
- Kalau seseorang mencoba memanggil URL API langsung (`.../exec?action=guests`) tanpa token yang valid, server menolak dan tidak mengirim data tamu apa pun.

Soal `config.js` di situs publik: itu dipisah **hanya untuk kerapian kode**, bukan untuk menyembunyikan URL (URL tetap terlihat lewat "View Source"). Itu tidak masalah karena endpoint publik (`config`, `comments`, `comment`) memang untuk umum dan tidak berisi data sensitif.

---

## 1. Buat Google Sheet

Buat 1 Spreadsheet baru, lalu buat **4 sheet (tab)** dengan nama PERSIS seperti berikut (huruf besar/kecil berpengaruh):

### a. `DataMempelai`
Kolom: `field | value | keterangan`
Import file **`sheet-template/DataMempelai.csv`** (File > Import > Insert new sheet, rename jadi `DataMempelai`).

Field yang bisa Anda ubah di sini (semua diambil dari template undangan Anda):

| Field | Contoh isi | Dipakai untuk |
|---|---|---|
| `judul_hero` | Undangan Pernikahan | Judul kecil di halaman |
| `nama_panggilan_pria` / `nama_panggilan_wanita` | Wahyu / Riski | Judul besar & pesan WA |
| `nama_lengkap_pria` / `nama_lengkap_wanita` | Wahyu Siapa / Riski Siapa | Bagian "Mempelai" |
| `status_anak_pria` / `status_anak_wanita` | Putra ke-1 / Putri ke-2 | |
| `ayah_pria`, `ibu_pria`, `ayah_wanita`, `ibu_wanita` | Bapak/Ibu ... | |
| `tanggal_acara_iso` | `2026-12-15 10:00:00` | **Wajib** format ini, dipakai hitung mundur |
| `tanggal_tampil` | Selasa, 15 Desember 2026 | Teks tanggal + dipakai di pesan WA |
| `waktu_akad`, `waktu_resepsi` | 08.00 - 10.00 WIB | |
| `nama_lokasi`, `alamat_lokasi`, `link_maps` | | |
| `dress_code` | | |
| `quote_1_teks`/`quote_1_sumber`, `quote_2_teks`/`quote_2_sumber` | Ayat Al-Qur'an | |
| `cerita_1_judul`/`cerita_1_isi` ... `cerita_3_*` | | Bagian "Kisah Cinta" (3 tahap) |
| `foto_cover_url`, `foto_pria_url`, `foto_wanita_url` | link gambar langsung | |
| `galeri_url` | url1,url2,url3 (pisahkan koma) | Galeri foto |
| `bank_nama`, `bank_rekening`, `bank_atas_nama`, `qris_image_url` | | Love Gift — rekening 1 |
| `bank_nama_2`, `bank_rekening_2`, `bank_atas_nama_2` | | Love Gift — rekening 2 (opsional, kosongkan semua kalau cuma 1 rekening) |
| `musik_url` | | Opsional, musik latar. **Wajib link file mp3 langsung**, lihat catatan di bawah tabel |
| `gift_nama`, `gift_hp`, `gift_alamat` | | Love Gift — kirim hadiah fisik |
| `bukti_tf_enabled` | `on` / `off` | **BARU** — tampilkan form upload bukti transfer / resi kado di bawah alamat kirim kado (bawaan: `off`) |
| `bukti_tf_drive_link` | `https://drive.google.com/drive/folders/XXXX` | **BARU** — folder Google Drive tempat foto bukti disimpan. Kosong = dibuat otomatis ("Bukti Transfer Undangan"). Field ini **tidak** ikut ke respons publik |
| `base_url` | `https://rizky-rasya.github.io/amplop/` | **Wajib**, dipakai membuat link tamu (`$link_undangan`) |
| `apps_script_url` | (isi setelah langkah 2) | referensi Anda sendiri |
| `template_pesan_wa` | (dikosongkan) | **Diisi/diubah otomatis lewat dashboard**, bukan manual |

> Tips: untuk `foto_*_url` dan `galeri_url`, upload foto ke Google Drive → klik kanan **Get link** → ubah menjadi format:
> `https://drive.google.com/uc?export=view&id=FILE_ID`, atau gunakan layanan hosting gambar lain.

> **Soal `musik_url` tidak bunyi:** link dari GitHub yang dibuka lewat halaman web (`github.com/.../blob/...`) itu HTML, bukan file mp3 — browser tidak bisa memutarnya langsung. Ubah jadi link **raw**: ganti `github.com` menjadi `raw.githubusercontent.com` dan hapus `/blob` dari URL-nya. Contoh:
> - Salah: `https://github.com/user/repo/blob/COMMIT/lagu.mp3`
> - Benar: `https://raw.githubusercontent.com/user/repo/COMMIT/lagu.mp3`
>
> Soal autoplay: browser tidak mengizinkan audio bersuara diputar otomatis sebelum ada interaksi. Situs ini menyiasatinya dengan memutar musik dalam kondisi **senyap** begitu halaman terbuka, lalu otomatis membuka suaranya tepat saat tamu menekan tombol **"Buka Undangan"** (karena itu sudah dihitung sebagai interaksi pengguna oleh browser). Tombol 🔊/🔇 di pojok kanan bawah (sebelah kiri tombol tema) untuk mute/unmute manual kapan saja.

### b. `NamaTamuUndangan`
Kolom: `no | nama_tamu | jenis_tamu | nomor_hp | id_tamu | link_undangan | status_kirim | tanggal_kirim | status_absen | tanggal_absen`
Import **`sheet-template/NamaTamuUndangan.csv`**.

- **Kolom `jenis_tamu`**: buat data validation dengan pilihan mis. `Keluarga, Teman Kantor, Teman Kuliah, Tetangga, VIP`. Dipakai untuk filter jenis tamu di dashboard.
- **Kolom `nomor_hp`**: isi manual, boleh format `08xxx` atau `+62xxx` — dashboard otomatis menormalkannya jadi `62xxx` saat kirim WA.
- **Kolom `id_tamu`**: token **acak** (bukan angka urut!) yang ikut tertanam di `link_undangan` sebagai `&k=...`. Inilah yang membuat sistem tetap tahu link itu punya siapa, **walaupun tamu mengetik nama lain** saat mengisi Ucapan & Doa. Diisi **otomatis oleh Apps Script**, bukan rumus sheet (lihat langkah di bawah) — supaya nilainya benar-benar acak dan tidak bisa ditebak/diurutkan seperti `T1`, `T2`, dst.
- **Kolom `link_undangan`**: dibuat otomatis oleh rumus di bawah, menyertakan `id_tamu` lewat parameter `k` (sengaja bukan `id` supaya tidak terlihat seperti "pengenal tamu" bagi orang iseng yang membaca URL).
- **Kolom `status_kirim`**: isi `FALSE` untuk baris baru, lalu jadikan checkbox (select kolom > Data > Data validation > Criteria "Checkbox"). Kolom ini **disimpan di sheet**, jadi statusnya sama persis di perangkat/browser mana pun Anda buka dashboard.
- **Kolom `tanggal_kirim`**: dikosongkan, terisi otomatis.
- **Kolom `status_absen`**: dikosongkan, terisi otomatis (`Hadir` / `Tidak Hadir` / `Masih Ragu`) begitu tamu dengan `id_tamu` itu mengisi form Ucapan & Doa di situs publik — terlepas dari nama apa yang mereka ketik di form. Dibatasi cooldown 30 detik per token supaya tidak bisa dibanjiri update beruntun.
- **Kolom `tanggal_absen`**: dikosongkan, terisi otomatis bersamaan dengan `status_absen`.
- Header ini dibaca **dinamis** oleh backend (huruf besar/kecil & spasi tidak masalah, otomatis dinormalkan), jadi kalau susunan kolom di sheet Anda sedikit berbeda, backend tetap menyesuaikan selama nama kolomnya sama secara makna.

**Langkah pengisian:**
1. Isi kolom `no`, `nama_tamu`, `jenis_tamu`, `nomor_hp` seperti biasa. **Biarkan `id_tamu` kosong dulu.**
2. Buat **Named Range** `base_url` dari sheet `DataMempelai`.
3. Di sel **F2** (`link_undangan`, sesuaikan kalau urutan kolom Anda beda), sertakan `id_tamu` lewat parameter `k`:
   ```
   =base_url&"?to="&ENCODEURL(B2)&"&k="&E2
   ```
   Tarik ke bawah untuk semua baris.
4. Buka **Extensions > Apps Script** di spreadsheet Anda, pilih fungsi **`generateMissingGuestIds`** dari dropdown toolbar, klik **Run**. Ini mengisi `id_tamu` untuk semua baris yang masih kosong dengan token acak (format seperti `xJ3kQ9zP-a1B`, bukan `T1`/`T2`) — sekali jalan, dan aman dijalankan ulang kapan pun setelah menambah tamu baru (baris yang sudah punya id tidak akan ditimpa).
5. Setelah itu, kolom `link_undangan` otomatis lengkap dengan token acaknya.

> Kalau sheet Anda **sudah terlanjur** memakai id lama yang berurutan (`T1`, `T2`, ...) dan **belum ada undangan yang benar-benar terkirim** ke tamu asli, jalankan **`regenerateAllGuestIds`** sekali (juga dari dropdown fungsi Apps Script) untuk mengganti SEMUA id jadi token acak baru sekaligus. Kalau sudah ada tamu yang menerima link lamanya, regenerate akan memutus deteksi-absen-otomatis untuk link yang sudah terkirim itu (linknya tetap bisa dibuka, cuma bagian absen-otomatisnya yang perlu link baru dikirim ulang).

### c. `KonfirmasiTamuUndangan`
Kolom: `timestamp | comment_id | nama | presensi | jumlah_hadir | ucapan_doa | edit_token | id_tamu`
Import **`sheet-template/KonfirmasiTamuUndangan.csv`** (cukup header — baris di bawahnya terisi otomatis dari form "Ucapan & Doa" di situs publik).

- **`comment_id`**: token acak, ditampilkan ke publik lewat daftar ucapan (dipakai untuk menunjuk "ucapan yang mana").
- **`jumlah_hadir`**: hanya terisi kalau tamu memilih presensi **Hadir**; kosong untuk Tidak Hadir/Masih Ragu.
- **`edit_token`**: token rahasia terpisah, **tidak pernah** ditampilkan ke publik — hanya dikirim sekali ke pengirimnya sendiri (disimpan di localStorage browser mereka) supaya nanti mereka bisa **Ubah**/**Hapus** ucapannya sendiri lewat situs publik. Tanpa token yang cocok, permintaan ubah/hapus ditolak server — jadi orang lain tidak bisa mengubah/menghapus ucapan siapa pun selain miliknya.
- **`id_tamu`**: disalin dari link undangan yang dipakai tamu saat mengisi (kalau ada), dipakai untuk tetap memperbarui `status_absen` di `NamaTamuUndangan` kalau ucapan itu diedit presensinya nanti.

### d. `AkunAdmin` — kredensial login dashboard
Kolom: `username | password`
Import **`sheet-template/AkunAdmin.csv`**, lalu **ganti password contohnya** dengan yang Anda mau. Bisa tambah lebih dari satu baris kalau lebih dari satu orang perlu akses dashboard.

> Password di sini tersimpan sebagai teks biasa di sheet Anda sendiri (bukan hal baru — Anda sudah punya akses penuh ke sheet ini). Yang penting: jangan bagikan akses "edit" sheet ke orang yang tidak seharusnya tahu kredensial dashboard.

### e. `BuktiTransfer` — daftar bukti transfer / resi kado (BARU)
Kolom: `timestamp | bukti_id | id_tamu | nama | tujuan | file_name | file_url | file_id`
**Tidak perlu dibuat manual** — sheet ini dibuat otomatis begitu bukti pertama masuk (atau Anda boleh import **`sheet-template/BuktiTransfer.csv`** untuk header-nya). Setiap tamu yang mengunggah menambah 1 baris:
- `id_tamu`: diambil otomatis dari parameter `k` di link undangan (kosong kalau tamu membuka link umum tanpa `k`, atau id-nya tidak ada di daftar tamu).
- `nama`: nama yang diketik tamu di form (boleh beda dari `nama_tamu` di undangan).
- `tujuan`: `pria` atau `wanita` (mempelai yang dituju).
- `file_url` / `file_id`: lokasi file di Google Drive.

> Jangan edit kolom `bukti_id` dan `file_id` secara manual — dipakai tombol Hapus di dashboard.

---

## 2. Pasang Apps Script

1. Di Spreadsheet, buka **Extensions > Apps Script**.
2. Hapus isi `Code.gs` bawaan, tempel isi file **`apps-script/Code.gs`** dari paket ini.
3. Klik **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy**, izinkan akses (Authorize access) — pilih akun Anda, **Advanced > Go to (nama project) (unsafe) > Allow** (wajar untuk skrip milik sendiri).
5. Salin **Web app URL** (`https://script.google.com/macros/s/XXXXXXXX/exec`). URL ini dipakai **baik oleh situs publik maupun dashboard** — tidak perlu dua URL berbeda, karena aksesnya sudah dipisahkan lewat pengecekan token di server, bukan lewat URL yang berbeda.
6. Tempelkan URL itu ke baris `apps_script_url` di sheet `DataMempelai` (arsip), ke `config.js` (langkah 3), dan ke `APPS_SCRIPT_URL` di `dashboard.html` (sudah terisi URL Anda saat ini — cukup diperiksa ulang tiap kali Anda deploy ulang).

> Setiap kali Anda mengubah `Code.gs`, jalankan lagi **Deploy > Manage deployments > Edit (pensil) > Version: New version > Deploy** supaya perubahan aktif di URL yang sama.

> **Khusus fitur upload bukti transfer:** `Code.gs` sekarang memakai Google Drive, jadi butuh izin baru. Sebelum deploy versi baru, di editor Apps Script pilih fungsi **`authorizeDrive`** pada dropdown lalu klik **Run**, dan izinkan akses Drive. Baru setelah itu **Deploy > Manage deployments > Edit > New version > Deploy**. Kalau langkah ini terlewat, upload dari situs akan gagal dengan pesan error izin.

---

## 3. Siapkan `index.html` & unggah ke GitHub Pages

1. Buka **`config.js`**, pastikan:
   ```js
   window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
   sesuai URL dari langkah 2.5.
2. Upload `index.html` **dan** `config.js` ke root repo GitHub Pages Anda (mis. `rizky-rasya/amplop`), folder yang sama.
3. **Settings > Pages**, source `main` branch, folder `/root`.
4. URL publik Anda: `https://rizky-rasya.github.io/amplop/`. Isikan ke field `base_url` di `DataMempelai`.
5. Link personal per tamu otomatis berbentuk:
   ```
   https://rizky-rasya.github.io/amplop/?to=Teman%20teman%20semua
   ```
   Nama di `?to=` inilah yang otomatis muncul di "Kepada Yth. Bapak/Ibu/Saudara/i" pada halaman sampul undangan.

### Ucapan & Doa — jumlah hadir, ubah, dan hapus

Saat tamu memilih **Hadir** di form Ucapan & Doa, muncul field tambahan **"Jumlah yang Hadir"** (minimal 1, tanpa batas atas) — hilang otomatis kalau mereka pilih Tidak Hadir/Masih Ragu, karena memang tidak relevan.

Setelah mengirim, tamu bisa **Ubah** atau **Hapus** ucapannya sendiri kapan saja — tombolnya otomatis muncul di kartu ucapan miliknya sendiri (dideteksi lewat token tersimpan di browser mereka, bukan lewat login). Kalau mereka membuka situs dari **browser/perangkat lain**, tombol itu tidak akan muncul (token hanya ada di perangkat tempat mereka pertama mengirim) — itu wajar dan sesuai desain keamanannya.

---

## 4. Pakai `dashboard.html`

`dashboard.html` **tidak perlu di-hosting di GitHub Pages** (dan sebaiknya tidak digabung ke repo publik yang sama) — karena keamanannya sudah dijamin lewat login + token di server, Anda cukup:
- Membukanya langsung dari komputer (double-click file-nya), atau
- Meng-upload ke repo GitHub **privat** terpisah + GitHub Pages, atau layanan hosting statis apa pun yang Anda kontrol.

Buka file, login dengan username/password dari sheet `AkunAdmin`. Sesi berlaku **6 jam**, setelah itu Anda perlu login ulang (server menolak token lama secara otomatis).

Halaman yang tersedia lewat sidebar:

**Dashboard** — kartu statistik Total Tamu, Hadir, Tidak Hadir, Masih Ragu (dengan persentase dari total yang merespons), Sudah Kirim WA, Belum Kirim WA, plus panel **Konfirmasi Terbaru** (10 ucapan terbaru secara default, dengan kontrol paginasi — lihat di bawah).

**Data Mempelai** — form lengkap untuk semua field sheet `DataMempelai` (nama mempelai & orang tua, tanggal/lokasi acara, ayat & kisah cinta, foto/galeri/musik, rekening & hadiah, base URL), dikelompokkan jadi beberapa bagian yang bisa dibuka/tutup. Klik **Simpan Semua Perubahan** untuk menyimpan ke sheet — situs undangan langsung memakai data terbaru begitu tamu refresh, tidak perlu edit sheet manual lagi.

**Daftar Tamu** — tabel tamu dari `NamaTamuUndangan`, dengan:
- Dropdown **filter Jenis Tamu**, otomatis berisi semua jenis yang pernah diketik di sheet (bertambah sendiri tiap ada jenis baru).
- Tombol **➕ Tambah Tamu** — buka form Nama, Jenis Tamu, No HP. `id_tamu` dan `link_undangan` dibuat otomatis.
- Kolom Aksi **✏️ Ubah** / **🗑️ Hapus** per baris.
- Field **Jenis Tamu** di form Tambah/Ubah berupa kombobox: kalau belum ada riwayat jenis tamu, ketik manual bebas; begitu ada riwayat, mengetik akan memunculkan saran dari jenis-jenis yang sudah pernah dipakai (boleh pilih salah satu, atau tetap ketik yang baru sama sekali).
- **10 tamu terbaru** ditampilkan lebih dulu (default), dengan kontrol paginasi (lihat di bawah).

**Kirim WA** — sama seperti Daftar Tamu (filter dropdown dari sheet, 10 terbaru + paginasi), tambah kolom Aksi:
- Tombol **Kirim** per tamu — membuka WhatsApp dengan pesan terisi dari Template, lalu status otomatis tersimpan ke sheet.
- **Kirim Semua** — mengirim ke semua tamu belum terkirim sesuai filter/pencarian aktif. **Catatan penting:** WhatsApp tidak punya API kirim massal gratis, dan browser bisa memblokir banyak `window.open` berturut-turut dalam satu aksi — kalau Anda perhatikan ada tab WA yang tidak terbuka padahal statusnya sudah "sudah dikirim", buka ulang manual dari tombol Kirim per baris untuk tamu itu. Untuk jumlah tamu banyak, kirim per beberapa puluh sekaligus lebih aman daripada sekali klik untuk ratusan.
- **Reset Status** — mengembalikan status_kirim semua tamu ke "Belum" di sheet (ada konfirmasi, tidak bisa dibatalkan).

**Paginasi** (Dashboard > Konfirmasi Terbaru, Daftar Tamu, Kirim WA): tiap panel punya kontrol jumlah baris per halaman — **10 / 50 / 100 / All** — plus tombol **‹ Sebelumnya** dan **Berikutnya ›**. Defaultnya 10 baris terbaru.

**Bukti Transfer** (BARU) — tabel semua bukti transfer / resi kado yang diunggah tamu: waktu, **ID tamu**, **siapa yang transfer** (nama yang diketik; kalau beda dari nama di undangan, nama undangannya ikut ditampilkan kecil di bawahnya), **dikirim ke** mempelai pria/wanita, dan tombol **🔗 Buka** untuk membuka foto di Google Drive. Ada filter tujuan (pria/wanita), pencarian nama/ID, paginasi 10/50/100/All, serta tombol 🗑️ hapus (baris dihapus dan file Drive dipindah ke Sampah, masih bisa dipulihkan). Kalau form upload sedang dimatikan, muncul peringatan kuning di atas tabel.

**Template Pesan** — edit format pesan WA, tersimpan ke sheet `DataMempelai` (field `template_pesan_wa`), jadi konsisten dipakai baik dibuka dari perangkat mana pun. Variabel yang tersedia:

| Variabel | Sumber |
|---|---|
| `$nama_tamu` | Kolom `nama_tamu` di `NamaTamuUndangan` |
| `$nama_pria` / `$nama_wanita` | Nama lengkap dari `DataMempelai` |
| `$panggilan_pria` / `$panggilan_wanita` | Nama panggilan dari `DataMempelai` |
| `$tanggal_acara` | `tanggal_tampil` |
| `$waktu_akad` / `$waktu_resepsi` | |
| `$nama_lokasi` / `$alamat_lokasi` / `$link_maps` | |
| `$link_undangan` | Link personal tamu (`base_url` + `?to=` + nama) |
| `$ayah_pria` / `$ibu_pria` / `$ayah_wanita` / `$ibu_wanita` | |
| `$dress_code` | |

Klik tombol variabel untuk menyisipkan ke posisi kursor, **Pratinjau** untuk melihat hasil dengan contoh data, **Simpan Template** untuk menyimpan ke sheet.

---

## Tab "Tampilan Undangan" — atur warna, bentuk & font dari dashboard

Semua pengaturan di tab ini disimpan di sheet **`PengaturanTema`** (dibuat otomatis saat pertama kali klik "Simpan Tampilan" — tidak perlu dibuat manual), dan langsung dipakai oleh `index.html` setiap kali situs undangan dimuat/di-refresh. Tidak perlu upload ulang file apa pun setelah menyimpan.

**Preset Tema** — 4 pilihan siap pakai (Emerald Gold, Rose Blush, Ocean Teal, Midnight Mono), masing-masing dengan palet warna terpisah untuk mode terang & gelap. Klik salah satu untuk langsung menerapkannya; kartu "Kustom" otomatis aktif begitu Anda mengubah warna apa pun secara manual.

**Pratinjau** — kotak mockup kecil (judul, kartu kutipan, angka hitung mundur, tombol) yang mengikuti warna/bentuk/font yang sedang dipilih secara langsung, dengan toggle Mode Terang/Gelap untuk mengecek keduanya sebelum disimpan.

**Warna Kustom** — 7 warna untuk mode terang dan 7 untuk mode gelap (Latar Belakang, Kartu/Permukaan, Permukaan Sekunder, Teks Utama, Teks Redup, Aksen/Emas, Aksen Lembut), masing-masing bisa diisi lewat color-picker atau ketik kode hex langsung. Warna garis/border tipis di seluruh situs dihitung otomatis dari warna Aksen (tidak perlu diatur terpisah).

**Bentuk & Tipografi**:
- *Bentuk sudut* — Tajam / Lembut / Bulat, berlaku ke kartu kutipan, kartu acara, kartu lokasi, kartu hadiah, dan sedikit ke sudut bawah bingkai foto (bagian atas bingkai foto yang melengkung seperti kubah sengaja dipertahankan di semua preset sebagai ciri khas desain).
- *Gaya font* — Elegant (Cormorant Garamond + Jost, bawaan), Modern (Poppins + Inter), Klasik (Playfair Display + Lato). Teks Arab (ayat Al-Qur'an) tetap memakai font Amiri di semua pilihan.

**Bagian yang Ditampilkan** — 7 sakelar untuk sembunyikan/tampilkan section situs undangan: Mempelai, Ayat Al-Qur'an, Kisah Cinta, Acara & Lokasi (+ hitung mundur), Galeri Foto, Hadiah/Amplop Digital, Ucapan & Doa. Matikan bagian yang memang tidak Anda perlukan (misalnya tidak punya galeri foto, atau tidak mau buka amplop digital) — perubahannya langsung terlihat di kotak Pratinjau di atasnya (baris ikon kecil di bagian bawah pratinjau meredup/coret kalau dimatikan). Halaman sampul (pembuka) dan footer penutup selalu tampil, tidak termasuk yang bisa dimatikan.

Klik **Simpan Tampilan** untuk menyimpannya ke sheet, atau **Reset ke Preset Bawaan** untuk kembali ke Emerald Gold (semua section aktif) tanpa menyimpan.

---

## Tab "Akun" — kelola siapa saja yang bisa buka dashboard

**Ganti Password Saya** — form untuk mengganti password akun yang sedang Anda pakai login. Wajib memasukkan password lama yang benar (diverifikasi di server) sebelum password baru disimpan.

**Akun Dashboard** — daftar semua username yang bisa login ke dashboard ini (dari sheet `AkunAdmin`). Password tidak pernah ditampilkan di sini (bahkan ke sesama admin) — hanya bisa **🔑 Reset** (atur ulang jadi password baru tanpa perlu tahu yang lama) atau **🗑️ Hapus**. Tombol **➕ Tambah Akun** untuk mengundang admin lain (mis. WO, keluarga yang bantu kirim undangan) tanpa perlu membagikan password Anda sendiri.

> Sistem menolak menghapus akun kalau itu tinggal satu-satunya akun tersisa — supaya dashboard tidak pernah terkunci total tanpa ada yang bisa login.

---

## Fitur Upload Bukti Transfer / Resi Kado (BARU)

### Tampilan untuk tamu
Di bagian **Hadiah** situs undangan, tepat di bawah alamat kirim kado, muncul kartu **"Konfirmasi Transfer / Kirim Kado"** berisi:
1. **Nama** — terisi otomatis dari nama di link undangan (`?to=`), tetap bisa diubah.
2. **ID tamu** — diambil otomatis dari parameter `k` di link undangan, **tidak ditampilkan** ke tamu.
3. **Dikirim ke** — pilihan radio berupa dua kartu foto: mempelai wanita (kiri) dan mempelai pria (kanan), lengkap dengan nama panggilan dari Data Mempelai.
4. **Bukti transfer atau resi kado** — pilih/ambil foto. Pratinjau, nama file, dan ukuran akhir langsung tampil.
5. Tombol **Kirim Bukti**; hasilnya tampil di popup modal (lihat bagian Tampilan & perilaku form).

### Tampilan & perilaku form (UI/UX)
- **Terlipat saat pertama dibuka.** Kartu hanya menampilkan judul dan penjelasan singkat; detail form (nama, tujuan, foto, tombol kirim) tersembunyi di dalam `<details>`. Tamu menekan tombol **"Unggah bukti transfer / resi kado"** (berlabel **Buka** dengan ikon maximize, berubah jadi **Tutup** dengan ikon minimize saat terbuka) untuk membuka atau melipat form. Bisa dioperasikan dengan keyboard (Enter/Spasi) dan terbaca pembaca layar sebagai kontrol buka-tutup.
- **Semua hasil tampil di popup modal** yang sama dengan modal sistem lainnya (backdrop blur, ikon status, tema terang/gelap, fokus terkunci, tombol Esc). Tidak ada lagi teks `form-msg` di bawah tombol; yang tersisa hanya baris progres kecil ("Memproses foto…" / "Mengunggah bukti…").
  - **Validasi** (nama kosong, tujuan belum dipilih, foto belum dipilih) → modal galat; setelah ditutup, kursor otomatis pindah ke kolom yang bermasalah.
  - **Gagal** (server menolak, koneksi putus, foto tidak bisa dikecilkan) → modal "Bukti belum terkirim" / "Foto belum bisa diproses". Isi form dan foto tetap ada, jadi tamu tinggal menekan kirim lagi.
  - **Berhasil** → modal sukses berisi ucapan terima kasih **dan doa**, lalu form dikosongkan dan kartu terlipat kembali.
- **Isi ucapan & doa disusun dari data sistem**, bukan teks tetap:
  - Judul: `Terima kasih, {nama tamu}` (nama yang diketik di form).
  - Kalimat konfirmasi menyebut penerima sesuai pilihan radio, memakai `nama_panggilan_pria` atau `nama_panggilan_wanita` dari Data Mempelai.
  - Doa memuat nama tamu serta kedua nama panggilan mempelai (`{pria} & {wanita}`), dengan lafaz *Jazakumullahu khairan* (جَزَاكُمُ اللّٰهُ خَيْرًا), doa keberkahan untuk tamu, dan doa sakinah, mawaddah, wa rahmah untuk mempelai. Tombol penutupnya berlabel **Aamiin**.
  - Kalau ingin mengubah redaksi doa, edit fungsi `proofThanks()` di `index.html`.

### Foto pada pilihan "Dikirim ke"
Kartu pilihan memakai foto mempelai dalam bingkai kubah yang senada dengan foto di bagian Mempelai (bukan ikon). Tanda terpilih ditunjukkan dengan border emas **dan** centang di pojok kartu, jadi tidak hanya mengandalkan warna.
- **File foto:** `assets/Rasya_Radio.webp` (wanita) dan `assets/Rizky_Radio.webp` (pria). Kalau salah satu file tidak ada, otomatis dipakai `foto_wanita_url` / `foto_pria_url` dari Data Mempelai; kalau itu pun gagal, bingkai foto disembunyikan dan kartu tetap berfungsi dengan teks saja.
- **Ukuran tampil:** 76–108 px (menyesuaikan lebar layar), rasio mengikuti foto asli 1950×1978, sehingga tidak ada lompatan tata letak.
- **Hemat data:** foto baru diunduh saat tamu membuka form (kartu tertutup di awal, dan gambar memakai `loading="lazy"`).
- **Sebaiknya perkecil file aslinya.** Browser memang menampilkannya kecil, tetapi tetap mengunduh file 1950 px penuh. Untuk tampilan maksimal 108 px (layar retina ±2–3×), cukup **±400 px**. Contoh dengan Python (Pillow):
  ```python
  from PIL import Image
  for n in ["Rasya_Radio", "Rizky_Radio"]:
      im = Image.open(f"assets/{n}.webp"); im.thumbnail((400, 406))
      im.save(f"assets/{n}.webp", "WEBP", quality=82, method=6)
  ```
  atau dengan ImageMagick: `magick Rasya_Radio.webp -resize 400x -quality 82 Rasya_Radio.webp`. Hasilnya biasanya hanya 15–40 KB per foto.
- Teks alternatif foto sengaja dikosongkan (`alt=""`) karena nama mempelai sudah terbaca dari label di sebelahnya; jika diisi, pembaca layar akan mengucapkan nama dua kali.

**Kompresi otomatis:** foto JPG/PNG/WebP/GIF yang sudah ≤ 100 KB dikirim apa adanya. Foto yang lebih besar (atau format gambar lain yang bisa dibaca browser) dikecilkan **di browser tamu** menjadi JPEG ≤ 100 KB: kualitas diturunkan bertahap lalu dimensi dikecilkan (maks. 1400 px) sampai ukurannya cukup. PNG transparan diberi latar putih. File non-gambar ditolak.

### Pengaturan di dashboard
1. **Data Mempelai → 🎁 Hadiah**:
   - Centang **"Tampilkan form upload bukti transfer / resi kado…"** untuk menampilkan form (bawaan mati). Hilangkan centang untuk menyembunyikannya; server juga menolak unggahan saat fitur mati.
   - Isi **"Link folder Google Drive tujuan bukti TF"** dengan link folder Drive Anda (mis. `https://drive.google.com/drive/folders/1AbC…`). **Kosongkan** kalau ingin dibuatkan otomatis folder bernama "Bukti Transfer Undangan" di Drive Anda — linknya lalu diisikan ke kolom ini.
   - Klik **Simpan Semua Perubahan**.
2. Menu **Bukti Transfer** untuk melihat daftar bukti masuk.

### Panduan perubahan spreadsheet (apa yang perlu Anda lakukan)
| Sheet | Perubahan | Tindakan |
|---|---|---|
| `DataMempelai` | 2 baris baru: `bukti_tf_enabled`, `bukti_tf_drive_link` | Tidak perlu manual — cukup isi lewat dashboard (Data Mempelai → Hadiah → Simpan), baris dibuat otomatis. Atau tambah sendiri dua baris itu di bawah tabel (field di kolom A, nilai di kolom B). |
| `BuktiTransfer` | Sheet baru | Dibuat otomatis saat bukti pertama masuk. Opsional: import `sheet-template/BuktiTransfer.csv`. |
| `NamaTamuUndangan`, `KonfirmasiTamuUndangan`, `AkunAdmin`, `PengaturanTema` | Tidak berubah | — |

### Langkah deploy
1. Timpa `Code.gs` di Apps Script dengan versi terbaru.
2. Jalankan fungsi **`authorizeDrive`** sekali (Run) dan izinkan akses Google Drive.
3. **Deploy > Manage deployments > Edit > New version > Deploy**.
4. Upload `index.html` terbaru (situs publik) dan buka `dashboard.html` terbaru (admin).
5. Di dashboard: aktifkan toggle bukti TF + (opsional) isi link folder Drive → Simpan.
6. Tes: buka link undangan personal (`?to=Nama&k=TOKEN`), unggah foto dari HP, lalu cek menu **Bukti Transfer** dan folder Drive.

### Keamanan & batasan
- File di Drive **tidak dibuat publik**; hanya pemilik Drive yang bisa membukanya. Tautan "Buka" di dashboard butuh Anda login ke akun Google pemilik Drive.
- Server memeriksa ulang: fitur harus `on`, ukuran ≤ 150 KB (toleransi), jenis file asli lewat *magic bytes* (JPG/PNG/GIF/WebP) — bukan sekadar ekstensi, tujuan harus `pria`/`wanita`.
- Anti-spam: jeda 15 detik per `id_tamu`, maksimal 10 unggahan per `id_tamu`, dan batas total 200 unggahan per ±6 jam.
- `id_tamu` hanya dipercaya kalau ada di sheet `NamaTamuUndangan`; kalau tidak, bukti tetap tersimpan tapi `id_tamu` dikosongkan.
- Link folder Drive **tidak** ikut ke respons publik `action=config` (hanya terkirim ke dashboard yang sudah login).
- Folder dari link harus milik akun pemilik Apps Script, atau dibagikan ke akun itu sebagai **Editor** — kalau tidak, muncul pesan "Folder Google Drive tidak bisa diakses".

### Masalah umum
- **Form tidak muncul di undangan** → toggle belum dicentang/belum disimpan, atau `index.html` lama masih terpasang (refresh keras).
- **"Tidak dapat terhubung ke server"** → `APPS_SCRIPT_URL` salah, atau belum deploy versi baru.
- **Error izin / DriveApp** → jalankan `authorizeDrive` lalu deploy versi baru.
- **"Foto sulit dikecilkan"** → coba foto lain atau tangkapan layar (screenshot) bukti transfer.
- **Foto HEIC dari iPhone** → biasanya terbaca browser dan dikonversi ke JPEG otomatis; kalau gagal, ubah pengaturan kamera ke "Most Compatible".

---

## Tema Terang / Gelap (situs publik)

Tombol bulat di pojok kanan bawah halaman ( ◐ ) mengganti tema **light (day)** ↔ **night**. Pilihan disimpan di browser tamu; kalau belum pernah memilih, otomatis mengikuti preferensi sistem perangkat mereka.

## Catatan keamanan & teknis

- **Kredensial dashboard hanya ada di sheet `AkunAdmin`**, tidak pernah ditulis ke file HTML. Login memanggil `action=login` di server, server membalas token sesi (6 jam), dan token itulah yang dipakai untuk semua permintaan sensitif berikutnya (`guests`, `update_status`, `reset_status`, `save_template`) — semuanya divalidasi ulang di `Code.gs`, bukan cuma dicek di layar login.
- Kalau curiga sesi/akses bocor: ganti password di sheet `AkunAdmin` — token lama otomatis tidak berguna begitu masa berlakunya (maks. 6 jam) habis, dan token baru hanya bisa didapat dengan password yang benar.
- **`config.js` bukan lapisan keamanan** — hanya kerapian kode; URL API publik memang boleh terlihat karena isinya cuma data undangan umum + ucapan/doa tervalidasi.
- Data POST (kirim ucapan, login, update status, dll.) dikirim sebagai `text/plain` (bukan `application/json`) agar browser tidak melakukan **CORS preflight**, karena Apps Script Web App tidak menjawab request `OPTIONS`. Jangan ubah `Content-Type` kecuali Anda menambahkan `doOptions()` sendiri di `Code.gs`.
- Jika `APPS_SCRIPT_URL` belum diisi/API gagal diakses, `index.html` tetap tampil dengan data contoh (`FALLBACK_DATA`) dan `dashboard.html` dengan data contoh (mock, ditandai peringatan) supaya Anda tetap bisa cek tampilan sebelum backend siap sepenuhnya.
- Semua teks & label UI sudah dalam Bahasa Indonesia sesuai permintaan.
