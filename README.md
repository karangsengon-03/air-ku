# AirKu — Manajemen Iuran Air Desa

**PWA manajemen tagihan air berbasis Next.js + Firebase**
Dikelola oleh PAM Al-Hikmah, Desa Karang Sengon, Situbondo — Jawa Timur.

---

## Versi Terkini

**v1.6.1** — Agustus 2026

---

## Teknologi

| Layer | Stack |
|---|---|
| Framework | Next.js 16.2.12 (Turbopack) |
| UI | React 19, Tailwind CSS 4, Lucide React |
| Database | Firebase Firestore (realtime) |
| Auth | Firebase Authentication |
| State | Zustand |
| Form | React Hook Form + Zod |
| Chart | Recharts |
| PDF | jsPDF |
| Excel | ExcelJS |
| Query | TanStack React Query |
| Host | Vercel |

---

## Fitur Utama

### Manajemen Pelanggan
- Tambah, edit, hapus pelanggan aktif
- Status: Aktif / Non-Aktif / Pindah
- Nomor sambungan auto-format dengan alokasi range dari Pengaturan (format: 001–999, atau 0001–9999 otomatis)
- Dropdown nomor sambungan — nomor terpakai tidak bisa dipilih ganda
- **Tanggal Terdaftar** — bisa diisi manual (default: waktu submit). Ini yang menentukan sejak bulan apa pelanggan wajib ditagih; pelanggan tidak akan pernah tampil menunggak/belum-dientry untuk bulan sebelum tanggal ini
- **Tanggal Nonaktif/Pindah** — diisi otomatis (hari ini) atau manual saat status diubah dari Aktif. Pelanggan berhenti ditagih sejak bulan setelah tanggal ini
- **Reaktivasi (non-permanen)** — status bisa dikembalikan ke Aktif kapan saja. Saat diaktifkan kembali, tanggal nonaktif dibersihkan dan tanggal terdaftar diperbarui ke tanggal reaktivasi, sehingga periode nonaktif tidak dihitung sebagai tunggakan
- Riwayat pendaftaran pertama (`tanggalPendaftaranPertama`) tetap tersimpan terpisah dan tidak pernah berubah, murni sebagai jejak historis

### Sistem Tarif
- Abonemen bulanan
- Multi-blok tarif: tipe **Flat** (iuran tetap) atau **Per m³** (berdasarkan meter air)
- Blok dinamis — bisa 2, 3, 4 blok atau lebih
- Riwayat perubahan tarif tersimpan

### Entry Tagihan & Pembayaran
- **Mode Iuran Rata** — input nominal langsung tanpa meter
- **Mode Meter Air** — input meter awal & akhir, sistem hitung otomatis
- **Mode Pembayaran** (setting global):
  - Per Member — admin pilih Langsung Lunas atau Catat Tagihan per transaksi
  - Global Langsung Lunas — semua entry otomatis lunas
  - Global Catat Tagihan — semua entry dicatat dulu, tandai lunas terpisah
- Meter awal selalu bisa diedit (tidak dikunci) untuk penyesuaian pemasangan awal water meter

### Status Tagihan 3 Tier
| Status | Warna | Kondisi |
|---|---|---|
| **Lunas** | Hijau | Sudah bayar |
| **Ditagih** | Oranye | Sudah dientry, belum bayar |
| **Menunggak** | Merah | Belum bayar dan sudah lewat batas aman bulan ini (baik sudah dientry maupun belum) |

### Export Rekap
- **3 cakupan**: Bulan Ini (bulan yang sedang dibuka di menu Rekap), Tahunan (dropdown hanya menampilkan tahun yang benar-benar punya data tagihan — dideteksi otomatis), Keseluruhan (3 tahun terakhir dari sekarang, lihat `EXPORT_KESELURUHAN_TAHUN_TERAKHIR` di `constants.ts`)
- **2 format**: PDF (jsPDF, landscape A4, dengan nomor halaman) dan Excel (ExcelJS, 2 sheet)
- Laporan multi-bulan (Tahunan/Keseluruhan) berisi dua bagian: **Ringkasan Per Bulan** (agregat: jumlah pelanggan, Lunas/Ditagih/Menunggak, total terkumpul & tagihan) dan **Detail Per Pelanggan Per Bulan** (rincian tiap baris tagihan, sama seperti tampilan Rekap satu-bulan tapi mencakup banyak bulan)
- Bulan-bulan di masa depan (belum terjadi) tidak ikut dihasilkan — cakupan berhenti di bulan berjalan sungguhan
- Excel pakai **ExcelJS**, bukan `xlsx`/SheetJS — `xlsx` versi npm registry punya 2 kerentanan keamanan high-severity (Prototype Pollution, ReDoS) yang perbaikannya cuma dirilis lewat CDN pribadi SheetJS (tidak dipublikasikan ulang ke npm), sehingga `npm audit` akan selalu melaporkannya tanpa solusi. ExcelJS aktif dipelihara di npm registry dan tidak membawa kerentanan setara

### Tunggakan
- Cek otomatis setiap hari
- Batas bayar: (hari terakhir bulan − 1) — mis. tgl 30 untuk bulan 31 hari, tgl 27/28 untuk Februari non-kabisat/kabisat
- Virtual entry untuk pelanggan yang belum dientry sama sekali
- Filter createdAt — pelanggan baru tidak masuk tunggakan bulan sebelum terdaftar

### Role & Akses
| Fitur | Admin | Penagih | Viewer (Warga) |
|---|---|---|---|
| Entry + Langsung Lunas | ✓ | ✓ | — |
| Entry Catat Tagihan | ✓ | — | — |
| Tandai Lunas | ✓ | ✓ | — |
| Kelola Pelanggan | ✓ | — | — |
| Pengaturan | ✓ | — | — |
| Lihat Data | ✓ | ✓ | ✓ |

**Viewer** (`warga@air.ku`) — 1 akun bersama untuk transparansi warga. Hanya bisa lihat Dashboard, Tagihan, Pelanggan, Tunggakan, dan Grafik.

### Menu Lengkap
- **Beranda** — ringkasan bulan ini, stat Lunas/Ditagih/Menunggak
- **Entry Bayar** — catat pembayaran per pelanggan
- **Tagihan** — daftar tagihan bulan aktif dengan filter status
- **Pelanggan** — manajemen data pelanggan
- **Pengaturan** — tarif, dusun/RT, alokasi nomor, mode pembayaran
- **Rekap** — laporan bulanan, export PDF/Excel (Bulan Ini/Tahunan/Keseluruhan), kirim WA kolektif
- **Tunggakan** — daftar pelanggan menunggak
- **Grafik** — tren pendapatan dan pemakaian
- **Operasional** — catat pengeluaran PAM (admin only)
- **Log Aktivitas** — catatan teknis "siapa melakukan apa" (admin only), retensi 30 hari — lihat [Retensi Log Aktivitas](#retensi-log-aktivitas)

---

## Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Halaman utama (butuh auth)
│   └── (auth)/            # Login
├── components/
│   ├── features/          # Komponen per fitur
│   ├── layout/            # Header, BottomNav, AppShell
│   └── ui/                # Komponen UI umum
├── hooks/                 # useAuth, useData, useSettings
├── lib/                   # db, helpers, export, constants
├── schemas/               # Validasi Zod
├── store/                 # Zustand store
└── types/                 # TypeScript types
```

---

## Setup & Deploy

### Prasyarat
- Node.js 24.x
- Firebase project dengan Firestore + Authentication aktif

### Environment Variables
Buat file `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Install & Run
```bash
npm install --legacy-peer-deps
npm run dev        # development
npm run build      # production build
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

⚠️ **PENTING sejak v1.5.0**: perintah ini WAJIB dijalankan setelah update untuk mengaktifkan perbaikan retensi Log Aktivitas (lihat di bawah). Deploy kode aplikasi ke Vercel/hosting SAJA tidak cukup — rules Firestore adalah sistem terpisah yang harus di-deploy sendiri lewat Firebase CLI. Kalau langkah ini terlewat, rules lama tetap aktif di server dan auto-hapus log tidak akan berfungsi meski kodenya sudah benar.

### Retensi Log Aktivitas

Sejak v1.5.0, Log Aktivitas disimpan **murni berdasarkan usia — 30 hari, tanpa batas jumlah entri**. Tidak ada peran (termasuk admin) yang bisa menghapus log secara manual lewat aplikasi; penghapusan hanya terjadi otomatis saat sebuah log sudah berusia lebih dari 30 hari, dan aturan ini ditegakkan di level Firestore Rules (server), bukan cuma di kode aplikasi.

**Kenapa begini:** Log Aktivitas di sini murni catatan teknis jangka pendek ("siapa baru saja mengedit/entry/hapus apa") untuk kebutuhan operasional harian — bukan arsip audit jangka panjang. Untuk sengketa terkait pembayaran atau tanggal bayar pelanggan, sumber kebenarannya adalah riwayat tagihan/pelanggan di menu Tagihan, Rekap, dan Pelanggan — data itu permanen dan tidak kena aturan hapus ini sama sekali. Storage untuk log sendiri kecil (ratusan-ribuan entri hanya beberapa ratus KB–MB), jadi tidak ada alasan performa untuk membatasi jumlah; usia 30 hari sudah cukup untuk kebutuhan teknis sehari-hari.

**Cara kerja teknis:**
- `firestore.rules` (`/activityLog/{id}`): `allow delete` hanya true jika `resource.data.ts` (waktu log dibuat) sudah lebih dari 30 hari dari `request.time` (waktu server saat ini). Ini berlaku untuk SIAPA PUN yang mencoba, termasuk admin — tidak ada jalur "hapus manual" di rules ini sama sekali.
- `pruneOldActivityLogs()` (`src/lib/db.ts`): dipanggil otomatis (silent, admin only) setiap kali menu Log Aktivitas dibuka. Query mengambil log dengan margin 31 hari (bukan tepat 30) sebagai jaga-jaga terhadap selisih jam antara klien dan server Firestore, supaya dokumen yang lolos query dijamin memenuhi syarat 30 hari versi rules.
- Menu Log Aktivitas tetap menampilkan maksimal 500 entri terbaru sekaligus di layar — ini murni batas TAMPILAN untuk performa render, bukan batas penghapusan. Kalau log di database lebih dari 500 (karena belum genap 30 hari), sisanya tetap tersimpan, hanya tidak ditampilkan sekaligus.

---

## Skema Versi

Format: **MAJOR.MINOR.PATCH**

| Jenis | Kapan | Contoh |
|---|---|---|
| PATCH | Bugfix, fix tampilan | `1.3.0` → `1.3.1` |
| MINOR | Fitur baru, menu baru | `1.3.x` → `1.4.0` |
| MAJOR | Perubahan arsitektur besar | `1.x.x` → `2.0.0` |

Versi otomatis dibaca dari `package.json` → tampil di Header dan halaman Pengaturan.

---

## Riwayat Versi

| Versi | Tanggal | Ringkasan |
|---|---|---|
| **1.6.1** | Agu 2026 | Fix modal Export Lainnya (Rekap) tidak muncul di viewport mobile — dirender inline alih-alih lewat ModalPortal, terjebak dalam containing block #app-shell (overflow:hidden), sehingga posisinya salah dan perlu discroll untuk ditemukan; fix nama file PDF invoice tagihan individual (menu Tagihan → Bagikan WA/Download) tidak konsisten antar pelanggan — sebelumnya mengandalkan tagihan.nomorTagihan yang pada sebagian data historis tidak selalu sesuai format baku, sekarang dibangun eksplisit dari field individual dengan format INVOICE-{bulan}-{tahun}-{nama}-{no sambungan} |
| **1.6.0** | Agu 2026 | Fitur baru: Export Rekap PDF & Excel dengan 3 cakupan (Bulan Ini, Tahunan — hanya tahun berdata, Keseluruhan — 3 tahun terakhir), tiap laporan multi-bulan berisi Ringkasan Per Bulan + Detail Per Pelanggan; ekstraksi logika join rekap ke buildRekapRows (helpers.ts) untuk dipakai ulang antara menu Rekap dan export; tambah dependency exceljs untuk Excel (dipilih atas xlsx/SheetJS karena xlsx punya 2 kerentanan high-severity tanpa perbaikan di npm) |
| **1.5.0** | Agu 2026 | Fix package-lock.json & header versi README yang tidak ikut ter-update di rilis sebelumnya; fitur baru: Nama Pelanggan wajib huruf besar (real-time saat mengetik + dipaksa saat tersimpan); tambah label log legacy (entry_iuran, UPDATE_TAGIHAN_STATUS) dari data sebelum v1.3.0; rombak retensi Log Aktivitas jadi murni berbasis usia 30 hari (hapus batas 500 entri) — akar masalah "auto-hapus tidak berfungsi" ternyata Firestore Rules melarang delete activityLog sama sekali (allow delete: if false), diperbaiki jadi delete diizinkan HANYA jika dokumen sudah >30 hari (dicek di rules/server, admin tetap tidak bisa hapus manual) |
| **1.4.3** | Agu 2026 | Fix label kotak ringkasan Tunggakan "Tagihan" + "X bulan" yang ambigu (terlihat seolah jumlah entitas sejajar dengan "Pelanggan" di sebelahnya) → diganti "Akumulasi Tunggak" agar jelas itu total gabungan bulan-tunggak dari semua pelanggan, bukan jumlah bulan kalender atau jumlah pelanggan. Angka tidak berubah, hanya label |
| **1.4.2** | Agu 2026 | Fix root cause klasifikasi Menunggak: activeBulan (bulan yang sedang dilihat di layar) salah dipakai sebagai pengganti "bulan sekarang" saat memanggil isMenunggak() di Tagihan, Rekap, dan Tunggakan — sehingga melihat bulan lampau (mis. Juni/Juli saat sekarang sudah Agustus) gagal mengenali tagihan yang belum bayar (baik sudah dientry maupun belum sama sekali) sebagai Menunggak. Sekarang semua pemanggilan memakai bulan sekarang sungguhan (getBulanTahunAktif) sebagai referensi, terpisah dari bulan yang sedang ditampilkan/dipilih pengguna |
| **1.4.1** | Agu 2026 | Fix batas tunggakan hardcode tgl 25 → dihitung dinamis per bulan (hari terakhir bulan − 1, termasuk Februari kabisat); fix klasifikasi Ditagih/Menunggak di menu Tagihan yang sebelumnya tidak ikut cek tanggal untuk tagihan yang sudah dientry; fix tanggal nonaktif/pindah tidak tersimpan saat status pelanggan tidak berubah (koreksi data tanpa ganti status); tambah label log aktivitas yang hilang (Entry Tagihan, Tandai Lunas, Lunas Tunggakan, Ubah Tarif, Ubah Alokasi Nomor, Logout) |
| **1.4.0** | Agu 2026 | Fix "Pelanggan Aktif" & menu Entry menampilkan pelanggan sebelum tanggal terdaftar mereka (Dashboard, Entry); fitur baru: tanggal terdaftar manual (koreksi data historis), tanggal nonaktif/pindah, dan reaktivasi non-permanen (berhenti-aktif kembali tidak dihitung tunggakan saat nonaktif); update Next.js 16.2.6 → 16.2.12 (patch keamanan) |
| **1.3.3** | Jul 2026 | Fix pelanggan baru tampil menunggak/belum-dientry untuk bulan sebelum terdaftar (Tagihan, Rekap, Beranda); sentralisasi logika periode terdaftar member; guard race condition saat data member belum selesai dimuat (Tunggakan, Rekap) |
| **1.3.2** | Jun 2026 | Fix hint teks Tagihan, fix export backup tidak terdownload |
| **1.3.1** | Jun 2026 | Fix email viewer, konsistensi BottomNav icon/teks |
| **1.3.0** | Jun 2026 | Status 3 tier (Lunas/Ditagih/Menunggak), mode pembayaran, nomor sambungan dropdown, alokasi nomor di Pengaturan, sistem versi otomatis |
| **1.2.0** | Jun 2026 | Role Viewer (warga), tarif flat/per m³ multi-blok, logika tunggakan tgl 25, virtual entries |
| **1.1.0** | Mei 2026 | Fix modal freeze, FAB fixed, hapus Sentry, Node.js 24 |
| **1.0.0** | Mei 2026 | Rilis awal production |

---

## Lisensi

Proyek internal PAM Al-Hikmah, Desa Karang Sengon.
Dikembangkan untuk keperluan administrasi iuran air desa.
