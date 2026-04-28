// src/components/doctors/appointment/AppointmentCalendarDayCard.jsx

import { Video, MapPin } from "lucide-react";

export default function AppointmentCalendarDayCard({
  day,
  dayAppointments,
  isToday,
  darkMode,
}) {
  return (
    <div
      className={`min-h-[100px] sm:min-h-[110px] rounded-xl border p-2 transition hover:shadow-md cursor-pointer ${
        isToday
          ? darkMode
            ? "border-blue-400 bg-blue-900/30"
            : "border-blue-500 bg-blue-50"
          : darkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* TOP */}
      <div className="flex justify-between items-center">
        <span
          className={`text-xs font-bold ${
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

        {dayAppointments.length > 0 && (
          <span
            className={`text-[10px] text-white px-2 py-0.5 rounded-full ${
              darkMode ? "bg-blue-500" : "bg-blue-600"
            }`}
          >
            {dayAppointments.length}
          </span>
        )}
      </div>

      {/* EVENTS */}
      <div className="mt-2 space-y-1">
        {dayAppointments.slice(0, 2).map((a) => (
          <div
            key={a.id}
            className={`text-[10px] px-2 py-1 rounded-lg border flex items-center justify-between ${
              darkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-200"
            }`}
          >
            <span
              className={`truncate ${
                darkMode ? "text-gray-100" : "text-gray-700"
              }`}
            >
              {a.patientName}
            </span>

            {a.type === "Teleconsultation" ? (
              <Video
                className={`w-3 h-3 shrink-0 ${
                  darkMode ? "text-blue-400" : "text-blue-500"
                }`}
              />
            ) : (
              <MapPin
                className={`w-3 h-3 shrink-0 ${
                  darkMode ? "text-green-400" : "text-green-600"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}