# Aplikasi Kasir Toko Ecer & Grosir (Offline-First & Google Sheets)

Aplikasi kasir (Point of Sale) modern berbasis HTML, CSS, dan JavaScript murni yang dapat di-hosting secara gratis di **GitHub Pages** dan menggunakan **Google Spreadsheets** sebagai basis data cloud multi-pengguna.

Aplikasi ini dirancang khusus untuk toko kelontong, agen sembako, dan toko rokok yang menjual produk secara **eceran maupun grosiran** (contoh: Rokok per Bal, Slop, Bungkus, hingga per Batang).

---

## ✨ Fitur Utama

1. **Online & Offline Penuh (Offline-First)**:
   - Dilengkapi **indikator status real-time** di bagian atas layar: 🟢 **Online** atau 🔴 **Offline**.
   - Ketika koneksi internet terputus, transaksi penjualan dan pencatatan pengeluaran tetap dapat berjalan lancar tanpa macet (disimpan otomatis di `LocalStorage` browser).
   - Saat internet terhubung kembali, antrean data secara otomatis disinkronkan ke Google Spreadsheet.

2. **Dukungan Multi-Satuan (Ecer & Grosir)**:
   - Mendukung satuan bertingkat dengan pengali (*multiplier*).
   - Contoh kasus rokok:
     - **Batang**: Pengali 1 (Harga eceran satuan)
     - **Bungkus**: Pengali 12 atau 16 batang
     - **Slop / Pres**: Pengali 10 bungkus (160 batang)
     - **Bal**: Pengali 10 slop (1600 batang)
   - Stok disimpan secara presisi dalam satuan terkecil. Saat kasir menjual 1 Bal atau 2 Bungkus, stok berkurang secara akurat.

3. **Pemisahan Peran Kasir (Pegawai) & Admin**:
   - **Halaman Kasir (Pegawai)**: Tampilan kasir POS cepat, pencarian barang, keranjang belanja, cetak struk nota, dan pencatatan pengeluaran harian.
   - **Halaman Admin**: Dilindungi **PIN Keamanan** (Default: `1234`), membuka akses ke:
     - 📊 **Laporan Laba Rugi (Profit & Loss)** Bulanan & Tahunan.
     - 📦 **Master Produk & Stok**: Mengatur satuan bertingkat, harga jual, dan modal (HPP).
     - ⚙️ **Pengaturan**: Menghubungkan URL Google Sheets, ganti PIN, ekspor cadangan data JSON.

4. **Laporan Laba Rugi Komprehensif (Bulanan & Tahunan)**:
   - Menghitung secara otomatis:
     - **Total Omset Penjualan** (Gross Sales)
     - **Potongan / Diskon**
     - **Harga Pokok Penjualan (HPP / Modal Barang)**
     - **Laba Kotor (Gross Profit)** = Penjualan - HPP
     - **Beban Biaya Operasional** (Listrik, Wifi, Gaji Pegawai, Sewa Kios, dll)
     - **Laba Bersih Akhir (Net Profit)** & Persentase Margin Keuntungan.

5. **Pencatatan Biaya Operasional**:
   - Form pencatatan biaya pengeluaran toko (Token listrik, gaji karyawan, langganan wifi, air galon, plastik kresek, dll) yang langsung mengurangi laba bersih.

6. **Cetak Struk Nota Siap Pakai**:
   - Format nota rapi yang kompatibel dengan printer kasir termal (58mm / 80mm) maupun printer biasa.

7. **Akses Multi-Device & Multi-User Sekaligus**:
   - Dapat diakses bersamaan dari komputer kasir, laptop, tablet, maupun smartphone Android/iOS.

---

## 📁 Struktur Berkas

```
toko-kasir-app/
├── index.html              # Antarmuka web utama (Single Page Application)
├── style.css               # Styling custom, modal, dan format cetak struk thermal
├── app.js                  # Logika POS, offline engine, multi-satuan, & laba rugi
├── google-apps-script.js   # Script backend untuk dipasang di Google Spreadsheets
└── README.md               # Dokumentasi panduan instalasi & penggunaan
```

---

## 🚀 Panduan 1: Cara Deploy ke GitHub Pages (Gratis & Online)

Aplikasi ini dibuat murni menggunakan HTML, Tailwind CSS, dan JavaScript tanpa perlu proses *build* atau *compile*.

1. **Buat Repository Baru di GitHub**:
   - Masuk ke akun [GitHub](https://github.com/).
   - Klik tombol **New** untuk membuat repositori baru.
   - Beri nama, misalnya `kasir-toko` dan pilih **Public**.

2. **Unggah File Proyek**:
   - Unggah file berikut ke repository:
     - `index.html`
     - `style.css`
     - `app.js`
   - Lakukan **Commit changes**.

3. **Aktifkan GitHub Pages**:
   - Masuk ke tab **Settings** pada repositori GitHub Anda.
   - Di menu sebelah kiri, pilih **Pages**.
   - Pada bagian **Build and deployment** > **Branch**, pilih branch `main` (atau `master`) dan folder `/ (root)`.
   - Klik **Save**.
   - Tunggu 1–2 menit, GitHub akan menampilkan tautan web Anda, contoh:
     `https://username.github.io/kasir-toko/`
   - Sekarang aplikasi web kasir Anda sudah online dan bisa diakses oleh siapa saja!

---

## 📊 Panduan 2: Menyiapkan Database di Google Spreadsheets

Aplikasi ini menggunakan Google Spreadsheet sebagai database cloud gratis melalui **Google Apps Script (GAS)**.

1. **Buka Google Drive & Buat Spreadsheet**:
   - Masuk ke [Google Sheets](https://sheets.google.com).
   - Buat dokumen baru dengan nama misalnya: `Database Kasir Toko Berkah`.

2. **Buka Editor Apps Script**:
   - Pada menu atas Google Sheet, klik **Ekstensi (Extensions)** &rarr; **Apps Script**.

3. **Salin Kode Backend**:
   - Hapus semua tulisan bawaan di editor `Code.gs`.
   - Buka file `google-apps-script.js` pada proyek ini, salin (copy) seluruh kodenya, lalu tempel (paste) ke editor Apps Script.
   - Klik tombol **Simpan** (ikon disket) atau tekan `Ctrl + S` / `Cmd + S`.

4. **Terapkan Sebagai Aplikasi Web (Deploy as Web App)**:
   - Klik tombol biru **Terapkan (Deploy)** di kanan atas &rarr; pilih **Penerapan baru (New deployment)**.
   - Klik ikon gerigi di sebelah kiri jenis penerapan &rarr; pilih **Aplikasi web (Web app)**.
   - Atur pengaturan berikut:
     - **Deskripsi**: `Backend Kasir Toko v1`
     - **Jalankan sebagai (Execute as)**: `Saya (email Anda)`
     - **Siapa yang memiliki akses (Who has access)**: **`Siapa saja (Anyone)`** *(Penting! Jika tidak dipilih Siapa Saja, web kasir tidak akan bisa mengirim data)*.
   - Klik tombol **Terapkan (Deploy)**.
   - Jika muncul jendela izin akses (*Authorization Required*):
     - Klik **Review Permissions** &rarr; Pilih akun Google Anda.
     - Klik **Advanced (Lanjutan)** &rarr; Klik **Go to Untitled project (unsafe) / Buka project**.
     - Klik **Allow (Izinkan)**.
   - Salin **URL Aplikasi Web** yang berakhiran `/exec`.

5. **Hubungkan ke Aplikasi Kasir**:
   - Buka web kasir Anda di browser.
   - Klik tombol **Login Admin** di pojok kanan atas (Masukkan PIN default: `1234`).
   - Buka tab **Pengaturan Database**.
   - Tempelkan URL Aplikasi Web ke kolom **Google Apps Script Web App URL**.
   - Klik **Simpan Pengaturan**, lalu klik **Tes Koneksi Spreadsheet**.
   - Selesai! Lembar kerja `Transaksi`, `Item_Transaksi`, `Pengeluaran`, dan `Produk_Stok` akan otomatis dibuatkan di Google Spreadsheet Anda dengan rapi.

---

## 🛒 Panduan 3: Cara Kerja Ecer & Grosir (Contoh Rokok)

Dalam bisnis toko rokok dan sembako, satu barang memiliki banyak varian satuan jual:

### Contoh Konfigurasi Produk Rokok:
- **Nama Barang**: `Rokok Sampoerna Mild 16`
- **Kategori**: `Rokok`
- **Satuan Terkecil (Acuan Stok)**: `Batang`
- **Stok Awal**: `3200 Batang` (sama dengan 2 Bal)

| Nama Satuan Jual | Pengali (*Multiplier*) | Harga Jual (Rp) | Modal / HPP (Rp) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Batang** | 1 | Rp 2.500 | Rp 1.900 | Eceran per batang |
| **Bungkus** | 16 | Rp 35.000 | Rp 29.500 | 1 bungkus = 16 batang |
| **Slop** | 160 | Rp 345.000 | Rp 292.000 | 1 slop = 10 bungkus = 160 batang |
| **Bal** | 1600 | Rp 3.400.000 | Rp 2.900.000 | 1 bal = 10 slop = 100 bungkus = 1600 batang |

### Saat Melakukan Penjualan di Kasir:
1. Pegawai cukup memilih tombol satuan yang dibeli pelanggan (misal: klik **Bungkus** atau **Bal**).
2. Jika pelanggan membeli 1 Bungkus, kasir menerima Rp 35.000, stok otomatis terpotong 16 batang, dan sistem mencatat laba kotor `Rp 35.000 - Rp 29.500 = Rp 5.500`.
3. Jika pelanggan membeli 1 Bal, kasir menerima Rp 3.400.000, stok terpotong 1600 batang, dan laba kotor tercatat `Rp 3.400.000 - Rp 2.900.000 = Rp 500.000`.

---

## 💡 Panduan 4: Cara Kerja Mode Offline

- Aplikasi ini mendeteksi koneksi jaringan komputer secara dinamis menggunakan API `navigator.onLine`.
- Jika komputer Anda tidak ada internet:
  - Header otomatis berubah warna merah dengan tulisan **Offline**.
  - Muncul banner peringatan bahwa komputer dalam mode offline.
  - Kasir tetap bisa melayani pembeli seperti biasa. Data tersimpan di memori browser lokal.
  - Muncul tombol antrean sinkronisasi (contoh: `Antrean: 3`).
- Begitu wifi / kabel LAN terhubung kembali:
  - Status berubah menjadi **Online**.
  - Aplikasi secara otomatis mengirimkan seluruh antrean transaksi dan pengeluaran ke Google Spreadsheet tanpa ada data yang hilang.

---

## 🔒 Keamanan & Hak Akses

- **Kasir (Pegawai)**:
  - Hanya dapat melakukan penjualan dan melihat riwayat transaksi harian.
  - Tidak dapat melihat menu **Laba Rugi**, tidak dapat melihat modal harga beli produk, dan tidak dapat mengubah pengaturan database.
- **Admin**:
  - Dilindungi oleh 4–6 digit PIN (dapat diubah kapan saja di menu Pengaturan).
  - Memiliki akses penuh ke laporan finansial, omset, margin laba bersih bulanan dan tahunan.
