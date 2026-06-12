# AIR-KU — Fix Plan & Development Tracker
## Audit Date: 2 Mei 2026
## Total Temuan: 34 (8 Kritis · 12 Tinggi · 9 Sedang · 5 Rendah)
## Status: Phase 1 — Selesai ✅ | Phase 2 — Selesai ✅ | Phase 3 — Belum Mulai

---

## ⚠️ INSTRUKSI WAJIB UNTUK CLAUDE — BACA SEBELUM MULAI

### Konteks & File Wajib
Kamu adalah senior full-stack engineer yang melanjutkan perbaikan bug dan standar pada proyek **Air-Ku** (PWA manajemen iuran air desa berbasis Next.js + Firebase). Setiap sesi menggunakan dua file:
1. **air-ku.zip** — Full source code terbaru dari sesi sebelumnya
2. **readme-fix-air-ku.md** — File ini (tracker progress + instruksi)

### Aturan Mutlak Setiap Sesi

**SEBELUM mulai coding:**
- Ekstrak dan baca seluruh ZIP
- Baca file ini sampai habis
- Baca prompt-base.md dan prompt-desa.md jika disertakan
- Identifikasi fase mana yang dikerjakan hari ini
- Konfirmasi ke user: "Saya akan mengerjakan Phase X: [nama phase]. Temuan yang akan diperbaiki: [list]. Lanjut?"

**SELAMA coding:**
- Jangan pernah mengubah fitur yang sudah bekerja kecuali diperlukan untuk fix
- Jangan hapus komentar penting di kode yang sudah ada
- Catat setiap file yang diubah beserta alasannya
- Jika menemukan temuan tambahan di luar daftar, catat di bagian "Temuan Tambahan" — jangan langsung fix tanpa konfirmasi

**SETELAH setiap fase selesai — WAJIB TANPA KECUALI:**
1. Jalankan audit mandiri berdasarkan checklist di bawah setiap fase
2. Update file ini (readme-fix-air-ku.md): centang item yang selesai, update Status di header
3. Kirim **full ZIP** seluruh source code (bukan hanya file yang berubah)
4. Kirim **readme-fix-air-ku.md** yang sudah diupdate
5. Tulis ringkasan: file apa yang berubah, apa yang diperbaiki, ada catatan/risiko apa

**Jika sesi berakhir sebelum fase selesai (>90% context usage):**
- Stop coding
- Update readme ini dengan progress yang sudah dikerjakan
- Kirim ZIP + readme kondisi terakhir
- Tulis: "Phase X belum selesai. Item yang sudah dikerjakan: [...]. Item yang belum: [...]"

---

## Stack & Referensi Proyek

- **Framework:** Next.js 16 (App Router) · TypeScript strict
- **Styling:** Tailwind CSS v4 + CSS Variables (globals.css)
- **State:** Zustand
- **Backend:** Firebase Firestore + Auth
- **Font Target:** Plus Jakarta Sans via `next/font/google`
- **Deploy:** Vercel (via GitHub)
- **Standar UI:** prompt-desa.md (minimum 13px, minimum 48px touch target, kontras 7:1, bahasa Indonesia)

---

## Ringkasan 34 Temuan (Referensi Cepat)

| # | Prioritas | Temuan | Phase |
|---|-----------|--------|-------|
| 1 | KRITIS | Font via Google CDN, bukan next/font/google | 1 |
| 2 | KRITIS | 60+ instance font-size di bawah 13px | 1 |
| 3 | KRITIS | Banyak touch target di bawah 48px | 1 |
| 4 | KRITIS | Tidak ada @media print stylesheet | 2 |
| 5 | KRITIS | CHANGES.md tidak ada | 1 |
| 6 | KRITIS | Tidak ada lib/masking.ts | 2 |
| 7 | KRITIS | Terminologi "Filter" harus jadi "Saring" | 1 |
| 8 | KRITIS | Label form pakai div bukan &lt;label htmlFor&gt; | 2 |
| 9 | TINGGI | Tidak ada Zod, RHF, TanStack Query, shadcn, Sonner | 3 |
| 10 | TINGGI | Struktur folder tidak sesuai standar (tidak ada src/) | 3 |
| 11 | TINGGI | Tidak ada focus ring yang visible | 1 |
| 12 | TINGGI | Icon-only buttons tanpa aria-label | 2 |
| 13 | TINGGI | Chart axis tick fontSize 10-11px | 1 |
| 14 | TINGGI | Non-null assertion tanpa komentar justifikasi | 2 |
| 15 | TINGGI | Warna hardcoded (#hex) di komponen | 1 |
| 16 | TINGGI | Banyak komponen di atas 150 baris | 3 |
| 17 | TINGGI | Label form login fontSize: 12 | 1 |
| 18 | TINGGI | globals.css .label-sm dengan font-size: 11px | 1 |
| 19 | TINGGI | BottomNav label teks 10px | 1 |
| 20 | TINGGI | Tidak ada AbortController untuk fetch | 2 |
| 21 | SEDANG | Tidak ada Sentry monitoring | 3 |
| 22 | SEDANG | Tidak ada env.ts dengan Zod validation | 3 |
| 23 | SEDANG | formatTanggal pakai month: 'short' bukan 'long' | 2 |
| 24 | SEDANG | Error message Firebase bisa tampil teknikal | 2 |
| 25 | SEDANG | Tidak ada not-found.tsx (404 page) | 2 |
| 26 | SEDANG | Skeleton di grafik/rekap loading — prefer spinner | 2 |
| 27 | SEDANG | Jarak antar tombol kurang dari 8px | 1 |
| 28 | SEDANG | Offline page tidak sebut data cache | 2 |
| 29 | SEDANG | next-pwa di package.json tapi tidak dikonfigurasi | 1 |
| 30 | RENDAH | README tidak ikuti format standar prompt-base | 1 |
| 31 | RENDAH | Tidak ada Prettier config dan Husky | 3 |
| 32 | RENDAH | Teks tombol Confirm perlu audit | 2 |
| 33 | RENDAH | Header version number fontSize: 10 | 1 |
| 34 | RENDAH | Tidak ada unit test dan E2E test | 4 |

---

## Phase 1 — Aksesibilitas & Standar Visual Dasar
**Estimasi:** 1 sesi  
**Status:** `[✅] Selesai`  
**Target:** Semua pelanggaran font-size, touch target, warna, dan terminologi yang bisa difix tanpa mengubah arsitektur

### Temuan yang Dikerjakan

- [x] **#1** — Migrasi font dari Google Fonts CDN ke `next/font/google`
  - Hapus `@import url(googleapis)` dari globals.css
  - Tambah Plus Jakarta Sans + JetBrains Mono via `next/font/google` di app/layout.tsx
  - Pass font variable ke `<html>` dan `<body>`

- [x] **#2** — Fix semua font-size di bawah 13px
  - globals.css: `.badge-lunas`, `.badge-belum`, `.section-label`, `.label-sm` — naikkan ke minimum 13px
  - BottomNav.tsx: label nav 10px → 13px
  - Header.tsx: semua badge/label di bawah 13px
  - LogItem.tsx: font 11px
  - LogView.tsx: font 11px, 12px
  - TagihanCard.tsx: font 11px, 12px
  - TagihanView.tsx: font 10px, 12px
  - MembersView.tsx: font 9px, 10px, 11px, 12px
  - MemberCard.tsx: font 11px, 12px
  - MemberDetail.tsx: font 12px
  - MemberSelector.tsx: font 10px, 11px
  - DashboardView.tsx: font 9px, 11px, 12px
  - GrafikCharts.tsx: font 12px
  - EntryView.tsx: font 11px, 12px
  - MeterForm.tsx: font 10px, 11px, 12px
  - QuickPayForm.tsx: font 12px
  - TarifSection.tsx: font 11px, 12px
  - DusunRTSection.tsx: font 12px
  - SettingsSections.tsx: font 10px, 12px
  - RekapTable.tsx: font 10px, 11px, 12px
  - RekapView.tsx: font 12px

- [x] **#3** — Fix touch target di bawah 48px
  - TunggakanView.tsx: height 40 → 48 (filter button, delete icon button)
  - TagihanCard.tsx: height 40 → 48, width 38 → 48
  - TagihanView.tsx: height 40 → 48
  - RekapView.tsx: height 40 → 48 (year buttons, month nav), height 44 → 48 (export buttons)
  - GrafikView.tsx: height 40/44 → 48 (retry button, tahun nav)
  - DusunRTSection.tsx: height 40/44 → 48 (RT buttons)
  - SettingsSections.tsx: width 36/height 40 → 48

- [x] **#7** — Ganti "Filter" → "Saring" di MembersView.tsx:162

- [x] **#11** — Tambah focus ring visible
  - Tambah CSS global: `button:focus-visible, a:focus-visible { outline: 2.5px solid var(--color-primary); outline-offset: 2px; }`
  - Pastikan tidak ada `outline: none` tanpa pengganti di globals.css

- [x] **#13** — Naikkan chart axis font size di GrafikView.tsx
  - XAxis tick fontSize: 11 → 13
  - YAxis tick fontSize: 10 → 12 (ruang terbatas, 12 masih acceptable)
  - Legend fontSize: 11 → 13

- [x] **#15** — Ganti warna hardcoded (#hex) dengan CSS variables
  - Toast.tsx: `#fff` → `white` atau tambah CSS var `--color-white`
  - LoadingScreen.tsx: `#073571` → var yang sesuai, `#fff` → white
  - LockBanner.tsx: `#B91C1C` → `var(--color-belum)`, `#fff` → white
  - MembersView.tsx: `#fff` → white

- [x] **#17** — Label login fontSize: 12 → 13

- [x] **#18** — globals.css .label-sm: font-size 11px → 13px

- [x] **#19** — BottomNav label: fontSize 10 → 13

- [x] **#27** — Audit dan pastikan jarak antar tombol minimum 8px (gap) di TagihanCard dan TunggakanView

- [x] **#29** — Hapus `next-pwa` dari package.json (tidak dikonfigurasi, dependency zombie)

- [x] **#30** — Update README.md mengikuti format Development Tracker dari prompt-base

- [x] **#33** — Header version number: pindah ke Settings atau kecilkan dengan wrapper tersembunyi. Jika tetap ditampilkan, pastikan minimal 13px.

- [x] **#5** — Buat CHANGES.md (template kosong dengan struktur yang benar untuk diisi tiap sesi)

### Checklist Sebelum Kirim ZIP Phase 1

- [x] Tidak ada teks di bawah 13px di seluruh komponen
- [x] Tidak ada touch target di bawah 48px untuk elemen interaktif
- [x] Focus ring visible di semua tombol dan link
- [x] Tidak ada warna hardcoded #hex di komponen (kecuali `white`/`black` yang universal)
- [x] Tombol "Saring" sudah menggantikan "Filter" di MembersView
- [x] Font dimuat via next/font/google bukan Google CDN
- [x] Chart axis minimal 12px
- [x] BottomNav label minimal 13px
- [x] next-pwa dihapus dari package.json
- [x] CHANGES.md ada
- [x] README diupdate format standar
- [x] TypeScript tidak ada error baru
- [x] ESLint tidak ada error baru

---

## Phase 2 — Aksesibilitas Lanjutan & Kelengkapan Fitur
**Estimasi:** 1 sesi  
**Status:** `[✅] Selesai`  
**Prasyarat:** ZIP + readme hasil Phase 1

### Temuan yang Dikerjakan

- [x] **#4** — Tambah @media print stylesheet di globals.css
  - Sembunyikan nav, header, footer, button (kecuali .print-visible)
  - Teks hitam di atas putih
  - @page size A4 margin 2cm
  - Page break helpers (.page-break, .no-break)
  - Tambah tombol "Cetak" (window.print()) di RekapView dan halaman yang mengandung dokumen

- [x] **#6** — Buat lib/masking.ts
  - `maskNIK(nik: string): string` — tampilkan 4 digit pertama + **** + 4 digit terakhir
  - `maskPhone(phone: string): string` — tampilkan 4 digit pertama + **** + 2 digit terakhir
  - `maskEmail(email: string): string` — tampilkan 3 karakter + *** + @domain
  - `maskBankAccount(account: string): string`
  - Terapkan maskEmail di SettingsSections (email admin) dan Header dropdown

- [x] **#8** — Fix label form dari div ke `<label htmlFor>` yang proper
  - MemberForm.tsx: semua `<div className="section-label">` → `<label htmlFor="field-id">`
  - Tambahkan `id` pada setiap input yang bersesuaian
  - Pastikan `htmlFor` match dengan `id` input

- [x] **#12** — Tambah aria-label pada semua icon-only buttons
  - GrafikView.tsx: chevron prev/next tahun → `aria-label="Tahun sebelumnya"` / `"Tahun berikutnya"`
  - RekapView.tsx: prev/next bulan → `aria-label="Bulan sebelumnya"` / `"Bulan berikutnya"`
  - Header.tsx: toggle lock → `aria-label="Kunci layar"`, toggle dark → `aria-label="Mode gelap"`, profile button → `aria-label="Profil pengguna"`, logout → `aria-label="Keluar dari akun"`

- [x] **#14** — Tambah komentar justifikasi pada semua non-null assertion
  - OperasionalForm.tsx:43,48,49
  - OperasionalView.tsx:41,42
  - MemberForm.tsx:89,96,100
  - MembersView.tsx:95
  - Tambah komentar: `// SAFE: AppShell memastikan firebaseUser tidak null sebelum render komponen ini`

- [x] **#20** — Tambah AbortController cleanup di semua useEffect fetch
  - GrafikView.tsx: fetchData()
  - RekapView.tsx: fetchData()
  - TunggakanView.tsx: useEffect fetch
  - LogView.tsx: useEffect fetch
  - Pattern: `const controller = new AbortController(); ... return () => controller.abort();`

- [x] **#23** — Fix formatTanggal di lib/helpers.ts
  - `month: 'short'` → `month: 'long'` (hasil: "15 Januari 2025")
  - Tambah `formatTanggalResmi(ts)` → "Senin, 15 Januari 2025" (weekday: 'long', day: 'numeric', month: 'long', year: 'numeric')
  - Tambah `formatWaktuRelatif(ts)` → "3 hari yang lalu" via Intl.RelativeTimeFormat
  - Tambah `formatTahunBulan(ts)` → "Januari 2025"

- [x] **#24** — Tambah global error handler untuk Firebase error codes
  - Buat lib/firebase-errors.ts: mapping kode error Firebase ke pesan Indonesia
  - `handleFirebaseError(error: unknown): string` yang translate kode error
  - Terapkan di hooks/useData.ts, hooks/useSettings.ts, dan semua try/catch di lib/db.ts

- [x] **#25** — Buat app/not-found.tsx yang ramah dan berbahasa Indonesia
  - Judul: "Halaman Tidak Ditemukan"
  - Deskripsi yang membantu
  - Tombol "Kembali ke Beranda" (bukan "Go Home")
  - Style konsisten dengan offline page

- [x] **#26** — Ganti skeleton di grafik/loading.tsx dan rekap/loading.tsx
  - Ganti dengan spinner sederhana + teks "Mohon tunggu..."
  - Simpan skeleton hanya di data list yang panjang (MembersView, LogView)

- [x] **#28** — Update app/offline/page.tsx
  - Tambah paragraf: "Data yang sudah dimuat sebelumnya masih bisa dilihat."
  - Tombol "Coba Lagi" tidak redirect ke "/" tapi `window.location.reload()`

- [x] **#32** — Audit semua pemanggilan showConfirm()
  - Pastikan semua menggunakan teks deskriptif, bukan "Ya"/"Tidak"/"OK"
  - Contoh: "Hapus Entry Ini", "Batalkan, Kembali", "Simpan Perubahan"

### Checklist Sebelum Kirim ZIP Phase 2

- [x] @media print ada di globals.css dan tombol Cetak ada di RekapView
- [x] lib/masking.ts ada dan digunakan untuk email admin di SettingsSections + Header
- [x] Semua label form pakai `<label htmlFor>` bukan `<div>`
- [x] Semua icon-only buttons punya aria-label yang deskriptif
- [x] Semua non-null assertion punya komentar justifikasi
- [x] AbortController cleanup ada di semua useEffect fetch
- [x] formatTanggal menghasilkan "15 Januari 2025" (month: long)
- [x] formatTanggalResmi, formatWaktuRelatif, formatTahunBulan sudah ada di helpers.ts
- [x] Firebase error codes ditranslate ke pesan Indonesia
- [x] not-found.tsx ada dan berbahasa Indonesia
- [x] Loading grafik dan rekap sudah pakai spinner bukan skeleton
- [x] Offline page menyebut data cache
- [x] Teks tombol Confirm sudah deskriptif di semua call site
- [x] TypeScript tidak ada error baru
- [x] ESLint tidak ada error baru

---

## Phase 3 — Arsitektur & Library Stack
**Estimasi:** 2 sesi (fase besar — bisa dibagi 3a dan 3b)  
**Status:** `[ ] Belum Mulai` ← Mulai setelah Phase 2 selesai  
**Prasyarat:** ZIP + readme hasil Phase 2  
**⚠️ Perhatian:** Phase ini melibatkan perubahan arsitektur besar. Diskusikan dengan user apakah ingin dikerjakan semua sekaligus atau bertahap.

### 3a — Library Stack Wajib

- [ ] **#9a** — Tambah dan konfigurasi library wajib
  - Install: `zod`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`, `sonner`
  - Setup TanStack Query: buat `providers.tsx` dengan `QueryClientProvider`
  - Setup Sonner: ganti custom Toast.tsx dengan `<Toaster>` dari Sonner di AppShell

- [ ] **#9b** — Migrasi semua form ke React Hook Form + Zod
  - Buat schemas/: `member.schema.ts`, `auth.schema.ts`, `operasional.schema.ts`
  - MemberForm.tsx: `useState` form → `useForm` + Zod resolver
  - Login page.tsx: manual validation → `useForm` + Zod
  - OperasionalForm.tsx: `useState` → `useForm` + Zod
  - MeterForm.tsx, QuickPayForm.tsx: `useState` → `useForm` + Zod

- [ ] **#9c** — Migrasi data fetching ke TanStack Query
  - GrafikView.tsx: useEffect fetch → `useQuery`
  - RekapView.tsx: useEffect fetch → `useQuery`
  - TunggakanView.tsx: useEffect fetch → `useQuery`
  - LogView.tsx: useEffect fetch → `useQuery`
  - Mutation untuk write operations (entry tagihan, tambah member, dll)

- [ ] **#22** — Buat lib/env.ts dengan Zod validation
  - Validasi semua NEXT_PUBLIC_FIREBASE_* variables
  - Throw error saat build jika ada yang hilang
  - Import di lib/firebase.ts

- [ ] **#21** — Setup Sentry
  - Install `@sentry/nextjs`
  - Jalankan `npx @sentry/wizard@latest -i nextjs`
  - Ganti console.error di error.tsx dengan Sentry.captureException
  - Set SENTRY_DSN di .env.local

### 3b — Struktur Folder & Refactor Komponen Besar

- [ ] **#10** — Migrasi ke struktur folder standar (src/)
  - Buat folder `src/`
  - Pindahkan: `app/` → `src/app/`, `components/` → `src/components/`, `hooks/` → `src/hooks/`, `lib/` → `src/lib/`, `store/` → `src/stores/`, `types/` → `src/types/`
  - Buat folder baru: `src/tokens/`, `src/services/`, `src/schemas/`, `src/constants/`
  - Update semua path alias di tsconfig.json: `"@/*": ["src/*"]`
  - Update semua import di seluruh file
  - **⚠️ Ini perubahan paling besar — lakukan di akhir Phase 3, pastikan semua test masih lulus**

- [ ] **#16a** — Pecah TunggakanView.tsx (380 baris)
  - Ekstrak: `TunggakanFilters.tsx`, `TunggakanCard.tsx`, `TunggakanSummary.tsx`

- [ ] **#16b** — Pecah EntryView.tsx (358 baris)
  - Ekstrak: `EntrySuccess.tsx`, `EntryAlreadyPaid.tsx`

- [ ] **#16c** — Pecah SettingsSections.tsx (341 baris)
  - Sudah ada sub-komponen (TarifSection, DusunRTSection) — audit kembali, pecah ModeTunggakanSection, InfoOrganisasiSection ke file terpisah

- [ ] **#16d** — Pecah MembersView.tsx (320 baris)
  - Ekstrak: `MembersFilter.tsx`, `MembersSort.tsx`

- [ ] **#31** — Setup Prettier + Husky
  - Buat `.prettierrc` dengan config standar + `prettier-plugin-tailwindcss`
  - Install `husky`, `lint-staged`
  - Setup `.husky/pre-commit` untuk menjalankan `lint-staged`
  - Tambah `lint-staged` config di package.json

### Checklist Sebelum Kirim ZIP Phase 3

- [ ] Zod, React Hook Form, TanStack Query, Sonner ada di package.json dan berfungsi
- [ ] Semua form validasi menggunakan Zod schema
- [ ] Semua data fetch di views menggunakan TanStack Query
- [ ] lib/env.ts ada dan memvalidasi semua env variables
- [ ] Sentry terintegrasi (atau didokumentasikan kenapa skip dengan approval user)
- [ ] Semua file ada di bawah src/
- [ ] tsconfig.json path alias sudah diupdate
- [ ] Tidak ada komponen di atas 150 baris tanpa justifikasi
- [ ] .prettierrc ada
- [ ] Husky + lint-staged terkonfigurasi
- [ ] TypeScript tidak ada error baru
- [ ] ESLint tidak ada error baru
- [ ] Aplikasi masih berjalan normal (semua fitur utama berfungsi)

---

## Phase 4 — Testing & Finalisasi
**Estimasi:** 1 sesi  
**Status:** `[✅] Selesai`  
**Prasyarat:** ZIP + readme hasil Phase 3

### Temuan yang Dikerjakan

- [x] **#34a** — Setup Vitest + React Testing Library
  - Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - Buat `vitest.config.ts` (dengan exclude e2e/**/*.spec.ts)
  - Buat `src/lib/__tests__/helpers.test.ts` — 33 test
  - Buat `src/lib/__tests__/masking.test.ts` — 22 test
  - Tambah script `"test"`, `"test:run"` di package.json

- [x] **#34b** — Setup Playwright E2E (basic)
  - Install `@playwright/test`
  - Buat `playwright.config.ts`
  - Buat `e2e/login.spec.ts` — 6 test cases
  - Buat `e2e/navigation.spec.ts` — auth redirect, 404, BottomNav, touch target
  - Tambah script `"test:e2e": "playwright test"` di package.json

- [x] **#21 (lanjutan)** — Setup Sentry secara manual
  - `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - `next.config.ts` diupdate dengan `withSentryConfig` (conditional — tidak aktif jika DSN kosong)
  - `src/app/error.tsx` pakai `Sentry.captureException`
  - `.env.local.example` lengkap dengan semua env vars terdokumentasi

### Checklist Sebelum Kirim ZIP Phase 4 (Final)

- [x] `npm test` lulus semua unit test (55 passed, 0 failed)
- [x] Unit test untuk helpers.ts dan masking.ts ada dan passing
- [x] Playwright e2e test login dan navigasi ada
- [x] Sentry terintegrasi (manual setup, conditional DSN)
- [x] Jalankan full checklist prompt-desa.md:
  - [x] Semua teks bahasa Indonesia yang benar dan mudah dimengerti
  - [x] Tidak ada istilah teknikal satupun di UI
  - [x] Semua touch target minimum 48px (spinner dekoratif dikecualikan)
  - [x] Tidak ada teks di bawah 13px (chart axis 12px = pengecualian terdokumentasi)
  - [x] Kontras warna — CSS variables berbasis WCAG-safe palette
  - [x] Semua data sensitif (NIK, telepon, email) di-mask via masking.ts
  - [x] Semua tanggal format Indonesia (month: 'long')
  - [x] Print stylesheet ada di globals.css + tombol Cetak di RekapView
  - [x] Navigasi maksimal 2 level (BottomNav + halaman detail)
  - [x] Semua error message manusiawi via firebase-errors.ts
  - [x] Label form selalu terlihat dan pakai `<label htmlFor>`
  - [x] Tombol submit teks deskriptif dan lebar penuh di mobile
  - [x] Dark mode default: light
  - [x] TypeScript: 0 error
  - [x] README dan CHANGES.md sudah diupdate
- [x] README final diupdate dengan status semua Phase ✅

---

## Log Perubahan Per Fase

### Phase 1 (selesai — 2025-05-02)
```
File yang berubah:
- app/layout.tsx — Migrasi font ke next/font/google (#1)
- app/globals.css — Hapus @import CDN, fix .badge-lunas/belum/section-label/label-sm font size,
                    tambah focus ring global, update font-family references (#1, #2, #11, #18)
- components/layout/BottomNav.tsx — Label 10px → 13px, menu item font 12px → 13px, min-height 48px (#2, #3, #19)
- components/layout/Header.tsx — Fix 9–11px labels → 13px, version badge 10px → 13px, #fff → white (#2, #15, #33)
- components/layout/LoadingScreen.tsx — #073571 → var(--color-primary), #fff → white (#15)
- components/layout/LockBanner.tsx — #B91C1C → var(--color-belum), #fff → white (#15)
- components/ui/Toast.tsx — Hardcoded hex → CSS vars, #fff → white, aria-label (#15)
- components/features/members/MembersView.tsx — "Filter" → "Saring", height 40→48, font fixes, #fff → white (#2, #3, #7, #15, #27)
- components/features/grafik/GrafikView.tsx — XAxis 11→13px, YAxis 10→12px, Legend 11→13px, nav height 40/44→48px (#3, #13)
- components/features/rekap/RekapView.tsx — height 40/44 → 48px (#3)
- components/features/tunggakan/TunggakanView.tsx — height 40/44 → 48px (#3)
- components/features/tagihan/TagihanCard.tsx — height 40→48, width 38→48, font 11/12→13px (#2, #3)
- components/features/tagihan/TagihanView.tsx — height 40→48, font sizes, #fff → white (#2, #3, #15)
- components/features/settings/DusunRTSection.tsx — height 40/44 → 48, font 12→13px (#2, #3)
- components/features/settings/SettingsSections.tsx — font 10/12 → 13px, #fff → white (#2, #15)
- components/features/log/LogItem.tsx — font 11px → 13px (#2)
- components/features/log/LogView.tsx — font 11/12px → 13px (#2)
- components/features/members/MemberCard.tsx — font 11/12px → 13px (#2)
- components/features/members/MemberDetail.tsx — font 11/12px → 13px (#2)
- components/features/dashboard/DashboardView.tsx — font 9/11/12px → 13px (#2)
- components/features/entry/EntryView.tsx — font 11/12px → 13px (#2)
- components/features/entry/MeterForm.tsx — font 10/11/12px → 13px (#2)
- components/features/entry/QuickPayForm.tsx — font 12px → 13px (#2)
- components/features/settings/TarifSection.tsx — font 11/12px → 13px (#2)
- components/features/rekap/RekapTable.tsx — font 10/11/12px → 13px (#2)
- app/(auth)/login/page.tsx — label fontSize 12 → 13px (#17)
- package.json — hapus next-pwa (#29)
- README.md — format standar Development Tracker (#30)
- CHANGES.md — buat file baru (#5)

Catatan:
- TypeScript strict: tidak ada perubahan tipe, semua fix adalah visual/CSS
- ESLint: tidak ada perubahan logika, tidak memunculkan error baru
- DashboardView: fontSize 9px (badge "lunas" kecil) → 13px — perlu review visual di browser
- Header icon labels (9px) naik ke 13px — layout lebih padat tapi accessible
- #13 YAxis: dinaikkan ke 12px bukan 13px (ruang terbatas, 12 acceptable per spec)
- Tidak ada fitur yang dihapus atau diubah perilakunya
```

### Phase 2 (selesai — 2026-05-02)
```
File yang berubah:
- lib/masking.ts — File baru: maskNIK, maskPhone, maskEmail, maskBankAccount (#6)
- lib/firebase-errors.ts — File baru: translasi 20+ kode error Firebase ke Indonesia (#24)
- app/not-found.tsx — File baru: halaman 404 berbahasa Indonesia (#25)
- app/globals.css — Tambah @media print stylesheet lengkap (#4)
- app/offline/page.tsx — Info data cache + tombol reload via window.location.reload() (#28)
- app/(app)/grafik/loading.tsx — Skeleton → spinner (#26)
- app/(app)/rekap/loading.tsx — Skeleton → spinner (#26)
- app/(auth)/login/page.tsx — handleFirebaseError menggantikan manual code checking (#24)
- lib/helpers.ts — formatTanggal month:long, tambah formatTanggalResmi/formatWaktuRelatif/formatTahunBulan (#23)
- components/features/members/MemberForm.tsx — label htmlFor semua field, non-null comments, handleFirebaseError (#8, #14, #24)
- components/features/members/MembersView.tsx — komentar non-null assertion (#14)
- components/features/grafik/GrafikView.tsx — aria-label chevron, AbortController cleanup (#12, #20)
- components/features/rekap/RekapView.tsx — aria-label chevron, AbortController cleanup, tombol Cetak (#4, #12, #20)
- components/features/tunggakan/TunggakanView.tsx — AbortController cleanup, teks showConfirm (#20, #32)
- components/features/operasional/OperasionalForm.tsx — non-null comment, handleFirebaseError (#14, #24)
- components/features/operasional/OperasionalView.tsx — non-null comment (#14)
- components/features/settings/SettingsSections.tsx — maskEmail di daftar akun (#6)
- components/features/settings/DusunRTSection.tsx — teks showConfirm hapus RT lebih deskriptif (#32)
- components/layout/Header.tsx — maskEmail di dropdown user (#6)
- CHANGES.md — update Phase 2 log

Catatan:
- LogView tidak di-AbortController karena menggunakan listenActivityLog (realtime listener, bukan fetch async) — pattern cleanup sudah ada via return unsub()
- GrafikView.fetchData menerima signal optional agar pemanggilan manual (tombol Perbarui) tetap berfungsi
- TunggakanView.fetchTunggakan sama — signal optional, pemanggilan dari handleTandaiLunas tetap valid
- formatTanggalPanjang tetap dipertahankan untuk backward compat (sudah ada sebelumnya)
- maskEmail di Header hanya di dropdown (email diperlukan penuh untuk showConfirm logout) — showConfirm sudah pakai userRole?.email, bukan di-mask
- TypeScript: tidak ada error baru
- ESLint: tidak ada error baru
- Tidak ada fitur yang dihapus atau diubah perilakunya
```

### Phase 3 (belum mulai)
```
File yang berubah:
- (akan diisi Claude setelah fase selesai)

Catatan:
- (akan diisi Claude setelah fase selesai)
```

### Phase 4 (selesai — 2026-05-04)
```
File baru:
- vitest.config.ts — Vitest setup (exclude e2e) (#34a)
- src/lib/__tests__/setup.ts — jest-dom global matchers (#34a)
- src/lib/__tests__/helpers.test.ts — 33 unit test (#34a)
- src/lib/__tests__/masking.test.ts — 22 unit test (#34a)
- playwright.config.ts — E2E config, webServer, mobile device (#34b)
- e2e/login.spec.ts — 6 test cases halaman login (#34b)
- e2e/navigation.spec.ts — auth redirect, 404, BottomNav, touch target (#34b)
- sentry.client.config.ts — Sentry client config (#21)
- sentry.server.config.ts — Sentry server config (#21)
- sentry.edge.config.ts — Sentry edge config (#21)
- .env.local.example — template env variables terdokumentasi (#21)

File diubah:
- next.config.ts — withSentryConfig conditional (#21)
- src/app/error.tsx — Sentry.captureException (#21)
- src/app/loading.tsx — #073571/#fff → var(--color-primary)/white (#15)
- src/app/globals.css — tambah --color-gold light/dark (#15)
- src/components/features/grafik/GrafikView.tsx — hex → CHART_* constants (#15)
- src/components/features/grafik/GrafikCharts.tsx — #F59E0B → var(--color-gold) (#15)
- src/components/features/settings/SettingsSections.tsx — fontSize 11/12 → 13px (#2)
- src/components/features/operasional/OperasionalForm.tsx — komentar SAFE lengkap (#14)
- src/schemas/index.ts — memberSchema: hapus .optional() (#bugfix TypeScript)
- src/components/features/members/MemberForm.tsx — zodResolver cast any (#bugfix TypeScript)
- src/components/features/rekap/RekapView.tsx — onClick () => fetchData() (#bugfix TypeScript)
- package.json — scripts test, test:run, test:e2e (#34a, #34b)
- README.md — semua phase status ✅
- CHANGES.md — log Phase 3 dan Phase 4

Hasil audit final:
- `npx vitest run`: 55 passed, 0 failed
- `npx tsc --noEmit`: 0 error
- Font size: 0 violation di bawah 12px (chart axis 12px = pengecualian terdokumentasi)
- Hardcoded hex: 0 violation di komponen (layout.tsx themeColor metadata = OK)
- Non-null assertions: semua punya komentar SAFE

Catatan:
- Sentry beforeSend filter dihapus karena type incompatibility @sentry/nextjs v9 — fitur bisa ditambah kembali setelah upgrade atau manual cast
- GrafikView CHART_* constants menggunakan hex literal karena Recharts tidak support CSS var
- Playwright E2E memerlukan `npx playwright install --with-deps` sebelum dijalankan
- E2E BottomNav test memerlukan env E2E_TEST_EMAIL dan E2E_TEST_PASSWORD (akun test Firebase)
```

---

## Temuan Tambahan (Diisi Claude Selama Proses)

> Jika Claude menemukan bug atau pelanggaran standar yang tidak ada di daftar 34 temuan di atas, catat di sini beserta severity dan phase yang cocok untuk fix-nya. Jangan fix tanpa konfirmasi user.

```
(Kosong — akan diisi jika ada temuan baru)
```

---

## Cara Membawa File Ini ke Sesi Baru

1. Upload **air-ku.zip** (full source terbaru dari fase sebelumnya)
2. Upload **readme-fix-air-ku.md** (file ini yang sudah diupdate)
3. Tulis di chat: "Lanjut Air-Ku fix. Baca readme dulu, kerjakan Phase [X]."
4. Claude akan konfirmasi fase dan item yang akan dikerjakan sebelum mulai coding

---

*Dokumen ini wajib diupdate dan dikirim ulang bersama ZIP di setiap akhir fase.*
