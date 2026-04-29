"use client";

import { useState, useMemo } from "react";
import {
  Users, Plus, Search, X, ChevronDown, ChevronUp, SortAsc,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  deleteMember, cekMemberPunyaTagihan, getTagihanByMember, saveActivityLog,
} from "@/lib/db";
import { Member, MemberStatus, Tagihan } from "@/types";
import MemberCard from "./MemberCard";
import MemberForm from "./MemberForm";
import MemberDetail from "./MemberDetail";

type SortKey = "nomorSambungan" | "nama" | "dusun" | "rt";
const SORT_LABELS: Record<SortKey, string> = {
  nomorSambungan: "No. Sambungan", nama: "Nama", dusun: "Dusun", rt: "RT",
};

export default function MembersView() {
  const { members, settings, firebaseUser, userRole, addToast, showConfirm } = useAppStore();
  const isAdmin = userRole?.role === "admin";

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterDusun, setFilterDusun] = useState("semua");
  const [filterStatus, setFilterStatus] = useState<"semua" | MemberStatus>("semua");
  const [sortKey, setSortKey] = useState<SortKey>("nomorSambungan");
  const [sortAsc, setSortAsc] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  // Modal tambah/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);

  // Detail riwayat
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [riwayatTagihan, setRiwayatTagihan] = useState<Tagihan[]>([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  const dusunList = useMemo(() => settings.dusunList || [], [settings.dusunList]);

  const filtered = useMemo(() => {
    let list = members.filter((m) => {
      if (filterStatus !== "semua" && m.status !== filterStatus) return false;
      if (filterDusun !== "semua" && m.dusun !== filterDusun) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.nama.toLowerCase().includes(q) ||
          m.nomorSambungan.toLowerCase().includes(q) ||
          (m.dusun || "").toLowerCase().includes(q) ||
          (m.rt || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = (a[sortKey] || "").toString();
      const vb = (b[sortKey] || "").toString();
      const cmp = va.localeCompare(vb, "id", { numeric: true, sensitivity: "base" });
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [members, search, filterDusun, filterStatus, sortKey, sortAsc]);

  const stats = useMemo(() => ({
    total: members.length,
    aktif: members.filter((m) => m.status === "aktif").length,
    nonaktif: members.filter((m) => m.status === "nonaktif").length,
    pindah: members.filter((m) => m.status === "pindah").length,
  }), [members]);

  const activeFilterCount = (filterStatus !== "semua" ? 1 : 0) + (filterDusun !== "semua" ? 1 : 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  async function handleDelete(m: Member) {
    const punyaTagihan = await cekMemberPunyaTagihan(m.id!);
    if (punyaTagihan) {
      addToast("error", "Tidak bisa hapus — pelanggan memiliki riwayat tagihan. Ubah status menjadi Non-Aktif atau Pindah.");
      return;
    }
    showConfirm("Hapus Pelanggan",
      `Yakin hapus pelanggan "${m.nama}"? Tindakan ini tidak bisa dibatalkan.`,
      async () => {
        try {
          await deleteMember(m.id!);
          await saveActivityLog("hapus_member",
            `Hapus pelanggan: ${m.nama} (${m.nomorSambungan})`,
            firebaseUser!.email!, userRole!.role);
          addToast("success", "Pelanggan dihapus.");
        } catch { addToast("error", "Gagal menghapus pelanggan."); }
      }, true);
  }

  async function openDetail(m: Member) {
    setDetailMember(m); setLoadingRiwayat(true);
    try {
      const list = await getTagihanByMember(m.id!);
      setRiwayatTagihan(list);
    } catch { setRiwayatTagihan([]); }
    finally { setLoadingRiwayat(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 80 }} className="animate-fade-in-up">

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--color-primary)" },
          { label: "Aktif", value: stats.aktif, color: "var(--color-lunas)" },
          { label: "Non-Aktif", value: stats.nonaktif, color: "var(--color-txt3)" },
          { label: "Pindah", value: stats.pindah, color: "var(--color-tunggakan)" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "10px 4px", textAlign: "center", minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--color-txt3)", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-txt3)", pointerEvents: "none" }} />
        <input
          className="input-field"
          style={{ paddingLeft: 36, paddingRight: search ? 36 : 14 }}
          placeholder="Cari nama, nomor, dusun, RT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-txt3)", padding: 4 }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter + Sort */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => setShowFilter((v) => !v)}
          style={{
            height: 36, paddingInline: 14, borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            background: (showFilter || activeFilterCount > 0) ? "var(--color-primary)" : "var(--color-bg)",
            color: (showFilter || activeFilterCount > 0) ? "#fff" : "var(--color-txt3)",
            outline: (!showFilter && activeFilterCount === 0) ? "1px solid var(--color-border)" : "none",
            position: "relative",
          }}
        >
          {showFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Filter
          {activeFilterCount > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--color-belum)", color: "#fff",
              fontSize: 9, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{activeFilterCount}</span>
          )}
        </button>

        {(["nomorSambungan", "nama", "dusun", "rt"] as SortKey[]).map((key) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            style={{
              flex: 1, height: 36, borderRadius: 8, fontSize: 11, fontWeight: 700,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
              background: sortKey === key ? "var(--color-primary)" : "var(--color-bg)",
              color: sortKey === key ? "#fff" : "var(--color-txt3)",
              outline: sortKey !== key ? "1px solid var(--color-border)" : "none",
            }}
          >
            {key === "nomorSambungan" ? "No." : key === "nama" ? "Nama" : key === "dusun" ? "Dusun" : "RT"}
            {sortKey === key && (
              <SortAsc size={11} style={{ transform: sortAsc ? "none" : "scaleY(-1)", transition: "transform 0.15s" }} />
            )}
          </button>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["semua", "aktif", "nonaktif", "pindah"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: filterStatus === s ? "var(--color-primary)" : "var(--color-border)",
                  background: filterStatus === s ? "var(--color-primary)" : "transparent",
                  color: filterStatus === s ? "#fff" : "var(--color-txt3)",
                }}>
                  {s === "semua" ? "Semua" : s === "aktif" ? "Aktif" : s === "nonaktif" ? "Non-Aktif" : "Pindah"}
                </button>
              ))}
            </div>
          </div>

          {dusunList.length > 0 && (
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Dusun</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["semua", ...dusunList].map((d) => (
                  <button key={d} onClick={() => setFilterDusun(d)} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "1.5px solid",
                    borderColor: filterDusun === d ? "var(--color-primary)" : "var(--color-border)",
                    background: filterDusun === d ? "var(--color-primary)" : "transparent",
                    color: filterDusun === d ? "#fff" : "var(--color-txt3)",
                  }}>
                    {d === "semua" ? "Semua Dusun" : d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterStatus("semua"); setFilterDusun("semua"); }}
              style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--color-belum)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Result count */}
      {(search || activeFilterCount > 0) && (
        <div style={{ fontSize: 12, color: "var(--color-txt3)" }}>
          Menampilkan {filtered.length} dari {members.length} pelanggan
          {sortKey && <span> · Urut: {SORT_LABELS[sortKey]} {sortAsc ? "A-Z" : "Z-A"}</span>}
        </div>
      )}

      {/* Member List */}
      {members.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <Users size={40} style={{ color: "var(--color-txt3)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--color-txt3)", fontSize: 15 }}>Belum ada pelanggan.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" className="empty-state-lg">
          Tidak ada pelanggan yang sesuai.
        </div>
      ) : (
        <div className="col-10">
          {filtered.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              isAdmin={isAdmin}
              onDetail={openDetail}
              onEdit={(m) => { setEditTarget(m); setModalOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* FAB Tambah Pelanggan */}
      {isAdmin && (
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          style={{
            position: "fixed",
            bottom: "calc(var(--nav-height) + 16px)",
            right: 20,
            width: 56, height: 56,
            borderRadius: "50%",
            background: "var(--color-primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(3,105,161,0.45)",
            zIndex: 50,
          }}
          title="Tambah Pelanggan"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Modal Tambah / Edit */}
      {modalOpen && (
        <MemberForm
          editTarget={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
        />
      )}

      {/* Modal Detail Riwayat */}
      {detailMember && (
        <MemberDetail
          member={detailMember}
          riwayat={riwayatTagihan}
          loading={loadingRiwayat}
          onClose={() => setDetailMember(null)}
        />
      )}
    </div>
  );
}
