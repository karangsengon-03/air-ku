import { create } from "zustand";
import { User } from "firebase/auth";
import { AppSettings, UserRole, Member, Tagihan, defaultSettings } from "@/types";
import { getBulanTahunAktif } from "@/lib/helpers";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
}

interface AppState {
  // Auth
  firebaseUser: User | null;
  userRole: UserRole | null;
  authLoading: boolean;
  setFirebaseUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setAuthLoading: (v: boolean) => void;

  // Settings
  settings: AppSettings;
  settingsLoaded: boolean;
  setSettings: (s: AppSettings) => void;

  // UI
  darkMode: boolean;
  toggleDarkMode: () => void;
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
  confirm: ConfirmState;
  showConfirm: (title: string, message: string, onConfirm: () => void, danger?: boolean) => void;
  closeConfirm: () => void;

  // Online state
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;

  // Data bulan aktif
  activeBulan: number;
  activeTahun: number;
  setActiveBulanTahun: (bulan: number, tahun: number) => void;

  // Data cache
  members: Member[];
  setMembers: (members: Member[]) => void;
  tagihan: Tagihan[];
  setTagihan: (tagihan: Tagihan[]) => void;
}

const { bulan: initBulan, tahun: initTahun } = getBulanTahunAktif();

export const useAppStore = create<AppState>((set) => ({
  // Auth
  firebaseUser: null,
  userRole: null,
  authLoading: true,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setUserRole: (role) => set({ userRole: role }),
  setAuthLoading: (v) => set({ authLoading: v }),

  // Settings
  settings: defaultSettings,
  settingsLoaded: false,
  setSettings: (s) => set({ settings: s, settingsLoaded: true }),

  // UI
  darkMode: false,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (typeof window !== "undefined") {
        localStorage.setItem("airku-dark", next ? "1" : "0");
        document.documentElement.classList.toggle("dark", next);
      }
      return { darkMode: next };
    }),
  toasts: [],
  addToast: (type, message) => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  confirm: { open: false, title: "", message: "", onConfirm: () => {}, danger: false },
  showConfirm: (title, message, onConfirm, danger = false) =>
    set({ confirm: { open: true, title, message, onConfirm, danger } }),
  closeConfirm: () =>
    set((state) => ({ confirm: { ...state.confirm, open: false } })),

  // Online
  isOnline: true,
  setIsOnline: (v) => set({ isOnline: v }),

  // Bulan aktif
  activeBulan: initBulan,
  activeTahun: initTahun,
  setActiveBulanTahun: (bulan, tahun) => set({ activeBulan: bulan, activeTahun: tahun }),

  // Data cache
  members: [],
  setMembers: (members) => set({ members }),
  tagihan: [],
  setTagihan: (tagihan) => set({ tagihan }),
}));
