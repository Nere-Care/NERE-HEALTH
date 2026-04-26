// src/components/doctors/appointment/AppointmentCalendarDayCard.jsx

import { Video, MapPin } from "lucide-react";

export default function AppointmentCalendarDayCard({
  day,
  dayAppointments,
  isToday,
}) {
  return (
    <div
      className={`min-h-[100px] sm:min-h-[110px] rounded-xl border p-2 transition hover:shadow-md cursor-pointer ${
        isToday
          ? "border-blue-500 bg-blue-50"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* TOP */}
      <div className="flex justify-between items-center">
        <span
          className={`text-xs font-bold ${
            isToday ? "text-blue-600" : "text-gray-600"
          }`}
        >
          {day}
        </span>

        {dayAppointments.length > 0 && (
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {dayAppointments.length}
          </span>
        )}
      </div>

      {/* EVENTS */}
      <div className="mt-2 space-y-1">
        {dayAppointments.slice(0, 2).map((a) => (
          <div
            key={a.id}
            className="text-[10px] px-2 py-1 rounded-lg bg-white border border-gray-200 flex items-center justify-between"
          >
            <span className="truncate text-gray-700">
              {a.patientName}
            </span>

            {a.type === "Teleconsultation" ? (
              <Video className="w-3 h-3 text-blue-500 shrink-0" />
            ) : (
              <MapPin className="w-3 h-3 text-green-600 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}