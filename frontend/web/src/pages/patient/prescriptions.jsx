import { useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { MoreHorizontal, Download, RefreshCw, Eye, Search, Pill } from 'lucide-react';

const prescriptions = [
  { id: 1, nom: "Amoxiceline", dosage: "250ml", frequence: "2x/jour", duree: "2 mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026", statut: "Actif", renouvellement: true },
  { id: 2, nom: "Paracétamol", dosage: "500mg", frequence: "3x/jour", duree: "1 mois", medecin: "Dr. Ngassa Pierre", date: "12/03/2026", statut: "Actif", renouvellement: false },
  { id: 3, nom: "Ibuprofène", dosage: "400mg", frequence: "2x/jour", duree: "2 semaines", medecin: "Dr. Kamdem Marie", date: "05/03/2026", statut: "Expiré", renouvellement: true },
  { id: 4, nom: "Doliprane", dosage: "1g", frequence: "1x/jour", duree: "10 jours", medecin: "Dr. Bello Ahmed", date: "01/03/2026", statut: "Expiré", renouvellement: false },
  { id: 5, nom: "Vitamine C", dosage: "1g", frequence: "1x/jour", duree: "3 mois", medecin: "Dr. Ngassa Pierre", date: "28/02/2026", statut: "Actif", renouvellement: false },
  { id: 6, nom: "Zinc", dosage: "15mg", frequence: "1x/jour", duree: "2 mois", medecin: "Dr. Kamdem Marie", date: "20/02/2026", statut: "Actif", renouvellement: true },
];

export default function Prescriptions({ darkMode }) {
  const { langue } = useLanguage();
  const [filtre, setFiltre] = useState("Tous");
  const [recherche, setRecherche] = useState("");

  const filtresPrescriptions = [
    { label: langue === 'fr' ? "Tous" : "All", val: "Tous" },
    { label: langue === 'fr' ? "Actif" : "Active", val: "Actif" },
    { label: langue === 'fr' ? "Expiré" : "Expired", val: "Expiré" },
  ];

  const prescriptionsFiltrees = prescriptions.filter(p => {
    const matchFiltre = filtre === "Tous" || p.statut === filtre;
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.medecin.toLowerCase().includes(recherche.toLowerCase());
    return matchFiltre && matchRecherche;
  });

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Titre */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
          {langue === 'fr' ? "Mes Prescriptions" : "My Prescriptions"}
        </h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {langue === 'fr' ? "Gérez vos ordonnances et traitements" : "Manage your prescriptions and treatments"}
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: langue === 'fr' ? "Prescriptions actives" : "Active Prescriptions", value: prescriptions.filter(p => p.statut === "Actif").length, color: "bg-green-100 text-green-500" },
          { label: langue === 'fr' ? "Expirées" : "Expired", value: prescriptions.filter(p => p.statut === "Expiré").length, color: "bg-red-100 text-red-500" },
          { label: langue === 'fr' ? "À renouveler" : "To Renew", value: prescriptions.filter(p => p.renouvellement).length, color: "bg-orange-100 text-orange-500" },
        ].map((stat, index) => (
          <div key={index} className={`rounded-2xl shadow p-4 flex items-center gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <Pill size={22} />
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 flex-1
          ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={langue === 'fr' ? "Rechercher une prescription..." : "Search prescription..."}
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {filtresPrescriptions.map((f) => (
            <button
              key={f.val}
              onClick={() => setFiltre(f.val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${filtre === f.val
                  ? "bg-blue-600 text-white"
                  : darkMode
                    ? "bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille prescriptions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptionsFiltrees.map((p) => (
          <div key={p.id} className={`rounded-2xl shadow p-4 flex flex-col gap-3
            ${darkMode ? "bg-gray-800" : "bg-white"}`}>

            {/* Header carte */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${darkMode ? "bg-blue-900" : "bg-blue-50"}`}>
                  <Pill size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{p.nom}</p>
                  <p className="text-xs text-blue-400">{p.dosage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${p.statut === "Actif" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                  {langue === 'fr' ? p.statut : p.statut === "Actif" ? "Active" : "Expired"}
                </span>
                <button className="text-gray-400">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Infos */}
            <div className={`rounded-xl p-3 flex flex-col gap-2 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              {[
                { label: langue === 'fr' ? "Fréquence" : "Frequency", value: p.frequence },
                { label: langue === 'fr' ? "Durée" : "Duration", value: p.duree },
                { label: langue === 'fr' ? "Prescrit le" : "Prescribed on", value: p.date },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Médecin */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {p.medecin.charAt(4)}
              </div>
              <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{p.medecin}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className={`flex-1 flex items-center justify-center gap-1 border text-xs py-1.5 rounded-lg transition-all
                ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Eye size={12} />
                {langue === 'fr' ? "Voir" : "View"}
              </button>
              <button className={`flex-1 flex items-center justify-center gap-1 border text-xs py-1.5 rounded-lg transition-all
                ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                <Download size={12} />
                {langue === 'fr' ? "Télécharger" : "Download"}
              </button>
              {p.renouvellement && (
                <button className="flex-1 flex items-center justify-center gap-1 bg-blue-500 text-white text-xs py-1.5 rounded-lg hover:bg-blue-600 transition-all">
                  <RefreshCw size={12} />
                  {langue === 'fr' ? "Renouveler" : "Renew"}
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}