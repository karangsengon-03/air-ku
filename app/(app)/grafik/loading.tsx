/**
 * grafik/loading.tsx — Skeleton loading khusus halaman Grafik.
 * Halaman ini berat karena render Recharts + data aggregation.
 */
export default function GrafikLoading() {
  return (
    <div className="col-16" style={{ padding: "12px 12px 80px" }}>
      {/* Filter bar skeleton */}
      <div className="row-8">
        <div className="skeleton" style={{ height: "44px", flex: 1 }} />
        <div className="skeleton" style={{ height: "44px", flex: 1 }} />
      </div>
      {/* Chart card skeleton */}
      <div className="skeleton" style={{ height: "220px", width: "100%" }} />
      {/* Second chart */}
      <div className="skeleton" style={{ height: "200px", width: "100%" }} />
      {/* Top list skeleton */}
      <div className="col-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "52px", opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
