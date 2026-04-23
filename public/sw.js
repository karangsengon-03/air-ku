const CACHE_NAME = "airku-v3";

const PRECACHE_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.json",
];

const NETWORK_ONLY_HOSTS = [
  "firestore.googleapis.com",
  "firebase.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "fcmregistrations.googleapis.com",
  "firebaseinstallations.googleapis.com",
];

// ── Install: precache & skipWaiting langsung ─────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(url).catch(() => null))
      );
    })
  );
  // skipWaiting langsung agar versi baru aktif tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// ── Activate: hapus cache lama + claim semua client ──────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.includes(h))) return;
  if (!url.protocol.startsWith("http")) return;

  // Static Next.js chunks → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Icons & manifest → cache-first
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Semua lainnya → network-first
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const fallback = await caches.match("/");
      if (fallback) return fallback;
    }
    return new Response(
      JSON.stringify({ error: "Tidak ada koneksi. Buka kembali saat online." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ── Message handler ──────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
