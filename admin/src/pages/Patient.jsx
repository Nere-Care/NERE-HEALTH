import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import PatientsStats    from "../../components/patients/PatientsStats";
import PatientsAnalytics from "../../components/patients/PatientsAnalytics";
import PatientsFilters  from "../../components/patients/PatientsFilters";
import PatientsActivity from "../../components/patients/PatientsActivity";
import PatientsTable    from "../../components/patients/PatientsTable";
import {
  fetchAdminPatients,
  fetchAdminPatientsStats,
  fetchAdminPatientsActivite,
} from "../../services/PatientService";

export default function Patients({ darkMode }) {
  const [patients,   setPatients]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [activite,   setActivite]   = useState(null);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [erreur,     setErreur]     = useState(null);
  const [filters, setFilters] = useState({
    nom: "", telephone: "", sexe: "", groupe: "", statut: "",
  });

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [patientsData, statsData, activiteData] = await Promise.all([
        fetchAdminPatients(filters),
        fetchAdminPatientsStats(),
        fetchAdminPatientsActivite(),
      ]);
      setPatients(patientsData?.patients ?? []);
      setTotal(patientsData?.total ?? 0);
      setStats(statsData);
      setActivite(activiteData ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const delay = setTimeout(charger, 300);
    return () => clearTimeout(delay);
  }, [charger]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 space-y-6 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50"}`}>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Gestion des patients</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {total} patient{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      <PatientsStats darkMode={darkMode} stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PatientsAnalytics darkMode={darkMode} stats={stats} />
        </div>
        <PatientsActivity darkMode={darkMode} activities={activite} />
      </div>

      <PatientsFilters darkMode={darkMode} filters={filters} setFilters={setFilters} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <PatientsTable
          darkMode={darkMode}
          patients={patients}
          onRefresh={charger}
        />
      )}
    </div>
  );
}