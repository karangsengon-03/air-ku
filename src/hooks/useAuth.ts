"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

export function useAuth() {
  const { setFirebaseUser, setUserRole, setAuthLoading } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const roleSnap = await getDoc(doc(db, "roles", user.uid));
          if (roleSnap.exists()) {
            setUserRole({ uid: user.uid, ...roleSnap.data() } as Parameters<typeof setUserRole>[0]);
          } else {
            // User Auth ada tapi belum punya dokumen /roles/{uid}
            // Tetap login tapi role null — Settings menu tidak akan muncul
            console.warn("User tidak punya dokumen roles. Buat di Firestore Console: /roles/" + user.uid);
            setUserRole(null);
          }
        } catch (error) {
          console.warn("useAuth error:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [setFirebaseUser, setUserRole, setAuthLoading]);
}
