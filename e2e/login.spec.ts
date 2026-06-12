// e2e/login.spec.ts
// E2E test untuk halaman login Air-Ku
//
// Prasyarat sebelum menjalankan:
//   1. npx playwright install --with-deps
//   2. Pastikan dev server berjalan atau konfigurasi webServer di playwright.config.ts
//   3. Set variabel E2E_BASE_URL jika port berbeda (default: http://localhost:3000)
//
// Jalankan: npm run test:e2e -- --grep login

import { test, expect } from "@playwright/test";

test.describe("Halaman Login", () => {
  test.beforeEach(async ({ page }) => {
    // Bersihkan localStorage agar tidak ada saved credential
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("airku_saved_email");
      localStorage.removeItem("airku_saved_pw");
    });
    await page.goto("/login");
  });

  test("halaman login tampil dengan elemen yang benar", async ({ page }) => {
    // Judul/logo aplikasi muncul
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Input email ada
    await expect(page.locator("#login-email")).toBeVisible();

    // Input password ada
    await expect(page.locator("#login-password")).toBeVisible();

    // Tombol masuk ada
    await expect(page.getByRole("button", { name: /masuk/i })).toBeVisible();
  });

  test("label form menggunakan bahasa Indonesia", async ({ page }) => {
    // Cek label "Alamat Email" atau "Email"
    const emailLabel = page.locator("label[for='login-email']");
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toContainText(/email/i);

    // Cek label "Kata Sandi" atau "Password"
    const pwLabel = page.locator("label[for='login-password']");
    await expect(pwLabel).toBeVisible();
    await expect(pwLabel).toContainText(/kata sandi/i);
  });

  test("menampilkan error validasi saat form kosong disubmit", async ({ page }) => {
    // Klik tombol Masuk tanpa isi apapun
    await page.getByRole("button", { name: /masuk/i }).click();

    // Minimal ada satu pesan error muncul
    const errorMessages = page.locator("[style*='color: var(--color-belum)'], [style*='color:var(--color-belum)']");
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test("menampilkan error saat email tidak valid", async ({ page }) => {
    await page.locator("#login-email").fill("bukanemailvalid");
    await page.locator("#login-password").fill("password123");
    await page.getByRole("button", { name: /masuk/i }).click();

    // Error validasi email harus muncul
    const emailError = page.locator("[style*='color: var(--color-belum)']").first();
    await expect(emailError).toBeVisible({ timeout: 5000 });
  });

  test("menampilkan error Firebase yang manusiawi saat kredensial salah", async ({ page }) => {
    // Email valid format tapi tidak terdaftar
    await page.locator("#login-email").fill("emailtidakada@airku.id");
    await page.locator("#login-password").fill("passwordsalah123");
    await page.getByRole("button", { name: /masuk/i }).click();

    // Tunggu response Firebase (bisa lambat)
    await page.waitForTimeout(3000);

    // Error message harus muncul dan menggunakan bahasa Indonesia
    // Pesan dari lib/firebase-errors.ts (bukan kode error teknikal seperti "auth/user-not-found")
    const loginError = page.locator("div").filter({ hasText: /email|sandi|akun|tidak/i }).last();
    await expect(loginError).toBeVisible({ timeout: 8000 });

    // Tidak boleh tampilkan kode error teknikal
    const pageContent = await page.content();
    expect(pageContent).not.toContain("auth/user-not-found");
    expect(pageContent).not.toContain("auth/wrong-password");
  });

  test("tombol toggle password menampilkan/menyembunyikan teks", async ({ page }) => {
    const pwInput = page.locator("#login-password");
    await pwInput.fill("tespassword");

    // Awalnya type="password"
    await expect(pwInput).toHaveAttribute("type", "password");

    // Klik toggle — cari button di dalam container password
    const toggleBtn = page.locator("button[type='button']").filter({ hasNot: page.getByRole("button", { name: /masuk/i }) });
    await toggleBtn.first().click();

    // Sekarang type="text"
    await expect(pwInput).toHaveAttribute("type", "text");
  });

  test("tidak ada teks kurang dari 13px di halaman login", async ({ page }) => {
    // Cek inline style fontSize di elemen visible
    const smallFontElements = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      const violations: string[] = [];
      all.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.offsetParent && htmlEl.tagName !== "BODY") return;
        const style = window.getComputedStyle(htmlEl);
        const size = parseFloat(style.fontSize);
        if (size < 13 && el.textContent && el.textContent.trim().length > 0) {
          violations.push(`${htmlEl.tagName}: ${size}px — "${el.textContent.trim().slice(0, 30)}"`);
        }
      });
      return violations.slice(0, 5); // Return maks 5 untuk debugging
    });

    expect(smallFontElements).toHaveLength(0);
  });
});
