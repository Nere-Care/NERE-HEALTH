import { useState } from "react";
import { getUserTimezone } from "../../../utils/timezone";
import { CheckCircle, Clock, XCircle, Search, Download, ArrowUpRight, Wallet, RotateCcw } from "lucide-react";
import { generateDoctorWithdrawalReceiptPDF, isPaidStatus } from "../../../utils/receiptGenerator";

const RETRAIT_STATUS = {
  en_attente: { icon: Clock, style: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800", label: "En attente" },
  valide: { icon: CheckCircle, style: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800", label: "Validé" },
  rejete: { icon: XCircle, style: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800", label: "Rejeté" },
  effectue: { icon: CheckCircle, style: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800", label: "Effectué" },
};

function getRetraitRef(r) {
  if (r.reference) return r.reference;
  const idPart = (r.id || "").replace(/-/g, "").slice(0, 12).toUpperCase();
  return `TRF-RET-${idPart}`;
}

export default function DoctorPaymentsHistory({ payments, retraits = [], darkMode, doctorName, configuredMethods = [] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tab, setTab] = useState("payments");

  const retraitStatusCounts = {
    all: retraits.length,
    en_attente: retraits.filter(r => r.statut === "en_attente").length,
    valide: retraits.filter(r => r.statut === "valide" || r.statut === "effectue").length,
    rejete: retraits.filter(r => r.statut === "rejete").length,
  };

  const filtered = tab === "payments"
    ? payments.filter((p) => {
        const v = search.toLowerCase();
        const matchSearch = (p.matricule || "").toLowerCase().includes(v) ||
          p.service.toLowerCase().includes(v) ||
          p.method.toLowerCase().includes(v) ||
          p.date.toLowerCase().includes(v);
        const matchStatus = filterStatus === "all" || p.status === filterStatus;
        return matchSearch && matchStatus;
      })
    : retraits.filter((r) => {
        const v = search.toLowerCase();
        const ref = getRetraitRef(r).toLowerCase();
        const matchSearch = r.methode.toLowerCase().includes(v) ||
          ref.includes(v) ||
          (r.created_at || "").toLowerCase().includes(v);
        const matchStatus = filterStatus === "all" || r.statut === filterStatus;
        return matchSearch && matchStatus;
      });

  const retraitsCounts = {
    all: retraits.length,
    en_attente: retraits.filter(r => r.statut === "en_attente").length,
    valide: retraits.filter(r => r.statut === "valide" || r.statut === "effectue").length,
    rejete: retraits.filter(r => r.statut === "rejete").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-[#2C3850]"}`}>
          Historique
        </h2>
      </div>

      {/* TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => { setTab("payments"); setFilterStatus("all"); setSearch(""); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${tab === "payments" ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Paiements ({payments.length})
        </button>
        <button
          onClick={() => { setTab("retraits"); setFilterStatus("all"); setSearch(""); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${tab === "retraits" ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Retraits ({retraits.length})
        </button>
      </div>

      {/* SEARCH + FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "payments" ? "Rechercher paiements..." : "Rechercher retraits..."}
            className={`w-full pl-9 p-2.5 border rounded-xl text-sm outline-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-white border-gray-300 text-black focus:border-blue-500"}`}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(tab === "payments"
            ? ["all", "Paid", "Pending", "Failed", "Retenu", "Refunded"]
            : ["all", "en_attente", "valide", "rejete"]
          ).map((status) => {
            const counts = tab === "payments"
              ? { all: payments.length, Paid: payments.filter(p => p.status === "Paid").length, Pending: payments.filter(p => p.status === "Pending").length, Failed: payments.filter(p => p.status === "Failed").length, Retenu: payments.filter(p => p.status === "Retenu").length, Refunded: payments.filter(p => p.status === "Refunded").length }
              : retraitsCounts;
            const label = status === "all" ? "Tous" : status === "en_attente" ? "En attente" : status === "valide" ? "Validés" : status === "rejete" ? "Rejetés" : status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition
                  ${filterStatus === status
                    ? "bg-blue-600 text-white"
                    : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {label} ({counts[status] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTE */}
      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
        {filtered.length > 0 ? (
          tab === "payments" ? (
            filtered.map((p) => {
              const statusConfig = {
                Paid: { icon: CheckCircle, style: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800", label: "Paid" },
                Pending: { icon: Clock, style: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800", label: "Pending" },
                Failed: { icon: XCircle, style: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800", label: "Failed" },
                Refunded: { icon: RotateCcw, style: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800", label: "Refunded" },
                Retenu: { icon: Clock, style: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800", label: "Retenu" },
              };
              const config = statusConfig[p.status] || statusConfig.Pending;
              const Icon = config.icon;
              return (
                <div
                  key={p.id}
                  className={`border rounded-xl p-4 transition
                    ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white border-gray-200 hover:shadow-sm"}`}
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{p.service}</p>
                      {p.matricule && (
                        <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>
                          Matricule: {p.matricule}
                        </p>
                      )}
                      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                        {p.method} • {p.date}
                      </p>
                      {p.frais_plateforme > 0 && (
                        <div className={`flex items-center gap-1 mt-1 text-[11px] ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          Commission plateforme: {Number(p.frais_plateforme).toLocaleString()} {p.devise}
                          <span className={`mx-1 ${darkMode ? "text-gray-600" : "text-gray-300"}`}>|</span>
                          Versé: {Number(p.montant_medecin || p.montant_total).toLocaleString()} {p.devise}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">{p.amount}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className={`inline-flex px-2 py-1 rounded-lg border items-center gap-1 text-xs ${config.style}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            filtered.map((r) => {
              const config = RETRAIT_STATUS[r.statut] || RETRAIT_STATUS.en_attente;
              const Icon = config.icon;
              return (
                <div
                  key={r.id}
                  className={`border rounded-xl p-4 transition
                    ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white border-gray-200 hover:shadow-sm"}`}
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet size={14} className="text-purple-500" />
                        <p className="font-medium text-sm">Retrait</p>
                      </div>
                      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                        {r.methode} • {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR", { timeZone: getUserTimezone() }) : "-"}
                      </p>
                      <p className={`text-xs mt-0.5 font-mono ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {getRetraitRef(r)}
                      </p>
                      {r.motif_rejet && (
                        <p className="text-xs mt-0.5 text-red-500">
                          Motif: {r.motif_rejet}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap text-purple-600 dark:text-purple-400">
                      -{Number(r.montant).toLocaleString()} {r.devise}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className={`inline-flex px-2 py-1 rounded-lg border items-center gap-1 text-xs ${config.style}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>

                    {isPaidStatus(r.statut) && (
                      <button
                        onClick={() => generateDoctorWithdrawalReceiptPDF(r, doctorName, configuredMethods)}
                        title="Télécharger le reçu de versement"
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition
                          ${darkMode ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/70" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                      >
                        <Download size={13} />
                        Reçu
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p className="text-sm">{tab === "payments" ? "Aucun paiement trouvé" : "Aucun retrait trouvé"}</p>
          </div>
        )}
      </div>
    </div>
  );
}