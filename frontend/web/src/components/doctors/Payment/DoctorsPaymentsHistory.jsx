import { useState } from "react";
import { CheckCircle, Clock, XCircle, Search, Download } from "lucide-react";

export default function DoctorPaymentsHistory({ payments = [], darkMode }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Configuration des statuts (indexée en minuscules pour éviter les conflits de casse)
  const statusConfig = {
    paid: { 
      icon: CheckCircle, 
      style: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800", 
      label: "Paid" 
    },
    pending: { 
      icon: Clock, 
      style: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800", 
      label: "Pending" 
    },
    failed: { 
      icon: XCircle, 
      style: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800", 
      label: "Failed" 
    },
  };

  // Helper pour obtenir le statut en minuscules de manière sécurisée
  const getNormalizedStatus = (status) => {
    return String(status || "").trim().toLowerCase();
  };

  // Filtrage des paiements
  const filtered = payments.filter((p) => {
    const v = search.toLowerCase();
    const matchSearch = 
      (p.service || "").toLowerCase().includes(v) ||
      (p.method || "").toLowerCase().includes(v) ||
      (p.date || "").toLowerCase().includes(v);

    const paymentStatus = getNormalizedStatus(p.status);
    const targetStatus = filterStatus.toLowerCase();

    const matchStatus = targetStatus === "all" || paymentStatus === targetStatus;
    
    return matchSearch && matchStatus;
  });

  // Calcul dynamique des compteurs (insensible à la casse)
  const statusCounts = {
    all: payments.length,
    Paid: payments.filter(p => getNormalizedStatus(p.status) === "paid").length,
    Pending: payments.filter(p => getNormalizedStatus(p.status) === "pending").length,
    Failed: payments.filter(p => getNormalizedStatus(p.status) === "failed").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-[#2C3850]"}`}>
          Payment History
        </h2>
      </div>

      {/* SEARCH + FILTRES */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments..."
            className={`w-full pl-9 p-2.5 border rounded-xl text-sm outline-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-white border-gray-300 text-black focus:border-blue-500"}`}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "Paid", "Pending", "Failed"].map((status) => (
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
              {status === "all" ? "Tous" : status} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
        {filtered.length > 0 ? (
          filtered.map((p) => {
            const normalizedStatus = getNormalizedStatus(p.status);
            const config = statusConfig[normalizedStatus] || statusConfig.pending;
            const Icon = config.icon;

            return (
              <div
                key={p.id}
                className={`border rounded-xl p-4 transition
                  ${darkMode
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                    : "bg-white border-gray-200 hover:shadow-sm"}`}
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.service}</p>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                      {p.method} • {p.date}
                    </p>
                  </div>
                  <p className="font-semibold text-sm whitespace-nowrap">
                    {p.amount} XAF
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className={`inline-flex px-2 py-1 rounded-lg border items-center gap-1 text-xs ${config.style}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                  {p.receipt && (
                    <button className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                      <Download size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <p className="text-sm">Aucun paiement trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}