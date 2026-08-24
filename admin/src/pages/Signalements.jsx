import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  Flag,
  Search,
  Loader,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  User,
  ShieldAlert,
  RotateCcw,
  X,
} from "lucide-react";
import API from "../services/api";

const STATUTS = {
  en_attente: { label: "En attente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  traite: { label: "Traité", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  rejete: { label: "Rejeté", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const ROLES = {
  patient: { label: "Patient", color: "bg-blue-500/10 text-blue-500" },
  medecin: { label: "Médecin", color: "bg-purple-500/10 text-purple-500" },
  infirmier: { label: "Infirmier", color: "bg-teal-500/10 text-teal-500" },
  sage_femme: { label: "Sage-femme", color: "bg-pink-500/10 text-pink-500" },
  admin: { label: "Admin", color: "bg-orange-500/10 text-orange-500" },
};

export default function Signalements({ darkMode }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [acting, setActing] = useState(null);

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/signalements");
      setSignalements(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error("❌ Erreur chargement des signalements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(
    () => ({
      total: signalements.length,
      en_attente: signalements.filter((s) => s.statut === "en_attente").length,
      traite: signalements.filter((s) => s.statut === "traite").length,
      rejete: signalements.filter((s) => s.statut === "rejete").length,
    }),
    [signalements]
  );

  const filtered = useMemo(() => {
    return signalements.filter((s) => {
      const matchStatut = statutFilter === "all" || s.statut === statutFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.motif || "").toLowerCase().includes(q) ||
        (s.conversation_signalee_par || "").toLowerCase().includes(q);
      return matchStatut && matchSearch;
    });
  }, [signalements, statutFilter, search]);

  const handleUpdate = async (s, statut) => {
    setActing(s.id);
    try {
      await API.put(`/signalements/${s.id}?statut=${statut}`);
      toast.success(statut === "traite" ? "✅ Signalement traité" : "🗂️ Signalement rejeté");
      fetchData();
      if (selected?.id === s.id) setSelected((prev) => ({ ...prev, statut }));
    } catch (e) {
      toast.error("❌ Erreur lors de la mise à jour");
    } finally {
      setActing(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const StatBadge = ({ statut }) => {
    const cfg = STATUTS[statut] || STATUTS.en_attente;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-3 sm:p-5 lg:p-6 space-y-5 ${bg}`}>
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Flag size={28} className="text-orange-500" />
            Signalements
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Conversations signalées par les patients et les professionnels
          </p>
        </div>
        <button
          onClick={fetchData}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 transition flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          Actualiser
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: "Total", value: stats.total, icon: Flag, color: "bg-orange-500/10 text-orange-500" },
          { title: "En attente", value: stats.en_attente, icon: Clock, color: "bg-yellow-500/10 text-yellow-500" },
          { title: "Traités", value: stats.traite, icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
          { title: "Rejetés", value: stats.rejete, icon: XCircle, color: "bg-gray-500/10 text-gray-400" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`rounded-2xl border p-4 ${card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{item.title}</p>
                  <h2 className="text-2xl font-bold mt-1">{item.value}</h2>
                </div>
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FILTERS ================= */}
      <div className={`rounded-2xl border p-4 space-y-4 ${card}`}>
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${darkMode ? "border-slate-700" : "border-gray-300"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par motif ou par personne..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Tous"],
            ["en_attente", "En attente"],
            ["traite", "Traités"],
            ["rejete", "Rejetés"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatutFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                statutFilter === val
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= LIST ================= */}
      {loading ? (
        <div className={`rounded-2xl border p-16 flex items-center justify-center ${card}`}>
          <Loader className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`rounded-2xl border p-16 text-center ${card}`}>
          <ShieldAlert size={40} className="mx-auto opacity-50 text-green-500" />
          <p className="mt-3 text-gray-400">Aucun signalement</p>
          {signalements.length === 0 && (
            <p className="mt-1 text-sm text-gray-400">Les conversations signalées apparaîtront ici</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const roleCfg = ROLES[s.signalant_role] || { label: s.signalant_role, color: "bg-gray-500/10 text-gray-400" };
            return (
              <div key={s.id} className={`rounded-2xl border p-5 transition hover:shadow-lg ${card}`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.statut === "rejete" ? "bg-gray-500/10 text-gray-400" : s.statut === "traite" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"}`}>
                    <Flag size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg line-clamp-1">{s.motif}</h3>
                      <StatBadge statut={s.statut} />
                    </div>
                    <p className={`text-sm mt-1 text-gray-400 flex items-center gap-1.5 flex-wrap`}>
                      <MessageSquare size={14} className="inline" />
                      Conversation avec{" "}
                      <span className="font-medium text-gray-500 dark:text-gray-300">
                        {s.conversation_signalee_par || "—"}
                      </span>
                      <span className="hidden sm:inline">·</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${roleCfg.color}`}>
                        <User size={12} />
                        {roleCfg.label}
                      </span>
                    </p>
                    {s.details && (
                      <p className={`text-sm mt-1 italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>« {s.details} »</p>
                    )}
                  </div>

                  <div className="flex flex-col lg:items-end gap-2">
                    <span className={`text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap`}>
                      <Clock size={12} />
                      {formatDate(s.created_at)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setSelected(s); setShowDetail(true); }}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"}`}
                      >
                        Détails
                      </button>
                      {s.statut === "en_attente" && (
                        <>
                          <button
                            onClick={() => handleUpdate(s, "traite")}
                            disabled={acting === s.id}
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition flex items-center gap-1.5"
                          >
                            {acting === s.id ? <Loader size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Traiter
                          </button>
                          <button
                            onClick={() => handleUpdate(s, "rejete")}
                            disabled={acting === s.id}
                            className="px-4 py-2 rounded-xl border text-sm font-medium transition text-gray-400 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                          >
                            <XCircle size={14} />
                            Rejeter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= DETAIL MODAL ================= */}
      {showDetail && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden ${darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}`}>
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Flag size={20} className="text-orange-500" />
                  Détail du signalement
                </h2>
                <p className="text-sm text-gray-400">{formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <StatBadge statut={selected.statut} />
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${(ROLES[selected.signalant_role] || { color: "bg-gray-500/10 text-gray-400" }).color}`}>
                  <User size={12} />
                  {ROLES[selected.signalant_role]?.label || selected.signalant_role}
                </span>
              </div>

              <div className={`rounded-2xl p-4 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Motif</p>
                <p className="font-semibold">{selected.motif}</p>
              </div>

              <div className={`rounded-2xl p-4 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Conversation avec</p>
                <p className="font-medium">{selected.conversation_signalee_par || "—"}</p>
              </div>

              {selected.details && (
                <div className={`rounded-2xl p-4 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                  <p className="text-xs uppercase text-gray-400 font-semibold mb-1">Détails</p>
                  <p className="text-sm italic">« {selected.details} »</p>
                </div>
              )}

              {selected.statut === "en_attente" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { handleUpdate(selected, "traite"); setShowDetail(false); }}
                    disabled={acting === selected.id}
                    className="flex-1 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2"
                  >
                    {acting === selected.id ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Marquer traité
                  </button>
                  <button
                    onClick={() => { handleUpdate(selected, "rejete"); setShowDetail(false); }}
                    disabled={acting === selected.id}
                    className={`flex-1 py-3 rounded-2xl border font-medium ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"}`}
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
