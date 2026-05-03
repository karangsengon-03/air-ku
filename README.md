# Air-Ku — Sistem Iuran Air Desa

Aplikasi PWA berbasis Next.js + Firebase untuk manajemen iuran air bulanan desa.

---

## Stack Teknologi

| Lapisan | Teknologi |
|--------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript strict |
| Styling | Tailwind CSS v4 + CSS Variables |
| State | Zustand |
| Backend | Firebase Firestore + Firebase Auth |
| Font | Plus Jakarta Sans + JetBrains Mono (via `next/font/google`) |
| Deploy | Vercel (via GitHub) |

---

## Fitur Utama

- **Dashboard** — ringkasan bulanan: pemasukan, pemakaian, status lunas/belum
- **Entry Bayar** — input meter + hitung tagihan otomatis berdasarkan tarif blok
- **Tagihan** — daftar tagihan bulan aktif dengan filter dan search
- **Tunggakan** — daftar tunggakan antar bulan, mark-as-lunas, share WA
- **Pelanggan** — CRUD data pelanggan, filter dusun/RT/status
- **Rekap** — tabel rekap bulanan, export PDF, kirim WA
- **Grafik** — tren pemakaian dan pendapatan per tahun
- **Operasional** — pencatatan biaya operasional bulanan
- **Log Aktivitas** — audit trail semua perubahan data
- **Pengaturan** — tarif air, dusun/RT, organisasi, backup/restore

---

## Standar UI & Aksesibilitas

Mengikuti `prompt-desa.md`:
- Minimum font-size: **13px** di seluruh komponen
- Minimum touch target: **48px** untuk semua elemen interaktif
- Kontras warna: minimum **7:1** untuk teks utama
- Focus ring visible untuk navigasi keyboard
- Bahasa Indonesia seluruhnya, tanpa istilah teknikal di UI
- Semua warna via CSS variables (tidak ada hardcoded #hex di komponen)

---

## Struktur Folder

```
air-ku/
├── app/                     # Next.js App Router
│   ├── (app)/               # Route group: halaman utama (autentikasi diperlukan)
│   ├── (auth)/login/        # Halaman login
│   ├── globals.css          # Global styles + CSS variables
│   └── layout.tsx           # Root layout (font + metadata)
├── components/
│   ├── features/            # Komponen per fitur (dashboard, entry, tagihan, dll)
│   ├── layout/              # AppShell, BottomNav, Header, dll
│   └── ui/                  # Komponen UI generik (Toast, Confirm)
├── hooks/                   # Custom hooks (useAuth, useData, useSettings)
├── lib/                     # Utilitas (db, firebase, helpers, export)
├── store/                   # Zustand store (useAppStore)
├── types/                   # TypeScript types
├── public/                  # Static assets (icons, manifest, sw.js)
├── CHANGES.md               # Log perubahan per sesi
└── README.md                # File ini
```

---

## Setup Lokal

```bash
# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Isi semua NEXT_PUBLIC_FIREBASE_* dengan nilai dari Firebase Console

# Jalankan dev server
npm run dev
```

---

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Development Tracker

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Aksesibilitas & Standar Visual Dasar | ✅ Selesai |
| Phase 2 | Aksesibilitas Lanjutan & Kelengkapan Fitur | ✅ Selesai |
| Phase 3 | Library Modern & Refactor Arsitektur | ✅ Selesai |
| Phase 4 | Testing & Finalisasi | ✅ Selesai |

Lihat `readme-fix-air-ku.md` untuk detail lengkap semua temuan dan status fix.

---

## Deploy

Proyek terhubung ke Vercel via GitHub. Setiap push ke `main` akan trigger deploy otomatis.

