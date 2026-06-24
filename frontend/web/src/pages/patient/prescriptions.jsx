import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, FileText } from "lucide-react";
import { fetchPrescriptions } from "../../services/ordonanceService";

const formatDate = (iso) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export default function Prescriptions({ darkMode }) {
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchPrescriptions();
        setPrescriptions(data || []); // S'assurer que c'est un tableau
      } catch (err) {
        console.error("Erreur chargement prescriptions:", err);
        setPrescriptions([]); // En cas d'erreur, tableau vide
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  const filtered = prescriptions.filter((p) =>
    p.nom?.toLowerCase().includes(recherche.toLowerCase())
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Liste */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {filtered.length > 0 ? (
            filtered.map((p) => (
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
                      {p.frequence || "Posologie non précisée"}
                    </p>
                    <p className="text-xs text-blue-400 mt-0.5">
                      {p.medecin} • Expire le {formatDate(p.date_expiration)}
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
            ))
          ) : (
            // Message sympathique quand aucune prescription
            <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
              <FileText size={64} className={`mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {recherche ? "Aucune prescription trouvée" : "Aucune prescription"}
              </h3>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {recherche
                  ? "Essayez avec d'autres termes de recherche"
                  : "Vous n'avez pas encore de prescription active. Consultez un médecin pour obtenir une ordonnance."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}