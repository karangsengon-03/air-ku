/**
 * grafik/loading.tsx — Spinner loading halaman Grafik.
 * #26 Fix: skeleton diganti spinner sederhana agar tidak misleading
 * saat data berat (Recharts + aggregation) masih dimuat.
 */
export default function GrafikLoading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 12,
      }}
    >
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid var(--color-border)",
          borderTopColor: "var(--color-primary)",
        }}
      />
      <p style={{ color: "var(--color-txt3)", fontSize: 14, margin: 0 }}>
        Mohon tunggu…
      </p>
    </div>
  );
}
