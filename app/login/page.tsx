"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { Droplets, Eye, EyeOff, LogIn } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { firebaseUser, authLoading } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && firebaseUser) router.replace("/dashboard");
  }, [authLoading, firebaseUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Email atau kata sandi salah.");
      } else if (code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        setError("Gagal masuk. Periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100svh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", padding: 20,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          background: "var(--color-primary)", borderRadius: 20, padding: 18,
          color: "#fff", display: "inline-flex", marginBottom: 14,
        }}>
          <Droplets size={40} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-txt)", margin: 0 }}>{APP_NAME}</h1>
        <p style={{ fontSize: 14, color: "var(--color-txt3)", marginTop: 4 }}>Manajemen Iuran Air Desa</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: "min(100%, 380px)", padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-txt)", marginBottom: 24 }}>Masuk</h2>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-txt2)", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-txt2)", marginBottom: 6 }}>
              Kata Sandi
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-txt3)", padding: 4,
                }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "#FEE2E2", color: "var(--color-belum)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Memuat…" : <><LogIn size={18} /> Masuk</>}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "var(--color-txt3)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
          Akun dikelola oleh administrator.<br />Hubungi admin jika lupa kata sandi.
        </p>
      </div>
    </div>
  );
}
