import { Video, MapPin, XCircle } from "lucide-react";

export default function AppointmentCalendarDayCard({
  day,
  dayAppointments,
  isToday,
  availability,
  dayException,
  darkMode,
  onDayClick,
  onSlotClick,
  onDeleteException,
}) {
  const visibleAppointments = dayAppointments.slice(0, 2);
  const remaining = dayAppointments.length - visibleAppointments.length;
  const isIndisponible = dayException?.type === "indisponible";

  return (
    <div
      onClick={() => onDayClick?.(day)}
      className={`group relative min-h-[90px] sm:min-h-[110px] lg:min-h-[120px] rounded-2xl border p-2 sm:p-3 transition-all duration-200 cursor-pointer
      hover:shadow-lg hover:-translate-y-[2px]
      ${
        isIndisponible
          ? darkMode
            ? "border-red-400/60 bg-red-900/20"
            : "border-red-400 bg-red-50"
          : isToday
          ? darkMode
            ? "border-blue-400 bg-blue-900/30"
            : "border-blue-500 bg-blue-50"
          : darkMode
          ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
          : "bg-gray-50 border-gray-200 hover:bg-white"
      }`}
    >
      {/* TOP HEADER */}
      <div className="flex justify-between items-center mb-1">
        <span
          className={`text-xs sm:text-sm font-semibold tracking-wide
          ${
            isIndisponible
              ? darkMode
                ? "text-red-400"
                : "text-red-500"
              : isToday
              ? darkMode
                ? "text-blue-400"
                : "text-blue-600"
              : darkMode
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        >
          {day}
        </span>

        {dayAppointments.length > 0 && (
          <span
            className={`text-[10px] sm:text-xs text-white px-2 py-0.5 rounded-full font-medium
            ${darkMode ? "bg-blue-500" : "bg-blue-600"}`}
          >
            {dayAppointments.length}
          </span>
        )}
      </div>

      {/* EXCEPTION BANNER */}
      {dayException && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onDeleteException && confirm("Supprimer cette exception ?")) {
              onDeleteException(dayException.id);
            }
          }}
          className={`flex items-center justify-between gap-1 mb-2 px-2 py-1.5 rounded-lg cursor-pointer transition duration-150
          ${
            isIndisponible
              ? darkMode
                ? "bg-red-900/40 hover:bg-red-900/60 text-red-300"
                : "bg-red-100 hover:bg-red-200 text-red-700"
              : darkMode
              ? "bg-amber-900/40 hover:bg-amber-900/60 text-amber-300"
              : "bg-amber-100 hover:bg-amber-200 text-amber-700"
          }`}
          title="Cliquer pour supprimer cette exception"
        >
          <span className="text-[10px] sm:text-xs font-medium truncate">
            {isIndisponible
              ? "Indisponible"
              : `Horaires perso`}
          </span>
          <XCircle className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
        </div>
      )}

      {/* AVAILABILITY SLOTS */}
      {availability?.length > 0 && (
        <div className="space-y-1 mb-2">
          {availability.map((slot) => (
            <div
              key={slot.id}
              onClick={(e) => {
                e.stopPropagation();
                onSlotClick?.(slot);
              }}
              className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg font-medium transition duration-150 cursor-pointer
              ${
                slot.exception
                  ? darkMode
                    ? "bg-amber-900/30 text-amber-300 hover:bg-amber-900/50"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : darkMode
                  ? "bg-green-900/30 text-green-300 hover:bg-green-900/50"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {slot.exception ? "Perso" : "Dispo"} {slot.startTime} - {slot.endTime}
            </div>
          ))}
        </div>
      )}

      {/* EVENTS */}
      <div className="mt-2 space-y-1.5">
        {visibleAppointments.map((a) => (
          <div
            key={a.id}
            className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border text-[10px] sm:text-xs transition
            ${
              darkMode
                ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
                : "bg-white border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span
              className={`truncate font-medium ${
                darkMode ? "text-gray-100" : "text-gray-700"
              }`}
            >
              {a.patientName}
            </span>
            <div className="flex items-center shrink-0">
              {a.type === "Teleconsultation" ? (
                <Video
                  className={`w-3.5 h-3.5 ${
                    darkMode ? "text-blue-400" : "text-blue-500"
                  }`}
                />
              ) : (
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    darkMode ? "text-green-400" : "text-green-600"
                  }`}
                />
              )}
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <div
            className={`text-[10px] sm:text-xs text-center font-medium rounded-lg py-1
            ${
              darkMode
                ? "text-gray-400 bg-gray-700"
                : "text-gray-500 bg-gray-100"
            }`}
          >
            +{remaining} more
          </div>
        )}
      </div>
    </div>
  );
}
