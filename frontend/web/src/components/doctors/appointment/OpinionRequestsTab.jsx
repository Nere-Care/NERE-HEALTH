import { useState } from "react";
import {
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ScheduleOpinionMeeting from "./ScheduleOpinionMeeting";

export default function OpinionRequestsTab({ darkMode, requests, onUpdateRequest }) {
  const [expandedId, setExpandedId] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [declineFor, setDeclineFor] = useState(null);
  const [declineReason, setDeclineReason] = useState("");

  // ✅ DEBUG
  console.log("🔍 Demandes reçues:", requests);

  const urgencyColors = {
    non_urgent: { bg: "bg-gray-100 text-gray-700", dark: "bg-gray-700 text-gray-300" },
    normal: { bg: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    urgent: { bg: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    tres_urgent: { bg: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
  };

  const urgencyLabels = {
    non_urgent: "Non urgent",
    normal: "Sous 48h",
    urgent: "Urgent",
    tres_urgent: "Très urgent",
  };

  // ✅ Fonction plus robuste : considère "en attente" si le statut n'est PAS "acceptee" ou "refusee"
  const isPending = (statut) => {
    if (!statut) return true;
    const s = statut.toLowerCase();
    return s !== "acceptee" && s !== "refusee";
  };

  const handleAccept = (request) => setScheduleFor(request);

  const handleDecline = (request) => {
    setDeclineFor(request);
    setDeclineReason("");
  };

  const confirmDecline = () => {
    if (declineFor) {
      onUpdateRequest(declineFor.id, "refusee", {
        reason: declineReason,
        notes: declineReason,
      });
      setDeclineFor(null);
      setDeclineReason("");
    }
  };

  const handleSchedule = (request, meetingData) => {
    onUpdateRequest(request.id, "acceptee", meetingData);
    setScheduleFor(null);
  };

  if (!requests || requests.length === 0) {
    return (
      <div className={`w-full text-center py-12 sm:py-16 px-4 rounded-2xl border-2 border-dashed ${
        darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
      }`}>
        <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-sm sm:text-base">Aucune demande d'avis reçue</p>
        <p className="text-xs sm:text-sm mt-1">Les demandes de vos confrères apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {requests.map((request) => {
        const isExpanded = expandedId === request.id;
        const urgency = urgencyColors[request.urgence] || urgencyColors.normal;
        const pending = isPending(request.statut);

        // ✅ DEBUG par demande
        console.log(`📋 Demande ${request.id}: statut="${request.statut}", pending=${pending}`);

        return (
          <div
            key={request.id}
            className={`w-full min-w-0 rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            {/* Header */}
            <div
              className="p-3 sm:p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : request.id)}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3 w-full">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {request.requesterName?.charAt(0) || "D"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm sm:text-base break-words ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}>
                        Dr. {request.requesterName}
                      </h3>
                    </div>

                    <p className={`text-xs sm:text-sm mt-1 font-medium break-words ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {request.motif}
                    </p>

                    <div className="flex items-center gap-1.5 sm:gap-3 mt-2 text-[10px] sm:text-xs flex-wrap">
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full font-semibold ${
                        darkMode ? urgency.dark : urgency.bg
                      }`}>
                        {urgencyLabels[request.urgence]}
                      </span>

                      <span className={`flex items-center gap-1 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        <Clock size={12} />
                        {new Date(request.date).toLocaleDateString("fr-FR")}
                      </span>

                      {pending && (
                        <span className="flex items-center gap-1 text-orange-500 font-semibold">
                          <AlertCircle size={12} />
                          <span className="hidden sm:inline">En attente</span>
                        </span>
                      )}

                      {request.statut === "acceptee" && (
                        <span className="flex items-center gap-1 text-green-500 font-semibold">
                          <CheckCircle size={12} />
                          <span className="hidden sm:inline">Acceptée</span>
                        </span>
                      )}

                      {request.statut === "refusee" && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold">
                          <XCircle size={12} />
                          <span className="hidden sm:inline">Refusée</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 self-start ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* ✅ BOUTONS D'ACTION - TOUJOURS VISIBLES si pending */}
            {pending && (
              <div className={`px-3 sm:px-4 pb-3 sm:pb-4 flex flex-col sm:flex-row gap-2 border-t ${
                darkMode ? "border-gray-700" : "border-gray-100"
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(request);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold text-xs sm:text-sm transition shadow-sm"
                >
                  <CheckCircle size={16} />
                  <span>Accepter & Planifier</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecline(request);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-xs sm:text-sm transition"
                >
                  <XCircle size={16} />
                  <span>Décliner</span>
                </button>
              </div>
            )}

            {/* Contenu détaillé */}
            {isExpanded && (
              <div className={`px-3 sm:px-4 pb-3 sm:pb-4 border-t ${
                darkMode ? "border-gray-700" : "border-gray-100"
              }`}>
                <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                  <div>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Contexte clinique
                    </p>
                    <p className={`text-xs sm:text-sm break-words leading-relaxed ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {request.contexte}
                    </p>
                  </div>

                  <div>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Question posée
                    </p>
                    <p className={`text-xs sm:text-sm break-words leading-relaxed ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      {request.question}
                    </p>
                  </div>

                  {request.examens && (
                    <div>
                      <p className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Examens réalisés
                      </p>
                      <p className={`text-xs sm:text-sm break-words leading-relaxed ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {request.examens}
                      </p>
                    </div>
                  )}

                  {/* PIECES JOINTES */}
{request.fichiers && request.fichiers.length > 0 && (
  <div>
    <p className={`text-[10px] sm:text-xs font-bold uppercase mb-2 ${
      darkMode ? "text-gray-400" : "text-gray-500"
    }`}>
      Pieces jointes ({request.fichiers.length})
    </p>
    <div className="flex flex-col gap-2">
      {request.fichiers.map((fichier, i) => {
        const isImage = fichier.type_mime?.startsWith("image/");
        const isPdf = fichier.type_mime === "application/pdf";
        const dataUrl = `data:${fichier.type_mime};base64,${fichier.contenu_base64}`;

        return (
          <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
            darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isPdf ? "bg-red-100 text-red-600" : isImage ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
              }`}>
                {isPdf ? "PDF" : isImage ? "IMG" : "DOC"}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  {fichier.nom}
                </p>
                <p className="text-[10px] text-gray-400">
                  {(fichier.taille / 1024).toFixed(0)} Ko
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {/* Visualiser */}
              {(isImage || isPdf) && (
                <button
                  onClick={() => window.open(dataUrl, "_blank")}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                    darkMode ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Voir
                </button>
              )}
              {/* Telecharger */}
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = dataUrl;
                  a.download = fichier.nom;
                  a.click();
                }}
                className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
              >
                Telecharger
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {scheduleFor && (
        <ScheduleOpinionMeeting
          open={!!scheduleFor}
          onClose={() => setScheduleFor(null)}
          request={scheduleFor}
          onSchedule={handleSchedule}
          darkMode={darkMode}
        />
      )}

      {declineFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-5 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold">Décliner la demande</h3>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Dr. {declineFor.requesterName}
                </p>
              </div>
            </div>

            <label className="text-sm font-semibold mb-2 block">
              Motif du refus <span className="text-xs font-normal text-gray-500">(optionnel)</span>
            </label>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Ex: Indisponibilité, pas dans ma spécialité..."
              rows={3}
              className={`w-full p-3 rounded-xl border outline-none resize-none text-sm mb-4 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                  : "bg-gray-50 border-gray-200 placeholder-gray-400"
              }`}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeclineFor(null);
                  setDeclineReason("");
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={confirmDecline}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}