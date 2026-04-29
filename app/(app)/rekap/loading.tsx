/**
 * rekap/loading.tsx — Skeleton loading khusus halaman Rekap.
 * Halaman ini me-render tabel besar per bulan.
 */
export default function RekapLoading() {
  return (
    <div className="col-12" style={{ padding: "12px 12px 80px" }}>
      {/* Filter/selector row */}
      <div className="row-8">
        <div className="skeleton" style={{ height: "44px", flex: 1 }} />
        <div className="skeleton" style={{ height: "44px", flex: 1 }} />
      </div>
      {/* Summary card */}
      <div className="skeleton" style={{ height: "72px", width: "100%" }} />
      {/* Table header */}
      <div className="skeleton" style={{ height: "40px", width: "100%" }} />
      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: "48px", opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}
