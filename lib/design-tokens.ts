/**
 * design-tokens.ts
 * Single source of truth untuk semua design token AIR-KU.
 * CSS variables di globals.css TETAP sebagai primary — file ini
 * sebagai referensi TypeScript yang bisa di-import saat dibutuhkan.
 *
 * ⚠️ JANGAN mengubah nilai ini tanpa mengupdate globals.css juga.
 */

export const colors = {
  primary:    '#0369A1',   // Biru utama
  accent:     '#0284C7',   // Biru terang
  lunas:      '#15803D',   // Hijau - status lunas
  belum:      '#B91C1C',   // Merah - status belum bayar
  tunggakan:  '#92400E',   // Oranye - tunggakan
  bg:         '#F8FAFC',   // Background halaman
  card:       '#FFFFFF',   // Background card
  border:     '#E2E8F0',   // Border
  txt:        '#111827',   // Teks utama
  txt2:       '#374151',   // Teks sekunder
  txt3:       '#6B7280',   // Teks tersier/placeholder
  shadow:     'rgba(0,0,0,0.06)',
} as const satisfies Record<string, string>;

export const radius = {
  base: '12px',   // Card, modal
  sm:   '8px',    // Button, input
} as const satisfies Record<string, string>;

export const layout = {
  navHeight: '64px',   // Bottom nav height
} as const satisfies Record<string, string>;

export type ColorToken  = keyof typeof colors;
export type RadiusToken = keyof typeof radius;
export type LayoutToken = keyof typeof layout;
