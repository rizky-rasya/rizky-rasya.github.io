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
- **Kolom `id_tamu`**: ID unik per tamu yang ikut tertanam di `link_undangan` (`&id=...`). Inilah yang membuat sistem tetap tahu link itu punya siapa, **walaupun tamu mengetik nama lain** saat mengisi Ucapan & Doa — jadi absensinya tetap tercatat ke baris tamu yang benar.
- **Kolom `link_undangan`**: dibuat otomatis oleh rumus di bawah, sudah menyertakan `id_tamu`.
- **Kolom `status_kirim`**: isi `FALSE` untuk baris baru, lalu jadikan checkbox (select kolom > Data > Data validation > Criteria "Checkbox"). Kolom ini **disimpan di sheet**, jadi statusnya sama persis di perangkat/browser mana pun Anda buka dashboard.
- **Kolom `tanggal_kirim`**: dikosongkan, terisi otomatis.
- **Kolom `status_absen`**: dikosongkan, terisi otomatis (`Hadir` / `Tidak Hadir` / `Masih Ragu`) begitu tamu dengan `id_tamu` itu mengisi form Ucapan & Doa di situs publik — terlepas dari nama apa yang mereka ketik di form.
- **Kolom `tanggal_absen`**: dikosongkan, terisi otomatis bersamaan dengan `status_absen`.
- Header ini dibaca **dinamis** oleh backend (huruf besar/kecil & spasi tidak masalah, otomatis dinormalkan), jadi kalau susunan kolom di sheet Anda sedikit berbeda, backend tetap menyesuaikan selama nama kolomnya sama secara makna.

**Rumus (contoh kalau urutan kolom: A=no, B=nama_tamu, C=jenis_tamu, D=nomor_hp, E=id_tamu, F=link_undangan):**
1. Buat **Named Range** `base_url` dari sheet `DataMempelai`.
2. Di sel **E2** (`id_tamu`) — ID stabil berbasis nomor baris, tidak berubah walau nama/HP diedit:
   ```
   ="T"&ROW()
   ```
3. Di sel **F2** (`link_undangan`), sertakan `id_tamu` sebagai parameter `id`:
   ```
   =base_url&"?to="&ENCODEURL(B2)&"&id="&E2
   ```
4. Tarik `E2:F2` ke bawah untuk semua baris tamu. **Penting:** kalau sheet Anda sudah pernah mengirim undangan dengan link_undangan versi lama (tanpa `&id=...`), link lama itu tetap berfungsi untuk menampilkan undangan — hanya saja absensi dari link lama itu tidak akan otomatis terhubung ke baris tamunya (tetap tercatat normal di `KonfirmasiTamuUndangan`, cuma `status_absen` di baris itu tidak ikut ter-update).

### c. `KonfirmasiTamuUndangan`
Kolom: `timestamp | nama | presensi | ucapan_doa`
Import **`sheet-template/KonfirmasiTamuUndangan.csv`** (cukup header — baris di bawahnya terisi otomatis dari form "Ucapan & Doa" di situs publik).

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

---

## 4. Pakai `dashboard.html`

`dashboard.html` **tidak perlu di-hosting di GitHub Pages** (dan sebaiknya tidak digabung ke repo publik yang sama) — karena keamanannya sudah dijamin lewat login + token di server, Anda cukup:
- Membukanya langsung dari komputer (double-click file-nya), atau
- Meng-upload ke repo GitHub **privat** terpisah + GitHub Pages, atau layanan hosting statis apa pun yang Anda kontrol.

Buka file, login dengan username/password dari sheet `AkunAdmin`. Sesi berlaku **6 jam**, setelah itu Anda perlu login ulang (server menolak token lama secara otomatis).

Ada 4 halaman lewat sidebar:

**Dashboard** — kartu statistik Total Tamu, Hadir, Tidak Hadir, Masih Ragu (dengan persentase dari total yang merespons), Sudah Kirim WA, Belum Kirim WA, plus 5 ucapan/doa terbaru.

**Daftar Tamu** — tabel tamu dari `NamaTamuUndangan`, bisa difilter per jenis tamu & dicari namanya. Status WA (Sudah/Belum) diambil langsung dari sheet.

**Kirim WA** — sama seperti Daftar Tamu, tambah kolom Aksi:
- Tombol **Kirim** per tamu — membuka WhatsApp dengan pesan terisi dari Template, lalu status otomatis tersimpan ke sheet.
- **Kirim Semua** — mengirim ke semua tamu belum terkirim sesuai filter/pencarian aktif. **Catatan penting:** WhatsApp tidak punya API kirim massal gratis, dan browser bisa memblokir banyak `window.open` berturut-turut dalam satu aksi — kalau Anda perhatikan ada tab WA yang tidak terbuka padahal statusnya sudah "sudah dikirim", buka ulang manual dari tombol Kirim per baris untuk tamu itu. Untuk jumlah tamu banyak, kirim per beberapa puluh sekaligus lebih aman daripada sekali klik untuk ratusan.
- **Reset Status** — mengembalikan status_kirim semua tamu ke "Belum" di sheet (ada konfirmasi, tidak bisa dibatalkan).

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

## Tema Terang / Gelap (situs publik)

Tombol bulat di pojok kanan bawah halaman ( ◐ ) mengganti tema **light (day)** ↔ **night**. Pilihan disimpan di browser tamu; kalau belum pernah memilih, otomatis mengikuti preferensi sistem perangkat mereka.

## Catatan keamanan & teknis

- **Kredensial dashboard hanya ada di sheet `AkunAdmin`**, tidak pernah ditulis ke file HTML. Login memanggil `action=login` di server, server membalas token sesi (6 jam), dan token itulah yang dipakai untuk semua permintaan sensitif berikutnya (`guests`, `update_status`, `reset_status`, `save_template`) — semuanya divalidasi ulang di `Code.gs`, bukan cuma dicek di layar login.
- Kalau curiga sesi/akses bocor: ganti password di sheet `AkunAdmin` — token lama otomatis tidak berguna begitu masa berlakunya (maks. 6 jam) habis, dan token baru hanya bisa didapat dengan password yang benar.
- **`config.js` bukan lapisan keamanan** — hanya kerapian kode; URL API publik memang boleh terlihat karena isinya cuma data undangan umum + ucapan/doa tervalidasi.
- Data POST (kirim ucapan, login, update status, dll.) dikirim sebagai `text/plain` (bukan `application/json`) agar browser tidak melakukan **CORS preflight**, karena Apps Script Web App tidak menjawab request `OPTIONS`. Jangan ubah `Content-Type` kecuali Anda menambahkan `doOptions()` sendiri di `Code.gs`.
- Jika `APPS_SCRIPT_URL` belum diisi/API gagal diakses, `index.html` tetap tampil dengan data contoh (`FALLBACK_DATA`) dan `dashboard.html` dengan data contoh (mock, ditandai peringatan) supaya Anda tetap bisa cek tampilan sebelum backend siap sepenuhnya.
- Semua teks & label UI sudah dalam Bahasa Indonesia sesuai permintaan.
