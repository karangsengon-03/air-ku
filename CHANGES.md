# CHANGES.md — Air-Ku

Format: `[YYYY-MM-DD] Versi / Phase — Deskripsi`

---

## [2026-05-02] Phase 2 — Aksesibilitas Lanjutan & Kelengkapan Fitur

### Ditambahkan
- `lib/masking.ts` — maskNIK, maskPhone, maskEmail, maskBankAccount (#6)
- `lib/firebase-errors.ts` — translasi 20+ kode error Firebase ke pesan Indonesia (#24)
- `app/not-found.tsx` — halaman 404 berbahasa Indonesia (#25)
- `@media print` stylesheet di globals.css (A4, sembunyikan nav/button, helpers .page-break/.no-break) (#4)
- Tombol "Cetak" (window.print()) di RekapView untuk admin (#4)
- `formatTanggalResmi`, `formatWaktuRelatif`, `formatTahunBulan` di lib/helpers.ts (#23)
- AbortController cleanup di GrafikView, RekapView, TunggakanView (#20)

### Diperbaiki
- `formatTanggal`: month 'short' → 'long' (output: "15 Januari 2025") (#23)
- MemberForm: semua `<div className="section-label">` → `<label htmlFor="...">` (#8)
- GrafikView, RekapView: aria-label pada chevron navigasi tahun/bulan (#12)
- Header.tsx: maskEmail diterapkan di dropdown user (#6)
- SettingsSections.tsx: maskEmail diterapkan di daftar akun (#6)
- OperasionalForm, OperasionalView: komentar justifikasi non-null assertion (#14)
- MemberForm, MembersView: komentar justifikasi non-null assertion (#14)
- Login page: handleFirebaseError menggantikan manual error code checking (#24)
- MemberForm, OperasionalForm: handleFirebaseError di catch block (#24)
- Teks showConfirm: TunggakanView lebih deskriptif (#32)
- DusunRTSection: teks hapus RT lebih deskriptif (#32)
- grafik/loading.tsx: skeleton → spinner (#26)
- rekap/loading.tsx: skeleton → spinner (#26)
- offline/page.tsx: info data cache + tombol reload via window.location.reload() (#28)

---

## [2026-05-02] Phase 1 — Aksesibilitas & Standar Visual Dasar

### Diperbaiki
- Font dimuat via `next/font/google` bukan Google Fonts CDN (#1)
- 60+ instance font-size di bawah 13px dinaikkan ke minimum 13px (#2)
- Touch target interaktif dinaikkan ke minimum 48px (#3)
- Terminologi "Filter" → "Saring" di MembersView (#7)
- Focus ring visible via CSS global (#11)
- Chart axis tick fontSize dinaikkan (#13)
- Warna hardcoded #hex → CSS variables di Toast, LoadingScreen, LockBanner, dll (#15)
- Label form login fontSize 12 → 13 (#17)
- .label-sm font-size 11px → 13px (#18)
- BottomNav label 10px → 13px (#19)
- Jarak antar tombol minimum 8px (#27)
- next-pwa dihapus dari package.json (#29)

### Ditambahkan
- CHANGES.md (#5)
- README.md diupdate ke format standar Development Tracker (#30)

---

## [2026-05-04] Phase 3 — Arsitektur & Library Stack

### Ditambahkan
- `src/lib/toast.ts` — wrapper toast.success/error/info berbasis Sonner (#9a)
- `src/lib/env.ts` — Zod v4 validation semua NEXT_PUBLIC_FIREBASE_* (#22)
- `src/schemas/index.ts` — Zod schemas: memberSchema, loginSchema, operasionalSchema, infoOrganisasiSchema (#9b)
- `src/components/providers/QueryProvider.tsx` — TanStack Query client provider (#9c)
- `src/components/features/tunggakan/TunggakanGroupCard.tsx` — dipecah dari TunggakanView (#16a)
- `src/components/features/tunggakan/TunggakanSummary.tsx` — dipecah dari TunggakanView (#16a)
- `src/components/features/entry/EntrySuccess.tsx` — dipecah dari EntryView (#16b)
- `src/components/features/entry/EntryAlreadyPaid.tsx` — dipecah dari EntryView (#16b)
- `src/components/features/settings/ModeTunggakanSection.tsx` — dipecah dari SettingsSections (#16c)
- `src/components/features/settings/InfoOrganisasiSection.tsx` — dipecah dari SettingsSections (#16c)
- `src/components/features/members/MembersFilter.tsx` — dipecah dari MembersView (#16d)
- `src/components/features/members/MembersSort.tsx` — dipecah dari MembersView (#16d)
- `.prettierrc`, `.prettierignore`, `.husky/pre-commit` (#31)

### Diperbaiki
- Semua kode dipindah ke `src/` (#10)
- `tsconfig.json` paths diupdate ke `./src/*` (#10)
- MemberForm, OperasionalForm, Login: full rewrite ke RHF + Zod (#9b)
- GrafikView: full rewrite ke TanStack Query (#9c)
- Semua `addToast(...)` → `toast.*` Sonner (#9a)
- `lib/firebase.ts` gunakan `env.*` dari env.ts (#22)

---

## [2026-05-04] Phase 4 — Testing & Finalisasi

### Ditambahkan
- `vitest.config.ts` — Vitest + jsdom + React Testing Library (#34a)
- `src/lib/__tests__/setup.ts` — global matchers jest-dom (#34a)
- `src/lib/__tests__/helpers.test.ts` — 33 unit test: formatRp, formatM3, formatTanggal, formatTanggalResmi, formatTahunBulan, formatWaktuRelatif, hitungTagihan, buildNomorTagihan, getBulanTahunAktif (#34a)
- `src/lib/__tests__/masking.test.ts` — 22 unit test: maskEmail, maskPhone, maskNIK, maskBankAccount (#34a)
- `playwright.config.ts` — konfigurasi E2E Playwright (#34b)
- `e2e/login.spec.ts` — test halaman login, validasi, error Firebase, toggle password (#34b)
- `e2e/navigation.spec.ts` — test redirect auth, 404 page, BottomNav, touch target (#34b)
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` — Sentry setup manual (#21)
- `.env.local.example` — template semua env variables dengan dokumentasi (#21)
- Script npm: `test`, `test:run`, `test:e2e` (#34a, #34b)

### Diperbaiki
- `next.config.ts` — withSentryConfig (conditional, tidak aktif jika DSN kosong) (#21)
- `src/app/error.tsx` — Sentry.captureException menggantikan console.error (#21)
- `src/app/loading.tsx` — #073571/#fff → var(--color-primary)/white (#15)
- `src/app/globals.css` — tambah --color-gold (#F59E0B light, #FBBF24 dark) (#15)
- `src/components/features/grafik/GrafikView.tsx` — hex Recharts → konstanta CHART_* (#15)
- `src/components/features/grafik/GrafikCharts.tsx` — #F59E0B → var(--color-gold) (#15)
- `src/components/features/settings/SettingsSections.tsx` — fontSize 11/12 → 13px (#2)
- `src/components/features/operasional/OperasionalForm.tsx` — komentar SAFE lengkap (#14)
- `src/schemas/index.ts` — memberSchema: .optional() dihapus agar kompatibel dengan RHF (#bugfix)
- `src/components/features/members/MemberForm.tsx` — zodResolver cast (#bugfix)
- `src/components/features/rekap/RekapView.tsx` — onClick fetchData → () => fetchData() (#bugfix)
- `vitest.config.ts` — exclude e2e/**/*.spec.ts agar tidak bentrok dengan Playwright (#bugfix)

### Hasil Test
- Unit test: **55 passed** (2 file, 0 failed)
- TypeScript: **0 error**
