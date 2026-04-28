import { notifications } from "../../../constants/doctors/DasboardData";

export default function NotificationsPanel({ darkMode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Notifications
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {notifications.map((n, i) => (
          <div
            key={i}
            className={`text-xs sm:text-sm border rounded-xl p-3
              ${darkMode ? "border-gray-700" : "border-gray-200"}
            `}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}