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

## 🆕 Revisi Terbaru (Tahap 2)

### Apa yang berubah
| # | Perubahan | Di mana mengaturnya |
|---|---|---|
| 1 | **Loading** memakai GIF (cincin emas + hati berdenyut), bukan ring CSS | Ganti file `assets/loading.gif` (GIF transparan ±96×96 px) |
| 2 | **Statistik acara** di dashboard: Total Orang Hadir, Hadir Akad, Hadir Resepsi, Hadir Ngunduh Mantu (jumlah orang + jumlah konfirmasi). Daftar konfirmasi terbaru juga menampilkan jumlah & acara | Dashboard > Ringkasan (otomatis dari kolom `acara_hadir` & `jumlah_hadir`) |
| 3 | **Bunga di belakang foto mempelai**. Wanita: `floral-left1` kiri-atas, `floral-right` kanan-bawah. Pria: `floral-right1` kanan-atas, `floral-left` kiri-bawah. Ikut bergoyang bila animasi daun aktif | Tetap (CSS `.arch-flower`); posisi/ukuran bisa diubah di CSS |
| 4 | **Tampilan Ngunduh Mantu** disamakan dengan Akad & Resepsi: tanggal (gaya `serif` emas), kartu acara (`.agenda .item` + ornamen bunga), Dress Code, dan kartu **Tempat Acara** (alamat, peta embed, tombol Maps). Bagian yang kosong (dress code / waktu) otomatis disembunyikan; tombol & peta punya `aria-label` | Dashboard > Data Mempelai > Acara Ngunduh Mantu |
| 5 | **Detail tampilan Ucapan & Doa** bisa on/off per bagian: nama, badge kehadiran, jumlah, acara, teks, tombol Ubah/Hapus | Dashboard > Tampilan Undangan > 💬 Detail Tampilan Ucapan & Doa |
| 6 | **Tata letak kartu ucapan** baru: badge kehadiran persis di kanan nama; jumlah, acara, dan teks ucapan berada dalam satu kotak; tombol Ubah/Hapus di bawahnya | Otomatis |
| 7 | **Logo bank** di kartu hadiah (bank pria & wanita/bank 1 & 2) | Dashboard > Data Mempelai > Hadiah: `bank_logo`, `bank_logo_2` (URL gambar langsung) |
| 8 | **Footer mengikuti tema**: warna footer tidak lagi berdiri sendiri, ia melanjutkan pola warna bergantian section dan ikut mode terang/gelap | Otomatis |
| 9 | **Detail footer** di bawah garis ornamen: "Build with ♥ Nama dev" + tautan Instagram + Music (ikon inline, tanpa Font Awesome). Kosong = tidak tampil; bila nama dev kosong dipakai teks bawaan | Dashboard > Data Mempelai > 🦶 Footer: `footer_dev_nama`, `footer_instagram_url`, `footer_musik_url` |

### Field/kolom baru di Spreadsheet (sudah ada di xlsx terbaru)
- **`DataMempelai`**: `bank_logo`, `bank_logo_2`, `footer_dev_nama`, `footer_instagram_url`, `footer_musik_url`.
- **`PengaturanTema`**: `komentar_nama`, `komentar_presensi`, `komentar_jumlah`, `komentar_acara`, `komentar_teks`, `komentar_aksi` (semua `on`/`off`).
- Baris otomatis dibuat juga bila Anda mengisinya dari dashboard, jadi mengetik manual tidak wajib.

### Langkah update
1. Ganti `Code.gs` → **Deploy > Manage deployments > Edit > New version**.
2. Upload ulang ke GitHub: `index.html`, `rahasia/index.html`, dan folder `assets/` (ada file baru `loading.gif`).
3. Dashboard → isi field baru → **Tampilan Undangan → Simpan Tampilan**.

> Catatan: mematikan **Tombol Ubah/Hapus** membuat tamu tidak bisa lagi mengubah/menghapus ucapannya sendiri.

---

## 📚 Daftar Lengkap Fitur

**Halaman tamu**
- Cover *Buka Uleman* dengan nama tamu dari link (`?to=Nama`), animasi **gerbang + asap** saat dibuka, musik latar yang langsung menyala & tidak restart.
- Loading GIF; mode **terang/gelap** (bisa dikunci ke satu mode); tombol musik (bisa dimatikan).
- Mempelai (foto berbingkai lengkung + bunga, nama orang tua, tombol **Instagram**), kutipan, kisah cinta, **Acara** (Akad & Resepsi + peta embed + tombol Maps + Dress Code), **Ngunduh Mantu**, **hitung mundur**, **Live Streaming** (Instagram / YouTube / Zoom), galeri, **hadiah** (rekening + logo bank, salin nomor, alamat kirim), **Ucapan & Doa** (RSVP), footer dengan kredit developer.
- **RSVP**: pilih Hadir / Tidak Hadir / Masih Ragu; bila hadir pilih **acara** (Akad / Resepsi / Ngunduh Mantu, boleh lebih dari satu) dan **jumlah 1–10**; tamu bisa **mengubah/menghapus** ucapannya sendiri.
- **Warna section dinamis** (bergantian otomatis meski ada section dimatikan), animasi masuk **Motion (Framer Motion)**, daun/bunga bergoyang, scroll halus.

**Dashboard admin (`rahasia/`)**
- Ringkasan & **statistik** kehadiran (total tamu, hadir/tidak/ragu, WA terkirim, total orang, per acara).
- Kelola **daftar tamu** & kirim undangan via WhatsApp; kelola **Data Mempelai** (semua teks, foto, hadiah, footer, Ngunduh Mantu, Live).
- **Tampilan Undangan**: preset tema & warna kustom, bentuk & font, bagian yang ditampilkan (on/off), detail kartu ucapan, fitur (musik, mode), animasi + pratinjau. Tersimpan di sheet `PengaturanTema`, tanpa upload ulang file.

**Backend (Google Apps Script + Sheets)**
- Sheet: `DataMempelai`, `DaftarTamu`, `KonfirmasiTamuUndangan` (kolom `acara_hadir`), `PengaturanTema`.
- Kolom sheet lama diperbaiki otomatis; tamu hanya bisa mengubah ucapannya sendiri lewat `edit_token`.

---

## 🆕 Pembaruan Versi Ini (Revisi Musik, Gerbang, Ngunduh Mantu, Live, RSVP, Animasi)

### Ringkasan file yang berubah
| File | Perubahan |
|---|---|
| `index.html` | Semua fitur baru di bawah |
| `assets/gate-left.png`, `assets/gate-right.png` | **Baru** — gerbang (dipotong dari `asset-sheet.png`) untuk animasi buka undangan |
| `assets/motion.min.js`, `assets/lenis.min.js` | **Baru** — pustaka animasi & scroll halus (dilokalkan, tidak bergantung CDN). **Wajib ikut di-upload ke GitHub** |
| `Code.gs` | Kolom `acara_hadir`, default tema baru. **Wajib di-deploy ulang** (Deploy > Manage deployments > Edit > New version) |
| `rahasia/index.html` (dashboard) | Field baru, sakelar Fitur, pengaturan Animasi + pratinjau |
| `Undangan_Pernikahan_RasyaRizky.xlsx` | Baris & kolom baru (lihat "Perubahan Spreadsheet") |

### Perubahan Spreadsheet (PANDU MANUAL kalau Anda pakai Sheet sendiri, bukan file xlsx ini)
1. **`KonfirmasiTamuUndangan`** → tambah kolom **`acara_hadir`** di paling kanan (setelah `id_tamu`). Berisi acara yang dipilih tamu, mis. `Akad, Resepsi, Ngunduh Mantu`. *(Code.gs juga menambahkannya otomatis saat ada ucapan pertama masuk.)*
2. **`DataMempelai`** → tambah baris (kolom `field` | `value`) berikut, atau cukup isi lewat Dashboard > Data Mempelai (baris dibuat otomatis):

| Field | Isi | Keterangan |
|---|---|---|
| `instagram_pria`, `instagram_wanita` | `rizky` | Username tanpa @. Kosong = tombol tidak tampil |
| `link_maps_embed` | URL/kode iframe | Peta embed Akad & Resepsi |
| `link_maps_embed_aktif` | `on` / `off` | `off` = peta embed disembunyikan |
| `ngunduh_tanggal_tampil` | Minggu, 22 November 2026 | |
| `waktu_ngunduh_mantu` | 10.00 - Selesai | |
| `ngunduh_nama_lokasi`, `ngunduh_alamat_lokasi` | | |
| `ngunduh_link_maps` | link Google Maps | Untuk tombol |
| `ngunduh_link_maps_embed` | URL/kode iframe | |
| `ngunduh_embed_aktif` | `on` / `off` | |
| `ngunduh_dress_code` | | |
| `live_channels` | `instagram,youtube,zoom` | Pilih satu atau banyak (pisah koma) |
| `live_instagram` | username | tanpa @ |
| `live_youtube`, `live_zoom` | link | |

3. **`PengaturanTema`** → baris baru (dibuat otomatis saat klik *Simpan Tampilan*): `section_livestream`, `section_ngunduh`, `fitur_musik`, `fitur_mode`, `anim_aktif`, `anim_gaya`, `anim_kecepatan`, `anim_daun`, `anim_smooth`.

> Cara mengambil peta embed: Google Maps → cari lokasi → **Bagikan → Sematkan peta → Salin HTML**. Boleh tempel seluruh kode `<iframe ...>` atau hanya isi `src`-nya.

### 1. Musik langsung menyala & tidak restart
- Begitu link dibuka, musik langsung dicoba diputar. Browser (terutama HP) sering menolak suara otomatis sebelum ada interaksi; jika ditolak, musik tetap **berjalan senyap** lalu **otomatis dibunyikan pada sentuhan/klik pertama di mana pun** (termasuk tombol *Buka Uleman*).
- Saat *Buka Uleman* ditekan, musik **tidak diulang dari awal** (`currentTime = 0` sudah dihapus) — lanjut mulus dari posisi terakhir.
- Tamu yang menekan tombol 🔇 sendiri **tidak** akan dibunyikan paksa lagi.

### 2. Animasi gerbang + asap saat Buka Uleman
Gerbang (aset lengkung bunga dari `asset-sheet.png`) menutup layar → terbelah ke kiri & kanan sambil 9 gumpalan asap mengepul → isi undangan terungkap. Musik tidak terpengaruh. Untuk mengganti gerbang, timpa `assets/gate-left.png` & `assets/gate-right.png` (dua PNG transparan, separuh kiri & kanan). Durasi total ±3 detik; ubah di CSS `.gate-door` (`transition`) dan `.puff` (`animation`).

### 3. Instagram mempelai
Isi `instagram_pria` / `instagram_wanita` di Dashboard > Data Mempelai > *Mempelai*. Tombol berlogo IG + `@username` muncul di bawah nama orang tua (ukuran font sama dengan status "Putra/Putri ke-…"). Kosong = tombol tidak tampil.

### 4. Warna section dinamis (Bagian yang Ditampilkan)
Warna latar tiap section **tidak lagi manual**. Sistem menghitung ulang setiap kali ada section dimatikan: section yang tampil diberi warna **bergantian** (`--bg` ↔ `--surface-2`) secara berurutan, jadi dua section bersebelahan **tidak pernah sewarna**. Pratinjau di dashboard juga ikut bergantian. (Efek samping: latar dekoratif lama pada *Mempelai*, *Kisah Cinta* dan *Galeri* diganti warna bergantian ini — sekalian memperbaiki *Kisah Cinta* yang warnanya tidak cocok di mode gelap.)

### 5. Sakelar Musik & Mode Terang/Gelap
Dashboard > **Tampilan Undangan > 🔧 Fitur Undangan**:
- **Musik latar** on/off — off: tidak ada audio & tombol musik hilang.
- **Mode**: *Terang & Gelap* (tombol ☀️/🌙 tampil di pojok kanan bawah), *Terang saja* atau *Gelap saja* (mode dikunci & tombol hilang).
Klik **Simpan Tampilan**.

### 6. Acara Ngunduh Mantu
Dashboard > Data Mempelai > **🎊 Acara Ngunduh Mantu** (field di tabel di atas). Kartu tampil **di bawah tombol lokasi Akad & Resepsi**. Peta embed-nya bisa dimatikan lewat `ngunduh_embed_aktif`; seluruh kartu bisa dimatikan lewat *Bagian yang Ditampilkan > Ngunduh Mantu*. Kartu otomatis tersembunyi bila tanggal, waktu, dan lokasinya kosong.

### 7. Peta embed Akad & Resepsi
Ada field baru **Link Peta Embed** + sakelar **Tampilkan peta embed** (`link_maps_embed_aktif`). Bila embed kosong, peta dibuat otomatis dari alamat.

### 8. Live Streaming
Section baru di antara *Menghitung Hari* dan *Galeri* (bisa di-on/off di *Bagian yang Ditampilkan*). Di Dashboard > Data Mempelai > **📡 Live Streaming** centang salah satu/banyak: **Instagram, YouTube, Zoom**, lalu isi username/link-nya. Tiap pilihan tampil sebagai tombol berikon (font seukuran status mempelai). Kalau tidak ada tautan terisi, section otomatis tersembunyi.

### 9. Form Ucapan & Doa (RSVP)
- Jika memilih **Hadir**: muncul kartu pilihan acara (boleh **1 atau lebih**): 💍 *Akad*, 🥂🍽️ *Resepsi*, ❤️ *Ngunduh Mantu* (ikon di atas, nama di bawah). *Ngunduh Mantu* hanya muncul bila kartunya aktif.
- **Jumlah yang Hadir** kini **dropdown 1–10** (server juga membatasi maks. 10).
- Hadir wajib memilih minimal 1 acara & jumlah. Pilihan tersimpan di kolom `acara_hadir` dan tampil di kartu ucapan. Saat tamu memilih **Ubah**, pilihan acara ikut terisi.

### 10. Animasi (Framer Motion) & scroll halus
Situs undangan berupa HTML statis (bukan React), jadi dipakai **Motion** — versi vanilla dari **Framer Motion** (mesin & kurva animasi yang sama, tanpa perlu React/build) — plus **Lenis** untuk scroll berinersia yang halus. Dikontrol di Dashboard > Tampilan Undangan > **✨ Animasi**:
- **Aktifkan animasi**: section, kartu, foto, teks, tombol, hitung mundur, ucapan masuk dengan efek saat digulir.
- **Gaya masuk**: Naik / Pudar / Zoom / Geser. **Kecepatan**: Cepat / Normal / Lambat. Item bersaudara muncul berurutan (stagger).
- **Daun & bunga bergoyang**: semua aset floral/daun bergoyang pelan seperti tertiup angin.
- **Scroll halus** antar section.
- Ada kotak **Pratinjau** + tombol *▶ Putar Ulang* di dashboard untuk melihat efeknya sebelum disimpan.
Pengguna dengan pengaturan sistem "kurangi gerakan" otomatis tidak diberi animasi.

### Langkah update
1. Ganti `Code.gs` di Apps Script → **Deploy > Manage deployments > Edit > New version**.
2. Perbarui Sheet (lihat "Perubahan Spreadsheet") atau pakai xlsx terbaru.
3. Upload ke GitHub Pages: `index.html`, `config.js`, dan **folder `assets/` lengkap** (ada 4 file baru).
4. Buka Dashboard → isi field baru → **Tampilan Undangan** → *Simpan Tampilan*.

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
| `nama_panggilan_pria` / `nama_panggilan_wanita` | Rasya / Rizky | Judul besar & pesan WA |
| `nama_lengkap_pria` / `nama_lengkap_wanita` | Rasya Siapa / Rizky Siapa | Bagian "Mempelai" |
| `status_anak_pria` / `status_anak_wanita` | Putri ke-1 / Putra ke-1 | |
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
| `musik_url` | | Opsional, musik latar (on/off dari Dashboard > Tampilan > Fitur). **Wajib link file mp3 langsung**, lihat catatan di bawah tabel |
| `gift_nama`, `gift_hp`, `gift_alamat` | | Love Gift — kirim hadiah fisik |
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
Kolom: `timestamp | comment_id | nama | presensi | jumlah_hadir | ucapan_doa | edit_token | id_tamu | acara_hadir`
Import **`sheet-template/KonfirmasiTamuUndangan.csv`** (cukup header — baris di bawahnya terisi otomatis dari form "Ucapan & Doa" di situs publik).

- **`comment_id`**: token acak, ditampilkan ke publik lewat daftar ucapan (dipakai untuk menunjuk "ucapan yang mana").
- **`jumlah_hadir`**: hanya terisi kalau tamu memilih presensi **Hadir**; kosong untuk Tidak Hadir/Masih Ragu.
- **`edit_token`**: token rahasia terpisah, **tidak pernah** ditampilkan ke publik — hanya dikirim sekali ke pengirimnya sendiri (disimpan di localStorage browser mereka) supaya nanti mereka bisa **Ubah**/**Hapus** ucapannya sendiri lewat situs publik. Tanpa token yang cocok, permintaan ubah/hapus ditolak server — jadi orang lain tidak bisa mengubah/menghapus ucapan siapa pun selain miliknya.
- **`id_tamu`**: disalin dari link undangan yang dipakai tamu saat mengisi (kalau ada), dipakai untuk tetap memperbarui `status_absen` di `NamaTamuUndangan` kalau ucapan itu diedit presensinya nanti.

### d. `AkunAdmin` — kredensial login dashboard
Kolom: `username | password`
Import **`sheet-template/AkunAdmin.csv`**, lalu **ganti password contohnya** dengan yang Anda mau. Bisa tambah lebih dari satu baris kalau lebih dari satu orang perlu akses dashboard.

> Password di sini tersimpan sebagai teks biasa di sheet Anda sendiri (bukan hal baru — Anda sudah punya akses penuh ke sheet ini). Yang penting: jangan bagikan akses "edit" sheet ke orang yang tidak seharusnya tahu kredensial dashboard.

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

Saat tamu memilih **Hadir** di form Ucapan & Doa, muncul pilihan **acara yang dihadiri** (Akad / Resepsi / Ngunduh Mantu) dan dropdown **"Jumlah yang Hadir"** (1–10) — hilang otomatis kalau mereka pilih Tidak Hadir/Masih Ragu, karena memang tidak relevan.

Setelah mengirim, tamu bisa **Ubah** atau **Hapus** ucapannya sendiri kapan saja — tombolnya otomatis muncul di kartu ucapan miliknya sendiri (dideteksi lewat token tersimpan di browser mereka, bukan lewat login). Kalau mereka membuka situs dari **browser/perangkat lain**, tombol itu tidak akan muncul (token hanya ada di perangkat tempat mereka pertama mengirim) — itu wajar dan sesuai desain keamanannya.

---

## 4. Pakai `dashboard.html`

`dashboard.html` **tidak perlu di-hosting di GitHub Pages** (dan sebaiknya tidak digabung ke repo publik yang sama) — karena keamanannya sudah dijamin lewat login + token di server, Anda cukup:
- Membukanya langsung dari komputer (double-click file-nya), atau
- Meng-upload ke repo GitHub **privat** terpisah + GitHub Pages, atau layanan hosting statis apa pun yang Anda kontrol.

Buka file, login dengan username/password dari sheet `AkunAdmin`. Sesi berlaku **6 jam**, setelah itu Anda perlu login ulang (server menolak token lama secara otomatis).

Ada 7 halaman lewat sidebar:

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

## Tema Terang / Gelap (situs publik)

Tombol bulat di pojok kanan bawah halaman (☀️/🌙) mengganti tema **light (day)** ↔ **night** — bisa dikunci ke satu mode (tombol hilang) dari Dashboard > Tampilan Undangan > Fitur. Pilihan disimpan di browser tamu; kalau belum pernah memilih, otomatis mengikuti preferensi sistem perangkat mereka.

## Catatan keamanan & teknis

- **Kredensial dashboard hanya ada di sheet `AkunAdmin`**, tidak pernah ditulis ke file HTML. Login memanggil `action=login` di server, server membalas token sesi (6 jam), dan token itulah yang dipakai untuk semua permintaan sensitif berikutnya (`guests`, `update_status`, `reset_status`, `save_template`) — semuanya divalidasi ulang di `Code.gs`, bukan cuma dicek di layar login.
- Kalau curiga sesi/akses bocor: ganti password di sheet `AkunAdmin` — token lama otomatis tidak berguna begitu masa berlakunya (maks. 6 jam) habis, dan token baru hanya bisa didapat dengan password yang benar.
- **`config.js` bukan lapisan keamanan** — hanya kerapian kode; URL API publik memang boleh terlihat karena isinya cuma data undangan umum + ucapan/doa tervalidasi.
- Data POST (kirim ucapan, login, update status, dll.) dikirim sebagai `text/plain` (bukan `application/json`) agar browser tidak melakukan **CORS preflight**, karena Apps Script Web App tidak menjawab request `OPTIONS`. Jangan ubah `Content-Type` kecuali Anda menambahkan `doOptions()` sendiri di `Code.gs`.
- Jika `APPS_SCRIPT_URL` belum diisi/API gagal diakses, `index.html` tetap tampil dengan data contoh (`FALLBACK_DATA`) dan `dashboard.html` dengan data contoh (mock, ditandai peringatan) supaya Anda tetap bisa cek tampilan sebelum backend siap sepenuhnya.
- Semua teks & label UI sudah dalam Bahasa Indonesia sesuai permintaan.