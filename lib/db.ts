import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  Timestamp,
  limit,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tagihan, Member, ActivityLog } from "@/types";
import { buildNomorTagihan } from "@/lib/helpers";
import { MAX_LOG_ENTRIES } from "@/lib/constants";

// ─── Members ─────────────────────────────────────────────────────────────────

export function listenMembers(
  callback: (members: Member[]) => void
): () => void {
  const q = query(
    collection(db, "members"),
    orderBy("nama", "asc")
  );
  return onSnapshot(q, (snap) => {
    const members: Member[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Member, "id">),
    }));
    callback(members);
  });
}

export async function getMemberById(id: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, "members", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Member, "id">) };
}

// ─── Tagihan ─────────────────────────────────────────────────────────────────

export function listenTagihan(
  bulan: number,
  tahun: number,
  callback: (tagihan: Tagihan[]) => void
): () => void {
  // Tanpa orderBy — hindari kebutuhan composite index Firestore
  // Sort dilakukan di client side
  const q = query(
    collection(db, "tagihan"),
    where("bulan", "==", bulan),
    where("tahun", "==", tahun)
  );
  return onSnapshot(q, (snap) => {
    const list: Tagihan[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Tagihan, "id">),
    }));
    // Sort by memberNama di client
    list.sort((a, b) => a.memberNama.localeCompare(b.memberNama, "id"));
    callback(list);
  }, (error) => {
    console.error("listenTagihan error:", error.code, error.message);
    callback([]);
  });
}

export async function saveTagihan(
  data: Omit<Tagihan, "id" | "nomorTagihan" | "tanggalEntry">
): Promise<string> {
  // hitung urutan untuk nomor tagihan di bulan+tahun ini
  const q = query(
    collection(db, "tagihan"),
    where("bulan", "==", data.bulan),
    where("tahun", "==", data.tahun)
  );
  const existing = await getDocs(q);
  const urutan = existing.size + 1;

  const nomorTagihan = buildNomorTagihan(
    data.tahun,
    data.bulan,
    urutan,
    data.memberNama
  );

  const docData: Omit<Tagihan, "id"> = {
    ...data,
    nomorTagihan,
    tanggalEntry: serverTimestamp(),
    // Auto-set tanggalBayar: lunas = server timestamp, belum = null
    tanggalBayar: data.status === "lunas" ? serverTimestamp() : null,
  };

  const ref = await addDoc(collection(db, "tagihan"), docData);
  return ref.id;
}

export async function updateTagihanStatus(
  id: string,
  status: "lunas" | "belum"
): Promise<void> {
  await updateDoc(doc(db, "tagihan", id), {
    status,
    tanggalBayar: status === "lunas" ? serverTimestamp() : null,
  });
}

export async function deleteTagihan(id: string): Promise<void> {
  await deleteDoc(doc(db, "tagihan", id));
}

// ─── Meter Terakhir ──────────────────────────────────────────────────────────

export async function getLastMeter(
  memberId: string,
  bulanSekarang: number,
  tahunSekarang: number
): Promise<number | null> {
  // cari bulan sebelumnya (handle overflow Jan → Des tahun sebelumnya)
  let bulanCari = bulanSekarang - 1;
  let tahunCari = tahunSekarang;
  if (bulanCari === 0) {
    bulanCari = 12;
    tahunCari = tahunSekarang - 1;
  }

  const q = query(
    collection(db, "tagihan"),
    where("memberId", "==", memberId),
    where("bulan", "==", bulanCari),
    where("tahun", "==", tahunCari),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;
  return (snap.docs[0].data() as Tagihan).meterAkhir;
}

// ─── Cek tagihan sudah ada ────────────────────────────────────────────────────

export async function cekTagihanSudahAda(
  memberId: string,
  bulan: number,
  tahun: number
): Promise<boolean> {
  const q = query(
    collection(db, "tagihan"),
    where("memberId", "==", memberId),
    where("bulan", "==", bulan),
    where("tahun", "==", tahun),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ─── Operasional ─────────────────────────────────────────────────────────────

export async function getTotalOperasional(
  bulan: number,
  tahun: number
): Promise<number> {
  const q = query(
    collection(db, "operasional"),
    where("bulan", "==", bulan),
    where("tahun", "==", tahun)
  );
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach((d) => {
    total += (d.data().nominal as number) || 0;
  });
  return total;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function saveActivityLog(
  action: string,
  detail: string,
  userEmail: string,
  userRole: string
): Promise<void> {
  const logData: Omit<ActivityLog, "id"> = {
    action,
    detail,
    ts: serverTimestamp(),
    user: userEmail,
    role: userRole,
  };

  await addDoc(collection(db, "activityLog"), logData);

  // trim jika melebihi MAX_LOG_ENTRIES
  const allLogs = await getDocs(
    query(collection(db, "activityLog"), orderBy("ts", "asc"))
  );

  if (allLogs.size > MAX_LOG_ENTRIES) {
    const batch = writeBatch(db);
    const toDelete = allLogs.docs.slice(0, allLogs.size - MAX_LOG_ENTRIES);
    toDelete.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// ─── Harga History ────────────────────────────────────────────────────────────

export async function getLatestHargaHistoryId(): Promise<string | null> {
  const q = query(
    collection(db, "hargaHistory"),
    orderBy("tanggal", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

// ─── Tagihan Tunggakan ────────────────────────────────────────────────────────

export async function getTagihanBelumBayarSebelumBulanIni(
  bulan: number,
  tahun: number
): Promise<Tagihan[]> {
  // ambil semua tagihan belum lunas sebelum bulan aktif
  // kita filter: (tahun < tahunAktif) ATAU (tahun == tahunAktif && bulan < bulanAktif)
  // Tanpa orderBy — filter dan sort di client
  const q = query(
    collection(db, "tagihan"),
    where("status", "==", "belum")
  );
  const snap = await getDocs(q);
  const all: Tagihan[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Tagihan, "id">),
  }));

  return all.filter((t) => {
    if (t.tahun < tahun) return true;
    if (t.tahun === tahun && t.bulan < bulan) return true;
    return false;
  });
}

// ─── Operasional realtime listener ───────────────────────────────────────────

export function listenOperasional(
  bulan: number,
  tahun: number,
  callback: (list: import("@/types").Operasional[]) => void
): () => void {
  // Tanpa orderBy untuk hindari composite index
  const q = query(
    collection(db, "operasional"),
    where("bulan", "==", bulan),
    where("tahun", "==", tahun)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<import("@/types").Operasional, "id">),
    }));
    callback(list);
  });
}

// ─── Tagihan satu tahun penuh (untuk grafik) ──────────────────────────────────

export async function getTagihanByTahun(
  tahun: number
): Promise<Tagihan[]> {
  const q = query(
    collection(db, "tagihan"),
    where("tahun", "==", tahun)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Tagihan, "id">),
  }));
}

// ─── Operasional satu tahun penuh (untuk grafik) ─────────────────────────────

export async function getOperasionalByTahun(
  tahun: number
): Promise<import("@/types").Operasional[]> {
  const q = query(
    collection(db, "operasional"),
    where("tahun", "==", tahun)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<import("@/types").Operasional, "id">),
  }));
}

// ─── Rekap: tagihan bulan tertentu (semua dusun) ──────────────────────────────

export async function getTagihanRekap(
  bulan: number,
  tahun: number
): Promise<Tagihan[]> {
  // Tanpa orderBy — sort di client untuk hindari composite index
  const q = query(
    collection(db, "tagihan"),
    where("bulan", "==", bulan),
    where("tahun", "==", tahun)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Tagihan, "id">),
  }));
  list.sort((a, b) => a.memberNama.localeCompare(b.memberNama, "id"));
  return list;
}

// ─── Simpan operasional ───────────────────────────────────────────────────────

export async function saveOperasional(
  data: Omit<import("@/types").Operasional, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "operasional"), data);
  return ref.id;
}

export async function deleteOperasional(id: string): Promise<void> {
  await deleteDoc(doc(db, "operasional", id));
}

// ─── Member CRUD ──────────────────────────────────────────────────────────────

export async function saveMember(
  data: Omit<Member, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "members"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMember(
  id: string,
  data: Partial<Omit<Member, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  await updateDoc(doc(db, "members", id), data);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, "members", id));
}

export async function cekMemberPunyaTagihan(memberId: string): Promise<boolean> {
  const q = query(
    collection(db, "tagihan"),
    where("memberId", "==", memberId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function cekNomorSambunganTerpakai(
  nomorSambungan: string,
  excludeId?: string
): Promise<boolean> {
  const q = query(
    collection(db, "members"),
    where("nomorSambungan", "==", nomorSambungan),
    limit(2)
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (excludeId) {
    return snap.docs.some((d) => d.id !== excludeId);
  }
  return true;
}

export async function getTagihanByMember(memberId: string): Promise<Tagihan[]> {
  const q = query(
    collection(db, "tagihan"),
    where("memberId", "==", memberId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tagihan, "id">) }));
  list.sort((a, b) => b.tahun !== a.tahun ? b.tahun - a.tahun : b.bulan - a.bulan);
  return list;
}

// ─── Activity Log listener ────────────────────────────────────────────────────

// ─── Prune log lebih dari 30 hari ────────────────────────────────────────────
export async function pruneOldActivityLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffTs = Timestamp.fromDate(cutoff);

  const q = query(
    collection(db, "activityLog"),
    where("ts", "<", cutoffTs)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  // Hapus batch (max 500 per batch Firestore)
  const BATCH_SIZE = 400;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
}

export function listenActivityLog(
  callback: (logs: ActivityLog[]) => void,
  maxEntries = 100
): () => void {
  const q = query(
    collection(db, "activityLog"),
    orderBy("ts", "desc"),
    limit(maxEntries)
  );
  return onSnapshot(q, (snap) => {
    const logs: ActivityLog[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ActivityLog, "id">),
    }));
    callback(logs);
  });
}

// ─── Export Helpers ───────────────────────────────────────────────────────────

export { Timestamp, serverTimestamp };

// ─── Harga History (full list) ────────────────────────────────────────────────

export async function getHargaHistoryList(): Promise<import("@/types").HargaHistory[]> {
  const q = query(
    collection(db, "hargaHistory"),
    orderBy("tanggal", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<import("@/types").HargaHistory, "id">) }));
}

export async function saveHargaHistory(
  data: Omit<import("@/types").HargaHistory, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "hargaHistory"), {
    ...data,
    tanggal: serverTimestamp(),
  });
  return ref.id;
}

// ─── Settings update ──────────────────────────────────────────────────────────

export async function updateSettings(
  data: Partial<import("@/types").AppSettings>
): Promise<void> {
  await updateDoc(doc(db, "settings", "main"), data);
}

// ─── Roles (daftar akun) ──────────────────────────────────────────────────────

export async function getRoles(): Promise<import("@/types").UserRole[]> {
  const snap = await getDocs(collection(db, "roles"));
  return snap.docs.map((d) => ({
    uid: d.id,
    ...(d.data() as Omit<import("@/types").UserRole, "uid">),
  }));
}

// ─── Backup & Restore ─────────────────────────────────────────────────────────

export interface BackupData {
  version: string;
  exportedAt: string;
  members: unknown[];
  tagihan: unknown[];
  operasional: unknown[];
  activityLog: unknown[];
  hargaHistory: unknown[];
  settings: unknown;
}

export async function exportBackup(): Promise<BackupData> {
  const [membersSnap, tagihanSnap, operasionalSnap, logSnap, hargaSnap, settingsSnap] =
    await Promise.all([
      getDocs(collection(db, "members")),
      getDocs(collection(db, "tagihan")),
      getDocs(collection(db, "operasional")),
      getDocs(collection(db, "activityLog")),
      getDocs(collection(db, "hargaHistory")),
      getDoc(doc(db, "settings", "main")),
    ]);

  const toArr = (snap: import("firebase/firestore").QuerySnapshot) =>
    snap.docs.map((d) => {
      const data = d.data();
      // Convert Timestamps to ISO strings for JSON compatibility
      const serialized: Record<string, unknown> = { id: d.id };
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && "seconds" in v) {
          serialized[k] = new Date((v as { seconds: number }).seconds * 1000).toISOString();
        } else {
          serialized[k] = v;
        }
      }
      return serialized;
    });

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    members: toArr(membersSnap),
    tagihan: toArr(tagihanSnap),
    operasional: toArr(operasionalSnap),
    activityLog: toArr(logSnap),
    hargaHistory: toArr(hargaSnap),
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  // Restore each collection with batched writes (max 500 per batch)
  const collections = [
    { name: "members", docs: data.members },
    { name: "tagihan", docs: data.tagihan },
    { name: "operasional", docs: data.operasional },
    { name: "activityLog", docs: data.activityLog },
    { name: "hargaHistory", docs: data.hargaHistory },
  ];

  for (const col of collections) {
    // Process in chunks of 450
    for (let i = 0; i < col.docs.length; i += 450) {
      const chunk = col.docs.slice(i, i + 450);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const d = item as Record<string, unknown>;
        const id = d.id as string;
        const { id: _id, ...rest } = d;
        void _id;
        // Convert ISO strings back to Timestamps for known date fields
        const dateFields = ["createdAt", "tanggal", "tanggalEntry", "tanggalBayar", "ts"];
        const converted: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(rest)) {
          if (dateFields.includes(k) && typeof v === "string" && v) {
            try {
              converted[k] = Timestamp.fromDate(new Date(v));
            } catch {
              converted[k] = v;
            }
          } else {
            converted[k] = v;
          }
        }
        const ref = id ? doc(db, col.name, id) : doc(collection(db, col.name));
        batch.set(ref, converted);
      }
      await batch.commit();
    }
  }

  // Restore settings
  if (data.settings) {
    await updateDoc(doc(db, "settings", "main"), data.settings as Record<string, unknown>);
  }
}
