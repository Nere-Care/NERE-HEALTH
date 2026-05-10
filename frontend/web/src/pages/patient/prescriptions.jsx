import { useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { Search, RefreshCw, Pill, Clock, Calendar, ChevronRight } from 'lucide-react';

const prescriptions = [
  {
    id: 1,
    nom: "Lisinopril",
    dosage: "10mg",
    frequence: "Une fois par jour",
    instructions: "Prendre le matin avec ou sans nourriture",
    medecin: "Dr. Ngassa Pierre",
    renouvellements: 2,
    prochainRenouvellement: "29 Jan 2027",
    statut: "Actif",
    urgence: false,
  },
  {
    id: 2,
    nom: "Metformine",
    dosage: "500mg",
    frequence: "Deux fois par jour",
    instructions: "Prendre avec les repas pour éviter les nausées",
    medecin: "Dr. Kamdem Marie",
    renouvellements: 3,
    prochainRenouvellement: "15 Jan 2027",
    statut: "Actif",
    urgence: false,
  },
  {
    id: 3,
    nom: "Atorvastatine",
    dosage: "20mg",
    frequence: "Une fois par jour",
    instructions: "Prendre le soir pour de meilleurs résultats",
    medecin: "Dr. Bello Ahmed",
    renouvellements: 1,
    prochainRenouvellement: "10 Fév 2026",
    statut: "Actif",
    urgence: true,
  },
  {
    id: 4,
    nom: "Amoxicilline",
    dosage: "250mg",
    frequence: "Trois fois par jour",
    instructions: "Prendre avec un grand verre d'eau",
    medecin: "Dr. Ngo Sophie",
    renouvellements: 0,
    prochainRenouvellement: "N/A",
    statut: "Expiré",
    urgence: false,
  },
  {
    id: 5,
    nom: "Vitamine C",
    dosage: "1g",
    frequence: "Une fois par jour",
    instructions: "Prendre le matin",
    medecin: "Dr. Ngassa Pierre",
    renouvellements: 4,
    prochainRenouvellement: "12 Mar 2027",
    statut: "Actif",
    urgence: false,
  },
];

export default function Prescriptions({ darkMode }) {
  const { langue } = useLanguage();
  const [recherche, setRecherche] = useState("");

  const actives = prescriptions.filter(p => p.statut === "Actif");
  const aRenouveler = prescriptions.filter(p => p.renouvellements <= 1 && p.statut === "Actif");
  const prochainDate = prescriptions.filter(p => p.urgence)[0]?.prochainRenouvellement || "N/A";

  const prescriptionsFiltrees = prescriptions.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.medecin.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            {langue === 'fr' ? "Prescriptions" : "Prescriptions"}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {langue === 'fr' ? "Gérez vos médicaments et renouvellements" : "Manage your medications and refills"}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">
          <RefreshCw size={16} />
          {langue === 'fr' ? "Demander un renouvellement" : "Request Refill"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: langue === 'fr' ? "Prescriptions actives" : "Active Prescriptions",
            value: actives.length,
            color: "bg-blue-100 text-blue-500",
          },
          {
            label: langue === 'fr' ? "À renouveler" : "Need Refill",
            value: aRenouveler.length,
            color: "bg-orange-100 text-orange-500",
          },
          {
            label: langue === 'fr' ? "Prochain renouvellement" : "Next Refill Due",
            value: prochainDate,
            color: "bg-green-100 text-green-500",
          },
        ].map((stat, index) => (
          <div key={index} className={`rounded-2xl shadow p-5 flex items-center gap-4
            ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <Pill size={22} />
            </div>
            <div>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
              <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 mb-4
        ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder={langue === 'fr' ? "Rechercher des prescriptions..." : "Search prescriptions..."}
          className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-3">
        {prescriptionsFiltrees.map((p) => (
          <div
            key={p.id}
            className={`rounded-2xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all
              ${p.urgence
                ? darkMode ? "bg-orange-900/30 border border-orange-700" : "bg-orange-50 border border-orange-200"
                : darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            {/* Icône + Nom */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <Pill size={18} className={p.urgence ? "text-orange-500" : "text-blue-500"} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {p.nom}
                  </p>
                  <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {p.dosage}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {langue === 'fr' ? p.frequence : p.frequence}
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {p.instructions}
                </p>
              </div>
            </div>

            {/* Médecin */}
            <div className="flex-shrink-0">
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {langue === 'fr' ? "Prescrit par" : "Prescribed by"}
              </p>
              <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {p.medecin}
              </p>
            </div>

            {/* Renouvellements */}
            <div className="flex-shrink-0">
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {langue === 'fr' ? "Renouvellements" : "Refills Left"}
              </p>
              <p className={`text-sm font-bold ${p.renouvellements === 0 ? "text-red-500" : darkMode ? "text-white" : "text-gray-800"}`}>
                {p.renouvellements}
              </p>
            </div>

            {/* Prochain renouvellement */}
            <div className="flex-shrink-0">
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {langue === 'fr' ? "Prochain renouvellement" : "Next Refill"}
              </p>
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-blue-400" />
                <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {p.prochainRenouvellement}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {langue === 'fr' ? "Détails" : "Details"}
              </button>
              <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${p.statut === "Expiré"
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"}`}
                disabled={p.statut === "Expiré"}>
                <RefreshCw size={11} />
                {langue === 'fr' ? "Renouveler" : "Refill"}
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}