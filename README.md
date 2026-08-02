# AirKu — Manajemen Iuran Air Desa

**PWA manajemen tagihan air berbasis Next.js + Firebase**
Dikelola oleh PAM Al-Hikmah, Desa Karang Sengon, Situbondo — Jawa Timur.

---

## Versi Terkini

**v1.4.0** — Agustus 2026

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
- **Rekap** — laporan bulanan, export PDF, kirim WA kolektif
- **Tunggakan** — daftar pelanggan menunggak
- **Grafik** — tren pendapatan dan pemakaian
- **Operasional** — catat pengeluaran PAM (admin only)
- **Log Aktivitas** — audit trail semua aksi (admin only)

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
