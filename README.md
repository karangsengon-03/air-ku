# AirKu — Manajemen Iuran Air Desa

**PWA manajemen tagihan air berbasis Next.js + Firebase**
Dikelola oleh PAM Al-Hikmah, Desa Karang Sengon, Situbondo — Jawa Timur.

---

## Versi Terkini

**v1.3.2** — Juni 2026

---

## Teknologi

| Layer | Stack |
|---|---|
| Framework | Next.js 16.2.6 (Turbopack) |
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
| **Menunggak** | Merah | Belum dientry sama sekali, lewat tgl 25 |

### Tunggakan
- Cek otomatis setiap hari
- Batas bayar: tanggal 25 tiap bulan
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
