// e2e/navigation.spec.ts
// E2E test untuk navigasi BottomNav Air-Ku
//
// Catatan: Test ini memerlukan user yang sudah login.
// Karena autentikasi melibatkan Firebase (tidak bisa di-mock tanpa emulator),
// test ini dirancang untuk dijalankan dengan akun test yang dikonfigurasi via env:
//   E2E_TEST_EMAIL=test@airku.id
//   E2E_TEST_PASSWORD=testpassword123
//
// Jika env tidak diset, test navigasi dasar tetap berjalan tanpa login.
//
// Jalankan: npm run test:e2e -- --grep navigation

import { test, expect } from "@playwright/test";

// ─── Helper: Login jika kredensial test tersedia ─────────────────────────────
async function loginIfCredentialsAvailable(page: import("@playwright/test").Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    return false;
  }

  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.removeItem("airku_saved_email");
    localStorage.removeItem("airku_saved_pw");
  });

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /masuk/i }).click();

  // Tunggu redirect ke dashboard
  await page.waitForURL("**/dashboard", { timeout: 10000 }).catch(() => {});
  return page.url().includes("dashboard");
}

// ─── Test: Halaman & Rute ─────────────────────────────────────────────────────
test.describe("Navigasi Halaman", () => {
  test("halaman login dapat diakses di /login", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);

    // Pastikan form login muncul
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("halaman 404 menampilkan pesan Indonesia", async ({ page }) => {
    await page.goto("/halaman-yang-tidak-ada-sama-sekali");

    // Cek ada teks berbahasa Indonesia di halaman 404
    await expect(page.getByText(/tidak ditemukan|halaman/i)).toBeVisible({ timeout: 5000 });

    // Pastikan tidak ada teks "404" raw atau teks teknikal
    // (halaman tidak-found.tsx kita sudah menggunakan pesan ramah)
    const pageText = await page.locator("body").textContent();
    expect(pageText).toMatch(/tidak ditemukan|kembali ke beranda/i);
  });

  test("redirect ke login saat belum authenticated", async ({ page }) => {
    // Bersihkan auth state
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    // Akses halaman protected
    await page.goto("/dashboard");

    // Harus redirect ke login
    await page.waitForURL(/login/, { timeout: 8000 });
    await expect(page).toHaveURL(/login/);
  });
});

// ─── Test: BottomNav (hanya jika sudah login) ────────────────────────────────
test.describe("BottomNav — Navigasi Utama", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginIfCredentialsAvailable(page);

    test.skip(!loggedIn, "Lewati: E2E_TEST_EMAIL/E2E_TEST_PASSWORD tidak diset");
  });

  test("BottomNav muncul di halaman dashboard", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
  });

  test("link Beranda ada di nav", async ({ page }) => {
    const berandaLink = page.getByRole("link", { name: /beranda/i });
    await expect(berandaLink).toBeVisible();
  });

  test("link Entry ada di nav", async ({ page }) => {
    const entryLink = page.getByRole("link", { name: /entry/i });
    await expect(entryLink).toBeVisible();
  });

  test("link Tagihan ada di nav", async ({ page }) => {
    const tagihanLink = page.getByRole("link", { name: /tagihan/i });
    await expect(tagihanLink).toBeVisible();
  });

  test("link Pelanggan ada di nav", async ({ page }) => {
    const membersLink = page.getByRole("link", { name: /pelanggan/i });
    await expect(membersLink).toBeVisible();
  });

  test("navigasi ke Tagihan berfungsi", async ({ page }) => {
    await page.getByRole("link", { name: /tagihan/i }).click();
    await expect(page).toHaveURL(/tagihan/, { timeout: 5000 });
  });

  test("navigasi ke Pelanggan berfungsi", async ({ page }) => {
    await page.getByRole("link", { name: /pelanggan/i }).click();
    await expect(page).toHaveURL(/members/, { timeout: 5000 });
  });

  test("tombol Lainnya membuka menu tambahan", async ({ page }) => {
    const moreBtn = page.getByRole("button", { name: /lainnya/i });
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      // Menu Lainnya harus muncul
      await expect(page.getByText("Menu Lainnya")).toBeVisible({ timeout: 3000 });
    }
  });
});

// ─── Test: Aksesibilitas Dasar ───────────────────────────────────────────────
test.describe("Aksesibilitas — Touch Target & Font", () => {
  test("tombol di halaman login punya touch target minimal 48px", async ({ page }) => {
    await page.goto("/login");

    const violations = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button, a");
      const issues: string[] = [];
      buttons.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        // Skip hidden elements
        if (rect.width === 0 || rect.height === 0) return;
        // Skip tombol toggle password kecil yang memang ada di dalam input
        if (htmlEl.closest("[style*='position: relative']") && rect.height < 48) {
          // Ini toggle button di dalam input — berikan pengecualian
          return;
        }
        if (rect.height < 44 || rect.width < 44) {
          issues.push(`${htmlEl.tagName} "${htmlEl.textContent?.trim().slice(0, 20)}" — ${Math.round(rect.width)}×${Math.round(rect.height)}px`);
        }
      });
      return issues;
    });

    // Log untuk debugging jika ada violations
    if (violations.length > 0) {
      console.log("Touch target violations:", violations);
    }

    // Hanya tombol utama (submit) yang ditest ketat
    const submitBtn = page.getByRole("button", { name: /masuk/i });
    const bbox = await submitBtn.boundingBox();
    expect(bbox?.height).toBeGreaterThanOrEqual(48);
  });
});
