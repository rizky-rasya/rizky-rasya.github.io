/**
 * KONFIGURASI UNDANGAN
 * ------------------------------------------------------------------
 * Catatan penting: file ini tetap bisa dibaca siapa saja yang membuka
 * situs Anda (lewat "View Source" / tab Network browser) — dipisah ke
 * sini hanya supaya index.html tetap rapi dan URL mudah diganti tanpa
 * mengutak-atik kode utama, BUKAN untuk menyembunyikan URL.
 *
 * Ini aman karena URL Apps Script di bawah hanya melayani:
 *   - action=config   -> data undangan yang memang untuk umum
 *   - action=comments -> daftar ucapan & doa yang memang tampil publik
 *   - POST ucapan baru (divalidasi panjang teksnya di server)
 * Data sensitif (nomor HP tamu, kirim WA, dsb) TIDAK lewat sini —
 * itu ada di dashboard terpisah yang dilindungi kunci (lihat SETUP.md).
 */
window.APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwNeWlN7whFRO-pGV5KTziAGxzLmHPC51AlAqSO1BvbxFb1Ec5X3rTx29p9lmrAqm-RQA/exec";
