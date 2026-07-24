import { useState } from "react";
import { ClipboardList, ExternalLink, X, Loader } from "lucide-react";
import { get } from "../../../services/apiClient";

const STATUT_COLORS = {
  en_attente: "bg-yellow-100 text-yellow-700",
  acceptee: "bg-green-100 text-green-700",
  refusee: "bg-red-100 text-red-700",
  annulee: "bg-gray-100 text-gray-500",
};

const STATUT_LABELS = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
};

function parseMessage(msg) {
  if (!msg) return {};
  const result = {};
  const lines = msg.split("\n\n").filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^Urgence:\s*(.+)$/);
    if (m) { result.urgence = m[1].trim(); continue; }
    const c = line.match(/^Contexte:\s*(.+)$/);
    if (c) { result.contexte = c[1].trim(); continue; }
    const q = line.match(/^Question:\s*(.+)$/);
    if (q) { result.question = q[1].trim(); continue; }
    const e = line.match(/^Examens:\s*(.+)$/);
    if (e) { result.examens = e[1].trim(); continue; }
  }
  return result;
}

function AvisDetailModal({ darkMode, avis, onClose }) {
  if (!avis) return null;
  const parsed = parseMessage(avis.message);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-blue-500" />
            <h2 className="font-bold text-lg">Demande d'avis médical</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Patient" value={`${avis.patient_prenom || ""} ${avis.patient_nom || ""}`.trim() || "—"} darkMode={darkMode} />
            <Info label="Spécialité" value={avis.specialite_libelle || "—"} darkMode={darkMode} />
            <Info label="Demandeur" value={avis.demandeur_prenom && avis.demandeur_nom ? `Dr. ${avis.demandeur_prenom} ${avis.demandeur_nom}` : "—"} darkMode={darkMode} />
            <Info label="Destinataire" value={avis.cible_prenom && avis.cible_nom ? `Dr. ${avis.cible_prenom} ${avis.cible_nom}` : "—"} darkMode={darkMode} />
            <Info label="Motif" value={avis.motif || "—"} darkMode={darkMode} />
            <div>
              <p className={`text-xs font-medium mb-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[avis.statut] || STATUT_COLORS.en_attente}`}>
                {STATUT_LABELS[avis.statut] || avis.statut}
              </span>
            </div>
          </div>

          {parsed.contexte && (
            <Section title="Contexte clinique" darkMode={darkMode}>
              {parsed.contexte}
            </Section>
          )}

          {parsed.question && (
            <Section title="Question posée" darkMode={darkMode} highlight>
              {parsed.question}
            </Section>
          )}

          {parsed.examens && (
            <Section title="Examens réalisés" darkMode={darkMode}>
              {parsed.examens}
            </Section>
          )}

          {avis.reponse && (
            <div className={`p-3 rounded-xl ${darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
              <p className={`text-xs font-bold uppercase mb-1 ${darkMode ? "text-green-400" : "text-green-600"}`}>Réponse du confrère</p>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{avis.reponse}</p>
            </div>
          )}

          {(avis.dossier_numero || avis.consultation_numero) && (
            <div className={`p-3 rounded-xl border space-y-2 ${darkMode ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <p className={`text-xs font-bold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Documents associés</p>
              {avis.dossier_numero && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Dossier médical :</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs">
                    {avis.dossier_numero}
                  </span>
                </div>
              )}
              {avis.consultation_numero && (
                <div className="flex items-center gap-2 text-sm">
                  <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Consultation :</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-xs">
                    {avis.consultation_numero}
                  </span>
                  {avis.consultation_motif && (
                    <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>({avis.consultation_motif})</span>
                  )}
                </div>
              )}
            </div>
          )}

          <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {new Date(avis.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, darkMode }) {
  return (
    <div>
      <p className={`text-xs font-medium mb-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children, darkMode, highlight }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
      <p className={`text-sm leading-relaxed break-words ${highlight ? "font-semibold" : ""} ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{children}</p>
    </div>
  );
}

export default function MedicalOpinionCard({ conversation, darkMode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [avisDetail, setAvisDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!conversation?.demande_avis_id) return null;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const handleClick = async () => {
    if (avisDetail) {
      setModalOpen(true);
      return;
    }
    setLoading(true);
    setModalOpen(true);
    try {
      const data = await get(`/api/demandes-avis/${conversation.demande_avis_id}`);
      setAvisDetail(data);
    } catch {
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`flex-shrink-0 mx-4 mt-3 p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
          darkMode
            ? "bg-gray-850 border-gray-700 hover:border-blue-600"
            : "bg-blue-50 border-blue-100 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} className="text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Avis médical
          </p>
          <ExternalLink size={12} className="ml-auto text-gray-400" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {conversation.demande_patient_nom && (
            <>
              <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Patient
              </p>
              <p className={darkMode ? "text-white" : "text-gray-800"}>
                {conversation.demande_patient_nom}
              </p>
            </>
          )}

          {conversation.other_medecin_nom && (
            <>
              <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Médecin
              </p>
              <p className={darkMode ? "text-white" : "text-gray-800"}>
                Dr. {conversation.other_medecin_nom}
              </p>
            </>
          )}

          {conversation.demande_motif && (
            <>
              <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Motif
              </p>
              <p className={darkMode ? "text-white" : "text-gray-800"}>
                {conversation.demande_motif}
              </p>
            </>
          )}

          {conversation.demande_specialite && (
            <>
              <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Spécialité
              </p>
              <p className={darkMode ? "text-white" : "text-gray-800"}>
                {conversation.demande_specialite}
              </p>
            </>
          )}

          <>
            <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Date
            </p>
            <p className={darkMode ? "text-white" : "text-gray-800"}>
              {formatDate(conversation.created_at)}
            </p>
          </>

          {conversation.demande_statut && (
            <>
              <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Statut
              </p>
              <span
                className={`inline-block w-fit px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUT_COLORS[conversation.demande_statut] || STATUT_COLORS.en_attente
                }`}
              >
                {STATUT_LABELS[conversation.demande_statut] || conversation.demande_statut}
              </span>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        loading && !avisDetail ? (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={() => setModalOpen(false)}>
            <div className={`p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
              <Loader className="animate-spin text-blue-500 mx-auto" size={24} />
              <p className={`text-sm mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Chargement...</p>
            </div>
          </div>
        ) : (
          <AvisDetailModal darkMode={darkMode} avis={avisDetail} onClose={() => setModalOpen(false)} />
        )
      )}
    </>
  );
}
