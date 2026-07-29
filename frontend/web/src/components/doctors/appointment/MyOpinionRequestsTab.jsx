import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
} from "lucide-react";

export default function MyOpinionRequestsTab({ darkMode, requests }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!requests || requests.length === 0) {
    return (
      <div
        className={
          "w-full text-center py-12 sm:py-16 px-4 rounded-2xl border-2 border-dashed " +
          (darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500")
        }
      >
        <Send className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
        <p className="font-semibold text-sm sm:text-base">Aucune demande envoyée</p>
        <p className="text-xs sm:text-sm mt-1">
          Vos demandes d'avis aux confrères apparaîtront ici
        </p>
      </div>
    );
  }

  const statusConfig = {
    en_attente: {
      icon: Clock,
      label: "En attente",
      color: "text-orange-500",
      bg: "bg-orange-100",
      darkBg: "bg-orange-900/30",
    },
    acceptee: {
      icon: CheckCircle,
      label: "Acceptée",
      color: "text-green-500",
      bg: "bg-green-100",
      darkBg: "bg-green-900/30",
    },
    refusee: {
      icon: XCircle,
      label: "Refusée",
      color: "text-red-500",
      bg: "bg-red-100",
      darkBg: "bg-red-900/30",
    },
  };

  const urgencyLabels = {
    non_urgent: "Non urgent",
    normal: "Sous 48h",
    urgent: "Urgent",
    tres_urgent: "Très urgent",
  };

  const urgencyColors = {
    non_urgent: { bg: "bg-gray-100 text-gray-700", dark: "bg-gray-700 text-gray-300" },
    normal: { bg: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-300" },
    urgent: { bg: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-300" },
    tres_urgent: { bg: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-300" },
  };

  return (
    <div className="space-y-3 w-full">
      {requests.map((req) => {
        const isExpanded = expandedId === req.id;
        const config = statusConfig[req.statut] || statusConfig.en_attente;
        const StatusIcon = config.icon;
        const urgency = urgencyColors[req.urgence] || urgencyColors.normal;

        return (
          <div
            key={req.id}
            className={
              "w-full min-w-0 rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 " +
              (darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")
            }
          >
            <div
              className="p-3 sm:p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : req.id)}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3 w-full">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:min-w-[48px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                    {req.doctorName?.charAt(0) || "D"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={"text-[11px] sm:text-xs " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                      Adressée à
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className={"font-bold text-sm sm:text-base break-words " + (darkMode ? "text-white" : "text-gray-800")}>
                        Dr. {req.doctorName}
                      </h3>
                      {req.doctorSpeciality && (
                        <span className={"text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap " + (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>
                          {req.doctorSpeciality}
                        </span>
                      )}
                    </div>

                    <p className={"text-xs sm:text-sm mt-1 font-medium break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-600")}>
                      {req.motif}
                    </p>

                    <div className="flex items-center gap-1.5 sm:gap-3 mt-2 text-[10px] sm:text-xs flex-wrap">
                      <span className={"px-1.5 sm:px-2 py-0.5 rounded-full font-semibold whitespace-nowrap " + (darkMode ? urgency.dark : urgency.bg)}>
                        {urgencyLabels[req.urgence] || "Normal"}
                      </span>

                      <span className={"flex items-center gap-1 whitespace-nowrap " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        <Clock size={12} />
                        {new Date(req.date).toLocaleDateString("fr-FR")}
                      </span>

                      {req.statut === "en_attente" && (
                        <span className="flex items-center gap-1 text-orange-500 font-semibold whitespace-nowrap">
                          <AlertCircle size={12} />
                          <span className="hidden sm:inline">En attente</span>
                        </span>
                      )}
                      {req.statut === "acceptee" && (
                        <span className="flex items-center gap-1 text-green-500 font-semibold whitespace-nowrap">
                          <CheckCircle size={12} />
                          <span className="hidden sm:inline">Acceptée</span>
                        </span>
                      )}
                      {req.statut === "refusee" && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold whitespace-nowrap">
                          <XCircle size={12} />
                          <span className="hidden sm:inline">Refusée</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button type="button" className={"p-1.5 sm:p-2 rounded-lg transition flex-shrink-0 self-start " + (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
                  {isExpanded ? <ChevronUp size={16} className="sm:hidden" /> : <ChevronDown size={16} className="sm:hidden" />}
                  {isExpanded ? <ChevronUp size={18} className="hidden sm:inline" /> : <ChevronDown size={18} className="hidden sm:inline" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className={"px-3 sm:px-4 pb-3 sm:pb-4 border-t " + (darkMode ? "border-gray-700" : "border-gray-100")}>
                <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">

                  {req.patientNom && (
                    <div>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-1 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        Patient
                      </p>
                      <p className={"text-xs sm:text-sm break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-700")}>
                        {req.patientPrenom} {req.patientNom}
                      </p>
                    </div>
                  )}

                  {req.contexte && (
                    <div>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-1 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        Contexte clinique
                      </p>
                      <p className={"text-xs sm:text-sm break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-700")}>
                        {req.contexte}
                      </p>
                    </div>
                  )}

                  {req.question && (
                    <div>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-1 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        Question posée
                      </p>
                      <p className={"text-xs sm:text-sm break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-700")}>
                        {req.question}
                      </p>
                    </div>
                  )}

                  {req.examens && (
                    <div>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-1 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        Examens réalisés
                      </p>
                      <p className={"text-xs sm:text-sm break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-700")}>
                        {req.examens}
                      </p>
                    </div>
                  )}

                  {(req.dossierNumero || req.consultationNumero) && (
                    <div>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-2 " + (darkMode ? "text-gray-400" : "text-gray-500")}>
                        Documents associés
                      </p>
                      <div className="space-y-1.5">
                        {req.dossierNumero && (
                          <div className={"flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm " + (darkMode ? "bg-gray-700" : "bg-gray-100")}>
                            <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            <span className={"font-medium " + (darkMode ? "text-gray-300" : "text-gray-600")}>Dossier médical :</span>
                            {req.dossierMedicalId ? (
                              <Link
                                to={`/dossier/${req.dossierMedicalId}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs hover:underline"
                              >
                                {req.dossierNumero}
                                <ExternalLink size={10} />
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-xs">
                                {req.dossierNumero}
                              </span>
                            )}
                          </div>
                        )}
                        {req.consultationNumero && (
                          <div className={"flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm " + (darkMode ? "bg-gray-700" : "bg-gray-100")}>
                            <FileText size={14} className="text-purple-500 flex-shrink-0" />
                            <span className={"font-medium " + (darkMode ? "text-gray-300" : "text-gray-600")}>Consultation :</span>
                            {req.consultationId ? (
                              <Link
                                to={`/consultation/${req.consultationId}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-xs hover:underline"
                              >
                                {req.consultationNumero}
                                <ExternalLink size={10} />
                              </Link>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium text-xs">
                                {req.consultationNumero}
                              </span>
                            )}
                            {req.consultationMotif && (
                              <span className={"text-[10px] sm:text-xs " + (darkMode ? "text-gray-400" : "text-gray-500")}>({req.consultationMotif})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {req.reponse && (
                    <div className={"p-3 rounded-xl " + (darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200")}>
                      <p className={"text-[10px] sm:text-xs font-bold uppercase mb-1 " + (darkMode ? "text-green-400" : "text-green-600")}>
                        Réponse du confrère
                      </p>
                      <p className={"text-xs sm:text-sm break-words leading-relaxed " + (darkMode ? "text-gray-300" : "text-gray-700")}>
                        {req.reponse}
                      </p>
                    </div>
                  )}

                  {req.statut === "refusee" && (
                    <div className={"p-3 rounded-xl text-xs sm:text-sm leading-relaxed break-words " + (darkMode ? "bg-red-900/20 border border-red-800 text-red-300" : "bg-red-50 border border-red-200 text-red-700")}>
                      La demande a été déclinée par le confrère.
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
