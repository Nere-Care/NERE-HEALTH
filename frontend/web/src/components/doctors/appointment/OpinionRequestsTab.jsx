// components/doctors/appointment/OpinionRequestsTab.jsx

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
  Send,
} from "lucide-react";
import ScheduleOpinionMeeting from "./ScheduleOpinionMeeting";

export default function OpinionRequestsTab({
  darkMode,
  requests,
  onUpdateRequest,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [scheduleFor, setScheduleFor] = useState(null);

  const urgencyColors = {
    non_urgent: {
      bg: "bg-gray-100 text-gray-700",
      dark: "bg-gray-700 text-gray-300",
    },
    normal: {
      bg: "bg-blue-100 text-blue-700",
      dark: "bg-blue-900/30 text-blue-300",
    },
    urgent: {
      bg: "bg-orange-100 text-orange-700",
      dark: "bg-orange-900/30 text-orange-300",
    },
    tres_urgent: {
      bg: "bg-red-100 text-red-700",
      dark: "bg-red-900/30 text-red-300",
    },
  };

  const urgencyLabels = {
    non_urgent: "Non urgent",
    normal: "Sous 48h",
    urgent: "Urgent",
    tres_urgent: "Très urgent",
  };

  const handleAccept = (request) => {
    onUpdateRequest(request.id, "acceptee", { openMessaging: true });
  };

  const handleAcceptAndSchedule = (request) => setScheduleFor(request);

  const handleDecline = (request, reason) => {
    onUpdateRequest(request.id, "refusee", { reason });
  };

  const handleSchedule = (request, meetingData) => {
    onUpdateRequest(request.id, "acceptee", meetingData);
    setScheduleFor(null);
  };

  if (!requests || requests.length === 0) {
    return (
      <div
        className={`w-full text-center py-12 sm:py-16 px-4 rounded-2xl border-2 border-dashed
        ${
          darkMode
            ? "border-gray-700 text-gray-400"
            : "border-gray-200 text-gray-500"
        }`}
      >
        <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />

        <p className="font-semibold text-sm sm:text-base">
          Aucune demande d'avis reçue
        </p>

        <p className="text-xs sm:text-sm mt-1">
          Les demandes de vos confrères apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {requests.map((request) => {
        const isExpanded = expandedId === request.id;
        const urgency =
          urgencyColors[request.urgence] || urgencyColors.normal;

        return (
          <div
            key={request.id}
            className={`w-full min-w-0 rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300
              ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100 shadow-sm"
              }`}
          >
            {/* Header */}
            <div
              className="p-3 sm:p-4 cursor-pointer"
              onClick={() =>
                setExpandedId(isExpanded ? null : request.id)
              }
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3 w-full">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {request.requesterName?.charAt(0) || "D"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3
                        className={`font-bold text-sm sm:text-base break-words ${
                          darkMode
                            ? "text-white"
                            : "text-gray-800"
                        }`}
                      >
                        Dr. {request.requesterName}
                      </h3>

                      {request.requesterSpeciality && (
                        <span
                          className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap
                          ${
                            darkMode
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {request.requesterSpeciality}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm mt-1 font-medium break-words leading-relaxed
                      ${
                        darkMode
                          ? "text-gray-300"
                          : "text-gray-600"
                      }`}
                    >
                      {request.motif}
                    </p>

                    <div className="flex items-center gap-1.5 sm:gap-3 mt-2 text-[10px] sm:text-xs flex-wrap">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap
                        ${
                          darkMode
                            ? urgency.dark
                            : urgency.bg
                        }`}
                      >
                        {urgencyLabels[request.urgence]}
                      </span>

                      <span
                        className={`flex items-center gap-1 whitespace-nowrap
                        ${
                          darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        <Clock size={10} className="sm:hidden" />
                        <Clock
                          size={12}
                          className="hidden sm:inline"
                        />
                        {new Date(
                          request.date
                        ).toLocaleDateString("fr-FR")}
                      </span>

                      {request.statut === "en_attente" && (
                        <span className="flex items-center gap-1 text-orange-500 font-semibold whitespace-nowrap">
                          <AlertCircle
                            size={10}
                            className="sm:hidden"
                          />
                          <AlertCircle
                            size={12}
                            className="hidden sm:inline"
                          />
                          <span className="hidden sm:inline">
                            En attente
                          </span>
                        </span>
                      )}

                      {request.statut === "acceptee" && (
                        <span className="flex items-center gap-1 text-green-500 font-semibold whitespace-nowrap">
                          <CheckCircle
                            size={10}
                            className="sm:hidden"
                          />
                          <CheckCircle
                            size={12}
                            className="hidden sm:inline"
                          />
                          <span className="hidden sm:inline">
                            Acceptée
                          </span>
                        </span>
                      )}

                      {request.statut === "refusee" && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold whitespace-nowrap">
                          <XCircle
                            size={10}
                            className="sm:hidden"
                          />
                          <XCircle
                            size={12}
                            className="hidden sm:inline"
                          />
                          <span className="hidden sm:inline">
                            Refusée
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 self-start
                  ${
                    darkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {isExpanded ? (
                    <ChevronUp
                      size={16}
                      className="sm:hidden"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="sm:hidden"
                    />
                  )}

                  {isExpanded ? (
                    <ChevronUp
                      size={18}
                      className="hidden sm:inline"
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className="hidden sm:inline"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Contenu détaillé */}
            {isExpanded && (
              <div
                className={`px-3 sm:px-4 pb-3 sm:pb-4 border-t ${
                  darkMode
                    ? "border-gray-700"
                    : "border-gray-100"
                }`}
              >
                <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                  {/* Contexte */}
                  <div>
                    <p
                      className={`text-[10px] sm:text-xs font-bold uppercase mb-1
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Contexte clinique
                    </p>

                    <p
                      className={`text-xs sm:text-sm break-words leading-relaxed ${
                        darkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                      }`}
                    >
                      {request.contexte}
                    </p>
                  </div>

                  {/* Question */}
                  <div>
                    <p
                      className={`text-[10px] sm:text-xs font-bold uppercase mb-1
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Question posée
                    </p>

                    <p
                      className={`text-xs sm:text-sm break-words leading-relaxed ${
                        darkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                      }`}
                    >
                      {request.question}
                    </p>
                  </div>

                  {/* Examens */}
                  {request.examens && (
                    <div>
                      <p
                        className={`text-[10px] sm:text-xs font-bold uppercase mb-1
                        ${
                          darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        Examens réalisés
                      </p>

                      <p
                        className={`text-xs sm:text-sm break-words leading-relaxed ${
                          darkMode
                            ? "text-gray-300"
                            : "text-gray-700"
                        }`}
                      >
                        {request.examens}
                      </p>
                    </div>
                  )}

                  {/* Pièces jointes */}
                  {request.attachments &&
                    request.attachments.length > 0 && (
                      <div>
                        <p
                          className={`text-[10px] sm:text-xs font-bold uppercase mb-2
                          ${
                            darkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                          }`}
                        >
                          Pièces jointes (
                          {request.attachments.length})
                        </p>

                        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full">
                          {request.attachments.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`max-w-full break-all flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs
                              ${
                                darkMode
                                  ? "bg-gray-700 hover:bg-gray-600"
                                  : "bg-gray-100 hover:bg-gray-200"
                              }`}
                            >
                              <FileText
                                size={12}
                                className="sm:hidden"
                              />
                              <FileText
                                size={14}
                                className="hidden sm:inline"
                              />
                              {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Documents associés */}
                  {(request.dossierNumero || request.consultationNumero) && (
                    <div>
                      <p
                        className={`text-[10px] sm:text-xs font-bold uppercase mb-2
                        ${
                          darkMode
                            ? "text-gray-400"
                            : "text-gray-500"
                        }`}
                      >
                        Documents associés
                      </p>

                      <div className="space-y-1.5">
                        {request.dossierNumero && (
                          <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                            <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Dossier médical :</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs">
                              {request.dossierNumero}
                            </span>
                          </div>
                        )}
                        {request.consultationNumero && (
                          <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                            <FileText size={14} className="text-purple-500 flex-shrink-0" />
                            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Consultation :</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-xs">
                              {request.consultationNumero}
                            </span>
                            {request.consultationMotif && (
                              <span className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>({request.consultationMotif})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {request.statut === "en_attente" && (
                    <div
                      className={`flex flex-col md:flex-row gap-2 pt-3 border-t
                      ${
                        darkMode
                          ? "border-gray-700"
                          : "border-gray-100"
                      }`}
                    >
                      <button
                        onClick={() => handleAccept(request)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold text-xs sm:text-sm transition"
                      >
                        <Send
                          size={14}
                          className="sm:hidden"
                        />
                        <Send
                          size={16}
                          className="hidden sm:inline"
                        />
                        <span>
                          Accepter
                        </span>
                      </button>

                      <button
                        onClick={() => handleAcceptAndSchedule(request)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-xs sm:text-sm transition"
                      >
                        <Calendar
                          size={14}
                          className="sm:hidden"
                        />
                        <Calendar
                          size={16}
                          className="hidden sm:inline"
                        />
                        <span>Planifier un RDV</span>
                      </button>

                      <button
                        onClick={() =>
                          handleDecline(
                            request,
                            "Indisponibilité"
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-xs sm:text-sm transition"
                      >
                        <XCircle
                          size={14}
                          className="sm:hidden"
                        />
                        <XCircle
                          size={16}
                          className="hidden sm:inline"
                        />
                        <span>Décliner</span>
                      </button>
                    </div>
                  )}

                  {request.statut === "acceptee" &&
                    request.meetingDate && (
                      <div
                        className={`p-2.5 sm:p-3 rounded-xl flex items-start gap-2 sm:gap-3
                        ${
                          darkMode
                            ? "bg-green-900/20 border border-green-800"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <Calendar
                          size={16}
                          className="text-green-500 flex-shrink-0 mt-0.5"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-xs font-bold text-green-600">
                            RDV planifié
                          </p>

                          <p
                            className={`text-xs sm:text-sm font-medium break-words
                            ${
                              darkMode
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                          >
                            {new Date(
                              request.meetingDate
                            ).toLocaleString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
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
    </div>
  );
}