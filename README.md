# 💧 AirKu — Aplikasi Iuran Air Bulanan Desa

> **File ini adalah sumber kebenaran tunggal proyek AirKu.**
> Dibawa di setiap ZIP dari Sesi 0 hingga Sesi 7.
> Diupdate in-place setiap sesi selesai — tidak pernah diganti dengan file baru.

---

## 📋 Daftar Isi
1. [Tentang AirKu](#tentang-airku)
2. [Tech Stack](#tech-stack)
3. [Infrastruktur & Repositori](#infrastruktur--repositori)
4. [Setup Lokal](#setup-lokal)
5. [Struktur Folder](#struktur-folder)
6. [Struktur Role & Hak Akses](#struktur-role--hak-akses)
7. [Global Lock](#global-lock)
8. [Fitur Lengkap per Menu](#fitur-lengkap-per-menu)
9. [Data Model Firestore](#data-model-firestore)
10. [Struktur Harga & Kalkulasi Tagihan](#struktur-harga--kalkulasi-tagihan)
11. [UI/UX — Panduan Visual](#uiux--panduan-visual)
12. [Fitur yang Dihapus dari WifiPay](#fitur-yang-dihapus-dari-wifipay)
13. [Rencana & Status Sesi](#rencana--status-sesi)
14. [Aturan Kerja Antar Sesi](#aturan-kerja-antar-sesi)

---

## Tentang AirKu

AirKu adalah aplikasi PWA berbasis Next.js untuk manajemen iuran air bulanan tingkat desa (HIPPAM/PAM Desa). Dibangun khusus untuk konteks desa di Indonesia dengan pengguna utama orang tua/lansia sebagai penagih.

- **Nama aplikasi:** AirKu — dapat diganti via 1 konstanta `APP_NAME` di `lib/constants.ts`
- **Bahasa UI:** Full Bahasa Indonesia
- **Target pengguna:** Admin (muda, melek teknologi) + Penagih (orang tua, lapangan)
- **Lingkup:** Desa — transparan, sederhana, dapat dipercaya
- **Inspirasi arsitektur:** WifiPay Next.js (milik developer yang sama)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js App Router (v16+) + TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Email/Password) |
| State | Zustand |
| Styling | Tailwind CSS v4 + CSS Variables custom |
| Icons | Lucide React |
| Font | Plus Jakarta Sans (display/body) + JetBrains Mono (angka) |
| PDF | jsPDF ^2.5.2 (client-side, lazy import) |
| Chart | Recharts ^2.15.3 |
| PWA | Service Worker manual (`public/sw.js`) |
| Deploy | Vercel (auto-deploy dari GitHub) |
| Package manager | pnpm |

---

## Infrastruktur & Repositori

| Item | Detail |
|---|---|
| GitHub Repo | `https://github.com/karangsengon-03/air-ku` |
| Firebase Project | `airku-2026` |
| Firebase Auth Domain | `airku-2026.firebaseapp.com` |
| Firestore Region | default — ditentukan saat setup |
| Vercel Project | Disambungkan ke repo GitHub |
| Firebase API Key | Tersimpan di `.env.local` — tidak pernah di-commit |

---

## Setup Lokal

```bash
# 1. Clone repo
git clone https://github.com/karangsengon-03/air-ku.git
cd air-ku

# 2. Install dependencies
pnpm install

# 3. Buat file environment
cp .env.local.example .env.local
# Isi nilai dari Firebase Console

# 4. Jalankan dev server
pnpm dev
```

**ENV Variables (`.env.local`):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=airku-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=airku-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=airku-2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Setup Firestore manual (lakukan sekali):**
1. Buat dokumen `/roles/{uid}` untuk admin pertama:
   ```json
   { "role": "admin", "nama": "Nama Admin", "email": "admin@email.com" }
   ```
2. Buat dokumen `/settings/main` dengan nilai default:
   ```json
   {
     "globalLock": false,
     "abonemen": 5000,
     "hargaBlok1": 2000,
     "batasBlok": 10,
     "hargaBlok2": 3000,
     "modeTunggakan": "mandiri",
     "dusunList": [],
     "rtPerDusun": {},
     "namaOrganisasi": "PAM Desa",
     "desa": "",
     "kecamatan": "",
     "versi": "1.0.0"
   }
   ```

---

## Struktur Folder

```
airku/
├── app/
│   ├── (app)/               ← Protected routes (butuh login)
│   │   ├── layout.tsx       ← AppShell wrapper (no SSR)
│   │   ├── dashboard/
│   │   ├── entry/
│   │   ├── tagihan/
│   │   ├── rekap/
│   │   ├── tunggakan/
│   │   ├── grafik/
│   │   ├── members/
│   │   ├── operasional/
│   │   ├── log/
│   │   ├── settings/
│   │   └── accounts/
│   ├── login/               ← Halaman login (public)
│   ├── globals.css          ← CSS variables, dark mode, utility classes
│   ├── layout.tsx           ← Root layout
│   └── page.tsx             ← Redirect ke /dashboard
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx     ← Auth guard, online detection, dark mode init
│   │   ├── Header.tsx       ← Title, lock button, dark toggle, online indicator
│   │   ├── BottomNav.tsx    ← Navigasi bawah (berbeda per role)
│   │   ├── LockBanner.tsx   ← Banner merah saat global lock aktif
│   │   └── LoadingScreen.tsx
│   ├── ui/
│   │   ├── Toast.tsx        ← Notifikasi sukses/error/info
│   │   └── Confirm.tsx      ← Dialog konfirmasi aksi penting
│   └── views/               ← (diisi mulai Sesi 2)
├── hooks/
│   ├── useAuth.ts           ← Firebase Auth listener + role dari Firestore
│   └── useSettings.ts       ← Realtime listener /settings/main
├── lib/
│   ├── constants.ts         ← APP_NAME, MONTHS, YEARS, PAGE_TITLES, PAGE_ICONS
│   ├── firebase.ts          ← Firebase init (SSR-safe, fallback placeholder)
│   ├── db.ts                ← (diisi Sesi 2) Semua fungsi Firestore
│   └── helpers.ts           ← (diisi Sesi 2) Kalkulasi tagihan, format Rp/m³
├── store/
│   └── useAppStore.ts       ← Zustand: auth, settings, toast, confirm, online
├── types/
│   └── index.ts             ← Semua TypeScript interfaces & types
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   ├── sw.js
│   └── icons/               ← icon-72 s/d icon-512 PNG
├── .env.local.example
├── .gitignore
├── next.config.ts
├── vercel.json
└── README.md                ← File ini
```

---

## Struktur Role & Hak Akses

### Dua Role
- **Admin** — pengelola penuh, biasanya kepala/pengurus PAM desa
- **Penagih** — petugas lapangan, sering orang tua/lansia

### Role disimpan di Firestore
```
/roles/{uid} → { role: 'admin' | 'penagih', nama: string, email: string }
```

### Penambahan Akun
- Admin dan Penagih ditambahkan **manual di Firebase Console Auth**
- Menu Manajemen Akun di app hanya **menampilkan daftar** — tidak bisa tambah/hapus dari app
- Login **mengingat session** (Firebase Auth `browserLocalPersistence`) — tidak perlu login ulang

### Tabel Hak Akses

| Menu / Fitur | Admin | Penagih |
|---|---|---|
| 🏠 Beranda | ✅ Full | ✅ Full |
| 📋 Entry Meter | ✅ Full | ✅ Full |
| 💧 Tagihan | ✅ Lihat + tandai lunas + hapus | ✅ Lihat + tandai lunas + share WA |
| 📁 Rekap | ✅ Full + export PDF + kirim WA | ✅ Lihat saja |
| ⚠️ Tunggakan | ✅ Full | ✅ Lihat saja |
| 📈 Grafik | ✅ Full | ✅ Full |
| 👥 Pelanggan | ✅ CRUD full | ❌ Tidak tampil |
| 🔧 Operasional | ✅ Full | ❌ Tidak tampil |
| 📜 Log | ✅ Full | ❌ Tidak tampil |
| ⚙️ Pengaturan | ✅ Full | ❌ Tidak tampil |
| 👤 Manajemen Akun | ✅ Lihat daftar saja | ❌ Tidak tampil |
| 🔒 Global Lock | ✅ Lock/unlock | ✅ Lock/unlock |

---

## Global Lock

- **Siapa bisa lock/unlock:** Admin DAN Penagih (keduanya sama)
- **Tujuan:** Melindungi data dari salah pencet, terutama penagih orang tua
- **Saat lock AKTIF:** Semua user tidak bisa tambah/edit/hapus/tandai lunas
- **Pengecualian:** Tidak ada — semua terblokir rata
- **Indikator:** Banner merah di atas semua halaman
- **Tombol lock:** Di Header, tampil untuk kedua role
- **Disimpan di:** Firestore `/settings/main` field `globalLock: boolean`

---

## Fitur Lengkap per Menu

### 🏠 Beranda
- Ringkasan bulan berjalan: total terkumpul, jumlah lunas, jumlah belum bayar, total m³
- Grafik mini proporsi lunas vs belum (donut/bar)
- Shortcut cepat ke Entry Meter
- Indikator sync status (online/offline)
- Banner Global Lock jika aktif

### 📋 Entry Meter
- Pilih pelanggan dari daftar (search by nama/dusun/RT)
- Input angka meter bulan ini (`inputMode="numeric"` — keyboard angka otomatis)
- Meter awal otomatis diambil dari meter akhir bulan lalu (kecuali bulan pertama — isi manual)
- Preview kalkulasi real-time: pemakaian, abonemen, blok 1, blok 2, total
- Snapshot harga saat tagihan dibuat (perubahan harga tidak mempengaruhi tagihan lama)
- Field catatan opsional
- Nomor tagihan otomatis: `TAG-2026-04-001-NAMAPELANGGAN`
- Konfirmasi sebelum simpan
- Log aktivitas otomatis

### 💧 Tagihan
- List tagihan bulan aktif (bisa ganti bulan/tahun)
- Filter: Semua / Lunas / Belum Bayar
- Tandai Lunas (dengan konfirmasi)
- Admin: Hapus tagihan (konfirmasi kuat)
- Share tagihan individual ke WA sebagai PDF (via `navigator.share` atau `wa.me`)

### 📁 Rekap
- Rekap per bulan, filter dusun/RT
- Tabel: nama, m³, tagihan, status + baris total
- Export PDF rekap (admin only)
- Ringkasan WA kolektif: daftar belum bayar → `wa.me` link

### ⚠️ Tunggakan
- List pelanggan dengan tagihan belum lunas (bulan-bulan lalu)
- Tampil: nama, dusun, RT, bulan tunggakan, jumlah bulan, total tunggakan
- Mode tunggakan (diatur di Pengaturan):
  - **Carry-over:** total dijumlahkan ke tagihan bulan berikutnya
  - **Berdiri sendiri:** tiap bulan independen
- Tandai Lunas + Share WA

### 📈 Grafik
- Tren pemakaian m³ per bulan (line chart)
- Tren pendapatan per bulan (bar chart)
- Komparasi pemakaian antar dusun
- Top pemakaian tertinggi bulan ini

### 👥 Pelanggan (Admin Only)
- List dengan filter dusun/RT/status + search
- Tambah pelanggan: nama, nomor sambungan (unik), alamat, RT, dusun, status Aktif
- Edit data, ubah status (Aktif/Nonaktif/Pindah) — data tidak dihapus
- Hapus permanen hanya jika tidak ada riwayat tagihan
- Lihat riwayat tagihan per pelanggan

### 🔧 Operasional (Admin Only)
- Catat pengeluaran: label, nominal, tanggal
- List dan total per bulan
- Tampil di Beranda sebagai pengurang pendapatan bersih

### 📜 Log Aktivitas (Admin Only)
- Semua aktivitas tercatat: entry meter, tandai lunas, hapus, ubah harga, dll
- Tampil: timestamp, user, aksi, detail
- Filter per tanggal/user/jenis aksi
- Maks 500 log (yang lama otomatis terhapus)

### ⚙️ Pengaturan (Admin Only)
- **Tarif:** Abonemen, Harga Blok 1, Batas Blok, Harga Blok 2 + riwayat perubahan
- **Dusun & RT:** tambah/edit/hapus nama dusun dan RT per dusun
- **Mode Tunggakan:** carry-over atau berdiri sendiri
- **Dark/Light Mode:** toggle, tersimpan di `localStorage` per perangkat
- **Backup Data:** download JSON seluruh data Firestore
- **Manajemen Akun:** daftar user (nama, email, role) — read only
- **Info Aplikasi:** nama app, versi, Firebase project

---

## Data Model Firestore

```
/settings/main                      ← dokumen tunggal (bukan collection)
  globalLock: boolean
  abonemen: number
  hargaBlok1: number
  batasBlok: number                 ← default 10 m³
  hargaBlok2: number
  modeTunggakan: 'carryover' | 'mandiri'
  dusunList: string[]
  rtPerDusun: Record<string, string[]>
  namaOrganisasi: string
  desa: string
  kecamatan: string
  versi: string

/hargaHistory/{id}
  tanggal: Timestamp
  abonemen: number
  hargaBlok1: number
  batasBlok: number
  hargaBlok2: number
  catatan: string
  diubahOleh: string                ← email admin

/members/{id}
  nama: string
  nomorSambungan: string            ← unik
  alamat: string
  rt: string
  dusun: string
  status: 'aktif' | 'nonaktif' | 'pindah'
  meterAwalPertama: number
  createdAt: Timestamp
  createdBy: string                 ← email

/tagihan/{id}
  nomorTagihan: string              ← TAG-YYYY-MM-NNN-NAMAPELANGGAN
  memberId: string
  memberNama: string
  memberNomorSambungan: string
  memberDusun: string
  memberRT: string
  bulan: number                     ← 1–12
  tahun: number
  meterAwal: number
  meterAkhir: number
  pemakaian: number                 ← meterAkhir - meterAwal
  hargaHistoryId: string            ← snapshot referensi harga saat entry
  abonemenSnapshot: number
  hargaBlok1Snapshot: number
  batasBlokSnapshot: number
  hargaBlok2Snapshot: number
  subtotalBlok1: number
  subtotalBlok2: number
  subtotalPemakaian: number
  total: number                     ← abonemen + subtotalPemakaian
  status: 'lunas' | 'belum'
  tanggalBayar: Timestamp | null
  tanggalEntry: Timestamp
  entryOleh: string                 ← email penagih/admin
  catatan: string

/operasional/{id}
  label: string
  nominal: number
  tanggal: Timestamp
  bulan: number
  tahun: number
  dicatatOleh: string

/activityLog/{id}
  action: string
  detail: string
  ts: Timestamp
  user: string                      ← email
  role: string                      ← 'admin' | 'penagih'

/roles/{uid}
  role: 'admin' | 'penagih'
  nama: string
  email: string
  createdAt: Timestamp
```

---

## Struktur Harga & Kalkulasi Tagihan

```
Total = Abonemen + Subtotal Pemakaian

Jika pemakaian ≤ batasBlok:
  subtotalPemakaian = pemakaian × hargaBlok1

Jika pemakaian > batasBlok:
  subtotalBlok1    = batasBlok × hargaBlok1
  subtotalBlok2    = (pemakaian - batasBlok) × hargaBlok2
  subtotalPemakaian = subtotalBlok1 + subtotalBlok2
```

**Contoh (pemakaian 15 m³):**
```
Abonemen  : Rp  5.000
Blok 1    : 10 × 2.000 = Rp 20.000
Blok 2    :  5 × 3.000 = Rp 15.000
Total     : Rp 40.000
```

**Aturan penting:**
- Setiap perubahan harga disimpan ke `/hargaHistory` dengan timestamp
- Setiap tagihan menyimpan snapshot harga saat dibuat (`hargaHistoryId`)
- **Tagihan lama tidak pernah berubah** meski harga diupdate

---

## UI/UX — Panduan Visual

### Palet Warna (CSS Variables di `app/globals.css`)

| Token | Light | Dark | Penggunaan |
|---|---|---|---|
| `--color-primary` | `#0369A1` | sama | Tombol utama, link |
| `--color-accent` | `#0284C7` | sama | Highlight, focus |
| `--color-lunas` | `#15803D` | sama | Status lunas, sukses |
| `--color-belum` | `#B91C1C` | sama | Status belum, error |
| `--color-tunggakan` | `#92400E` | sama | Peringatan |
| `--color-bg` | `#F8FAFC` | `#0F172A` | Background |
| `--color-card` | `#FFFFFF` | `#1E293B` | Card/panel |
| `--color-border` | `#E2E8F0` | `#334155` | Border |
| `--color-txt` | `#111827` | `#F1F5F9` | Teks utama |
| `--color-txt2` | `#374151` | `#CBD5E1` | Teks sekunder |
| `--color-txt3` | `#6B7280` | `#94A3B8` | Label, placeholder |

### Tipografi

| Penggunaan | Font | Weight | Min Size |
|---|---|---|---|
| Judul halaman | Plus Jakarta Sans | 800 | 20px |
| Sub-judul | Plus Jakarta Sans | 700 | 16px |
| Body/konten | Plus Jakarta Sans | 400–500 | 15px |
| Label form | Plus Jakarta Sans | 500 | 13px |
| Angka meter/nominal | JetBrains Mono | 500–700 | 15px |

### UX Orang-Tua-Friendly
- Tombol aksi utama: **minimum 52px tinggi**
- Semua elemen interaktif: **minimum 44px touch target**
- Font body **minimum 15px** — tidak ada teks di bawah 12px
- Tidak ada gestur swipe tersembunyi
- **Konfirmasi dialog** sebelum setiap aksi hapus/ubah penting
- Pesan error dalam Bahasa Indonesia yang jelas
- `inputMode="numeric"` pada semua input angka
- Loading state selalu tampil
- Dark mode tersimpan per perangkat via `localStorage`

### Utility Classes (siap pakai di semua komponen)
- `.card` — card dengan border + shadow
- `.btn-primary` — tombol biru utama (52px)
- `.btn-secondary` — tombol outline
- `.btn-ghost` — tombol transparan
- `.btn-danger` — tombol merah (ditambah ke btn-primary)
- `.input-field` — input standar (52px)
- `.badge-lunas` / `.badge-belum` — badge status
- `.mono` — font JetBrains Mono untuk angka
- `.pb-safe` — padding bawah untuk bottom nav
- `.section-label` — label section uppercase

---

## Fitur yang Dihapus dari WifiPay

| Fitur WifiPay | Alasan Dihapus di AirKu |
|---|---|
| PIN Lock & Idle Timeout | Global Lock sudah cukup |
| Manajemen Zona (KRS/SLK) | Diganti Dusun/RT |
| Pengaturan Bahasa (i18n) | Full Bahasa Indonesia |
| Quick Pay amounts | Tagihan dihitung otomatis |
| Free Member | Tidak relevan |
| Import JSON | Tidak diperlukan |
| Export Excel | Cukup PDF |
| Field IP Address | Tidak relevan |
| Tarif flat per member | Diganti harga global per m³ |
| Lock Entry per bulan | Diganti Global Lock |

---

## Rencana & Status Sesi

### ✅ Sesi 0 — Planning Final
Diskusi lengkap konsep, fitur, role, UI/UX, data model. Tidak ada file project.

---

### ✅ Sesi 1 — Fondasi & Auth
**Status: SELESAI — Build sukses (14 routes, 0 TypeScript error)**

**File yang dibuat/dimodifikasi:**
- `lib/constants.ts` — APP_NAME, MONTHS, YEARS, PAGE_TITLES, PAGE_ICONS, MAX_LOG_ENTRIES
- `lib/firebase.ts` — Firebase init SSR-safe (fallback `"placeholder"` agar build tanpa `.env.local` tidak crash)
- `types/index.ts` — Semua interface: UserRole, AppSettings, HargaHistory, Member, Tagihan, Operasional, ActivityLog + defaultSettings
- `store/useAppStore.ts` — Zustand store: auth slice, settings slice, toast slice, confirm slice, online state
- `hooks/useAuth.ts` — `onAuthStateChanged` + fetch role dari `/roles/{uid}`
- `hooks/useSettings.ts` — `onSnapshot` ke `/settings/main`
- `app/globals.css` — CSS variables (light+dark), utility classes lengkap
- `app/layout.tsx` — Root layout + metadata PWA + viewport
- `app/page.tsx` — Redirect ke `/dashboard`
- `app/login/page.tsx` — Login form (email+password, show/hide password, pesan error Bahasa Indonesia, `browserLocalPersistence`)
- `app/(app)/layout.tsx` — `dynamic import AppShell { ssr: false }` — mencegah Firebase crash saat prerender
- `components/layout/AppShell.tsx` — Auth guard, dark mode init dari localStorage, online/offline listener
- `components/layout/Header.tsx` — Title dinamis, tombol lock (update Firestore langsung), dark mode toggle, online indicator
- `components/layout/BottomNav.tsx` — 5 item berbeda untuk admin vs penagih
- `components/layout/LockBanner.tsx` — Banner merah kondisional dari `settings.globalLock`
- `components/layout/LoadingScreen.tsx` — Splash screen animasi
- `components/ui/Toast.tsx` — Auto-dismiss 3.5 detik, 3 tipe (success/error/info)
- `components/ui/Confirm.tsx` — Dialog modal dengan mode danger
- `public/favicon.svg` — Ikon tetes air SVG
- `public/icons/icon-{72,96,128,144,152,192,384,512}.png` — PWA icons semua ukuran
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service Worker: network-first untuk app, skip Firebase/googleapis
- `next.config.ts` — Header cache-control untuk sw.js
- `vercel.json` — Build config pnpm
- `.gitignore` — Termasuk `.env.local`, `.next`, `node_modules`
- `.env.local.example` — Template env vars
- Stub pages: dashboard, entry, tagihan, rekap, tunggakan, grafik, members, operasional, log, settings, accounts

**Catatan teknis Sesi 1:**
- Firestore `settings` menggunakan document ID `"main"`: `/settings/main` (bukan auto-ID)
- `AppShell` di-dynamic import `{ ssr: false }` — wajib dipertahankan
- `firebaseConfig.apiKey` pakai fallback `"placeholder"` — hapus fallback ini setelah `.env.local` diisi

---

### ✅ Sesi 2 — Firestore Helpers + Beranda + Entry Meter
**Status: SELESAI**

**Target:** Bisa entry meter dan lihat dashboard beranda dengan data real

**File yang akan dibuat:**
- `lib/db.ts` — Semua fungsi Firestore:
  - `listenTagihan(bulan, tahun, callback)` — realtime listener
  - `listenMembers(callback)` — realtime listener
  - `saveTagihan(data)` — simpan tagihan baru
  - `updateTagihanStatus(id, status)` — tandai lunas/belum
  - `deleteTagihan(id)` — hapus tagihan
  - `getLastMeter(memberId, bulan, tahun)` — ambil meter akhir bulan sebelumnya
  - `saveActivityLog(action, detail)` — catat log (dengan auto-trim 500 entri)
  - `generateNomorTagihan(bulan, tahun)` — generate TAG-YYYY-MM-NNN-NAMA
- `lib/helpers.ts` — Fungsi kalkulasi & format:
  - `hitungTagihan(meterAwal, meterAkhir, settings)` → { subtotalBlok1, subtotalBlok2, subtotalPemakaian, total }
  - `formatRp(number)` → "Rp 40.000"
  - `formatM3(number)` → "15 m³"
  - `formatTanggal(Timestamp)` → "20 Apr 2026"
  - `getBulanTahunAktif()` → { bulan, tahun } bulan berjalan
- `components/views/DashboardView.tsx` — Dashboard lengkap:
  - 4 stat cards: total terkumpul, jumlah lunas, jumlah belum, total m³
  - Donut chart mini proporsi lunas vs belum
  - Ringkasan pendapatan bersih (terkumpul - operasional)
  - Shortcut button ke Entry Meter
- `components/views/EntryView.tsx` — Entry meter lengkap:
  - Search & pilih pelanggan (filter nama/dusun/RT)
  - Info pelanggan terpilih (nama, nomor sambungan, alamat, dusun, RT)
  - Input meter sekarang (`inputMode="numeric"`)
  - Meter awal otomatis dari bulan lalu (atau manual jika bulan pertama)
  - Preview kalkulasi real-time
  - Field catatan opsional
  - Tombol Simpan dengan konfirmasi
  - Log aktivitas otomatis setelah simpan
- `app/(app)/dashboard/page.tsx` — Render DashboardView
- `app/(app)/entry/page.tsx` — Render EntryView

**File yang akan diedit:**
- `store/useAppStore.ts` — Tambah slice: `activeBulan`, `activeTahun`, daftar `members`, daftar `tagihan`
- `README.md` — Update status Sesi 2

**Tidak dikerjakan di Sesi 2:**
- PDF export
- Share WA
- Grafik kompleks (chart library belum dipilih)

---

### ✅ Sesi 3 — Tagihan + Tunggakan
**Status: SELESAI**

**Target:** Lihat, tandai lunas, share tagihan per pelanggan ke WA

**File yang dibuat/dimodifikasi:**
- `lib/export.ts` — Generate PDF tagihan individual (jsPDF client-side, lazy import), share WA via Web Share API + fallback wa.me teks, download PDF helper
- `components/views/TagihanView.tsx` — List tagihan realtime, filter Semua/Lunas/Belum, search, stat cards, bulan picker, tandai lunas/belum (konfirmasi), hapus (admin, danger), share WA, download PDF per tagihan
- `components/views/TunggakanView.tsx` — List tunggakan dikelompokkan per pelanggan, expand detail per bulan, tandai lunas per tagihan atau semua sekaligus, share WA per tagihan + share kolektif WA, auto-refresh setelah update
- `app/(app)/tagihan/page.tsx` — Render TagihanView
- `app/(app)/tunggakan/page.tsx` — Render TunggakanView
- `package.json` — Tambah dependency `jspdf: ^2.5.2`

**Catatan teknis Sesi 3:**
- jsPDF di-lazy import (`await import("jspdf")`) — tidak masuk SSR bundle
- PDF format 80mm width (thermal printer friendly)
- Web Share API dicoba dulu; fallback ke wa.me teks jika tidak support
- TunggakanView pakai one-time fetch (bukan realtime) karena query lintas bulan — ada tombol "Perbarui Data" manual + auto-refetch setelah tandai lunas

---

### ✅ Sesi 4 — Rekap + Grafik
**Status: SELESAI**

**Target:** Rekap per bulan/dusun bisa export PDF, grafik tren tampil

**File yang dibuat/dimodifikasi:**
- `lib/db.ts` — Tambah: `listenOperasional`, `getTagihanByTahun`, `getOperasionalByTahun`, `getTagihanRekap`, `saveOperasional`, `deleteOperasional`
- `lib/export.ts` — Tambah: `downloadPdfRekap` (A4 landscape, tabel dengan zebra stripe, summary, footer), `buildWaKolektif` (daftar belum bayar), `RekapRow` interface
- `components/views/RekapView.tsx` — Tabel rekap scrollable, filter dusun/RT dari data aktual, stat cards (terkumpul/total/lunas/m³), pendapatan bersih jika ada operasional, export PDF (admin only), share WA kolektif belum bayar, bulan picker
- `components/views/GrafikView.tsx` — Navigasi per tahun, line chart tren m³ (Recharts), bar chart tren pendapatan + operasional, bar chart horizontal komparasi dusun, top 5 pemakaian tertinggi dengan progress bar + emoji medal
- `app/(app)/rekap/page.tsx` — Render RekapView
- `app/(app)/grafik/page.tsx` — Render GrafikView
- `package.json` — Tambah `recharts: ^2.15.3`

**Catatan teknis Sesi 4:**
- GrafikView otomatis memotong data bulan yang belum tiba di tahun berjalan
- Komparasi dusun dan Top 5 menggunakan data bulan aktif (`activeBulan`) dari store
- RekapView filter dusun/RT dibangun dari data tagihan aktual (bukan dari settings) — lebih akurat
- PDF Rekap format A4 landscape, mendukung page break otomatis jika banyak pelanggan

---

### ✅ Sesi 5 — Pelanggan + Operasional + Log
**Status: SELESAI**

**File yang dibuat/dimodifikasi:**
- `lib/db.ts` — Tambah: `saveMember`, `updateMember`, `deleteMember`, `cekMemberPunyaTagihan`, `cekNomorSambunganTerpakai`, `getTagihanByMember`, `listenActivityLog`
- `components/views/MembersView.tsx` — CRUD pelanggan lengkap: stat cards, search, filter dusun/status, tambah/edit modal (dengan dropdown dusun/RT dari settings), hapus (cek riwayat tagihan dulu), detail riwayat tagihan per pelanggan
- `components/views/OperasionalView.tsx` — Catat + list pengeluaran per bulan: bulan picker, summary total, form tambah (label, nominal, tanggal), hapus dengan konfirmasi, log aktivitas otomatis
- `components/views/LogView.tsx` — Log aktivitas realtime: 100 log terbaru, search, filter jenis aksi + tanggal, warna/emoji per jenis aksi, badge user + role
- `app/(app)/members/page.tsx` — dynamic import MembersView
- `app/(app)/operasional/page.tsx` — dynamic import OperasionalView
- `app/(app)/log/page.tsx` — dynamic import LogView

**Catatan teknis Sesi 5:**
- Hapus pelanggan dicegah jika sudah ada riwayat tagihan — user diarahkan ubah status
- Nomor sambungan dicek unik sebelum simpan (exclude self saat edit)
- Dropdown dusun/RT di form member menggunakan data dari `settings.dusunList` / `settings.rtPerDusun` — fallback ke input manual jika settings belum diisi
- LogView listen 100 log terbaru via `onSnapshot` — realtime tanpa refresh manual
- OperasionalView nominal input otomatis format ribuan saat mengetik

---

### ✅ Sesi 6 — Pengaturan + PWA Polish
**Status: SELESAI**

**File yang dibuat/dimodifikasi:**
- `components/views/SettingsView.tsx` — 6 section collapsible: Tarif (dengan riwayat perubahan), Dusun/RT (CRUD lengkap), Mode Tunggakan (toggle), Info Organisasi, Manajemen Akun (daftar + petunjuk tambah akun manual via Console), Backup & Restore (export/import JSON semua collection), Info Aplikasi
- `app/(app)/settings/page.tsx` — dynamic import SettingsView
- `app/(app)/accounts/page.tsx` — redirect ke /settings (section accounts terintegrasi di SettingsView)
- `lib/db.ts` — Tambah: `getHargaHistoryList`, `saveHargaHistory`, `updateSettings`, `getRoles`, `exportBackup`, `importBackup`
- `public/sw.js` — Upgrade ke `airku-v2`: network-first dengan cache fallback, cache-first untuk `_next/static`, skip Firebase/Google API domains, SKIP_WAITING message handler
- `firestore.rules` — Security rules produksi: hanya Firebase Auth user terdaftar di `/roles`, admin CRUD penuh, penagih baca+entry+tandai lunas, log hanya tulis, akun hanya via Console

**Catatan teknis Sesi 6:**
- `/accounts` redirect ke `/settings` — section Manajemen Akun sudah terintegrasi di SettingsView
- Backup: Timestamp dikonversi ke ISO string saat export, dikembalikan ke Timestamp saat import
- Import tidak hapus data lama — dokumen ID sama di-overwrite (upsert)
- `firestore.rules` deploy manual: `firebase deploy --only firestore:rules`

**Hot-fix setelah Sesi 6 (build error Vercel):**
- 6 page files (`dashboard`, `entry`, `log`, `members`, `operasional`, `settings`) ditambah `"use client"` — Next.js 16 Turbopack melarang `ssr: false` di Server Component
- `TagihanView.tsx` line 137: cast `item.tanggalBayar as boolean` — type `unknown` tidak bisa langsung jadi ReactNode condition
- Build lokal verified: 16 routes, 0 TypeScript error, 0 warning

---

### 🔜 Sesi 7 — QA Final + Bug Fix + Production Ready
**Target:** ZIP final siap deploy ke Vercel

**Yang dikerjakan:**
- Testing semua flow end-to-end
- Testing role (penagih tidak bisa akses menu admin)
- Testing Global Lock
- Testing dark/light mode konsistensi
- Testing offline
- Edge cases: bulan pertama entry, pelanggan tanpa riwayat, harga berubah di tengah bulan
- Bug fix
- Konsistensi UI: spacing, warna, ukuran font
- Deploy guide final

---

## Aturan Kerja Antar Sesi

1. **1 ZIP = 1 project utuh** — semua file dari sesi sebelumnya selalu dibawa
2. **README.md ini selalu diupdate in-place** — tidak dibuat file README baru
3. **Edit file lama** jika sesi berikutnya membutuhkan perubahan — tidak buat duplikat
4. **Nama ZIP:** `airku-sesi-[nomor]-[deskripsi].zip`
5. **Sesi baru = chat baru** — kirim ZIP sesi sebelumnya sebagai konteks
6. **Diskusi dulu** sebelum eksekusi jika ada perubahan fitur/desain signifikan
7. **Tidak deploy ke Vercel** sampai developer bilang siap
8. **`.env.local` tidak pernah masuk ZIP**
9. **`node_modules` dan `.next` tidak masuk ZIP**
