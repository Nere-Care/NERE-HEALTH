import { useState } from "react";
import { CheckCircle, Clock, XCircle, Search } from "lucide-react";

export default function PaymentHistory({ payments, darkMode }) {
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState("tous");

  const statusConfig = {
    paid:    { icon: CheckCircle, style: "text-green-700 bg-green-50 border-green-200", label: "Paye" },
    pending: { icon: Clock,       style: "text-yellow-700 bg-yellow-50 border-yellow-200", label: "En attente" },
    failed:  { icon: XCircle,     style: "text-red-700 bg-red-50 border-red-200", label: "Echoue" },
  };

  const filtered = payments.filter((p) => {
    const v = search.toLowerCase();
    const matchSearch = (
      p.service?.toLowerCase().includes(v) ||
      p.method?.toLowerCase().includes(v) ||
      p.date?.toLowerCase().includes(v) ||
      p.patient?.toLowerCase().includes(v)
    );
    const matchFiltre = filtre === "tous" || p.status === filtre;
    return matchSearch && matchFiltre;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Historique des paiements
        </h2>
        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
          {payments.length} transaction(s)
        </span>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { key: "tous", label: "Tous" },
          { key: "paid", label: "Payes" },
          { key: "pending", label: "En attente" },
          { key: "failed", label: "Echoues" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
              ${filtre === key
                ? "bg-blue-600 text-white"
                : darkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className={`w-full pl-9 py-2 border rounded-xl text-sm outline-none
            ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
        />
      </div>

      {/* Liste */}
      <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className={`text-center py-10 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucune transaction trouvee.
          </div>
        ) : (
          filtered.map((p) => {
            const config = statusConfig[p.status] || statusConfig.pending;
            const Icon = config.icon;

            return (
              <div key={p.id} className={`border rounded-xl p-4 transition
                ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700" : "bg-white border-gray-200 hover:shadow-sm"}`}>

                <div className="flex justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {p.service}
                    </p>
                    <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {p.method} • {p.date} {p.heure}
                    </p>
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap text-green-600">
                    +{p.amount?.toLocaleString()} {p.devise}
                  </p>
                </div>

                <div className={`mt-2 inline-flex px-2 py-1 rounded-lg border items-center gap-1 text-xs ${config.style}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}