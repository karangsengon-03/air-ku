"use client";
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, RefreshCw, User } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const SAVED_EMAIL_KEY = "airku_saved_email";
const SAVED_PW_KEY = "airku_saved_pw";

export default function LoginPage() {
  const { firebaseUser, authLoading } = useAppStore();
  const router = useRouter();

  // Saved credentials
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [savedPw, setSavedPw] = useState<string | null>(null);
  const [useGantaAkun, setGantiAkun] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const em = localStorage.getItem(SAVED_EMAIL_KEY);
    const pw = localStorage.getItem(SAVED_PW_KEY);
    if (em) { setSavedEmail(em); setEmail(em); }
    if (pw) { setSavedPw(pw); setPassword(pw); }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && firebaseUser) router.replace("/dashboard");
  }, [authLoading, firebaseUser, router]);

  const hasSaved = !!savedEmail && !!savedPw && !useGantaAkun;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(""); setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Simpan credential ke localStorage
      localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
      localStorage.setItem(SAVED_PW_KEY, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Email atau kata sandi salah.");
      } else if (code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        setError("Gagal masuk. Periksa koneksi internet.");
      }
    } finally { setLoading(false); }
  };

  const handleGantiAkun = () => {
    setGantiAkun(true);
    setEmail(""); setPassword(""); setError("");
  };

  return (
    <div style={{
      minHeight: "100svh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)", padding: 20,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <img
          src="/icons/icon-192-maskable.png"
          alt={APP_NAME}
          width={80}
          height={80}
          style={{ borderRadius: 20, marginBottom: 14, boxShadow: "0 4px 16px rgba(3,105,161,0.3)", display: "block", margin: "0 auto 14px" }}
        />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--color-txt)", margin: 0 }}>{APP_NAME}</h1>
        <p style={{ fontSize: 14, color: "var(--color-txt3)", marginTop: 4 }}>Manajemen Iuran Air Desa</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: "min(100%, 380px)", padding: 28, minHeight: 340 }}>

        {/* MODE: Ada credential tersimpan & belum ganti akun */}
        {hasSaved ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-txt)", margin: 0 }}>Selamat Datang</h2>

            {/* Akun tersimpan */}
            <div style={{
              background: "var(--color-bg)", borderRadius: 10, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--color-border)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(3,105,161,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <User size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-txt)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {savedEmail}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-txt3)", marginTop: 2 }}>Akun tersimpan</div>
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(185,28,28,0.1)", color: "var(--color-belum)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500,
              }}>{error}</div>
            )}

            <button className="btn-primary" style={{ height: 52 }}
              onClick={() => handleLogin()} disabled={loading}>
              {loading ? <><RefreshCw size={18} /> Memuat…</> : <><LogIn size={18} /> Masuk</>}
            </button>

            <button
              onClick={handleGantiAkun}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-txt3)", fontSize: 13, fontWeight: 600,
                padding: "4px 0", textDecoration: "underline",
              }}
            >
              Ganti Akun
            </button>
          </div>

        ) : (
          /* MODE: Form manual (pertama kali / ganti akun) */
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-txt)", marginBottom: 20 }}>
              {useGantaAkun ? "Ganti Akun" : "Masuk"}
            </h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email
                </label>
                <input type="email" className="input-field"
                  placeholder="nama@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-txt3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Kata Sandi
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} className="input-field"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    style={{ paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-txt3)", padding: 4,
                  }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: "rgba(185,28,28,0.1)", color: "var(--color-belum)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500,
                }}>{error}</div>
              )}

              <button type="submit" className="btn-primary" style={{ height: 52, marginTop: 4 }} disabled={loading}>
                {loading ? <><RefreshCw size={18} /> Memuat…</> : <><LogIn size={18} /> Masuk</>}
              </button>

              {useGantaAkun && savedEmail && (
                <button type="button"
                  onClick={() => { setGantiAkun(false); setEmail(savedEmail); setPassword(savedPw || ""); setError(""); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-txt3)", fontSize: 13, fontWeight: 600,
                    padding: "4px 0", textDecoration: "underline",
                  }}>
                  Batal
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
