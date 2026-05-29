import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useLanguage } from "../../LanguageContext";
import { Search, RefreshCw } from "lucide-react";

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
    instructions: "Prendre avec les repas",
    medecin: "Dr. Kamdem Marie",
    renouvellements: 3,
    prochainRenouvellement: "15 Jan 2027",
    statut: "Actif",
    urgence: false,
  },
];

export default function Prescriptions({ darkMode }) {
  // const { langue } = useLanguage();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");

  const filtered = prescriptions.filter((p) =>
    p.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>

      {/* Titre */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Prescriptions</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Vos ordonnances actives
        </p>
      </div>

      {/* Recherche */}
      <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 mb-6
        ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
        <Search size={16} className="text-gray-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une prescription..."
          className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
        />
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl shadow flex justify-between items-center
              ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            {/* Infos */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                ${p.urgence ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-blue-500"}`}>
                <RefreshCw size={20} />
              </div>
              <div>
                <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {p.nom} — {p.dosage}
                </p>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {p.frequence}
                </p>
                <p className="text-xs text-blue-400 mt-0.5">
                  {p.medecin}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/prescription/${p.id}`)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                Détails
              </button>
              <button className={`px-4 py-2 text-sm rounded-xl flex items-center gap-1 transition-all
                ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <RefreshCw size={12} />
                Renouveler
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={`text-center py-10 rounded-2xl ${darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}>
            Aucune prescription trouvée.
          </div>
        )}
      </div>
    </div>
  );
}