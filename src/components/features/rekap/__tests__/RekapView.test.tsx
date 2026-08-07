import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RekapView from "../RekapView";

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Semua dependency eksternal (Zustand store, Firestore, toast) di-mock supaya
// komponen bisa di-render terisolasi tanpa koneksi sungguhan — tujuannya
// murni memverifikasi TIDAK ADA ERROR RUNTIME saat render awal dan saat
// tombol "Export Lainnya" diklik, sesuai laporan bug: modal tidak muncul
// sama sekali saat tombol diklik.
//
// CATATAN: React Testing Library memunculkan warning "not wrapped in
// act(...)" untuk pembaruan state dari useEffect fetch-data internal
// RekapView saat mount. Ini KOSMETIK (soal gaya penulisan test), BUKAN
// indikasi bug aplikasi — sudah dicoba dibungkus act() eksplisit, tapi
// itu menyebabkan deadlock/timeout (lihat riwayat commit), jadi dibiarkan
// apa adanya: semua assertion tetap terbukti benar meski warning muncul.

const mockMembers = [
  { id: "m1", nama: "ANGGA", nomorSambungan: "001", status: "aktif", dusun: "Paleran", rt: "005" },
];

vi.mock("@/store/useAppStore", () => ({
  useAppStore: () => ({
    settings: { namaOrganisasi: "PAM Al-Hikmah", desa: "Karang Sengon", kecamatan: "Klabang", abonemen: 5000 },
    activeBulan: 7,
    activeTahun: 2026,
    setActiveBulanTahun: vi.fn(),
    userRole: { role: "admin" },
    firebaseUser: { email: "pwilda@air.ku" },
    members: mockMembers,
    membersLoaded: true,
  }),
}));

vi.mock("@/lib/db", () => ({
  getTagihanRekap: vi.fn().mockResolvedValue([]),
  getTotalOperasional: vi.fn().mockResolvedValue(0),
  getTagihanRekapRange: vi.fn().mockResolvedValue([]),
  getAvailableRekapYears: vi.fn().mockResolvedValue([2026]),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("RekapView — tombol Export Lainnya", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render awal tidak melempar error runtime", async () => {
    expect(() => render(<RekapView />)).not.toThrow();
  });

  it("tombol 'Export Lainnya' muncul di layar setelah data selesai dimuat", async () => {
    render(<RekapView />);
    const tombol = await screen.findByRole("button", { name: /export lainnya/i });
    expect(tombol).toBeInTheDocument();
  });

  it("klik tombol 'Export Lainnya' TIDAK melempar error dan modal benar-benar muncul di DOM", async () => {
    render(<RekapView />);
    const tombol = await screen.findByRole("button", { name: /export lainnya/i });

    // Ini simulasi PERSIS yang dilakukan admin: klik tombol.
    // Kalau ada error runtime di handleOpenExportPicker atau di render
    // modal, fireEvent akan melempar exception di sini, atau modal tidak
    // akan pernah muncul di assertion berikutnya.
    fireEvent.click(tombol);

    await waitFor(() => {
      expect(screen.getByText("Export Laporan Rekap")).toBeInTheDocument();
    });
  });

  it("setelah modal terbuka, opsi cakupan Bulan Ini/Tahunan/Keseluruhan semuanya terlihat", async () => {
    render(<RekapView />);
    const tombol = await screen.findByRole("button", { name: /export lainnya/i });
    fireEvent.click(tombol);

    await waitFor(() => {
      expect(screen.getByText("Export Laporan Rekap")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /bulan ini/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^tahunan$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keseluruhan/i })).toBeInTheDocument();
  });
});
