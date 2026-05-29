import {
  ArrowLeft,
  Pill,
  Calendar,
  RefreshCw,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

// 🔹 Données simulées
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
];

export default function PrescriptionDetail({ darkMode }) {
  const navigate = useNavigate();

  const { id } = useParams();

  const prescription = prescriptions.find(
    (p) => p.id === parseInt(id)
  );

  if (!prescription) {
    return (
      <div className="p-6">
        Prescription introuvable
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-50 text-gray-800"
      }`}
    >
      {/* 🔹 Retour */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium
          ${
            darkMode
              ? "text-gray-300 hover:text-white"
              : "text-gray-600 hover:text-blue-500"
          }`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* 🔹 Carte principale */}
      <div
        className={`rounded-3xl shadow-lg p-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center
              ${
                prescription.urgence
                  ? "bg-orange-100 text-orange-500"
                  : "bg-blue-100 text-blue-500"
              }`}
          >
            <Pill size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {prescription.nom}
            </h1>

            <p className="text-gray-400 mt-1">
              Dosage : {prescription.dosage}
            </p>
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Posologie */}
          <div
            className={`rounded-2xl p-5 ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-blue-500" />
              <h2 className="font-bold">
                Posologie
              </h2>
            </div>

            <p className="text-sm leading-relaxed">
              {prescription.frequence}
            </p>

            <p className="text-sm mt-3 text-gray-400">
              {prescription.instructions}
            </p>
          </div>

          {/* Médecin */}
          <div
            className={`rounded-2xl p-5 ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-green-500" />

              <h2 className="font-bold">
                Prescrit par
              </h2>
            </div>

            <p className="text-sm font-semibold">
              {prescription.medecin}
            </p>
          </div>

          {/* Renouvellement */}
          <div
            className={`rounded-2xl p-5 ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} className="text-purple-500" />

              <h2 className="font-bold">
                Renouvellements
              </h2>
            </div>

            <p className="text-2xl font-bold">
              {prescription.renouvellements}
            </p>
          </div>

          {/* Date */}
          <div
            className={`rounded-2xl p-5 ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-orange-500" />

              <h2 className="font-bold">
                Prochain renouvellement
              </h2>
            </div>

            <p className="text-sm font-semibold">
              {prescription.prochainRenouvellement}
            </p>
          </div>
        </div>

        {/* Alerte */}
        {prescription.urgence && (
          <div className="mt-5 bg-orange-100 text-orange-600 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} />

            <p className="text-sm font-medium">
              Cette prescription nécessite un renouvellement prochainement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}