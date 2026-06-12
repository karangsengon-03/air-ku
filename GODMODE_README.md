# AIR-KU — God Mode Perfectionist Blueprint

> **STATUS DOKUMEN:** `FASE 3 SELESAI — FINAL` — Diupdate setelah eksekusi Fase 2 (Apr 2026)
> **Versi Apps Saat Ini:** 1.0.0 (belum deploy — deploy saat semua fase final)
> **Pendekatan:** Restruktur murni — ZERO perubahan fungsi inti, ZERO perubahan logic bisnis

---

## ATURAN MUTLAK — BACA SETIAP SESI SEBELUM EKSEKUSI

```
❌ DILARANG KERAS:
   - Mengubah logic di lib/db.ts
   - Mengubah logic di lib/helpers.ts (hitungTagihan, formatRp, getBlokTarif)
   - Mengubah lib/firebase.ts
   - Mengubah lib/constants.ts
   - Mengubah store/useAppStore.ts
   - Mengubah hooks/ (useAuth, useData, useSettings)
   - Mengubah public/sw.js
   - Mengubah alur login + saved credential
   - Mengubah AppShell scroll architecture (#app-shell, #app-main)
   - Mengubah dynamic import pattern di app/(app)/*/page.tsx
   - Mengubah Firestore realtime listener logic
   - Mengubah export PDF / share WA logic (lib/export.ts)
   - Mengubah backup-restore logic

✅ YANG BOLEH DILAKUKAN:
   - Memindahkan file ke folder baru (update import path menyertainya)
   - Memecah komponen besar menjadi sub-komponen kecil
   - Mengekstrak UI atoms ke components/ui/
   - Menambah file baru (design-tokens, error.tsx, loading.tsx, dll)
   - Menambah animasi CSS di globals.css
   - Menambah TypeScript type yang lebih ketat (tanpa ubah interface yang ada)
   - Memperbaiki inkonsistensi inline style → CSS class
   - Menambah JSDoc comment untuk dokumentasi

⚠️ JIKA RAGU → JANGAN LAKUKAN
```

---

## SNAPSHOT KONDISI SAAT INI (Setelah Fase 1)

### Stack
| Layer | Teknologi | Versi |
|---|---|---|
| Framework | Next.js | 16.2.4 |
| UI Library | React | 19.2.4 |
| State Management | Zustand | 5.0.12 |
| Database | Firebase Firestore | 12.12.0 |
| Auth | Firebase Auth | (bundled) |
| Charts | Recharts | 2.15.3 |
| Icons | Lucide React | 1.8.0 |
| PDF Export | jsPDF | 2.5.2 |
| Styling | Tailwind CSS v4 + Custom CSS | 4.x |
| PWA | Custom SW + manifest | - |
| Deploy | Vercel | - |
| Node | >= 20, < 22 | - |

### Struktur File Saat Ini (Setelah Fase 2)
```
air-ku/
├── app/
│   ├── (app)/
│   │   ├── layout.tsx              (AppShell wrapper)
│   │   ├── dashboard/page.tsx
│   │   ├── entry/page.tsx
│   │   ├── tagihan/page.tsx
│   │   ├── members/page.tsx
│   │   ├── rekap/page.tsx
│   │   ├── grafik/page.tsx
│   │   ├── tunggakan/page.tsx
│   │   ├── operasional/page.tsx
│   │   ├── log/page.tsx
│   │   ├── settings/page.tsx
│   │   └── accounts/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                    (redirect)
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            (KRITIS - scroll architecture)
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── LockBanner.tsx
│   ├── ui/
│   │   ├── Confirm.tsx
│   │   └── Toast.tsx
│   └── features/                   ← SUB-KOMPONEN FASE 2
│       ├── dashboard/
│       │   └── DashboardView.tsx
│       ├── entry/
│       │   ├── EntryView.tsx       ← orchestrator (358 baris, turun dari 473)
│       │   ├── MemberSelector.tsx  ✅ BARU — Step 1: cari & pilih pelanggan
│       │   ├── QuickPayForm.tsx    ✅ BARU — Mode iuran rata
│       │   └── MeterForm.tsx       ✅ BARU — Mode meter air
│       ├── tagihan/
│       │   ├── TagihanView.tsx     ← orchestrator
│       │   └── TagihanCard.tsx     ✅ BARU — Card tagihan tunggal
│       ├── members/
│       │   ├── MembersView.tsx     ← orchestrator (320 baris, turun dari 679)
│       │   ├── MemberCard.tsx      ✅ BARU — Card pelanggan + status badge
│       │   ├── MemberForm.tsx      ✅ BARU — Modal tambah/edit
│       │   └── MemberDetail.tsx    ✅ BARU — Modal riwayat tagihan
│       ├── rekap/
│       │   ├── RekapView.tsx       ← orchestrator
│       │   └── RekapTable.tsx      ✅ BARU — Tabel rekap pelanggan
│       ├── grafik/
│       │   ├── GrafikView.tsx      ← orchestrator (203 baris, turun dari 489)
│       │   └── GrafikCharts.tsx    ✅ BARU — TooltipRp, TooltipM3, SectionHeader, TopPelangganList
│       ├── tunggakan/
│       │   └── TunggakanView.tsx   ← TunggakanGroupCard tetap inline (coupling ketat)
│       ├── operasional/
│       │   ├── OperasionalView.tsx ← orchestrator
│       │   └── OperasionalForm.tsx ✅ BARU — Modal catat pengeluaran
│       ├── log/
│       │   ├── LogView.tsx         ← orchestrator
│       │   └── LogItem.tsx         ✅ BARU — Item log tunggal + ACTION_META + helpers
│       └── settings/
│           ├── SettingsView.tsx    ← orchestrator (40 baris, turun dari 1060!)
│           ├── SettingsSection.tsx ✅ BARU — Accordion wrapper reusable
│           ├── TarifSection.tsx    ✅ BARU — Multi-blok tarif + riwayat
│           ├── DusunRTSection.tsx  ✅ BARU — Manajemen dusun & RT + ModalInput
│           └── SettingsSections.tsx ✅ BARU — ModeTunggakan, InfoOrganisasi, Accounts, Backup, InfoApp, Logout
├── lib/
│   ├── firebase.ts                 (DIKUNCI)
│   ├── db.ts                       (DIKUNCI - 587 baris)
│   ├── helpers.ts                  (DIKUNCI - 151 baris)
│   ├── constants.ts                (DIKUNCI)
│   ├── export.ts                   (DIKUNCI)
│   └── design-tokens.ts            (dari Fase 1)
├── hooks/
│   ├── useAuth.ts                  (DIKUNCI)
│   ├── useData.ts                  (DIKUNCI)
│   └── useSettings.ts              (DIKUNCI)
├── store/
│   └── useAppStore.ts              (DIKUNCI - Zustand)
├── types/
│   ├── index.ts                    (barrel re-export, dari Fase 1)
│   ├── common.ts
│   ├── settings.ts
│   ├── member.ts
│   ├── tagihan.ts
│   ├── operasional.ts
│   ├── log.ts
│   └── auth.ts
├── public/
│   ├── sw.js                       (DIKUNCI)
│   ├── manifest.json
│   └── icons/
└── settings-main.json
```

### Design Tokens Saat Ini (CSS Variables di globals.css)
```css
/* WARNA */
--color-primary:    #0369A1   /* Biru utama */
--color-accent:     #0284C7   /* Biru terang */
--color-lunas:      #15803D   /* Hijau - status lunas */
--color-belum:      #B91C1C   /* Merah - status belum bayar */
--color-tunggakan:  #92400E   /* Oranye - tunggakan */
--color-bg:         #F8FAFC   /* Background halaman */
--color-card:       #FFFFFF   /* Background card */
--color-border:     #E2E8F0   /* Border */
--color-txt:        #111827   /* Teks utama */
--color-txt2:       #374151   /* Teks sekunder */
--color-txt3:       #6B7280   /* Teks tersier/placeholder */
--color-shadow:     rgba(0,0,0,0.06)

/* RADIUS */
--radius:           12px      /* Card, modal */
--radius-sm:        8px       /* Button, input */

/* LAYOUT */
--nav-height:       64px      /* Bottom nav height */

/* DARK MODE override sudah ada */
```

### CSS Classes Existing (TIDAK BOLEH DIUBAH/DIHAPUS)
| Class | Fungsi |
|---|---|
| `.card` | Container card dengan border + shadow |
| `.btn-primary` | Tombol aksi utama (biru, 52px height) |
| `.btn-secondary` | Tombol sekunder (outline biru) |
| `.btn-ghost` | Tombol ghost transparan |
| `.btn-danger` | Tombol merah (hapus) |
| `.input-field` | Input text standar (52px height) |
| `.badge-lunas` | Badge status lunas (hijau) |
| `.badge-belum` | Badge status belum bayar (merah) |
| `.section-label` | Label uppercase 11px untuk section |
| `.mono` | Font JetBrains Mono |
| `.bottom-sheet` | Overlay modal backdrop |
| `.bottom-sheet-content` | Konten modal scrollable |
| `.animate-spin` | Animasi loading spinner |

### Zustand Store — State yang Ada
```typescript
// Auth
firebaseUser, userRole, authLoading

// Settings
settings (AppSettings), settingsLoaded

// UI
darkMode, toasts, confirm (showConfirm, closeConfirm)

// Online
isOnline

// Data cache
activeBulan, activeTahun, members[], tagihan[]
```

---

## RENCANA EKSEKUSI — 3 FASE

### FASE 1 — Struktur & Foundation ✅ SELESAI
**ZIP Output:** `air-ku-fase1.zip`

#### Yang sudah dikerjakan:
- ✅ 1A. Login dipindah: `app/login/` → `app/(auth)/login/`
- ✅ 1B. Semua views dipindah: `components/views/` → `components/features/*/`
- ✅ 1C. Semua import path di `app/(app)/*/page.tsx` diupdate
- ✅ 1D. `lib/design-tokens.ts` dibuat (TypeScript reference + `satisfies`)
- ✅ 1E. `types/index.ts` dipecah per-domain: common, settings, member, tagihan, operasional, log, auth
- ✅ 1F. `types/index.ts` dijadikan barrel re-export (backward compat penuh)
- ✅ Semua file DIKUNCI tidak berubah (diff verified)

#### Catatan teknis Fase 1:
- `AppShell.tsx` menggunakan `router.replace("/login")` — path URL tetap `/login` karena route group `(auth)` tidak mempengaruhi URL. **Tidak perlu diubah.**
- `accounts/page.tsx` hanya redirect ke `/settings`, tidak import views — tidak dipindah.
- Folder `components/views/` dihapus setelah semua konten dipindah.

---

### FASE 2 — UI Components & Sub-komponen ✅ SELESAI
**ZIP Output:** `air-ku-fase2.zip`

#### Yang sudah dikerjakan:

**features/entry/** (473 → 4 file)
- ✅ `EntryView.tsx` — orchestrator, dipangkas ke 358 baris
- ✅ `MemberSelector.tsx` — Step 1: cari & pilih pelanggan dari daftar aktif
- ✅ `QuickPayForm.tsx` — Mode iuran rata: preset + input manual ×1000
- ✅ `MeterForm.tsx` — Mode meter air: input awal/akhir + preview kalkulasi multi-blok

**features/members/** (679 → 4 file)
- ✅ `MembersView.tsx` — orchestrator, dipangkas ke 320 baris
- ✅ `MemberCard.tsx` — Card pelanggan, status badge, tombol aksi (detail/edit/hapus)
- ✅ `MemberForm.tsx` — Modal tambah/edit, validasi duplikat nomor sambungan
- ✅ `MemberDetail.tsx` — Modal riwayat tagihan per pelanggan

**features/tagihan/** (184 → 2 file)
- ✅ `TagihanView.tsx` — orchestrator
- ✅ `TagihanCard.tsx` — Card tagihan tunggal dengan tombol Share WA + Download

**features/log/** (332 → 2 file)
- ✅ `LogView.tsx` — orchestrator + search/filter panel
- ✅ `LogItem.tsx` — Item log tunggal + `ACTION_META` map + `getActionMeta` + `formatTimestamp` + `getDateString`

**features/operasional/** (311 → 2 file)
- ✅ `OperasionalView.tsx` — orchestrator
- ✅ `OperasionalForm.tsx` — Modal catat pengeluaran baru

**features/tunggakan/** (494 baris — TunggakanGroupCard tetap inline)
- ✅ `TunggakanView.tsx` — direfaktor, `TunggakanGroupCard` tetap inline karena coupling ketat dengan state parent

**features/rekap/** (584 → 2 file)
- ✅ `RekapView.tsx` — orchestrator
- ✅ `RekapTable.tsx` — Tabel rekap (thead/tbody/tfoot) per bulan

**features/grafik/** (489 → 2 file)
- ✅ `GrafikView.tsx` — orchestrator, dipangkas ke 203 baris
- ✅ `GrafikCharts.tsx` — `TooltipRp`, `TooltipM3`, `SectionHeader`, `TopPelangganList`

**features/settings/** (1060 → 5 file)
- ✅ `SettingsView.tsx` — orchestrator tipis, hanya 40 baris
- ✅ `SettingsSection.tsx` — Accordion wrapper reusable (open/close state)
- ✅ `TarifSection.tsx` — Multi-blok tarif + edit inline + riwayat harga
- ✅ `DusunRTSection.tsx` — Manajemen dusun & RT + `ModalInput` inline
- ✅ `SettingsSections.tsx` — `ModeTunggakanSection`, `InfoOrganisasiSection`, `AccountsSection`, `BackupSection`, `InfoAppSection`, `LogoutSection`

#### Ringkasan dampak Fase 2:
| File | Baris Sebelum | Baris Sesudah |
|---|---|---|
| SettingsView.tsx | 1060 | 40 |
| MembersView.tsx | 679 | 320 |
| GrafikView.tsx | 489 | 203 |
| EntryView.tsx | 473 | 358 |
| Total sub-komponen baru | — | 18 file baru |

### FASE 3 — Polish & Micro-animations
**Estimasi:** 1 sesi
**Risiko:** Rendah (CSS-only + file baru)
**Target ZIP output:** `air-ku-fase3-FINAL.zip`
**Prasyarat:** Fase 2 selesai dan ter-deploy tanpa error

#### 3A. Micro-animations (CSS only, tambah ke globals.css)
```css
/* Animasi masuk untuk card/konten */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Shimmer untuk skeleton loading */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

/* Slide dari bawah untuk modal */
@keyframes slideInFromBottom {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* Reduced motion — wajib */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* Utility classes */
.animate-fade-in-up    { animation: fadeInUp 0.2s ease-out forwards; }
.animate-slide-up      { animation: slideInFromBottom 0.25s ease-out forwards; }
.skeleton-shimmer      { /* background gradient animasi */ }
.card-hover            { transition: transform 0.15s, box-shadow 0.15s; }
.card-hover:active     { transform: translateY(-1px); box-shadow: ...; }
```

#### 3B. Route-level Loading & Error states
```
app/
├── error.tsx                    ← Global error boundary + tombol retry
├── loading.tsx                  ← Global loading (full-screen)
├── (app)/
│   ├── loading.tsx              ← Loading untuk semua halaman dalam (app)
│   ├── grafik/loading.tsx       ← Skeleton khusus grafik (berat)
│   └── rekap/loading.tsx        ← Skeleton khusus rekap
└── offline/
    └── page.tsx                 ← Halaman cantik saat SW detect offline
```

#### 3C. TypeScript Audit
- Ganti semua `unknown` yang tidak perlu dengan type yang tepat
- Tambah JSDoc untuk semua fungsi public di `lib/`
- Tambah `satisfies` operator untuk design-tokens
- Pastikan tidak ada `any` tersisa

#### 3D. Standardisasi Inline Styles → CSS Classes
- Audit semua inline `style={{...}}` di komponen
- Yang berulang 3+ kali → ekstrak ke CSS class baru di globals.css

---

## CHECKLIST PER SESI

### Template yang harus dipenuhi di setiap sesi:

```
□ Baca README ini dari awal sebelum mulai
□ Konfirmasi sedang di fase berapa
□ Konfirmasi file ZIP yang diterima adalah output sesi sebelumnya
□ Tidak ada perubahan fungsi inti (verifikasi sebelum kirim)
□ Build berhasil tanpa error TypeScript
□ Tidak ada import path yang putus
□ Semua logic bisnis masih berjalan identik
□ README diupdate sebelum kirim ZIP output
```

---

## MAPPING IMPORT (REFERENSI)

### Fase 1 — sudah dieksekusi ✅
| File | Import Lama | Import Baru |
|---|---|---|
| `app/(app)/dashboard/page.tsx` | `@/components/views/DashboardView` | `@/components/features/dashboard/DashboardView` |
| `app/(app)/entry/page.tsx` | `@/components/views/EntryView` | `@/components/features/entry/EntryView` |
| `app/(app)/tagihan/page.tsx` | `@/components/views/TagihanView` | `@/components/features/tagihan/TagihanView` |
| `app/(app)/members/page.tsx` | `@/components/views/MembersView` | `@/components/features/members/MembersView` |
| `app/(app)/rekap/page.tsx` | `@/components/views/RekapView` | `@/components/features/rekap/RekapView` |
| `app/(app)/grafik/page.tsx` | `@/components/views/GrafikView` | `@/components/features/grafik/GrafikView` |
| `app/(app)/tunggakan/page.tsx` | `@/components/views/TunggakanView` | `@/components/features/tunggakan/TunggakanView` |
| `app/(app)/operasional/page.tsx` | `@/components/views/OperasionalView` | `@/components/features/operasional/OperasionalView` |
| `app/(app)/log/page.tsx` | `@/components/views/LogView` | `@/components/features/log/LogView` |
| `app/(app)/settings/page.tsx` | `@/components/views/SettingsView` | `@/components/features/settings/SettingsView` |
| `app/login/page.tsx` | `app/login/` | `app/(auth)/login/` |

---

## STATUS PROGRESS

| Fase | Status | ZIP Output | Catatan |
|---|---|---|---|
| Fase 1 — Struktur & Foundation | ✅ `SELESAI` | `air-ku-fase1.zip` | Deploy ke Vercel setelah Fase 3 final |
| Fase 2 — UI Components & Sub-komponen | ✅ `SELESAI` | `air-ku-fase2.zip` | 18 sub-komponen baru dibuat, zero perubahan logic |
| Fase 3 — Polish & Micro-animations | ✅ `SELESAI` | `air-ku-fase3-FINAL.zip` | CSS animations, skeleton, error/loading/offline pages, TS audit, inline style cleanup |

---

## CATATAN PENTING

1. **`components/ui/`** — Sudah ada `Confirm.tsx` dan `Toast.tsx`. Fase 2 akan tambah komponen di folder yang sama, tidak konflik.

2. **`app/(app)/accounts/page.tsx`** — Hanya redirect ke `/settings`, tidak import views. Tidak disentuh di Fase 1 maupun Fase 2.

3. **`settings-main.json`** — File JSON di root project. Jangan disentuh.

4. **`LockBanner.tsx`** — Tetap di `components/layout/`, tidak diubah.

5. **`lib/export.ts`** — DIKUNCI, tidak disentuh.

6. **Login page & router.replace("/login")** — Route group `(auth)` tidak mempengaruhi URL publik. Path `/login` tetap valid. `AppShell.tsx` tidak perlu diubah.

7. **Inline styles** — Pattern berulang 3+ kali telah diekstrak ke CSS utility classes (`.flex-min`, `.col-10/12/16`, `.row-8/10`, `.empty-state`, dll). Sisa inline style adalah one-off yang wajar ditinggal inline.

8. **types/index.ts** — Dijadikan barrel re-export. Semua import lama `@/types` tetap berfungsi tanpa perubahan di file manapun. Import baru bisa langsung ke domain file.

9. **lib/design-tokens.ts** — Menggunakan `satisfies` operator untuk type-safety. CSS variables di `globals.css` tetap sebagai primary — file ini sebagai TypeScript reference saja.

---

## CARA PAKAI README INI

**Di awal setiap sesi baru:**
1. Kirim README ini + ZIP output sesi sebelumnya ke chat baru
2. Minta Claude baca README dari awal
3. Konfirmasi fase yang akan dikerjakan
4. Pastikan Claude konfirmasi pemahaman sebelum eksekusi

**Di akhir setiap sesi:**
1. Update tabel STATUS PROGRESS
2. Update CATATAN PENTING jika ada temuan baru
3. Update CHECKLIST jika ada item baru
4. Kirim README versi terbaru bersama ZIP output

---

*README ini adalah dokumen hidup — diupdate setiap akhir sesi*
*God Mode Perfectionist 1000% — Tidak ada kompromi pada kualitas*
