// lib/masking.ts — Masking data sensitif pelanggan
// Digunakan untuk semua tampilan NIK, telepon, email, dan rekening
// agar data pribadi tidak tampil penuh di UI

/**
 * Masking NIK: tampilkan 4 digit pertama + **** + 4 digit terakhir
 * Contoh: "3511200112345678" → "3511****5678"
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length < 8) return nik || "-";
  return nik.slice(0, 4) + "****" + nik.slice(-4);
}

/**
 * Masking telepon: tampilkan 4 digit pertama + **** + 2 digit terakhir
 * Contoh: "081234567890" → "0812****90"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone || "-";
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

/**
 * Masking email: tampilkan 3 karakter + *** + @domain
 * Contoh: "budiono@gmail.com" → "bud***@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email || "-";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

/**
 * Masking nomor rekening bank: tampilkan 4 digit pertama + **** + 4 digit terakhir
 * Contoh: "1234567890123456" → "1234****3456"
 */
export function maskBankAccount(account: string): string {
  if (!account || account.length < 8) return account || "-";
  return account.slice(0, 4) + "****" + account.slice(-4);
}
