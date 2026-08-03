import { useState, useEffect, useCallback } from "react";
import { Stethoscope, AlertCircle, Download } from "lucide-react";
import PatientConsultationCard from "../../components/doctors/patient/PatientConsultationCard";
import PatientConsultationDetails from "../../components/doctors/patient/PatientConsultationDetails";
import SearchBar from "../../components/common/SearchBar";
import { fetchMesConsultationsPatient, telechargerMonDossier } from "../../services/patientService";

export default function MesConsultations({ darkMode }) {
  const [consultations, setConsultations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [telechargement, setTelechargement] = useState(false);

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

  useEffect(() => { charger(); }, [charger]);

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