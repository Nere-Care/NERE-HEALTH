import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

// Components
import PatientsStats from "../components/patients/PatientsStats";
import PatientsAnalytics from "../components/patients/PatientsAnalytics";
import PatientsFilters from "../components/patients/PatientsFilters";
import PatientsActivity from "../components/patients/PatientsActivity";
import PatientsTable from "../components/patients/PatientsTable";

// Modals (Vérifie que les chemins d'import correspondent à ton arborescence)
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import PatientEditModal from "../components/patients/PatientEditModal";
import PatientAddModal from "../components/patients/PatientAddModal";

// Services
// Services
import {
  fetchAdminPatients,
  fetchAdminPatientsStats,
  fetchAdminPatientsActivite,
  fetchAdminPatient, // ✅ AJOUTE CETTE LIGNE ICI
  updateAdminPatient,
  deleteAdminPatient,
} from "../services/PatientService";

export default function Patients({ darkMode }) {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [activite, setActivite] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  
  const [filters, setFilters] = useState({
    nom: "", telephone: "", sexe: "", groupe: "", statut: "",
  });

  // ✅ États pour gérer les modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [patientsData, statsData, activiteData] = await Promise.all([
        fetchAdminPatients(filters),
        fetchAdminPatientsStats(),
        fetchAdminPatientsActivite(),
      ]);

      const rawPatients = patientsData?.patients ?? [];
      const mappedPatients = rawPatients.map(p => ({
        id: p.id,
        nom: `${p.prenom} ${p.nom}`.trim(),
        sexe: p.sexe,
        age: p.age,
        telephone: p.telephone,
        medecin: "Non assigné",
        groupe: p.groupe_sanguin,
        assurance: p.couverture,
        statut: p.statut === "actif" ? "Actif" : p.statut === "inactif" ? "Inactif" : p.statut === "suspendu" ? "Suspendu" : "En attente",
        email: p.email,
        adresse: p.ville,
        allergies: Array.isArray(p.allergies_list) ? p.allergies_list.join(", ") : p.allergies,
        antecedents: p.antecedents,
      }));

      setPatients(mappedPatients);
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

  // ✅ Handlers pour les actions du tableau
   const handleView = useCallback(async (patientFromList) => {
    try {
      // 1. On ouvre le modal avec les données de base (pour un affichage immédiat)
      setSelectedPatient(patientFromList);
      setIsViewOpen(true);

      // 2. On récupère les détails complets depuis le backend en arrière-plan
      const details = await fetchAdminPatient(patientFromList.id);
      
      if (details) {
        // 3. On met à jour le patient sélectionné avec les nouvelles données (médecin et dernière connexion)
        setSelectedPatient(prev => ({
          ...prev,
          ...details,
          // On s'assure que le frontend utilise bien les bons noms de clés
          medecin: details.medecin_traitant || prev.medecin || "Non assigné",
          derniereConnexion: details.derniereConnexion || "Jamais",
        }));
      }
    } catch (err) {
      toast.error("❌ Erreur lors du chargement des détails du patient");
      console.error(err);
    }
  }, []);

 const handleEdit = async (patientFromList) => {
  try {
    const details = await fetchAdminPatient(patientFromList.id);

    setSelectedPatient({
      ...patientFromList,

      nom: `${details.prenom} ${details.nom}`.trim(),
      email: details.email,
      telephone: details.telephone,
      adresse: details.ville,
      groupe: details.groupe_sanguin,
      assurance: details.couverture_assurance,
      allergies: Array.isArray(details.allergies)
        ? details.allergies.join(", ")
        : details.allergies || "",
      antecedents: details.antecedents_medicaux || "",
      statut: details.statut,
      sexe: details.sexe,
    });

    setIsEditOpen(true);
  } catch (err) {
    toast.error("Erreur lors du chargement du patient");
    console.error(err);
  }
};

  const handleDelete = async (patient) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver le patient ${patient.nom} ?`)) {
      try {
        await deleteAdminPatient(patient.id);
        toast.success("✅ Patient désactivé avec succès");
        charger(); // Recharger la liste
      } catch (err) {
        toast.error("❌ Erreur lors de la suppression");
      }
    }
  };

const handleSaveEdit = async (updatedData) => {
  try {
    console.log("Payload envoyé :", updatedData);

    await updateAdminPatient(updatedData.id, updatedData);

    toast.success("✅ Patient mis à jour avec succès");

    setIsEditOpen(false);
    setSelectedPatient(null);

    charger();
  } catch (err) {
    toast.error(err.message || "❌ Erreur lors de la mise à jour");
    console.error(err);
  }
};

  const handleAdd = async (newPatientData) => {
    // Ici, tu pourras appeler ton futur service createAdminPatient(newPatientData)
    // Pour l'instant, on simule un succès pour que l'UX soit fluide
    toast.success("✅ Patient ajouté avec succès (Simulation)");
    setIsAddOpen(false);
    charger();
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 space-y-6 ${darkMode ? "bg-slate-950 text-white" : "bg-gray-50"}`}>

      {/* HEADER avec bouton Ajouter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Gestion des patients</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {total} patient{total > 1 ? "s" : ""} enregistré{total > 1 ? "s" : ""}
          </p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={18} />
          Ajouter un patient
        </button>
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
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ✅ MODALS */}
      {isViewOpen && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => { setIsViewOpen(false); setSelectedPatient(null); }}
          onEdit={() => { setIsViewOpen(false); setIsEditOpen(true); }}
          darkMode={darkMode}
        />
      )}

      {isEditOpen && selectedPatient && (
        <PatientEditModal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedPatient(null); }}
          patient={selectedPatient}
          onSave={handleSaveEdit}
          darkMode={darkMode}
        />
      )}

      {isAddOpen && (
        <PatientAddModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onAdd={handleAdd}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}