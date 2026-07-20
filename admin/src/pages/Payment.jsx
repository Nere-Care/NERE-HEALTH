import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, Eye, X, AlertCircle, TrendingUp,
  CreditCard, Clock, CheckCircle, XCircle, ChevronDown,
} from "lucide-react";
import {
  fetchAdminPaiements,
  fetchAdminPaiementsStats,
  fetchAdminPaiement,
  updatePaiementStatut,
} from "../services/PaiementService";

function BadgeStatut({ statut }) {
  const config = {
    confirme:   { label: "Confirmé",   cls: "bg-green-100 text-green-700"  },
    initie:     { label: "Initié",     cls: "bg-yellow-100 text-yellow-700" },
    en_attente: { label: "En attente", cls: "bg-yellow-100 text-yellow-700" },
    echoue:     { label: "Échoué",     cls: "bg-red-100 text-red-700"      },
    annule:     { label: "Annulé",     cls: "bg-gray-100 text-gray-600"    },
    rembourse:  { label: "Remboursé",  cls: "bg-blue-100 text-blue-700"    },
  };
  const c = config[statut] || config.en_attente;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.cls}`}>{c.label}</span>;
}

function PaiementDetailModal({ paiementId, onClose, onUpdateStatut, darkMode }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [motif, setMotif] = useState("");

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminPaiement(paiementId);
        setDetail(data);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [paiementId]);

  const handleStatut = async (statut) => {
    try {
      setSaving(true);
      setErreur(null);
      await onUpdateStatut(paiementId, statut, statut === "rembourse" ? motif : null);
      onClose();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden
        ${darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-800"}`}>

        <div className={`flex items-center justify-between px-6 py-4 border-b
          ${darkMode ? "border-slate-700" : "border-gray-100"}`}>
          <h2 className="font-bold text-lg">Détail du paiement</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : detail ? (
            <>
              {erreur && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm">
                  <AlertCircle size={14} /> {erreur}
                </div>
              )}

              <div className={`p-4 rounded-xl grid grid-cols-2 gap-3 text-sm ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                <div><p className="text-xs text-gray-400">Référence</p><p className="font-mono font-medium">{detail.reference}</p></div>
                <div><p className="text-xs text-gray-400">Statut</p><BadgeStatut statut={detail.statut} /></div>
                <div><p className="text-xs text-gray-400">Patient</p><p className="font-medium">{detail.patient_nom}</p></div>
                <div><p className="text-xs text-gray-400">Médecin</p><p className="font-medium">{detail.medecin_nom}</p></div>
                <div><p className="text-xs text-gray-400">Montant total</p><p className="font-semibold">{detail.montant_total?.toLocaleString()} {detail.devise}</p></div>
                <div><p className="text-xs text-gray-400">Commission</p><p className="font-semibold text-orange-500">{detail.frais_plateforme?.toLocaleString()} {detail.devise}</p></div>
                <div><p className="text-xs text-gray-400">Méthode</p><p className="font-medium">{detail.methode}</p></div>
                <div><p className="text-xs text-gray-400">Fournisseur</p><p className="font-medium">{detail.fournisseur}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-400">Date</p><p className="font-medium">{detail.date_creation}</p></div>
              </div>

              {detail.rdv && (
                <div className={`p-4 rounded-xl text-sm ${darkMode ? "bg-slate-800" : "bg-blue-50"}`}>
                  <p className="font-semibold mb-1">Rendez-vous associé</p>
                  <p>Réf : {detail.rdv.numero_rdv}</p>
                  <p>Motif : {detail.rdv.motif}</p>
                  <p>Date : {detail.rdv.date}</p>
                </div>
              )}

              {detail.statut === "confirme" && (
                <div>
                  <label className="text-xs font-semibold mb-1 block">Motif de remboursement (si applicable)</label>
                  <input
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex: Consultation annulée par le patient"
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none
                      ${darkMode ? "bg-slate-800 border-slate-600 text-white" : "bg-white border-gray-300"}`}
                  />
                </div>
              )}
            </>
          ) : null}
        </div>

        {detail && (
          <div className={`flex flex-wrap gap-2 px-6 py-4 border-t ${darkMode ? "border-slate-700" : "border-gray-100"}`}>
            {detail.statut === "confirme" && (
              <button onClick={() => handleStatut("rembourse")} disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                Rembourser
              </button>
            )}
            {["initie", "en_attente"].includes(detail.statut) && (
              <>
                <button onClick={() => handleStatut("confirme")} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  Forcer confirmation
                </button>
                <button onClick={() => handleStatut("echoue")} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                  Marquer échoué
                </button>
              </>
            )}
            <button onClick={onClose}
              className={`ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition
                ${darkMode ? "bg-slate-800 text-gray-300 hover:bg-slate-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Payment({ darkMode }) {
  const [paiements, setPaiements] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [erreur,    setErreur]    = useState(null);
  const [search,    setSearch]    = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [paiementsData, statsData] = await Promise.all([
        fetchAdminPaiements({ search, statut: filtreStatut }),
        fetchAdminPaiementsStats(),
      ]);
      setPaiements(paiementsData?.paiements ?? []);
      setTotal(paiementsData?.total ?? 0);
      setStats(statsData);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filtreStatut]);

  useEffect(() => {
    const delay = setTimeout(charger, 300);
    return () => clearTimeout(delay);
  }, [charger]);

  const handleUpdateStatut = async (id, statut, motif) => {
    await updatePaiementStatut(id, statut, motif);
    await charger();
  };

  const STATS_ITEMS = stats ? [
    { label: "Volume total",  value: `${Math.round(stats.volume_total).toLocaleString()} XAF`, icon: TrendingUp,  color: "green"  },
    { label: "Commissions",   value: `${Math.round(stats.commissions_total).toLocaleString()} XAF`, icon: CreditCard, color: "blue"   },
    { label: "En attente",    value: stats.en_attente,  icon: Clock,       color: "orange" },
    { label: "Échoués",       value: stats.echoues,     icon: XCircle,     color: "red"    },
  ] : [];

  const colorMap = {
    green:  "bg-green-600/10 text-green-500",
    blue:   "bg-blue-600/10 text-blue-500",
    orange: "bg-orange-600/10 text-orange-500",
    red:    "bg-red-600/10 text-red-500",
  };

  const inputClass = `px-4 py-2.5 rounded-xl border outline-none text-sm transition
    ${darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`;

  return (
    <div className={`min-h-screen p-4 sm:p-6 space-y-6 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-gray-900"}`}>

      <div>
        <h1 className="text-2xl font-bold text-blue-500">Gestion des paiements</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {total} transaction{total > 1 ? "s" : ""}
        </p>
      </div>

      {erreur && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <h2 className="text-xl font-bold mt-1">{item.value}</h2>
                  </div>
                  <div className={`p-3 rounded-xl ${colorMap[item.color]}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`rounded-2xl p-4 border space-y-3 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par référence, patient..."
              className={`${inputClass} pl-9 w-full`} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition
              ${showFilters ? "bg-blue-600 text-white border-blue-600" : darkMode ? "bg-slate-800 border-slate-700 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
            <Filter size={15} /> Filtres
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-inherit">
            <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className={inputClass}>
              <option value="">Statut — Tous</option>
              <option value="confirme">Confirmé</option>
              <option value="initie">Initié</option>
              <option value="en_attente">En attente</option>
              <option value="echoue">Échoué</option>
              <option value="rembourse">Remboursé</option>
              <option value="annule">Annulé</option>
            </select>
            <button onClick={() => { setSearch(""); setFiltreStatut(""); }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paiements.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? "border-slate-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-slate-800" : "bg-gray-50"}>
                <tr>
                  {["Référence", "Patient", "Médecin", "Montant", "Commission", "Méthode", "Statut", "Date", ""].map((h) => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id} className={`border-t transition ${darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-100 hover:bg-gray-50"}`}>
                    <td className="px-5 py-4 font-mono text-xs">{p.reference}</td>
                    <td className="px-5 py-4">{p.patient_nom}</td>
                    <td className="px-5 py-4">{p.medecin_nom}</td>
                    <td className="px-5 py-4 font-semibold">{p.montant_total.toLocaleString()} {p.devise}</td>
                    <td className="px-5 py-4 text-orange-500">{p.frais_plateforme.toLocaleString()} {p.devise}</td>
                    <td className="px-5 py-4 text-xs">{p.methode}</td>
                    <td className="px-5 py-4"><BadgeStatut statut={p.statut} /></td>
                    <td className={`px-5 py-4 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{p.date}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedId(p.id)}
                        className={`p-1.5 rounded-lg transition ${darkMode ? "bg-slate-700 hover:bg-slate-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedId && (
        <PaiementDetailModal
          paiementId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdateStatut={handleUpdateStatut}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}