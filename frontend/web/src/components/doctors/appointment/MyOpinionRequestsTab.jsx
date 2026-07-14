// components/doctors/appointment/MyOpinionRequestsTab.jsx

import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Send,
} from "lucide-react";

export default function MyOpinionRequestsTab({
  darkMode,
  requests,
}) {
  if (!requests || requests.length === 0) {
    return (
      <div
        className={`
          w-full
          text-center
          py-12 sm:py-16
          px-4
          rounded-2xl
          border-2 border-dashed
          ${
            darkMode
              ? "border-gray-700 text-gray-400"
              : "border-gray-200 text-gray-500"
          }
        `}
      >
        <Send className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />

        <p className="font-semibold text-sm sm:text-base">
          Aucune demande envoyée
        </p>

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

  return (
    <div className="w-full space-y-4">
      {requests.map((req) => {
        const config =
          statusConfig[req.statut] ||
          statusConfig.en_attente;

        const StatusIcon = config.icon;

        return (
          <div
            key={req.id}
            className={`
              w-full
              min-w-0
              overflow-hidden
              rounded-2xl
              p-3 sm:p-4 md:p-5
              border
              transition-all
              ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100 shadow-sm"
              }
            `}
          >
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              {/* Infos médecin */}
              <div className="flex-1 min-w-0">
                <p
                  className={`
                    text-[11px] sm:text-xs
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  `}
                >
                  Adressée à
                </p>


<h3
  className={`
    font-bold
    text-sm sm:text-base md:text-lg
    break-words
    overflow-wrap-anywhere
    ${
      darkMode
        ? "text-white"
        : "text-gray-800"
    }
  `}
>
  Dr. {req.doctorName || "Médecin"}
</h3>

                {req.doctorSpeciality && (
                  <p
                    className={`
                      mt-1
                      text-xs sm:text-sm
                      break-words
                      overflow-wrap-anywhere
                      ${
                        darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {req.doctorSpeciality}
                  </p>
                )}
              </div>

              {/* Badge statut */}
              <div className="flex-shrink-0 self-start max-w-full">
                <span
                  className={`
                    inline-flex
                    items-center
                    gap-1.5
                    px-3 py-1.5
                    rounded-full
                    text-xs
                    font-semibold
                    max-w-full
                    break-words
                    ${
                      darkMode
                        ? config.darkBg
                        : config.bg
                    }
                    ${config.color}
                  `}
                >
                  <StatusIcon
                    size={14}
                    className="flex-shrink-0"
                  />
                  <span className="break-words">
                    {config.label}
                  </span>
                </span>
              </div>
            </div>

            {/* Motif */}
            <div
              className={`
                mt-4
                text-sm
                leading-relaxed
                break-words
                overflow-wrap-anywhere
                ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }
              `}
            >
              <strong>Motif :</strong> {req.motif}
            </div>

            {/* RDV accepté */}
            {req.statut === "acceptee" &&
              req.meetingDate && (
                <div
                  className={`
                    mt-4
                    p-3
                    rounded-xl
                    flex
                    items-start
                    gap-3
                    min-w-0
                    ${
                      darkMode
                        ? "bg-green-900/20 border border-green-800"
                        : "bg-green-50 border border-green-200"
                    }
                  `}
                >
                  <Calendar
                    size={18}
                    className="text-green-500 flex-shrink-0 mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-green-600">
                      RDV confirmé
                    </p>

                    <p
                      className={`
                        text-xs sm:text-sm
                        mt-1
                        break-words
                        overflow-wrap-anywhere
                        ${
                          darkMode
                            ? "text-white"
                            : "text-gray-800"
                        }
                      `}
                    >
                      {new Date(
                        req.meetingDate
                      ).toLocaleString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}

            {/* Refus */}
            {req.statut === "refusee" &&
              req.refusalReason && (
                <div
                  className={`
                    mt-4
                    p-3
                    rounded-xl
                    text-xs sm:text-sm
                    leading-relaxed
                    break-words
                    overflow-wrap-anywhere
                    ${
                      darkMode
                        ? "bg-red-900/20 border border-red-800 text-red-300"
                        : "bg-red-50 border border-red-200 text-red-700"
                    }
                  `}
                >
                  <strong>Motif du refus :</strong>{" "}
                  {req.refusalReason}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}