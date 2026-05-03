"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, RefreshCw, User } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { handleFirebaseError } from "@/lib/firebase-errors";
import { loginSchema, LoginFormValues } from "@/schemas";

const SAVED_EMAIL_KEY = "airku_saved_email";
const SAVED_PW_KEY = "airku_saved_pw";

export default function LoginPage() {
  const { firebaseUser, authLoading } = useAppStore();
  const router = useRouter();

  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [savedPw, setSavedPw] = useState<string | null>(null);
  const [useGantiAkun, setGantiAkun] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const em = localStorage.getItem(SAVED_EMAIL_KEY);
    const pw = localStorage.getItem(SAVED_PW_KEY);
    if (em) { setSavedEmail(em); setValue("email", em); }
    if (pw) { setSavedPw(pw); setValue("password", pw); }
  }, [setValue]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && firebaseUser) router.replace("/dashboard");
  }, [authLoading, firebaseUser, router]);

  const hasSaved = !!savedEmail && !!savedPw && !useGantiAkun;

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError("");
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
      localStorage.setItem(SAVED_EMAIL_KEY, data.email.trim());
      localStorage.setItem(SAVED_PW_KEY, data.password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setLoginError(handleFirebaseError(err));
    }
  };

  const handleLoginWithSaved = async () => {
    setLoginError("");
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, savedEmail!, savedPw!);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setLoginError(handleFirebaseError(err));
    }
  };

  const handleGantiAkun = () => {
    setGantiAkun(true);
    setValue("email", "");
    setValue("password", "");
    setLoginError("");
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
          src="/icons/icon-192.png"
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
                <div style={{ fontSize: 13, color: "var(--color-txt3)", marginTop: 2 }}>Akun tersimpan</div>
              </div>
            </div>

            {loginError && (
              <div style={{
                background: "rgba(185,28,28,0.1)", color: "var(--color-belum)",
                borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500,
              }}>{loginError}</div>
            )}

            <button className="btn-primary" style={{ height: 52 }}
              onClick={handleLoginWithSaved} disabled={isSubmitting}>
              {isSubmitting ? <><RefreshCw size={18} /> Memuat…</> : <><LogIn size={18} /> Masuk</>}
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
              {useGantiAkun ? "Ganti Akun" : "Masuk"}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="login-email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="login-password" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--color-txt3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Kata Sandi
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="login-password"
                    type={showPw ? "text" : "password"}
                    className="input-field"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--color-txt3)", padding: 4,
                  }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 13, color: "var(--color-belum)", marginTop: 4 }}>{errors.password.message}</p>}
              </div>

              {loginError && (
                <div style={{
                  background: "rgba(185,28,28,0.1)", color: "var(--color-belum)",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 500,
                }}>{loginError}</div>
              )}

              <button type="submit" className="btn-primary" style={{ height: 52, marginTop: 4 }} disabled={isSubmitting}>
                {isSubmitting ? <><RefreshCw size={18} /> Memuat…</> : <><LogIn size={18} /> Masuk</>}
              </button>

              {useGantiAkun && savedEmail && (
                <button type="button"
                  onClick={() => {
                    setGantiAkun(false);
                    setValue("email", savedEmail);
                    setValue("password", savedPw || "");
                    setLoginError("");
                  }}
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
