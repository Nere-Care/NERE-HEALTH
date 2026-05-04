import { patients } from "../../../constants/doctors/DasboardData";
import { User } from "lucide-react";

export default function RecentPatients({ darkMode }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">
          Recent Patients
        </h2>

        <span className="text-xs text-gray-400">
          {patients.length}
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {patients.map((p, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 rounded-xl border transition hover:shadow-sm
            ${
              darkMode
                ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                : "bg-gray-50 border-gray-200 hover:bg-white"
            }`}
          >
            {/* LEFT */}
            <div className="flex items-center gap-3 min-w-0">

              {/* AVATAR */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                ${
                  darkMode
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {p.name.charAt(0)}
              </div>

              {/* NAME */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.name}
                </p>
                <p className="text-xs text-gray-400">
                  Patient
                </p>
              </div>
            </div>

            {/* AGE BADGE */}
            <div
              className={`text-xs px-2 py-1 rounded-full border shrink-0
              ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-300"
                  : "bg-gray-100 border-gray-200 text-gray-600"
              }`}
            >
              {p.age} yrs
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}