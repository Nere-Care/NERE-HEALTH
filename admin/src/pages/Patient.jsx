import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import API from "../services/api";

import PatientsStats from "../components/patients/PatientsStats";
import PatientsFilters from "../components/patients/PatientsFilters";
import PatientsTable from "../components/patients/PatientsTable";
import PatientsAnalytics from "../components/patients/PatientsAnalytics";
import PatientsActivity from "../components/patients/PatientsActivity";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import PatientEditModal from "../components/patients/PatientEditModal";
import PatientAddModal from "../components/patients/PatientAddModal";

function mapPatient(p, userMap) {
  const user = userMap[p.id] || {};
  const age = p.date_naissance
    ? Math.floor((new Date() - new Date(p.date_naissance)) / (365.25 * 86400000))
    : 0;
  return {
    id: p.id,
    code_patient: p.code_patient || "",
    nom: `${user.prenom || ""} ${user.nom || ""}`.trim() || `Patient #${p.numero_patient || p.id}`,
    sexe: p.sexe === "M" ? "Masculin" : p.sexe === "F" ? "Féminin" : p.sexe || "Non précisé",
    age,
    telephone: user.telephone || "—",
    groupe: p.groupe_sanguin || "Inconnu",
    assurance: p.couverture_assurance || "Aucune",
    medecin: "—",
    statut: user.role === "actif" ? "Actif" : "Actif",
    email: user.email || "",
    adresse: p.adresse || p.ville || "—",
    antecedents: p.antecedents_medicaux || "Aucun",
    derniereConnexion: "—",
  };
}

export default function PatientsPage({ darkMode }) {
  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  const [filters, setFilters] = useState({
    nom: "", telephone: "", sexe: "", groupe: "", statut: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [patientsRes, usersRes, consultationsRes] = await Promise.allSettled([
        API.get("/patients?limit=200"),
        API.get("/users"),
        API.get("/consultations?limit=20"),
      ]);

      const pList = patientsRes.status === "fulfilled" ? patientsRes.value.data : [];
      const uList = usersRes.status === "fulfilled" ? usersRes.value.data : [];

      setPatients(pList);
      setUsers(uList);

      const userMap = {};
      uList.forEach((u) => { userMap[u.id] = u; });

      const notifs = consultationsRes.status === "fulfilled"
        ? consultationsRes.value.data.slice(0, 4).map((c, i) => ({
            id: i + 1,
            action: "Nouvelle consultation",
            patient: userMap[c.patient_id]?.email || `#${c.patient_id}`,
            time: c.created_at
              ? timeAgo(new Date(c.created_at))
              : "Récemment",
          }))
        : [];

      if (notifs.length > 0) setActivities(notifs);
    } catch (e) {
      console.error("Erreur chargement patients:", e);
    } finally {
      setLoading(false);
    }
  }

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = u; });
    return map;
  }, [users]);

  const enrichedPatients = useMemo(
    () => patients.map((p) => mapPatient(p, userMap)),
    [patients, userMap]
  );

  const filteredPatients = useMemo(() => {
    return enrichedPatients.filter((patient) => {
      const q = filters.nom.toLowerCase();
      const matchNom = patient.nom.toLowerCase().includes(q) || patient.code_patient.toLowerCase().includes(q) || patient.email.toLowerCase().includes(q);
      const matchTelephone = patient.telephone.includes(filters.telephone);
      const matchSexe = !filters.sexe || patient.sexe === filters.sexe;
      const matchGroupe = !filters.groupe || patient.groupe === filters.groupe;
      const matchStatut = !filters.statut || patient.statut === filters.statut;
      return matchNom && matchTelephone && matchSexe && matchGroupe && matchStatut;
    });
  }, [enrichedPatients, filters]);

  const handleAddPatient = useCallback(async (newPatient) => {
    try {
      const payload = {
        numero_patient: `PAT-${Date.now()}`,
        sexe: newPatient.sexe === "Masculin" ? "M" : "F",
        ville: newPatient.adresse || "",
        adresse: newPatient.adresse || "",
        groupe_sanguin: newPatient.groupe || "Inconnu",
        antecedents_medicaux: newPatient.antecedents || "",
        couverture_assurance: newPatient.assurance || "",
      };
      await API.post("/patients", payload);
      toast.success("Patient ajouté avec succès");
      setShowAdd(false);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.detail || "Erreur lors de l'ajout";
      toast.error(msg);
    }
  }, []);

  const handleEditPatient = useCallback(async (updatedPatient) => {
    try {
      const payload = {
        sexe: updatedPatient.sexe === "Masculin" ? "M" : "F",
        adresse: updatedPatient.adresse || "",
        ville: updatedPatient.adresse || "",
        antecedents_medicaux: updatedPatient.antecedents || "",
        couverture_assurance: updatedPatient.assurance || "",
      };
      await API.put(`/patients/${updatedPatient.id}`, payload);
      toast.success("Patient mis à jour");
      setShowEdit(false);
      setSelectedPatient(null);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.detail || "Erreur lors de la modification";
      toast.error(msg);
    }
  }, []);

  const handleDeletePatient = useCallback(async (patientId) => {
    try {
      await API.delete(`/patients/${patientId}`);
      toast.success("Patient supprimé");
      setShowDeleteConfirm(false);
      setPatientToDelete(null);
      fetchData();
    } catch (e) {
      const msg = e.response?.data?.detail || "Erreur lors de la suppression";
      toast.error(msg);
    }
  }, []);

  const confirmDelete = useCallback((patient) => {
    setPatientToDelete(patient);
    setShowDeleteConfirm(true);
  }, []);

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#0f172a]" : "bg-gray-100"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${darkMode ? "bg-[#0f172a] text-white" : "bg-gray-100 text-gray-900"}`}>
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

      <PatientsStats darkMode={darkMode} patients={filteredPatients} />
      <PatientsFilters darkMode={darkMode} filters={filters} setFilters={setFilters} />
      <PatientsTable
        patients={filteredPatients}
        darkMode={darkMode}
        onView={openDetails}
        onEdit={openEdit}
        onDelete={confirmDelete}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PatientsAnalytics darkMode={darkMode} patients={filteredPatients} />
        </div>
        <PatientsActivity darkMode={darkMode} activities={activities} />
      </div>

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
              className={`px-5 py-2.5 rounded-xl border font-medium transition ${darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
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

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} jours`;
}
