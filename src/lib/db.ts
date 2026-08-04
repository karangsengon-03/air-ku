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
import { buildNomorTagihan, isMemberTerdaftarSaatPeriode, isMenunggak, getBulanTahunAktif } from "@/lib/helpers";
import { YEARS } from "@/lib/constants";

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
// Retensi log: MURNI berbasis usia (30 hari), lihat pruneOldActivityLogs() di
// bawah dan firestore.rules untuk /activityLog. TIDAK ADA batas jumlah entri
// — sengaja dihilangkan (v1.4.4): storage untuk log kecil (ratusan-ribuan
// entri hanya beberapa ratus KB), dan log di sini murni catatan teknis
// jangka pendek ("siapa baru saja melakukan apa"), bukan arsip audit
// jangka panjang — audit pembayaran/tanggal bayar punya sumber kebenaran
// sendiri di koleksi tagihan/members yang tidak kena retensi ini.
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

/**
 * Ambil semua tagihan belum lunas yang dianggap "tunggakan", dibatasi sampai
 * dengan bulan/tahun cutoff yang dipilih pengguna (mis. "Tunggakan s/d Juni
 * 2026" — tagihan bulan Juli/Agustus dst tidak ikut tampil meski sudah
 * menunggak, karena di luar cutoff yang dipilih).
 *
 * Logika:
 * 1. Tagihan di luar cutoff (t.bulan/t.tahun > cutoffBulan/cutoffTahun) → selalu diabaikan.
 * 2. Tagihan dari bulan-bulan SEBELUM bulan sekarang (sungguhan) yang masih belum lunas → selalu tunggakan.
 * 3. Tagihan bulan SEKARANG (sungguhan) yang belum lunas → tunggakan jika sudah lewat batas
 *    aman bulan itu (lihat isMenunggak/getBatasMenunggakTanggal di helpers.ts —
 *    batasnya berbeda tiap bulan tergantung jumlah harinya, bukan tanggal tetap).
 * 4. Filter createdAt member: pelanggan hanya dihitung tunggakan mulai dari bulan
 *    dia terdaftar. Tagihan sebelum bulan terdaftar → diabaikan.
 *
 * PENTING: cutoffBulan/cutoffTahun HANYA membatasi rentang data yang
 * ditampilkan (dari pilihan date-picker pengguna) — BUKAN dipakai sebagai
 * referensi "bulan sekarang" untuk isMenunggak(). Bulan sekarang sungguhan
 * dihitung sendiri di dalam (getBulanTahunAktif()), supaya memilih cutoff ke
 * bulan lampau tetap benar menganggap bulan itu sebagai tunggakan (bukan
 * salah dibandingkan terhadap tanggal-hari-ini seolah cutoff = bulan aktif).
 *
 * Members di-pass dari luar (sudah ada di store) untuk hindari query ganda.
 */
export async function getTagihanBelumBayarSebelumBulanIni(
  cutoffBulan: number,
  cutoffTahun: number,
  members?: Member[]
): Promise<Tagihan[]> {
  const q = query(
    collection(db, "tagihan"),
    where("status", "==", "belum")
  );
  const snap = await getDocs(q);
  const all: Tagihan[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Tagihan, "id">),
  }));

  // Bulan/tahun SUNGGUHAN sekarang — titik referensi untuk isMenunggak(),
  // independen dari cutoff yang dipilih pengguna.
  const { bulan: bulanSekarang, tahun: tahunSekarang } = getBulanTahunAktif();

  // Map memberId → Member, untuk cek kapan member terdaftar (createdAt).
  // Parsing createdAt dilakukan di satu tempat (isMemberTerdaftarSaatPeriode di
  // helpers.ts) supaya konsisten dengan Tagihan/Rekap/Beranda/Tunggakan.
  const memberMap = new Map<string, Member>();
  if (members && members.length > 0) {
    for (const m of members) {
      if (m.id) memberMap.set(m.id, m);
    }
  }

  return all.filter((t) => {
    // 1. Batasi ke rentang cutoff yang dipilih pengguna — tagihan setelah
    // cutoff tidak ikut tampil sama sekali, apa pun status menunggaknya.
    const diLuarCutoff =
      t.tahun > cutoffTahun || (t.tahun === cutoffTahun && t.bulan > cutoffBulan);
    if (diLuarCutoff) return false;

    // 2/3. Tunggakan jika tagihan ini (t.bulan/t.tahun) sudah melewati batas
    // aman, dilihat dari bulan SEKARANG SUNGGUHAN — baik karena berasal dari
    // bulan lampau (selalu true di isMenunggak) atau karena bulan sekarang
    // sudah lewat batas hari-nya.
    if (!isMenunggak(t.bulan, t.tahun, bulanSekarang, tahunSekarang)) return false;

    // Pelanggan hanya wajib bayar mulai bulan dia terdaftar.
    // Jika member tidak ditemukan di memberMap (data lama tanpa createdAt,
    // member sudah dihapus, atau daftar members tidak di-pass), filter ini
    // dilewati sepenuhnya — tagihan tetap dianggap valid (tidak difilter).
    const member = memberMap.get(t.memberId);
    if (member && !isMemberTerdaftarSaatPeriode(member, t.bulan, t.tahun)) {
      return false;
    }

    return true;
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

/**
 * Ambil semua tagihan yang sudah pernah di-entry (semua status, semua bulan).
 * Return sebagai Set string "memberId-tahun-bulan" untuk cek sudah entry atau belum.
 * Dipakai di TunggakanView untuk filter virtual entries.
 */
export async function getAllTagihanEntrySet(): Promise<Set<string>> {
  const snap = await getDocs(collection(db, "tagihan"));
  const result = new Set<string>();
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.memberId && data.tahun && data.bulan) {
      result.add(`${data.memberId}-${data.tahun}-${data.bulan}`);
    }
  });
  return result;
}

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

/**
 * Deteksi tahun-tahun yang benar-benar punya data tagihan, untuk dropdown
 * "Export Tahunan". Dicek dengan query bertarget + limit(1) per kandidat
 * tahun (dari constants.YEARS, sudah dibatasi wajar: 2024 s.d. tahun
 * berjalan+2) — jauh lebih murah dari sisi baca Firestore dibanding
 * getDocs() tanpa batas atas seluruh koleksi tagihan hanya untuk tahu tahun
 * mana yang terisi, apalagi kalau koleksi sudah besar di masa depan.
 *
 * Hasil selalu diurutkan terbaru dulu (descending), karena itu urutan yang
 * paling wajar dipilih orang di dropdown export.
 */
export async function getAvailableRekapYears(): Promise<number[]> {
  const results = await Promise.all(
    YEARS.map(async (y) => {
      const q = query(collection(db, "tagihan"), where("tahun", "==", y), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : y;
    })
  );
  return results.filter((y): y is number => y !== null).sort((a, b) => b - a);
}

/**
 * Ambil semua tagihan dalam rentang tahun [tahunMulai, tahunAkhir] (inklusif
 * kedua ujung), untuk export Tahunan (tahunMulai === tahunAkhir) atau
 * Keseluruhan (rentang beberapa tahun, dibatasi wajar oleh pemanggil — lihat
 * EXPORT_KESELURUHAN_TAHUN_TERAKHIR di constants.ts).
 *
 * Query per-tahun (bukan satu query rentang gabungan) supaya tetap konsisten
 * dengan pola "tanpa orderBy, tanpa composite index" di seluruh file ini —
 * where("tahun", "==", y) untuk tiap tahun dalam rentang, hasil digabung dan
 * di-sort di client. Untuk rentang 1-3 tahun (cakupan export yang disepakati)
 * ini jauh lebih sederhana dan aman daripada composite index untuk range
 * query dua field (tahun + bulan) sekaligus.
 */
export async function getTagihanRekapRange(
  tahunMulai: number,
  tahunAkhir: number
): Promise<Tagihan[]> {
  const tahunList: number[] = [];
  for (let y = tahunMulai; y <= tahunAkhir; y++) tahunList.push(y);

  const perTahun = await Promise.all(
    tahunList.map(async (tahun) => {
      const q = query(collection(db, "tagihan"), where("tahun", "==", tahun));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Tagihan, "id">),
      }));
    })
  );

  const list = perTahun.flat();
  list.sort((a, b) => {
    if (a.tahun !== b.tahun) return a.tahun - b.tahun;
    if (a.bulan !== b.bulan) return a.bulan - b.bulan;
    return a.memberNama.localeCompare(b.memberNama, "id");
  });
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
  data: Omit<Member, "id" | "tanggalTerdaftar" | "tanggalPendaftaranPertama"> & { tanggalTerdaftar?: Date }
): Promise<string> {
  // Jika admin mengisi tanggal terdaftar manual, pakai itu. Jika tidak,
  // default ke waktu server saat ini (perilaku lama, sebelum fitur ini ada).
  // tanggalPendaftaranPertama selalu ikut tanggalTerdaftar saat pembuatan
  // pertama — field ini tidak akan berubah lagi meski direaktivasi nanti.
  const { tanggalTerdaftar: tanggalManual, ...rest } = data;
  const tanggalTerdaftarValue = tanggalManual ? Timestamp.fromDate(tanggalManual) : serverTimestamp();

  const ref = await addDoc(collection(db, "members"), {
    ...rest,
    createdAt: serverTimestamp(),
    tanggalTerdaftar: tanggalTerdaftarValue,
    tanggalPendaftaranPertama: tanggalTerdaftarValue,
  });
  return ref.id;
}

export async function updateMember(
  id: string,
  data: Partial<Omit<Member, "id" | "createdAt" | "createdBy" | "tanggalPendaftaranPertama">>
): Promise<void> {
  // Update dokumen member
  await updateDoc(doc(db, "members", id), data);

  // Jika ada perubahan field yang di-snapshot ke tagihan,
  // sync semua tagihan milik member ini secara batch
  const snapshotFields: Record<string, string> = {
    nama: "memberNama",
    nomorSambungan: "memberNomorSambungan",
    dusun: "memberDusun",
    rt: "memberRT",
  };

  const tagihanUpdate: Record<string, string> = {};
  for (const [memberField, tagihanField] of Object.entries(snapshotFields)) {
    if (memberField in data && data[memberField as keyof typeof data] !== undefined) {
      tagihanUpdate[tagihanField] = data[memberField as keyof typeof data] as string;
    }
  }

  if (Object.keys(tagihanUpdate).length === 0) return; // Tidak ada field relevan yang berubah

  // Ambil semua tagihan milik member ini
  const q = query(collection(db, "tagihan"), where("memberId", "==", id));
  const snap = await getDocs(q);
  if (snap.empty) return;

  // Batch update — Firestore batch max 500 dokumen, cukup untuk skala desa
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, tagihanUpdate);
  });
  await batch.commit();
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
// Rules Firestore (activityLog) hanya mengizinkan delete jika dokumen ITU
// SENDIRI (resource.data.ts) sudah > 30 hari, dievaluasi terhadap jam SERVER
// (request.time) — bukan jam klien. Kalau jam klien sedikit maju dari server,
// query di sini bisa saja "menjamin" dokumen sudah 30 hari padahal dari sudut
// pandang server (saat rules dievaluasi) belum genap, menyebabkan delete gagal
// permission-denied untuk dokumen batas. Untuk itu query memakai cutoff 31
// hari (bukan tepat 30) sebagai margin aman terhadap selisih jam — dokumen
// yang lolos query dijamin cukup jauh melewati batas 30 hari versi rules.
const PRUNE_QUERY_MARGIN_HARI = 31;

export async function pruneOldActivityLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PRUNE_QUERY_MARGIN_HARI);
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
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
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
