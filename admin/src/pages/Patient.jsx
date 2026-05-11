import { useState } from "react";

import PatientsStats from "../components/patients/PatientsStats";
import PatientsFilters from "../components/patients/PatientsFilters";
import PatientsTable from "../components/patients/PatientsTable";
import PatientsAnalytics from "../components/patients/PatientsAnalytics";
import PatientsActivity from "../components/patients/PatientsActivity";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import PatientEditModal from "../components/patients/PatientEditModal";
import PatientAddModal from "../components/patients/PatientAddModal";

export default function PatientsPage({ darkMode }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const patients = [
    {
      id: 1,
      nom: "Jean Mbappe",
      sexe: "Masculin",
      age: 34,
      telephone: "+237 690000000",
      groupe: "O+",
      assurance: "CNPS",
      medecin: "Dr Ngono",
      statut: "Actif",
      email: "jean@gmail.com",
      adresse: "Douala",
      allergies: "Aucune",
      antecedents: "Diabète",
      derniereConnexion: "Aujourd'hui",
    },
  ];

  const openDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetails(true);
  };

  const openEdit = (patient) => {
    setSelectedPatient(patient);
    setShowEdit(true);
  };

  return (
    <div
      className={`min-h-screen p-6 space-y-6 ${
        darkMode ? "bg-[#0f172a] text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Patients</h1>
          <p className="text-sm text-gray-400 mt-1">
            Supervision et administration des comptes patients
          </p>
        </div>
         <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
        >
          Ajouter un patient
        </button>
      </div>

      <PatientsStats darkMode={darkMode} />

      <PatientsFilters darkMode={darkMode} />

      <PatientsTable
        patients={patients}
        darkMode={darkMode}
        onView={openDetails}
        onEdit={openEdit}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PatientsAnalytics darkMode={darkMode} />
        </div>

         <PatientsActivity darkMode={darkMode} />
      </div>

      {showDetails && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setShowDetails(false)}
          darkMode={darkMode}
        />
      )}

      {showEdit && (
        <PatientEditModal
          patient={selectedPatient}
          onClose={() => setShowEdit(false)}
          darkMode={darkMode}
        />
      )}

      {showAdd && (
        <PatientAddModal
          onClose={() => setShowAdd(false)}
          darkMode={darkMode}
        />
          )}
    </div>
  );
}

