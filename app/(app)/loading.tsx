/**
 * (app)/loading.tsx — Skeleton loading untuk semua halaman dalam route group (app).
 * Muncul saat navigasi antar halaman di dalam AppShell.
 */
export default function AppLoading() {
  return (
    <div className="col-12" style={{ padding: "12px 12px 80px" }}>
      {/* Skeleton header card */}
      <div className="skeleton" style={{ height: "80px", width: "100%" }} />
      {/* Skeleton list items */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: "68px", width: "100%", opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
