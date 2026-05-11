import { useState } from 'react';
import {
  Download, Eye, CreditCard, CheckCircle, Clock, XCircle
} from 'lucide-react';

const factures = [
  { id: "FAC-001", date: "12/03/2026", medecin: "Dr. Ngassa Pierre", acte: "Consultation dentaire", montant: 15000, statut: "Payé" },
  { id: "FAC-002", date: "05/03/2026", medecin: "Dr. Kamdem Marie", acte: "Consultation cardiologie", montant: 25000, statut: "Payé" },
  { id: "FAC-003", date: "28/02/2026", medecin: "Dr. Bello Ahmed", acte: "Consultation générale", montant: 10000, statut: "En attente" },
  { id: "FAC-004", date: "15/02/2026", medecin: "Dr. Ngo Sophie", acte: "Consultation pédiatrie", montant: 20000, statut: "Payé" },
  { id: "FAC-005", date: "01/02/2026", medecin: "Dr. Essomba Paul", acte: "Consultation dermatologie", montant: 18000, statut: "Annulé" },
];

export default function Factures({ darkMode }) {
  const [filtre, setFiltre] = useState("Tous");

  const filtres = [
    { label: "Tous", val: "Tous" },
    { label: "Payé", val: "Payé" },
    { label: "En attente", val: "En attente" },
    { label: "Annulé", val: "Annulé" },
  ];

  const facturesFiltrees =
    filtre === "Tous" ? factures : factures.filter(f => f.statut === filtre);

  const total = factures
    .filter(f => f.statut === "Payé")
    .reduce((acc, f) => acc + f.montant, 0);

  const enAttente = factures
    .filter(f => f.statut === "En attente")
    .reduce((acc, f) => acc + f.montant, 0);

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Titre */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          Mes Factures
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Historique de vos paiements et factures
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total payé", value: `${total.toLocaleString()} FCFA`, icon: CheckCircle, color: "bg-green-100 text-green-500" },
          { label: "En attente", value: `${enAttente.toLocaleString()} FCFA`, icon: Clock, color: "bg-orange-100 text-orange-500" },
          { label: "Factures totales", value: factures.length, icon: CreditCard, color: "bg-blue-100 text-blue-500" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-4 flex items-center gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {filtres.map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltre(f.val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium
              ${filtre === f.val
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-600"
                  : "bg-white text-gray-600 border border-gray-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {["N° Facture", "Date", "Médecin", "Acte", "Montant", "Statut", "Actions"].map((h) => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {facturesFiltrees.map((f) => (
              <tr key={f.id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>

                <td className="px-5 py-4 font-medium text-blue-500">{f.id}</td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.date}</td>
                <td className={`px-5 py-4 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{f.medecin}</td>
                <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{f.acte}</td>
                <td className={`px-5 py-4 font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {f.montant.toLocaleString()} FCFA
                </td>

                <td className="px-5 py-4">
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold w-fit
                    ${f.statut === "Payé"
                      ? "bg-green-100 text-green-600"
                      : f.statut === "En attente"
                        ? "bg-orange-100 text-orange-500"
                        : "bg-red-100 text-red-500"}`}>
                    
                    {f.statut === "Payé" && <CheckCircle size={10} />}
                    {f.statut === "En attente" && <Clock size={10} />}
                    {f.statut === "Annulé" && <XCircle size={10} />}

                    {f.statut}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button className={`p-1.5 rounded-lg ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                      <Eye size={14} />
                    </button>
                    <button className={`p-1.5 rounded-lg ${darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-50 text-blue-500"}`}>
                      <Download size={14} />
                    </button>

                    {f.statut === "En attente" && (
                      <button className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg">
                        Payer
                      </button>
                    )}
                  </div>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}