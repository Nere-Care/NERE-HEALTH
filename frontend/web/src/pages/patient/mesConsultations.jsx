import { useState, useEffect, useCallback } from "react";
import { Stethoscope, AlertCircle, Download, Lock } from "lucide-react";
import PatientConsultationCard from "../../components/doctors/patient/PatientConsultationCard";
import PatientConsultationDetails from "../../components/doctors/patient/PatientConsultationDetails";
import SearchBar from "../../components/common/SearchBar";
import PasswordConfirmModal from "../../components/common/PasswordConfirmModal"; // Composant modal importé
import { fetchMesConsultationsPatient, telechargerMonDossier } from "../../services/patientService";

export default function MesConsultations({ darkMode }) {
  const [consultations, setConsultations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [telechargement, setTelechargement] = useState(false);

  // 1. Initialiser showPasswordModal à true pour qu'elle s'ouvre direct
const [isUnlocked, setIsUnlocked] = useState(false);
const [showPasswordModal, setShowPasswordModal] = useState(true);

// 2. Charger les données uniquement une fois déverrouillé


  // Charger les données seulement après déverrouillage
  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const data = await fetchMesConsultationsPatient();
      setConsultations(data ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  if (isUnlocked) {
    charger();
  }
}, [isUnlocked]);

  // Callback appelé par PasswordConfirmModal après validation réussie du mot de passe
  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    setIsUnlocked(true);
  };

  const handleTelecharger = async () => {
    try {
      setTelechargement(true);
      await telechargerMonDossier();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setTelechargement(false);
    }
  };

  const filtered = consultations.filter((c) => {
    const kw = search.toLowerCase();
    return (
      c.reason?.toLowerCase().includes(kw) ||
      c.doctor?.toLowerCase().includes(kw) ||
      c.diagnosis?.toLowerCase().includes(kw)
    );
  });

  // 1. Si la page est verrouillée, afficher le Modal de confirmation de mot de passe
// Si le composant n'est pas déverrouillé, afficher l'écran d'attente
if (!isUnlocked) {
  return (
    <div className={`p-6 min-h-screen flex flex-col items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`p-8 rounded-3xl shadow-xl border text-center max-w-sm w-full ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
          <Lock size={32} />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Consultations Protégées
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Veuillez confirmer votre mot de passe pour accéder à l'historique de vos consultations.
        </p>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition"
        >
          Déverrouiller
        </button>
      </div>

      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setShowPasswordModal(false);
        }}
        title="Accès aux consultations"
      />
    </div>
  );
}

  // 2. Une fois déverrouillé, afficher la page normale
  return (
    <div className={`min-h-screen p-4 sm:p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-500">Mes consultations</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Historique complet de vos consultations médicales
          </p>
        </div>
        <button
          onClick={handleTelecharger}
          disabled={telechargement}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Download size={16} />
          {telechargement ? "Génération..." : "Télécharger mon dossier"}
        </button>
      </div>

      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      <div className="mb-6">
        <SearchBar
          placeholder="Rechercher par motif, médecin, diagnostic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
          <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">Aucune consultation trouvée</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} onClick={() => setSelected(c)} className="cursor-pointer">
                <PatientConsultationCard consultation={c} darkMode={darkMode} />
              </div>
            ))}
          </div>
          {selected && (
            <div className="w-full md:w-[380px]">
              <PatientConsultationDetails
                consultation={selected}
                onClose={() => setSelected(null)}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}