// src/lib/__tests__/masking.test.ts
// Unit test untuk semua fungsi di lib/masking.ts
// Jalankan: npm test

import { describe, it, expect } from "vitest";
import { maskNIK, maskPhone, maskEmail, maskBankAccount } from "../masking";

// ─── maskEmail ───────────────────────────────────────────────────────────────
describe("maskEmail", () => {
  it("memask email standar", () => {
    expect(maskEmail("budiono@gmail.com")).toBe("bud***@gmail.com");
  });

  it("memask email dengan nama pendek (< 3 karakter)", () => {
    expect(maskEmail("ab@gmail.com")).toBe("ab***@gmail.com");
  });

  it("memask email dengan nama 1 karakter", () => {
    expect(maskEmail("a@gmail.com")).toBe("a***@gmail.com");
  });

  it("memask email dengan domain berbeda", () => {
    expect(maskEmail("admin@airku.id")).toBe("adm***@airku.id");
  });

  it("mengembalikan '-' untuk string kosong", () => {
    expect(maskEmail("")).toBe("-");
  });

  it("mengembalikan email apa adanya jika tidak ada '@'", () => {
    expect(maskEmail("bukanemailvalid")).toBe("bukanemailvalid");
  });

  it("mempertahankan domain lengkap", () => {
    const result = maskEmail("testest@yahoo.co.id");
    expect(result).toContain("@yahoo.co.id");
  });
});

// ─── maskPhone ───────────────────────────────────────────────────────────────
describe("maskPhone", () => {
  it("memask nomor telepon standar", () => {
    expect(maskPhone("081234567890")).toBe("0812****90");
  });

  it("memask nomor pendek tapi cukup panjang (≥ 6)", () => {
    const result = maskPhone("081234");
    // 4 digit pertama + **** + 2 digit terakhir = "0812****34"
    expect(result).toBe("0812****34");
  });

  it("mengembalikan nomor asli jika terlalu pendek (< 6 digit)", () => {
    expect(maskPhone("08123")).toBe("08123");
  });

  it("mengembalikan '-' untuk string kosong", () => {
    expect(maskPhone("")).toBe("-");
  });

  it("menghasilkan format yang benar untuk nomor panjang", () => {
    const result = maskPhone("6281234567890");
    expect(result).toContain("****");
    expect(result.startsWith("6281")).toBe(true);
    expect(result.endsWith("90")).toBe(true);
  });
});

// ─── maskNIK ─────────────────────────────────────────────────────────────────
describe("maskNIK", () => {
  it("memask NIK standar 16 digit", () => {
    expect(maskNIK("3511200112345678")).toBe("3511****5678");
  });

  it("memask NIK dengan benar (4 pertama + **** + 4 terakhir)", () => {
    const result = maskNIK("1234567890123456");
    expect(result).toBe("1234****3456");
  });

  it("mengembalikan NIK asli jika terlalu pendek (< 8 digit)", () => {
    expect(maskNIK("1234567")).toBe("1234567");
  });

  it("mengembalikan '-' untuk string kosong", () => {
    expect(maskNIK("")).toBe("-");
  });

  it("menghasilkan format yang tepat dengan tanda bintang", () => {
    const result = maskNIK("3578010101500001");
    expect(result).toContain("****");
    expect(result.length).toBe(12); // 4 + 4 + 4 = 12 karakter
  });
});

// ─── maskBankAccount ─────────────────────────────────────────────────────────
describe("maskBankAccount", () => {
  it("memask nomor rekening standar", () => {
    expect(maskBankAccount("1234567890123456")).toBe("1234****3456");
  });

  it("memask nomor rekening 10 digit", () => {
    const result = maskBankAccount("1234567890");
    expect(result).toBe("1234****7890");
  });

  it("mengembalikan nomor asli jika terlalu pendek (< 8 digit)", () => {
    expect(maskBankAccount("1234567")).toBe("1234567");
  });

  it("mengembalikan '-' untuk string kosong", () => {
    expect(maskBankAccount("")).toBe("-");
  });

  it("menghasilkan format yang benar", () => {
    const result = maskBankAccount("0123456789");
    expect(result.startsWith("0123")).toBe(true);
    expect(result.endsWith("6789")).toBe(true);
    expect(result).toContain("****");
  });
});
