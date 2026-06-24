import { useState, useEffect } from "react";
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
import { fetchPrescriptionDetail } from "../../services/ordonanceService";

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

export default function PrescriptionDetail({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchPrescriptionDetail(id);
        setPrescription(data);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (erreur || !prescription) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
        <p className="text-red-500">{erreur || "Prescription introuvable"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 font-semibold">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-500"}`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* Carte principale */}
      <div className={`rounded-3xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
            ${prescription.urgence ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-blue-500"}`}>
            <Pill size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{prescription.nom}</h1>
            <p className="text-gray-400 mt-1">
              Dosage : {prescription.dosage}
              {prescription.forme && ` • ${prescription.forme}`}
            </p>
            {prescription.numero_ordonnance && (
              <p className="text-xs text-gray-500 mt-1">
                Ordonnance n° {prescription.numero_ordonnance}
              </p>
            )}
          </div>
        </div>

        {/* Infos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Posologie */}
          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-blue-500" />
              <h2 className="font-bold">Posologie</h2>
            </div>
            <p className="text-sm leading-relaxed">{prescription.frequence}</p>
            {prescription.instructions && (
              <p className="text-sm mt-3 text-gray-400">{prescription.instructions}</p>
            )}
            {prescription.duree_jours && (
              <p className="text-xs mt-2 text-gray-500">
                Durée : {prescription.duree_jours} jour{prescription.duree_jours > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Médecin */}
          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-green-500" />
              <h2 className="font-bold">Prescrit par</h2>
            </div>
            <p className="text-sm font-semibold">{prescription.medecin}</p>
            {prescription.date_emission && (
              <p className="text-xs text-gray-400 mt-2">
                Le {formatDate(prescription.date_emission)}
              </p>
            )}
          </div>

          {/* Renouvellement */}
          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={18} className="text-purple-500" />
              <h2 className="font-bold">Renouvellements restants</h2>
            </div>
            <p className="text-2xl font-bold">{prescription.renouvellements}</p>
          </div>

          {/* Date */}
          <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-orange-500" />
              <h2 className="font-bold">Date d'expiration</h2>
            </div>
            <p className="text-sm font-semibold">{formatDate(prescription.date_expiration)}</p>
          </div>
        </div>

        {/* Alerte urgence */}
        {prescription.urgence && (
          <div className="mt-5 bg-orange-100 text-orange-600 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <p className="text-sm font-medium">
              Cette prescription expire bientôt. Contactez votre médecin pour un renouvellement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}