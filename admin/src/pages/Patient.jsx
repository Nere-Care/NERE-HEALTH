import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast"; // npm install react-hot-toast

import PatientsStats from "../components/patients/PatientsStats";
import PatientsFilters from "../components/patients/PatientsFilters";
import PatientsTable from "../components/patients/PatientsTable";
import PatientsAnalytics from "../components/patients/PatientsAnalytics";
import PatientsActivity from "../components/patients/PatientsActivity";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import PatientEditModal from "../components/patients/PatientEditModal";
import PatientAddModal from "../components/patients/PatientAddModal";

export default function PatientsPage({ darkMode }) {
  const [patients, setPatients] = useState([
    {
      id: 2,
      nom: "Sarah Ndzi",
      sexe: "Féminin",
      age: 28,
      telephone: "+237 677111111",
      groupe: "A+",
      assurance: "Activa",
      medecin: "Dr Njoya",
      statut: "Actif",
      email: "sarah@gmail.com",
      adresse: "Yaoundé",
      allergies: "Pénicilline",
      antecedents: "Asthme",
      derniereConnexion: "Hier",
    },
    {
      id: 3,
      nom: "Paul Tchoumi",
      sexe: "Masculin",
      age: 45,
      telephone: "+237 699222222",
      groupe: "B+",
      assurance: "SUNU",
      medecin: "Dr Ndzi",
      statut: "Inactif",
      email: "paul@gmail.com",
      adresse: "Bafoussam",
      allergies: "Aucune",
      antecedents: "Hypertension",
      derniereConnexion: "Il y a 2 jours",
    },
    {
      id: 4,
      nom: "Brigitte Essomba",
      sexe: "Féminin",
      age: 39,
      telephone: "+237 655333333",
      groupe: "AB+",
      assurance: "CNPS",
      medecin: "Dr Mbarga",
      statut: "Actif",
      email: "brigitte@gmail.com",
      adresse: "Douala",
      allergies: "Arachides",
      antecedents: "Migraine",
      derniereConnexion: "Aujourd'hui",
    },
    {
      id: 5,
      nom: "Armand Ekani",
      sexe: "Masculin",
      age: 31,
      telephone: "+237 688444444",
      groupe: "O-",
      assurance: "Chanas",
      medecin: "Dr Nkono",
      statut: "Actif",
      email: "armand@gmail.com",
      adresse: "Kribi",
      allergies: "Aucune",
      antecedents: "Aucun",
      derniereConnexion: "Maintenant",
    },
  ]);

  const [activities] = useState([
    { id: 1, action: "Nouvelle consultation", patient: "Sarah Ndzi", time: "Il y a 5 min" },
    { id: 2, action: "Mise à dossier", patient: "Paul Tchoumi", time: "Il y a 1h" },
    { id: 3, action: "Ajout patient", patient: "Brigitte Essomba", time: "Il y a 3h" },
    { id: 4, action: "Résultat labo", patient: "Armand Ekani", time: "Il y a 5h" },
  ]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  // ================= FILTERS =================
  const [filters, setFilters] = useState({
    nom: "",
    telephone: "",
    sexe: "",
    groupe: "",
    statut: "",
  });

  // ================= FILTER LOGIC (Memoized) =================
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchNom = patient.nom.toLowerCase().includes(filters.nom.toLowerCase());
      const matchTelephone = patient.telephone.includes(filters.telephone);
      const matchSexe = !filters.sexe || patient.sexe === filters.sexe;
      const matchGroupe = !filters.groupe || patient.groupe === filters.groupe;
      const matchStatut = !filters.statut || patient.statut === filters.statut;
      return matchNom && matchTelephone && matchSexe && matchGroupe && matchStatut;
    });
  }, [patients, filters]);

  // ================= CRUD OPERATIONS =================
  const handleAddPatient = useCallback((newPatient) => {
    const patientWithId = {
      ...newPatient,
      id: Date.now(),
      derniereConnexion: "À l'instant",
    };
    setPatients((prev) => [patientWithId, ...prev]);
    toast.success("✅ Patient ajouté avec succès");
    setShowAdd(false);
  }, []);

  const handleEditPatient = useCallback((updatedPatient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p))
    );
    toast.success("✅ Patient mis à jour");
    setShowEdit(false);
    setSelectedPatient(null);
  }, []);

  const handleDeletePatient = useCallback((patientId) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    toast.success("🗑️ Patient supprimé");
    setShowDeleteConfirm(false);
    setPatientToDelete(null);
  }, []);

  const confirmDelete = useCallback((patient) => {
    setPatientToDelete(patient);
    setShowDeleteConfirm(true);
  }, []);

  // ================= MODAL HANDLERS =================
  const openDetails = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowDetails(true);
  }, []);

  const openEdit = useCallback((patient) => {
    setSelectedPatient(patient);
    setShowEdit(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowDetails(false);
    setShowEdit(false);
    setShowAdd(false);
    setShowDeleteConfirm(false);
    setSelectedPatient(null);
    setPatientToDelete(null);
  }, []);

  return (
    <div className={`min-h-screen p-6 space-y-6 ${darkMode ? "bg-[#0f172a] text-white" : "bg-gray-100 text-gray-900"}`}>
      
      {/* HEADER */}
      <div className="flex flex-col mt-6 sm:mt-0 sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Patients</h1>
          <p className="text-sm text-gray-400 mt-1">Supervision et administration des comptes patients</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          + Ajouter un patient
        </button>
      </div>

      {/* STATS */}
      <PatientsStats darkMode={darkMode} patients={patients} />

      {/* FILTERS */}
      <PatientsFilters darkMode={darkMode} filters={filters} setFilters={setFilters} />

      {/* TABLE */}
      <PatientsTable
        patients={filteredPatients}
        darkMode={darkMode}
        onView={openDetails}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      {/* ANALYTICS & ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PatientsAnalytics darkMode={darkMode} patients={patients} />
        </div>
        <PatientsActivity darkMode={darkMode} activities={activities} />
      </div>

      {/* MODALS */}
      {showDetails && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={closeModal}
          onEdit={() => { closeModal(); openEdit(selectedPatient); }}
          darkMode={darkMode}
        />
      )}

      {showEdit && selectedPatient && (
        <PatientEditModal
          isOpen={showEdit}
          patient={selectedPatient}
          onClose={closeModal}
          onSave={handleEditPatient}
          darkMode={darkMode}
        />
      )}

      {showAdd && (
        <PatientAddModal
          isOpen={showAdd}
          onClose={closeModal}
          onAdd={handleAddPatient}
          darkMode={darkMode}
        />
      )}

      {showDeleteConfirm && patientToDelete && (
        <DeleteConfirmModal
          patient={patientToDelete}
          onConfirm={() => handleDeletePatient(patientToDelete.id)}
          onCancel={closeModal}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// ================= DELETE CONFIRMATION MODAL =================
function DeleteConfirmModal({ patient, onConfirm, onCancel, darkMode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Confirmer la suppression</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Voulez-vous vraiment supprimer le patient <strong>{patient.nom}</strong> ?<br/>
            Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className={`px-5 py-2.5 rounded-xl border font-medium transition ${
                darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}