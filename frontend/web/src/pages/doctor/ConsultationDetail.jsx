import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "../../services/apiClient";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Stethoscope,
  Activity,
  Pill,
  AlertCircle,
  Loader,
  ClipboardList,
} from "lucide-react";

const STATUT_LABELS = {
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

const STATUT_COLORS = {
  en_cours: "bg-blue-100 text-blue-700",
  terminee: "bg-green-100 text-green-700",
  annulee: "bg-red-100 text-red-700",
};

function FieldSection({ icon: Icon, title, children, darkMode }) {
  if (!children) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-blue-500" />
        <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {title}
        </p>
      </div>
      <p className={`text-sm leading-relaxed pl-6 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {children}
      </p>
    </div>
  );
}

export default function ConsultationDetail({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const data = await get(`/api/consultations/${id}`);
        setConsultation(data);
      } catch (err) {
        setError(err.message || "Impossible de charger la consultation");
      } finally {
        setLoading(false);
      }
    };
    fetchConsultation();
  }, [id]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <Loader className="animate-spin mr-2" size={20} />
        <span>Chargement de la consultation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 gap-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-500 hover:underline"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!consultation) return null;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null;

  const formatDateTime = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const medecinName =
    consultation.medecin?.prenom && consultation.medecin?.nom
      ? `Dr. ${consultation.medecin.prenom} ${consultation.medecin.nom}`
      : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Consultation {consultation.numero_consultation || ""}
          </h1>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {formatDateTime(consultation.date_heure_debut)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            STATUT_COLORS[consultation.statut] || STATUT_COLORS.en_cours
          }`}
        >
          {STATUT_LABELS[consultation.statut] || consultation.statut}
        </span>
      </div>

      <div
        className={`rounded-2xl border p-5 space-y-5 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médecin</p>
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{medecinName}</p>
          </div>
          <div className="space-y-1">
            <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif</p>
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{consultation.motif}</p>
          </div>
          {consultation.date_heure_debut && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date de début</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <Calendar size={12} className="inline mr-1" />
                {formatDateTime(consultation.date_heure_debut)}
              </p>
            </div>
          )}
          {consultation.date_heure_fin && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date de fin</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <Clock size={12} className="inline mr-1" />
                {formatDateTime(consultation.date_heure_fin)}
              </p>
            </div>
          )}
          {consultation.duree_minutes && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Durée</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{consultation.duree_minutes} min</p>
            </div>
          )}
          {consultation.code_cim10 && (
            <div className="space-y-1">
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Code CIM-10</p>
              <p className={`text-sm font-mono ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{consultation.code_cim10}</p>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 space-y-5 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <FieldSection icon={ClipboardList} title="Anamnèse" darkMode={darkMode}>
          {consultation.anamnese}
        </FieldSection>
        <FieldSection icon={Stethoscope} title="Examen clinique" darkMode={darkMode}>
          {consultation.examen_clinique}
        </FieldSection>
        <FieldSection icon={Activity} title="Diagnostic principal" darkMode={darkMode}>
          {consultation.diagnostic_principal}
        </FieldSection>
        {consultation.diagnostics_secondaires?.length > 0 && (
          <FieldSection icon={AlertCircle} title="Diagnostics secondaires" darkMode={darkMode}>
            {consultation.diagnostics_secondaires.join(", ")}
          </FieldSection>
        )}
        <FieldSection icon={FileText} title="Plan de traitement" darkMode={darkMode}>
          {consultation.plan_traitement}
        </FieldSection>
        <FieldSection icon={Pill} title="Prescription" darkMode={darkMode}>
          {consultation.prescription_nom && `${consultation.prescription_nom}`}
          {consultation.prescription_posologie && ` — ${consultation.prescription_posologie}`}
        </FieldSection>
        <FieldSection icon={FileText} title="Demandes de labo" darkMode={darkMode}>
          {consultation.demandes_labo}
        </FieldSection>
        <FieldSection icon={FileText} title="Observations" darkMode={darkMode}>
          {consultation.observations}
        </FieldSection>
        <FieldSection icon={FileText} title="Instructions patient" darkMode={darkMode}>
          {consultation.instructions_patient}
        </FieldSection>
        {consultation.resume_ia && (
          <div className={`p-3 rounded-xl ${darkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}>
            <p className={`text-xs font-bold uppercase mb-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Résumé IA</p>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{consultation.resume_ia}</p>
          </div>
        )}
        {consultation.suivi_necessaire && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${darkMode ? "bg-orange-900/20 border border-orange-800" : "bg-orange-50 border border-orange-200"}`}>
            <AlertCircle size={14} className="text-orange-500" />
            <span className={`text-sm font-medium ${darkMode ? "text-orange-300" : "text-orange-700"}`}>
              Suivi nécessaire
              {consultation.date_prochain_rdv && ` — Prochain RDV : ${formatDate(consultation.date_prochain_rdv)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
