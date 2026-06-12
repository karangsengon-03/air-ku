// lib/firebase-errors.ts — Translasi kode error Firebase ke pesan Indonesia
// Digunakan di semua try/catch yang berhubungan dengan Firebase Auth & Firestore

const FIREBASE_ERROR_MAP: Record<string, string> = {
  // Auth
  "auth/invalid-credential":      "Email atau kata sandi salah. Silakan periksa kembali.",
  "auth/invalid-email":           "Format email tidak valid.",
  "auth/user-disabled":           "Akun ini telah dinonaktifkan. Hubungi admin.",
  "auth/user-not-found":          "Akun tidak ditemukan. Periksa email yang digunakan.",
  "auth/wrong-password":          "Kata sandi salah. Silakan coba lagi.",
  "auth/too-many-requests":       "Terlalu banyak percobaan login. Coba lagi beberapa menit kemudian.",
  "auth/network-request-failed":  "Gagal terhubung ke server. Periksa koneksi internet Anda.",
  "auth/email-already-in-use":    "Email sudah digunakan oleh akun lain.",
  "auth/weak-password":           "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.",
  "auth/requires-recent-login":   "Sesi habis. Silakan login ulang untuk melanjutkan.",
  "auth/popup-closed-by-user":    "Proses login dibatalkan.",
  "auth/operation-not-allowed":   "Metode login ini tidak diizinkan. Hubungi admin.",
  // Firestore
  "permission-denied":            "Akses ditolak. Anda tidak memiliki izin untuk aksi ini.",
  "unavailable":                  "Layanan tidak tersedia saat ini. Coba lagi nanti.",
  "not-found":                    "Data tidak ditemukan.",
  "already-exists":               "Data sudah ada dan tidak bisa dibuat ulang.",
  "resource-exhausted":           "Batas penggunaan tercapai. Coba lagi beberapa saat.",
  "deadline-exceeded":            "Permintaan memakan waktu terlalu lama. Periksa koneksi Anda.",
  "cancelled":                    "Permintaan dibatalkan.",
  "data-loss":                    "Terjadi kesalahan pada data. Hubungi admin.",
  "unauthenticated":              "Sesi login habis. Silakan login ulang.",
  // Generic
  "internal":                     "Terjadi kesalahan sistem. Coba beberapa saat lagi.",
};

/**
 * Translasi kode error Firebase ke pesan ramah bahasa Indonesia.
 * Jika kode tidak dikenal, kembalikan pesan fallback generik.
 */
export function handleFirebaseError(error: unknown): string {
  if (!error) return "Terjadi kesalahan yang tidak diketahui.";

  // Firebase error object biasanya punya property .code
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;
    if (FIREBASE_ERROR_MAP[code]) return FIREBASE_ERROR_MAP[code];
    // Coba match prefix (misal "auth/..." diparsing tanpa prefix)
    const shortCode = code.includes("/") ? code.split("/")[1] : code;
    if (FIREBASE_ERROR_MAP[shortCode]) return FIREBASE_ERROR_MAP[shortCode];
  }

  // Jika ada message string langsung
  if (typeof error === "string") return error;

  return "Gagal menghubungi server. Periksa koneksi dan coba lagi.";
}
