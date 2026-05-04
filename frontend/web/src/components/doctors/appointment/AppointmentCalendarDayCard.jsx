// src/components/doctors/appointment/AppointmentCalendarDayCard.jsx

import { Video, MapPin } from "lucide-react";

export default function AppointmentCalendarDayCard({
  day,
  dayAppointments,
  isToday,
  darkMode,
}) {
  const visibleAppointments = dayAppointments.slice(0, 2);
  const remaining = dayAppointments.length - visibleAppointments.length;

  return (
    <div
      className={`group min-h-[90px] sm:min-h-[110px] lg:min-h-[120px] rounded-2xl border p-2 sm:p-3 transition-all duration-200 cursor-pointer
      hover:shadow-lg hover:-translate-y-[2px]
      ${
        isToday
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

        {/* DAY */}
        <span
          className={`text-xs sm:text-sm font-semibold tracking-wide
          ${
            isToday
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

        {/* COUNT BADGE */}
        {dayAppointments.length > 0 && (
          <span
            className={`text-[10px] sm:text-xs text-white px-2 py-0.5 rounded-full font-medium
            ${darkMode ? "bg-blue-500" : "bg-blue-600"}`}
          >
            {dayAppointments.length}
          </span>
        )}
      </div>

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
            {/* NAME */}
            <span
              className={`truncate font-medium ${
                darkMode ? "text-gray-100" : "text-gray-700"
              }`}
            >
              {a.patientName}
            </span>

            {/* ICON */}
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

        {/* MORE INDICATOR */}
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