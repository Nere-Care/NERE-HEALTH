import { appointments } from "../../../constants/doctors/DasboardData";
import { Clock, Building2, FileText } from "lucide-react";

export default function TodayAppointments({ darkMode }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">
          Today Appointments
        </h2>

        <span className="text-xs text-gray-400">
          {appointments.length} patients
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {appointments.map((a, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 border transition-all duration-200 hover:shadow-md
            ${
              darkMode
                ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                : "bg-gray-50 border-gray-200 hover:bg-white"
            }`}
          >
            {/* TOP ROW */}
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm sm:text-base">
                {a.patient}
              </p>

              {/* TYPE BADGE */}
              <span
                className={`text-[10px] px-2 py-1 rounded-full font-medium
                ${
                  a.type === "Consultation"
                    ? "bg-blue-100 text-blue-600"
                    : a.type === "Follow-up"
                    ? "bg-green-100 text-green-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {a.type}
              </span>
            </div>

            {/* TIME */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {a.time}
            </div>

            {/* CLINIC */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <Building2 className="w-3 h-3" />
              {a.clinic}
            </div>

            {/* REASON */}
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              {a.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}